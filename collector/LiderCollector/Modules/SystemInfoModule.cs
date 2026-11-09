using System.Management;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;

namespace LiderCollector.Modules;

/// <summary>
/// Collects hardware and OS information via WMI.
/// Sources: Win32_ComputerSystem, Win32_OperatingSystem, Win32_Processor, Win32_BIOS,
///          Win32_SystemEnclosure, Win32_PhysicalMemory, Win32_DiskDrive, Win32_DiskPartition,
///          Win32_LogicalDisk (+ MSFT_PhysicalDisk for SSD/HDD and health, best effort).
///
/// Design rules:
///  • every source runs independently — a failing query never suppresses the others;
///  • the payload is ALWAYS returned, together with a <see cref="ModuleReport"/> that says which
///    sources worked and why a failed one failed (the server stores this per module);
///  • every WMI query has a timeout so one hung provider cannot stall the inventory cycle.
/// </summary>
public sealed class SystemInfoModule : IReportingModule
{
    private readonly ILogger<SystemInfoModule> _log;
    public string Name => "system";
    public ModuleReport? LastReport { get; private set; }

    public SystemInfoModule(ILogger<SystemInfoModule> log) => _log = log;

    public Task<object?> RunAsync(CancellationToken ct)
    {
        var payload = new SystemPayload();
        var t = new SourceTracker();

        t.Run("ComputerSystem",  () => CollectComputerSystem(payload), required: true,  _log);
        t.Run("ComputerProduct", () => CollectProduct(payload),        required: false, _log);
        t.Run("OperatingSystem", () => CollectOs(payload),             required: true,  _log);
        t.Run("Processor",       () => CollectProcessor(payload),      required: true,  _log);
        t.Run("BIOS",            () => CollectBios(payload),           required: true,  _log);
        t.Run("Memory",          () => CollectMemory(payload),         required: true,  _log);
        t.Run("Disks",           () => CollectDisks(payload),          required: true,  _log);
        t.Run("Partitions",      () => CollectPartitions(payload),     required: false, _log);
        t.Run("Volumes",         () => CollectVolumes(payload),        required: true,  _log);
        t.Run("Enclosure",       () => CollectEnclosure(payload),      required: false, _log);
        t.Run("PhysicalDisks",   () => EnrichPhysicalDisks(payload),   required: false, _log);

        Sanity(payload, t);
        LastReport = t.Finish();

        // Always return the payload — partial data is far more useful than null.
        return Task.FromResult<object?>(payload);
    }

    // ── Sanity checks: implausible output becomes a warning, never a silent gap ──
    public static void Sanity(SystemPayload p, SourceTracker t)
    {
        if (p.TotalRamBytes <= 0) t.Warn("total RAM not reported");
        if (p.Processors.Count == 0) t.Warn("no processor rows returned");
        if (string.IsNullOrWhiteSpace(p.OsName)) t.Warn("operating system name not reported");
        if (p.Disks.Count == 0) t.Warn("no physical disks returned");
        if (p.Volumes.Count == 0) t.Warn("no fixed volumes returned");
    }

    // ── WMI helper with timeout ────────────────────────────────────────────────
    private static IEnumerable<ManagementObject> Query(string wql, string scope = @"root\cimv2", int timeoutSeconds = 30)
    {
        var opts = new System.Management.EnumerationOptions { Timeout = TimeSpan.FromSeconds(timeoutSeconds), ReturnImmediately = false };
        using var searcher = new ManagementObjectSearcher(new ManagementScope(scope), new ObjectQuery(wql), opts);
        foreach (ManagementObject o in searcher.Get())
        {
            using (o) yield return o;
        }
    }

    private static string? S(ManagementBaseObject o, string prop)
    {
        var v = o[prop]?.ToString()?.Trim();
        return string.IsNullOrEmpty(v) ? null : v;
    }
    private static long L(ManagementBaseObject o, string prop) { try { return Convert.ToInt64(o[prop] ?? 0); } catch { return 0; } }
    private static int  I(ManagementBaseObject o, string prop) { try { return Convert.ToInt32(o[prop] ?? 0); } catch { return 0; } }

