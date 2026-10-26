using Microsoft.Extensions.Logging;
using System.Management;
using System.Text.Json.Serialization;

namespace LiderCollector.Modules.Virtualization;

/// <summary>
/// Collects Hyper-V VM inventory via WMI namespace root\virtualization\v2.
/// Returns null (not an error) when Hyper-V is not installed on this host.
/// Read-only; never modifies any VM, GPO, or host configuration.
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
            var vms = new List<VmInfo>();
            var scope = new ManagementScope(@"\\.\root\virtualization\v2");
            scope.Connect();

            // Msvm_ComputerSystem represents both the host and VMs.
            // Caption == "Virtual Machine" filters to guest VMs only.
            using var searcher = new ManagementObjectSearcher(scope,
                new ObjectQuery(
                    "SELECT Name,ElementName,EnabledState,NumberOfProcessors,MemorySettingData " +
                    "FROM Msvm_ComputerSystem WHERE Caption='Virtual Machine'"));

            foreach (ManagementObject vm in searcher.Get())
            {
                string? vmId = vm["Name"]?.ToString();    // GUID
                string? vmName = vm["ElementName"]?.ToString();
                int state = Convert.ToInt32(vm["EnabledState"] ?? 0);

                int cpuCount = 0;
                long ramMb = 0;

                // Get memory settings for this VM
                try
                {
                    using var memSearcher = new ManagementObjectSearcher(scope,
                        new ObjectQuery(
                            $"SELECT Limit FROM Msvm_MemorySettingData " +
                            $"WHERE InstanceID LIKE 'Microsoft:{vmId}%'"));
                    foreach (ManagementObject mem in memSearcher.Get())
                        ramMb = Convert.ToInt64(mem["Limit"] ?? 0);
                }
                catch { }

                // Processor settings
                try
                {
                    using var cpuSearcher = new ManagementObjectSearcher(scope,
                        new ObjectQuery(
                            $"SELECT VirtualQuantity FROM Msvm_ProcessorSettingData " +
                            $"WHERE InstanceID LIKE 'Microsoft:{vmId}%'"));
                    foreach (ManagementObject cpu in cpuSearcher.Get())
                        cpuCount = Convert.ToInt32(cpu["VirtualQuantity"] ?? 0);
                }
                catch { }

                vms.Add(new VmInfo
                {
                    VmGuid = vmId,
                    Name = vmName,
                    State = HyperVStateToString(state),
                    CpuCount = cpuCount,
                    RamMb = ramMb,
                    Platform = "hyperv",
                });
            }

            _log.LogInformation("Hyper-V: found {Count} VMs.", vms.Count);
            return Task.FromResult<object?>(new HyperVPayload { VirtualMachines = vms });
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "HyperVModule failed");
            return Task.FromResult<object?>(null);
        }
    }

    private static string HyperVStateToString(int state) => state switch
    {
        2 => "running",
        3 => "off",
        4 => "stopping",
        6 => "saved",
        9 => "paused",
        10 => "starting",
        11 => "reset",
        32768 => "running_critical",
        32769 => "off_critical",
        _ => "unknown",
    };

    // ── Payload DTOs ──────────────────────────────────────────────────────────

    public sealed class HyperVPayload
    {
        [JsonPropertyName("virtual_machines")] public List<VmInfo> VirtualMachines { get; set; } = new();
    }

    /// <summary>
    /// Common VM data model shared between Hyper-V and VMware.
    /// </summary>
    public sealed class VmInfo
    {
        [JsonPropertyName("vm_guid")] public string? VmGuid { get; set; }
        [JsonPropertyName("name")] public string? Name { get; set; }
        [JsonPropertyName("state")] public string? State { get; set; }
        [JsonPropertyName("cpu_count")] public int CpuCount { get; set; }
        [JsonPropertyName("ram_mb")] public long RamMb { get; set; }
        [JsonPropertyName("platform")] public string Platform { get; set; } = "hyperv";
        [JsonPropertyName("host")] public string? Host { get; set; }
        [JsonPropertyName("guest_os")] public string? GuestOs { get; set; }
        [JsonPropertyName("ip_addresses")] public List<string> IpAddresses { get; set; } = new();
    }
}
