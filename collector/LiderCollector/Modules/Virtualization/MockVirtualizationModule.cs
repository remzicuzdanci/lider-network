using Microsoft.Extensions.Logging;

namespace LiderCollector.Modules.Virtualization;

/// <summary>
/// Configurable mock adapter for both VMware and Hyper-V.
/// Enabled via config: Modules.MockVirt = true, MockVirt.Platform = "vmware" | "hyperv".
/// Used in isolated test environments — never connects to real infrastructure.
/// </summary>
public sealed class MockVirtualizationModule : IVirtualizationModule
{
    private readonly MockVirtConfig _cfg;
    private readonly ILogger<MockVirtualizationModule> _log;

    public string Name => "mock_virt";

    public MockVirtualizationModule(MockVirtConfig cfg, ILogger<MockVirtualizationModule> log)
    {
        _cfg = cfg;
        _log = log;
    }

    public bool IsAvailable() => true;

    public Task<object?> RunAsync(CancellationToken ct)
    {
        _log.LogInformation(
            "MockVirt: generating {HostCount} hosts, {VmCount} VMs (platform={Platform}).",
            _cfg.HostCount, _cfg.VmCount, _cfg.Platform);

        var payload = new VirtSyncPayload
        {
            Platform      = _cfg.Platform,
            ConnectionRef = "mock-connection",
            CollectedAt   = DateTime.UtcNow.ToString("O"),
            SyncType      = "full",
        };

        bool isVmware = _cfg.Platform.StartsWith("vmware", StringComparison.OrdinalIgnoreCase);

        // Hosts
        for (int h = 1; h <= _cfg.HostCount; h++)
        {
            payload.Hosts.Add(new VirtHostData
            {
                PlatformId        = isVmware ? $"host-{h}" : $"mock-esxi-{h:00}.internal",
                Name              = $"esx{h:00}.internal",
                Fqdn              = $"esx{h:00}.internal",
                CpuModel          = "Intel Xeon Gold 6248R",
                CpuSockets        = 2,
                CpuCoresTotal     = 40,
                CpuThreadsTotal   = 80,
                CpuTotalMhz       = 80 * 3000,
                CpuUsageMhz       = (h % 3 + 1) * 4000,
                RamTotalGb        = 768,
                RamUsageGb        = 100 + h * 60.0,
                HypervisorVersion = isVmware ? "VMware ESXi 8.0.1" : "17763",
                BuildVersion      = isVmware ? "21813344" : null,
                Status            = "connected",
                ClusterName       = _cfg.HostCount > 1 ? "Cluster-A" : null,
                DatacenterName    = isVmware ? "DC-Mock" : null,
            });
        }

        // Datastores (VMware mock)
        if (isVmware)
        {
            for (int d = 1; d <= 2; d++)
            {
                payload.Datastores.Add(new VirtDatastoreData
                {
                    DatastoreId = $"datastore-{d}",
                    Name        = $"SAN-DS{d:00}",
                    Type        = "VMFS",
                    CapacityGb  = 10 * 1024,
                    FreeGb      = (7 - d) * 1024,
                    VmCount     = _cfg.VmCount / 2,
                    Accessible  = true,
                });
            }
        }

        // Networks
        payload.Networks.Add(new VirtNetworkData
        {
            NetworkId = isVmware ? "network-1" : $"mock-switch-{Guid.NewGuid():N}",
            Name      = "VM Network",
            Type      = isVmware ? "standard_vswitch" : "hyperv_switch",
            VlanId    = 10,
        });
        payload.Networks.Add(new VirtNetworkData
        {
            NetworkId = isVmware ? "dvportgroup-1" : $"mock-switch-{Guid.NewGuid():N}",
            Name      = "Management Network",
            Type      = isVmware ? "dvs" : "hyperv_switch",
            VlanId    = 99,
        });

        // VMs
        for (int v = 1; v <= _cfg.VmCount; v++)
        {
            string vmUuid      = $"mock-vm-uuid-{v:00000000}";
            string? biosUuid   = $"MOCK-BIOS-{v:0000}-0000-0000-000000000000";
            string hostRef     = payload.Hosts[(v - 1) % _cfg.HostCount].PlatformId;
            bool powered       = v % 5 != 0; // every 5th is off
            int snapCount      = (v % 4 == 0) ? 2 : (v % 7 == 0) ? 5 : 0;

            var vm = new VirtVmData
            {
                VmUuid         = vmUuid,
                InstanceUuid   = isVmware ? $"iuuid-{v:00000000}-0000-0000-0000" : null,
                BiosUuid       = biosUuid,
                Moref          = isVmware ? $"vm-{100 + v}" : null,
                HostPlatformId = hostRef,
                Name           = $"mock-vm-{v:00}",
                PowerState     = powered ? "powered_on" : "powered_off",
                GuestOs        = (v % 3 == 0) ? "windows_2022" : "rhel9_64Guest",
                GuestHostname  = powered ? $"mock-vm-{v:00}.internal" : null,
                GuestIp        = powered ? $"192.168.{10 + (v / 254)}.{v % 254}" : null,
                ToolsStatus    = powered ? "guestToolsRunning" : "guestToolsNotRunning",
                VcpuCount      = (v % 3 + 1) * 2,
                RamMb          = (long)((v % 4 + 1) * 4096),
                CpuUsageMhz    = powered ? (v % 5 + 1) * 100 : 0,
                RamUsageMb     = powered ? (long)((v % 4 + 1) * 1024) : 0,
                SnapshotCount  = snapCount,
                OldestSnapshotDays = snapCount > 0 ? 14 + v % 30 : null,
            };

            vm.Disks.Add(new VirtDiskData
            {
                Label           = "[SAN-DS01] mock-vm-{v:00}/mock-vm-{v:00}.vmdk",
                DatastoreId     = "datastore-1",
                SizeGb          = 80 + (v % 5) * 20,
                UsedGb          = 40 + (v % 5) * 10,
                ThinProvisioned = true,
                DiskType        = isVmware ? "vmdk" : (v % 2 == 0 ? "vhdx" : "vhd"),
            });

            for (int s = 0; s < snapCount; s++)
            {
                vm.Snapshots.Add(new VirtSnapshotData
                {
                    Name      = $"snapshot-{s + 1}",
                    CreatedAt = DateTime.UtcNow.AddDays(-(14 + s * 7)).ToString("O"),
                    SizeGb    = 2.5 + s,
                    IsCurrent = s == snapCount - 1,
                });
            }

            vm.Nics.Add(new VirtNicData
            {
                MacAddress  = $"00:50:56:{v / 256:x2}:{v % 256:x2}:01",
                NetworkId   = "network-1",
                AdapterType = isVmware ? "vmxnet3" : "synthetic",
                Connected   = powered,
            });

            payload.VMs.Add(vm);
        }

        return Task.FromResult<object?>(payload);
    }
}

/// <summary>Mock virtualization module configuration.</summary>
public sealed class MockVirtConfig
{
    public string Platform  { get; set; } = "vmware_vcenter"; // vmware_vcenter | vmware_esxi | hyperv
    public int    HostCount { get; set; } = 2;
    public int    VmCount   { get; set; } = 10;
}