    // ── Sources ────────────────────────────────────────────────────────────────
    private static void CollectComputerSystem(SystemPayload p)
    {
        bool any = false;
        foreach (var o in Query("SELECT Name,Manufacturer,Model,TotalPhysicalMemory,NumberOfLogicalProcessors,SystemType,Domain FROM Win32_ComputerSystem"))
        {
            any = true;
            p.Hostname = S(o, "Name");
            p.Manufacturer = CleanVendor(S(o, "Manufacturer"));
            p.Model = CleanVendor(S(o, "Model"));
            p.TotalRamBytes = L(o, "TotalPhysicalMemory");
            p.LogicalCores = I(o, "NumberOfLogicalProcessors");
            p.SystemType = S(o, "SystemType");
            p.Domain = S(o, "Domain");
        }
        if (!any) throw new InvalidOperationException("Win32_ComputerSystem returned no rows");
    }

    // NOTE: the machine UUID is NOT a Win32_ComputerSystem property (querying it throws "Invalid query" on every Windows
    // version, which used to silence the whole module). It lives in Win32_ComputerSystemProduct.
    private static void CollectProduct(SystemPayload p)
    {
        foreach (var o in Query("SELECT UUID,IdentifyingNumber,Vendor,Name FROM Win32_ComputerSystemProduct"))
        {
            p.BiosUuid = NormalizeUuid(S(o, "UUID"));
            p.Manufacturer ??= CleanVendor(S(o, "Vendor"));
            p.Model ??= CleanVendor(S(o, "Name"));
            p.BiosSerial ??= NormalizeSerial(S(o, "IdentifyingNumber"));
        }
    }

    private static void CollectOs(SystemPayload p)
    {
        bool any = false;
        foreach (var o in Query("SELECT Caption,Version,BuildNumber,OSArchitecture,LastBootUpTime,InstallDate FROM Win32_OperatingSystem"))
        {
            any = true;
            p.OsName = S(o, "Caption");
            p.OsVersion = S(o, "Version");
            p.OsBuild = S(o, "BuildNumber");
            p.OsArch = S(o, "OSArchitecture");
            if (o["LastBootUpTime"] is string lbt) p.LastBootTime = ManagementDateTimeConverter.ToDateTime(lbt);
            if (o["InstallDate"] is string inst) p.OsInstallDate = ManagementDateTimeConverter.ToDateTime(inst);
        }
        if (!any) throw new InvalidOperationException("Win32_OperatingSystem returned no rows");
    }

    private static void CollectProcessor(SystemPayload p)
    {
        var cpus = new List<CpuInfo>();
        foreach (var o in Query("SELECT Name,NumberOfCores,NumberOfLogicalProcessors,MaxClockSpeed FROM Win32_Processor"))
            cpus.Add(new CpuInfo
            {
                Name = Regex.Replace(S(o, "Name") ?? "", @"\s+", " ").Trim(),
                Cores = I(o, "NumberOfCores"),
                LogicalProcessors = I(o, "NumberOfLogicalProcessors"),
                MaxClockMhz = I(o, "MaxClockSpeed"),
            });
        p.Processors = cpus;
        // Some virtualised guests report 0 cores per socket; fall back to the logical count so the field is not empty.
        foreach (var c in cpus) if (c.Cores == 0 && c.LogicalProcessors > 0) c.Cores = c.LogicalProcessors;
        if (p.LogicalCores == 0) p.LogicalCores = cpus.Sum(c => c.LogicalProcessors);
    }

    private static void CollectBios(SystemPayload p)
    {
        foreach (var o in Query("SELECT SerialNumber,SMBIOSBIOSVersion,Version,Manufacturer FROM Win32_BIOS"))
        {
            p.BiosSerial = NormalizeSerial(S(o, "SerialNumber"));
            p.BiosVersion = S(o, "SMBIOSBIOSVersion") ?? S(o, "Version");
            p.BiosManufacturer = CleanVendor(S(o, "Manufacturer"));
        }
    }

    private static void CollectEnclosure(SystemPayload p)
    {
        foreach (var o in Query("SELECT ChassisTypes FROM Win32_SystemEnclosure"))
            if (o["ChassisTypes"] is ushort[] types && types.Length > 0)
                p.ChassisType = ChassisTypeToString(types[0]);
    }

