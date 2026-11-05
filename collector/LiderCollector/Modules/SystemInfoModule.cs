using System.Management;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;

namespace LiderCollector.Modules;

/// <summary>
/// Collects hardware and OS information via WMI.
/// Sources: Win32_ComputerSystem, Win32_OperatingSystem, Win32_Processor,
///          Win32_BIOS, Win32_SystemEnclosure, Win32_PhysicalMemory,
///          Win32_DiskDrive, Win32_LogicalDisk.
/// </summary>
public sealed class SystemInfoModule : ICollectorModule
{
    private readonly ILogger<SystemInfoModule> _log;
    public string Name => "system";

    public SystemInfoModule(ILogger<SystemInfoModule> log) => _log = log;

    public Task<object?> RunAsync(CancellationToken ct)
    {
        var payload = new SystemPayload();

        // Each WMI source is independent; a failure in one must not suppress the rest.
        TryCollect("ComputerSystem", () => CollectComputerSystem(payload));
        TryCollect("OperatingSystem", () => CollectOs(payload));
        TryCollect("Processor",       () => CollectProcessor(payload));
        TryCollect("BIOS",            () => CollectBios(payload));
        TryCollect("Enclosure",       () => CollectEnclosure(payload));
        TryCollect("Memory",          () => CollectMemory(payload));
        TryCollect("Disks",           () => CollectDisks(payload));

        // Always return the payload — partial data is far more useful than null.
        return Task.FromResult<object?>(payload);
    }

    private void TryCollect(string source, Action action)
    {
        try { action(); }
        catch (Exception ex) { _log.LogWarning(ex, "SystemInfoModule: {Source} WMI query failed", source); }
    }

    private static void CollectComputerSystem(SystemPayload p)
    {
        using var s = new ManagementObjectSearcher(
            "SELECT Name,Manufacturer,Model,TotalPhysicalMemory,NumberOfLogicalProcessors," +
            "SystemType,Domain,UUID FROM Win32_ComputerSystem");
        foreach (ManagementObject o in s.Get())
        {
            p.Hostname = o["Name"]?.ToString();
            p.Manufacturer = o["Manufacturer"]?.ToString();
            p.Model = o["Model"]?.ToString();
            p.TotalRamBytes = Convert.ToInt64(o["TotalPhysicalMemory"] ?? 0);
            p.LogicalCores = Convert.ToInt32(o["NumberOfLogicalProcessors"] ?? 0);
            p.SystemType = o["SystemType"]?.ToString();
            p.Domain = o["Domain"]?.ToString();
            p.BiosUuid = NormalizeUuid(o["UUID"]?.ToString());
        }
    }

    private static string? NormalizeUuid(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        var upper = raw.Trim().ToUpperInvariant();
        // Filter known-fake/default GUIDs reported by some firmware/hypervisors
        if (upper == "00000000-0000-0000-0000-000000000000") return null;
        if (upper == "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF") return null;
        if (upper == "03000200-0400-0500-0006-000700080009") return null; // VMware default
        if (upper.StartsWith("00000000-0000-0000-")) return null;
        return upper;
    }

    private static void CollectOs(SystemPayload p)
    {
        using var s = new ManagementObjectSearcher(
            "SELECT Caption,Version,BuildNumber,OSArchitecture,LastBootUpTime," +
            "FreePhysicalMemory,InstallDate FROM Win32_OperatingSystem");
        foreach (ManagementObject o in s.Get())
        {
            p.OsName = o["Caption"]?.ToString();
            p.OsVersion = o["Version"]?.ToString();
            p.OsBuild = o["BuildNumber"]?.ToString();
            p.OsArch = o["OSArchitecture"]?.ToString();
            if (o["LastBootUpTime"] is string lbt)
                p.LastBootTime = ManagementDateTimeConverter.ToDateTime(lbt);
            if (o["InstallDate"] is string inst)
                p.OsInstallDate = ManagementDateTimeConverter.ToDateTime(inst);
        }
    }

    private static void CollectProcessor(SystemPayload p)
    {
        var cpus = new List<CpuInfo>();
        using var s = new ManagementObjectSearcher(
            "SELECT Name,NumberOfCores,NumberOfLogicalProcessors,MaxClockSpeed FROM Win32_Processor");
        foreach (ManagementObject o in s.Get())
            cpus.Add(new CpuInfo
            {
                Name = o["Name"]?.ToString(),
                Cores = Convert.ToInt32(o["NumberOfCores"] ?? 0),
                LogicalProcessors = Convert.ToInt32(o["NumberOfLogicalProcessors"] ?? 0),
                MaxClockMhz = Convert.ToInt32(o["MaxClockSpeed"] ?? 0),
            });
        p.Processors = cpus;
    }

