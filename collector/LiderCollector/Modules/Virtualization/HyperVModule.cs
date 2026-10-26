using Microsoft.Extensions.Logging;
using System.Management;

namespace LiderCollector.Modules.Virtualization;

/// <summary>
/// Collects Hyper-V inventory via WMI namespace root\virtualization\v2 on the LOCAL host.
/// The Site Collector must run on (or have WinRM access to) the Hyper-V server.
/// Read-only — never modifies any VM, GPO, service, or host configuration.
/// </summary>
public sealed class HyperVModule : IVirtualizationModule
{
    private readonly ILogger<HyperVModule> _log;
    public string Name => "hyperv";

    public HyperVModule(ILogger<HyperVModule> log) => _log = log;

    public bool IsAvailable()
    {
        try
        {
            var scope = new ManagementScope(@"\\.\root\virtualization\v2");
            scope.Connect();
            return true;
        }
        catch { return false; }
    }

    public Task<object?> RunAsync(CancellationToken ct)
    {
        if (!IsAvailable())
        {
            _log.LogDebug("Hyper-V WMI namespace not found — skipping.");
            return Task.FromResult<object?>(null);
        }

        try
        {
            var scope = new ManagementScope(@"\\.\root\virtualization\v2");
            scope.Connect();

            var payload = new VirtSyncPayload
            {
                Platform      = "hyperv",
                ConnectionRef = System.Net.Dns.GetHostName(),
                CollectedAt   = DateTime.UtcNow.ToString("O"),
                SyncType      = "full",
            };

            payload.Hosts.Add(CollectLocalHost(scope));
            payload.VMs.AddRange(CollectVMs(scope));
            payload.Networks.AddRange(CollectNetworks(scope));

            _log.LogInformation("Hyper-V: {Hosts} host, {VMs} VMs, {Nets} networks.",
                payload.Hosts.Count, payload.VMs.Count, payload.Networks.Count);

            return Task.FromResult<object?>(payload);
        }
        catch (OperationCanceledException) { throw; }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "HyperVModule failed");
            return Task.FromResult<object?>(null);
        }
    }

    // ── Host (this machine acting as Hyper-V server) ──────────────────────────

    private static VirtHostData CollectLocalHost(ManagementScope scope)
    {
        var host = new VirtHostData
        {
            PlatformId = System.Net.Dns.GetHostName(),
            Name       = System.Net.Dns.GetHostName(),
            Fqdn       = System.Net.Dns.GetHostEntry("").HostName,
            Status     = "connected",
        };

        // CPU info
        try
        {
            using var cs = new ManagementObjectSearcher(
                @"root\cimv2", "SELECT NumberOfLogicalProcessors,NumberOfCores FROM Win32_ComputerSystem");
            var mo = cs.Get().Cast<ManagementObject>().FirstOrDefault();
            if (mo != null)
            {
                host.CpuCoresTotal = Convert.ToInt32(mo["NumberOfCores"] ?? 0);
                host.CpuThreadsTotal = Convert.ToInt32(mo["NumberOfLogicalProcessors"] ?? 0);
            }
        }
        catch { }

        try
        {
            using var cs = new ManagementObjectSearcher(
                @"root\cimv2", "SELECT Name,MaxClockSpeed FROM Win32_Processor");
            var mo = cs.Get().Cast<ManagementObject>().FirstOrDefault();
            if (mo != null)
            {
                host.CpuModel = mo["Name"]?.ToString()?.Trim();
                long maxMhz = Convert.ToInt64(mo["MaxClockSpeed"] ?? 0);
                host.CpuTotalMhz = (host.CpuThreadsTotal ?? 1) * maxMhz;
            }
        }
        catch { }

        // RAM
        try
        {
            using var cs = new ManagementObjectSearcher(
                @"root\cimv2", "SELECT TotalPhysicalMemory FROM Win32_ComputerSystem");
            var mo = cs.Get().Cast<ManagementObject>().FirstOrDefault();
            if (mo != null)
                host.RamTotalGb = Math.Round(Convert.ToInt64(mo["TotalPhysicalMemory"]) / (1024.0 * 1024 * 1024), 1);
        }
        catch { }

        // Hyper-V version
        try
        {
            using var cs = new ManagementObjectSearcher(
                scope, new ObjectQuery("SELECT Version FROM Msvm_VirtualSystemManagementService"));
            var mo = cs.Get().Cast<ManagementObject>().FirstOrDefault();
            if (mo != null)
                host.HypervisorVersion = mo["Version"]?.ToString();
        }
        catch { }

        return host;
    }

    // ── Virtual machines ──────────────────────────────────────────────────────

    private List<VirtVmData> CollectVMs(ManagementScope scope)
    {
        var vms = new List<VirtVmData>();

        using var searcher = new ManagementObjectSearcher(scope,
            new ObjectQuery(
                "SELECT Name,ElementName,EnabledState,Description FROM Msvm_ComputerSystem " +
                "WHERE Caption='Virtual Machine'"));

        foreach (ManagementObject vm in searcher.Get())
        {
            string vmGuid = vm["Name"]?.ToString() ?? Guid.NewGuid().ToString();
            string vmName = vm["ElementName"]?.ToString() ?? vmGuid;
            int state = Convert.ToInt32(vm["EnabledState"] ?? 0);

            var data = new VirtVmData
            {
                VmUuid     = vmGuid,
                Name       = vmName,
                PowerState = StateToString(state),
                HostPlatformId = System.Net.Dns.GetHostName(),
            };

            EnrichVmResources(scope, vmGuid, data);
            EnrichVmBiosUuid(scope, vmGuid, data);
            EnrichVmDisks(scope, vmGuid, data);
            EnrichVmSnapshots(scope, vmGuid, data);
            EnrichVmNics(scope, vmGuid, data);
            EnrichVmGuestInfo(scope, vmGuid, data);

            vms.Add(data);
        }

        return vms;
    }

    private static void EnrichVmResources(ManagementScope scope, string vmGuid, VirtVmData data)
    {
        try
        {
            using var s = new ManagementObjectSearcher(scope,
                new ObjectQuery($"SELECT Limit FROM Msvm_MemorySettingData " +
                                $"WHERE InstanceID LIKE 'Microsoft:{vmGuid}%'"));
            var mo = s.Get().Cast<ManagementObject>().FirstOrDefault();
            if (mo != null) data.RamMb = Convert.ToInt64(mo["Limit"] ?? 0);
        }
        catch { }

        try
        {
            using var s = new ManagementObjectSearcher(scope,
                new ObjectQuery($"SELECT VirtualQuantity FROM Msvm_ProcessorSettingData " +
                                $"WHERE InstanceID LIKE 'Microsoft:{vmGuid}%'"));
            var mo = s.Get().Cast<ManagementObject>().FirstOrDefault();
            if (mo != null) data.VcpuCount = Convert.ToInt32(mo["VirtualQuantity"] ?? 0);
        }
        catch { }
    }

    private static void EnrichVmBiosUuid(ManagementScope scope, string vmGuid, VirtVmData data)
    {
        try
        {
            // Msvm_BIOSElement contains the BIOS UUID visible to the guest OS
            using var s = new ManagementObjectSearcher(scope,
                new ObjectQuery($"SELECT BIOSSerialNumber FROM Msvm_BIOSElement " +
                                $"WHERE SystemName='{vmGuid}'"));
            var mo = s.Get().Cast<ManagementObject>().FirstOrDefault();
            if (mo != null)
            {
                var serial = mo["BIOSSerialNumber"]?.ToString();
                if (!string.IsNullOrWhiteSpace(serial))
                    data.BiosUuid = serial.Trim();
            }
        }
        catch { }
    }

    private static void EnrichVmDisks(ManagementScope scope, string vmGuid, VirtVmData data)
    {
        try
        {
            // Msvm_StorageAllocationSettingData for VHD/VHDX paths
            using var s = new ManagementObjectSearcher(scope,
                new ObjectQuery(
                    $"SELECT HostResource,Caption,VirtualQuantityUnits FROM Msvm_StorageAllocationSettingData " +
                    $"WHERE InstanceID LIKE 'Microsoft:{vmGuid}%' AND ResourceType=17"));

            foreach (ManagementObject disk in s.Get())
            {
                string[]? hostRes = disk["HostResource"] as string[];
                string path = hostRes?.FirstOrDefault() ?? "";
                if (string.IsNullOrEmpty(path)) continue;

                string ext = Path.GetExtension(path).ToLowerInvariant();
                data.Disks.Add(new VirtDiskData
                {
                    Label    = Path.GetFileName(path),
                    DiskType = ext.TrimStart('.'),
                    // SizeGb from VirtualQuantityUnits — bytes value needs unit check
                });
            }
        }
        catch { }
    }

    private static void EnrichVmSnapshots(ManagementScope scope, string vmGuid, VirtVmData data)
    {
        try
        {
            using var s = new ManagementObjectSearcher(scope,
                new ObjectQuery(
                    $"SELECT ElementName,CreationTime FROM Msvm_VirtualSystemSettingData " +
                    $"WHERE VirtualSystemType='Microsoft:Hyper-V:Snapshot:Realized' " +
                    $"AND SystemName='{vmGuid}'"));

            DateTime? oldest = null;
            foreach (ManagementObject snap in s.Get())
            {
                string? createdRaw = snap["CreationTime"]?.ToString();
                DateTime? created = null;
                if (createdRaw != null &&
                    ManagementDateTimeConverter.ToDateTime(createdRaw) is DateTime dt)
                {
                    created = dt.ToUniversalTime();
                    if (oldest == null || created < oldest) oldest = created;
                }

                data.Snapshots.Add(new VirtSnapshotData
                {
                    Name      = snap["ElementName"]?.ToString(),
                    CreatedAt = created?.ToString("O"),
                });
            }

            data.SnapshotCount = data.Snapshots.Count;
            if (oldest.HasValue)
                data.OldestSnapshotDays = (int)(DateTime.UtcNow - oldest.Value).TotalDays;
        }
        catch { }
    }

    private static void EnrichVmNics(ManagementScope scope, string vmGuid, VirtVmData data)
    {
        try
        {
            using var s = new ManagementObjectSearcher(scope,
                new ObjectQuery(
                    $"SELECT Address,ElementName FROM Msvm_SyntheticEthernetPortSettingData " +
                    $"WHERE InstanceID LIKE 'Microsoft:{vmGuid}%'"));

            foreach (ManagementObject nic in s.Get())
            {
                string? mac = nic["Address"]?.ToString();
                if (string.IsNullOrEmpty(mac)) continue;

                // Normalise MAC: AABBCCDDEE11 → aa:bb:cc:dd:ee:11
                if (mac.Length == 12)
                    mac = string.Join(":", Enumerable.Range(0, 6)
                        .Select(i => mac.Substring(i * 2, 2))).ToLowerInvariant();

                data.Nics.Add(new VirtNicData
                {
                    MacAddress  = mac,
                    AdapterType = "synthetic",
                    Connected   = true,
                });
            }
        }
        catch { }
    }

    private static void EnrichVmGuestInfo(ManagementScope scope, string vmGuid, VirtVmData data)
    {
        try
        {
            // Msvm_GuestNetworkAdapterConfiguration — populated when Hyper-V Integration Services running
            using var s = new ManagementObjectSearcher(scope,
                new ObjectQuery(
                    $"SELECT IPAddresses,DNSHostname FROM Msvm_GuestNetworkAdapterConfiguration " +
                    $"WHERE InstanceID LIKE 'Microsoft:{vmGuid}%'"));

            string? firstIp = null;
            string? hostname = null;
            foreach (ManagementObject gc in s.Get())
            {
                string[]? ips = gc["IPAddresses"] as string[];
                if (firstIp == null)
                    firstIp = ips?.FirstOrDefault(ip =>
                        System.Net.IPAddress.TryParse(ip, out var parsed) &&
                        !ip.StartsWith("169.254") && !ip.StartsWith("fe80"));

                if (hostname == null)
                    hostname = gc["DNSHostname"]?.ToString();
            }

            if (firstIp != null)  data.GuestIp = firstIp;
            if (hostname != null) data.GuestHostname = hostname;
        }
        catch { }
    }

    // ── Virtual networks (Hyper-V switches) ───────────────────────────────────

    private static List<VirtNetworkData> CollectNetworks(ManagementScope scope)
    {
        var nets = new List<VirtNetworkData>();
        try
        {
            using var s = new ManagementObjectSearcher(scope,
                new ObjectQuery("SELECT Name,ElementName FROM Msvm_VirtualEthernetSwitch"));

            foreach (ManagementObject sw in s.Get())
            {
                string? id   = sw["Name"]?.ToString();
                string? name = sw["ElementName"]?.ToString();
                if (string.IsNullOrEmpty(id)) continue;

                nets.Add(new VirtNetworkData
                {
                    NetworkId = id,
                    Name      = name ?? id,
                    Type      = "hyperv_switch",
                });
            }
        }
        catch { }
        return nets;
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private static string StateToString(int state) => state switch
    {
        2     => "powered_on",
        3     => "powered_off",
        4     => "stopping",
        6     => "suspended",
        9     => "suspended",
        10    => "starting",
        11    => "powered_off",
        32768 => "powered_on",
        32769 => "powered_off",
        _     => "unknown",
    };
}