    private static void CollectMemory(SystemPayload p)
    {
        var slots = new List<RamSlot>();
        foreach (var o in Query("SELECT DeviceLocator,BankLabel,Capacity,Speed,ConfiguredClockSpeed,Manufacturer,PartNumber FROM Win32_PhysicalMemory"))
        {
            int speed = I(o, "ConfiguredClockSpeed"); if (speed == 0) speed = I(o, "Speed");
            slots.Add(new RamSlot
            {
                Label = S(o, "DeviceLocator") ?? S(o, "BankLabel"),
                CapacityBytes = L(o, "Capacity"),
                SpeedMhz = speed,
                Manufacturer = CleanVendor(S(o, "Manufacturer")),
                PartNumber = S(o, "PartNumber"),
            });
        }
        p.RamSlots = slots;
    }

    private static void CollectDisks(SystemPayload p)
    {
        var disks = new List<DiskInfo>();
        foreach (var o in Query("SELECT Index,Model,Size,MediaType,SerialNumber,InterfaceType,Status,FirmwareRevision,Partitions FROM Win32_DiskDrive"))
            disks.Add(new DiskInfo
            {
                Index = I(o, "Index"),
                Model = S(o, "Model"),
                SizeBytes = L(o, "Size"),
                MediaType = S(o, "MediaType"),
                Serial = S(o, "SerialNumber"),
                InterfaceType = S(o, "InterfaceType"),
                HealthStatus = MapWin32Status(S(o, "Status")),
                Firmware = S(o, "FirmwareRevision"),
                PartitionCount = I(o, "Partitions"),
            });
        p.Disks = disks;
    }

    private static void CollectPartitions(SystemPayload p)
    {
        var parts = new List<PartitionInfo>();
        foreach (var o in Query("SELECT DeviceID,DiskIndex,Index,Type,Size,BootPartition,PrimaryPartition FROM Win32_DiskPartition"))
            parts.Add(new PartitionInfo
            {
                Id = S(o, "DeviceID"),
                DiskIndex = I(o, "DiskIndex"),
                PartitionIndex = I(o, "Index"),
                Type = S(o, "Type"),
                SizeBytes = L(o, "Size"),
                IsBoot = o["BootPartition"] is true,
                IsPrimary = o["PrimaryPartition"] is true,
            });

        // partition → drive letter
        try
        {
            foreach (var o in Query("SELECT Antecedent,Dependent FROM Win32_LogicalDiskToPartition"))
            {
                string? ant = S(o, "Antecedent"), dep = S(o, "Dependent");
                if (ant == null || dep == null) continue;
                var pm = Regex.Match(ant, "DeviceID=\"(?<id>[^\"]+)\"");
                var lm = Regex.Match(dep, "DeviceID=\"(?<id>[^\"]+)\"");
                if (!pm.Success || !lm.Success) continue;
                var part = parts.FirstOrDefault(x => string.Equals(x.Id, pm.Groups["id"].Value, StringComparison.OrdinalIgnoreCase));
                if (part != null) part.DriveLetter = lm.Groups["id"].Value;
            }
        }
        catch { /* letters are an enrichment; partitions are still useful without them */ }
        p.Partitions = parts;
    }

    private static void CollectVolumes(SystemPayload p)
    {
        var vols = new List<VolumeInfo>();
        foreach (var o in Query("SELECT DeviceID,Size,FreeSpace,FileSystem,VolumeName FROM Win32_LogicalDisk WHERE DriveType=3"))
        {
            long size = L(o, "Size"), free = L(o, "FreeSpace");
            vols.Add(new VolumeInfo
            {
                Letter = S(o, "DeviceID"),
                SizeBytes = size,
                FreeBytes = free,
                UsedBytes = size > 0 ? Math.Max(0, size - free) : 0,
                FileSystem = S(o, "FileSystem"),
                Label = S(o, "VolumeName"),
            });
        }
        // attach the physical disk behind each letter when the partition map is available
        foreach (var v in vols)
        {
            var part = p.Partitions.FirstOrDefault(x => string.Equals(x.DriveLetter, v.Letter, StringComparison.OrdinalIgnoreCase));
            if (part != null) v.DiskIndex = part.DiskIndex;
        }
        p.Volumes = vols;
    }