    private static void CollectBios(SystemPayload p)
    {
        using var s = new ManagementObjectSearcher(
            "SELECT SerialNumber,Version,ReleaseDate,Manufacturer FROM Win32_BIOS");
        foreach (ManagementObject o in s.Get())
        {
            p.BiosSerial = o["SerialNumber"]?.ToString();
            p.BiosVersion = o["Version"]?.ToString();
            p.BiosManufacturer = o["Manufacturer"]?.ToString();
        }
    }

    private static void CollectEnclosure(SystemPayload p)
    {
        using var s = new ManagementObjectSearcher(
            "SELECT ChassisTypes FROM Win32_SystemEnclosure");
        foreach (ManagementObject o in s.Get())
        {
            if (o["ChassisTypes"] is ushort[] types && types.Length > 0)
                p.ChassisType = ChassisTypeToString(types[0]);
        }
    }

    private static void CollectMemory(SystemPayload p)
    {
        var slots = new List<RamSlot>();
        using var s = new ManagementObjectSearcher(
            "SELECT BankLabel,Capacity,Speed,Manufacturer,PartNumber FROM Win32_PhysicalMemory");
        foreach (ManagementObject o in s.Get())
            slots.Add(new RamSlot
            {
                Label = o["BankLabel"]?.ToString(),
                CapacityBytes = Convert.ToInt64(o["Capacity"] ?? 0),
                SpeedMhz = Convert.ToInt32(o["Speed"] ?? 0),
                Manufacturer = o["Manufacturer"]?.ToString(),
                PartNumber = o["PartNumber"]?.ToString(),
            });
        p.RamSlots = slots;
    }

    private static void CollectDisks(SystemPayload p)
    {
        var disks = new List<DiskInfo>();
        using var s = new ManagementObjectSearcher(
            "SELECT Model,Size,MediaType,SerialNumber,InterfaceType FROM Win32_DiskDrive");
        foreach (ManagementObject o in s.Get())
            disks.Add(new DiskInfo
            {
                Model = o["Model"]?.ToString(),
                SizeBytes = Convert.ToInt64(o["Size"] ?? 0),
                MediaType = o["MediaType"]?.ToString(),
                Serial = o["SerialNumber"]?.ToString(),
                InterfaceType = o["InterfaceType"]?.ToString(),
            });
        p.Disks = disks;

        var vols = new List<VolumeInfo>();
        using var sv = new ManagementObjectSearcher(
            "SELECT DeviceID,Size,FreeSpace,FileSystem,VolumeName FROM Win32_LogicalDisk WHERE DriveType=3");
        foreach (ManagementObject o in sv.Get())
            vols.Add(new VolumeInfo
            {
                Letter = o["DeviceID"]?.ToString(),
                SizeBytes = Convert.ToInt64(o["Size"] ?? 0),
                FreeBytes = Convert.ToInt64(o["FreeSpace"] ?? 0),
                FileSystem = o["FileSystem"]?.ToString(),
                Label = o["VolumeName"]?.ToString(),
            });
        p.Volumes = vols;
    }

    private static string ChassisTypeToString(ushort t) => t switch
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
        [JsonPropertyName("volumes")] public List<VolumeInfo> Volumes { get; set; } = new();

        // ── Backward-compat aliases expected by WindowsInventoryProcessor ──────
        // These derived properties emit the field names the PHP server consumes
        // without removing the original rich fields above.
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
        [JsonPropertyName("model")] public string? Model { get; set; }
        [JsonPropertyName("size_bytes")] public long SizeBytes { get; set; }
        [JsonPropertyName("media_type")] public string? MediaType { get; set; }
        [JsonPropertyName("serial")] public string? Serial { get; set; }
        [JsonPropertyName("interface_type")] public string? InterfaceType { get; set; }
    }

    public sealed class VolumeInfo
    {
        [JsonPropertyName("letter")] public string? Letter { get; set; }
        [JsonPropertyName("size_bytes")] public long SizeBytes { get; set; }
        [JsonPropertyName("free_bytes")] public long FreeBytes { get; set; }
        [JsonPropertyName("file_system")] public string? FileSystem { get; set; }
        [JsonPropertyName("label")] public string? Label { get; set; }
    }
}
