using System.Management;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;

namespace LiderCollector.Modules;

/// <summary>
/// Collects network adapter configuration via WMI (Win32_NetworkAdapterConfiguration).
/// Returns adapters that have IP enabled; skips loopback and tunnel adapters.
/// </summary>
public sealed class NetworkModule : ICollectorModule
{
    private readonly ILogger<NetworkModule> _log;
    public string Name => "network";

    public NetworkModule(ILogger<NetworkModule> log) => _log = log;

    public Task<object?> RunAsync(CancellationToken ct)
    {
        var adapters = new List<AdapterInfo>();
        try
        {
            using var s = new ManagementObjectSearcher(
                "SELECT Description,MACAddress,IPAddress,IPSubnet,DefaultIPGateway," +
                "DHCPEnabled,DHCPServer,DNSServerSearchOrder,Index,IPEnabled " +
                "FROM Win32_NetworkAdapterConfiguration WHERE IPEnabled=True");

            foreach (ManagementObject o in s.Get())
            {
                try
                {
                    string? mac = o["MACAddress"]?.ToString();
                    if (string.IsNullOrEmpty(mac)) continue;

                    var ips = (o["IPAddress"] as string[]) ?? Array.Empty<string>();
                    var subnets = (o["IPSubnet"] as string[]) ?? Array.Empty<string>();
                    var gateways = (o["DefaultIPGateway"] as string[]) ?? Array.Empty<string>();
                    var dns = (o["DNSServerSearchOrder"] as string[]) ?? Array.Empty<string>();

                    adapters.Add(new AdapterInfo
                    {
                        Description = o["Description"]?.ToString(),
                        MacAddress = mac,
                        IpAddresses = ips.ToList(),
                        Subnets = subnets.ToList(),
                        DefaultGateways = gateways.ToList(),
                        DnsServers = dns.ToList(),
                        DhcpEnabled = Convert.ToBoolean(o["DHCPEnabled"] ?? false),
                        DhcpServer = o["DHCPServer"]?.ToString(),
                    });
                }
                catch (Exception ex)
                {
                    _log.LogWarning(ex, "NetworkModule: failed to read one adapter, skipping");
                }
            }
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "NetworkModule: WMI query failed");
        }

        // Always return payload — empty adapter list is valid (loopback-only machine).
        return Task.FromResult<object?>(new NetworkPayload { Adapters = adapters });
    }

    public sealed class NetworkPayload
    {
        [JsonPropertyName("adapters")] public List<AdapterInfo> Adapters { get; set; } = new();
    }

    public sealed class AdapterInfo
    {
        [JsonPropertyName("description")] public string? Description { get; set; }
        [JsonPropertyName("mac_address")] public string? MacAddress { get; set; }
        [JsonPropertyName("ip_addresses")] public List<string> IpAddresses { get; set; } = new();
        [JsonPropertyName("subnets")] public List<string> Subnets { get; set; } = new();
        [JsonPropertyName("default_gateways")] public List<string> DefaultGateways { get; set; } = new();
        [JsonPropertyName("dns_servers")] public List<string> DnsServers { get; set; } = new();
        [JsonPropertyName("dhcp_enabled")] public bool DhcpEnabled { get; set; }
        [JsonPropertyName("dhcp_server")] public string? DhcpServer { get; set; }
    }
}