    /// <summary>SSD/HDD type, bus and health from the Storage Management provider (best effort).</summary>
    private static void EnrichPhysicalDisks(SystemPayload p)
    {
        foreach (var o in Query("SELECT DeviceId,FriendlyName,MediaType,BusType,HealthStatus,SerialNumber FROM MSFT_PhysicalDisk", @"root\Microsoft\Windows\Storage"))
        {
            string? devId = S(o, "DeviceId");
            var disk = p.Disks.FirstOrDefault(d => d.Index.ToString() == devId)
                    ?? p.Disks.FirstOrDefault(d => !string.IsNullOrEmpty(d.Serial) && d.Serial.Trim('.', ' ') == (S(o, "SerialNumber") ?? "").Trim('.', ' '));
            if (disk == null) continue;
            disk.MediaType = I(o, "MediaType") switch { 3 => "HDD", 4 => "SSD", 5 => "SCM", _ => disk.MediaType };
            disk.BusType = I(o, "BusType") switch { 7 => "USB", 8 => "RAID", 10 => "SAS", 11 => "SATA", 17 => "NVMe", 3 => "ATA", 1 => "SCSI", _ => disk.BusType };
            disk.HealthStatus = I(o, "HealthStatus") switch { 0 => "OK", 1 => "WARNING", 2 => "FAILING", _ => disk.HealthStatus };
        }
    }

    // ── Normalisation ──────────────────────────────────────────────────────────
    private static readonly string[] JunkValues =
    {
        "to be filled by o.e.m.", "default string", "system serial number", "system product name", "none", "n/a", "not applicable",
        "unknown", "not specified", "o.e.m.", "oem", "0", "123456789", "serial number", "type1productconfigid",
    };

    public static string? NormalizeSerial(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        var v = raw.Trim();
        return JunkValues.Contains(v.ToLowerInvariant()) ? null : v;
    }

    public static string? CleanVendor(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        var v = raw.Trim();
        return JunkValues.Contains(v.ToLowerInvariant()) ? null : v;
    }

    public static string? NormalizeUuid(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        var upper = raw.Trim().ToUpperInvariant();
        if (upper == "00000000-0000-0000-0000-000000000000") return null;
        if (upper == "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF") return null;
        if (upper == "03000200-0400-0500-0006-000700080009") return null; // VMware default
        if (upper.StartsWith("00000000-0000-0000-")) return null;
        return upper;
    }

    private static string? MapWin32Status(string? s) => s?.ToUpperInvariant() switch
    {
        "OK" => "OK", "PRED FAIL" => "FAILING", "DEGRADED" => "WARNING", "ERROR" => "FAILING", null => "UNKNOWN", _ => "UNKNOWN",
    };

    public static string ChassisTypeToString(ushort t) => t switch
    {
        3 or 4 or 5 or 6 or 7 => "Desktop",
        8 or 9 or 10 or 11 or 12 or 14 => "Laptop",
        17 or 18 or 19 or 20 or 21 or 22 or 23 => "Server",
        _ => "Other",
    };

    // ── Payload DTOs ──────────────────────────────────────────────────────────

    public sealed class SystemPayload
    {
        [JsonPropertyName("hostname")] public string? Hostname { get; set; }
        [JsonPropertyName("manufacturer")] public string? Manufacturer { get; set; }
        [JsonPropertyName("model")] public string? Model { get; set; }
        [JsonPropertyName("chassis_type")] public string? ChassisType { get; set; }
        [JsonPropertyName("bios_uuid")] public string? BiosUuid { get; set; }
        [JsonPropertyName("bios_serial")] public string? BiosSerial { get; set; }
        [JsonPropertyName("bios_version")] public string? BiosVersion { get; set; }
        [JsonPropertyName("bios_manufacturer")] public string? BiosManufacturer { get; set; }
        [JsonPropertyName("os_name")] public string? OsName { get; set; }
        [JsonPropertyName("os_version")] public string? OsVersion { get; set; }
        [JsonPropertyName("os_build")] public string? OsBuild { get; set; }
        [JsonPropertyName("os_arch")] public string? OsArch { get; set; }
        [JsonPropertyName("os_install_date")] public DateTime? OsInstallDate { get; set; }
        [JsonPropertyName("last_boot_time")] public DateTime? LastBootTime { get; set; }
        [JsonPropertyName("total_ram_bytes")] public long TotalRamBytes { get; set; }
        [JsonPropertyName("logical_cores")] public int LogicalCores { get; set; }
        [JsonPropertyName("system_type")] public string? SystemType { get; set; }
        [JsonPropertyName("domain")] public string? Domain { get; set; }
        [JsonPropertyName("processors")] public List<CpuInfo> Processors { get; set; } = new();
        [JsonPropertyName("ram_slots")] public List<RamSlot> RamSlots { get; set; } = new();
        [JsonPropertyName("disks")] public List<DiskInfo> Disks { get; set; } = new();
        [JsonPropertyName("partitions")] public List<PartitionInfo> Partitions { get; set; } = new();
        [JsonPropertyName("volumes")] public List<VolumeInfo> Volumes { get; set; } = new();

        // ── Backward-compat aliases expected by WindowsInventoryProcessor ──────
        [JsonPropertyName("serial_number")]  public string? SerialNumber  => BiosSerial;
        [JsonPropertyName("ram_gb")]         public double? RamGb         => TotalRamBytes > 0 ? Math.Round(TotalRamBytes / 1_073_741_824.0, 2) : null;
        [JsonPropertyName("cpu_model")]      public string? CpuModel      => Processors.FirstOrDefault()?.Name;
        [JsonPropertyName("cpu_cores")]      public int?    CpuCores      => Processors.Count > 0 ? Processors.Sum(p => p.Cores) : null;
        [JsonPropertyName("last_boot_at")]   public string? LastBootAt    => LastBootTime?.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ");
        [JsonPropertyName("fqdn")]           public string? Fqdn          => (!string.IsNullOrEmpty(Domain) && Domain != "WORKGROUP" && Hostname != null) ? $"{Hostname}.{Domain}" : null;
        [JsonPropertyName("uptime_seconds")] public long?   UptimeSec     => LastBootTime.HasValue ? (long)(DateTime.UtcNow - LastBootTime.Value.ToUniversalTime()).TotalSeconds : null;
    }

    public sealed class CpuInfo
    {
        [JsonPropertyName("name")] public string? Name { get; set; }
        [JsonPropertyName("cores")] public int Cores { get; set; }
        [JsonPropertyName("logical_processors")] public int LogicalProcessors { get; set; }
        [JsonPropertyName("max_clock_mhz")] public int MaxClockMhz { get; set; }
    }

    public sealed class RamSlot
    {
        [JsonPropertyName("label")] public string? Label { get; set; }
        [JsonPropertyName("capacity_bytes")] public long CapacityBytes { get; set; }
        [JsonPropertyName("speed_mhz")] public int SpeedMhz { get; set; }
        [JsonPropertyName("manufacturer")] public string? Manufacturer { get; set; }
        [JsonPropertyName("part_number")] public string? PartNumber { get; set; }
    }

    public sealed class DiskInfo
    {
        [JsonPropertyName("index")] public int Index { get; set; }
        [JsonPropertyName("model")] public string? Model { get; set; }
        [JsonPropertyName("size_bytes")] public long SizeBytes { get; set; }
        [JsonPropertyName("media_type")] public string? MediaType { get; set; }
        [JsonPropertyName("serial")] public string? Serial { get; set; }
        [JsonPropertyName("interface_type")] public string? InterfaceType { get; set; }
        [JsonPropertyName("bus_type")] public string? BusType { get; set; }
        [JsonPropertyName("health_status")] public string? HealthStatus { get; set; }
        [JsonPropertyName("firmware")] public string? Firmware { get; set; }
        [JsonPropertyName("partition_count")] public int PartitionCount { get; set; }
    }

    public sealed class PartitionInfo
    {
        [JsonPropertyName("id")] public string? Id { get; set; }
        [JsonPropertyName("disk_index")] public int DiskIndex { get; set; }
        [JsonPropertyName("partition_index")] public int PartitionIndex { get; set; }
        [JsonPropertyName("type")] public string? Type { get; set; }
        [JsonPropertyName("size_bytes")] public long SizeBytes { get; set; }
        [JsonPropertyName("is_boot")] public bool IsBoot { get; set; }
        [JsonPropertyName("is_primary")] public bool IsPrimary { get; set; }
        [JsonPropertyName("drive_letter")] public string? DriveLetter { get; set; }
    }

    public sealed class VolumeInfo
    {
        [JsonPropertyName("letter")] public string? Letter { get; set; }
        [JsonPropertyName("size_bytes")] public long SizeBytes { get; set; }
        [JsonPropertyName("free_bytes")] public long FreeBytes { get; set; }
        [JsonPropertyName("used_bytes")] public long UsedBytes { get; set; }
        [JsonPropertyName("file_system")] public string? FileSystem { get; set; }
        [JsonPropertyName("label")] public string? Label { get; set; }
        [JsonPropertyName("disk_index")] public int? DiskIndex { get; set; }
    }
}
