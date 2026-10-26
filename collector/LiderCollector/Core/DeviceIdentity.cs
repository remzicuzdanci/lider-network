using System.Management;
using System.Net.NetworkInformation;
using System.Text.Json.Serialization;

namespace LiderCollector.Core;

/// <summary>
/// Collects stable hardware identifiers used for reliable device matching on the server.
/// Priority order for deduplication: bios_uuid > serial > ad_guid > mac > hostname.
/// IP and hostname alone are never sufficient for merge decisions.
/// </summary>
public sealed class DeviceIdentity
{
    // Cached on first collection
    private IdentityPayload? _cached;
    private readonly object _lock = new();

    public IdentityPayload Collect()
    {
        lock (_lock)
        {
            return _cached ??= CollectInternal();
        }
    }

    private static IdentityPayload CollectInternal()
    {
        var id = new IdentityPayload();

        // ── BIOS UUID ──────────────────────────────────────────────────────
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT UUID FROM Win32_ComputerSystemProduct");
            foreach (ManagementObject obj in searcher.Get())
            {
                string? uuid = obj["UUID"]?.ToString();
                if (!string.IsNullOrWhiteSpace(uuid) &&
                    !uuid.Equals("FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF", StringComparison.OrdinalIgnoreCase) &&
                    !uuid.StartsWith("00000000", StringComparison.OrdinalIgnoreCase))
                {
                    id.BiosUuid = uuid.ToUpperInvariant();
                }
            }
        }
        catch { /* non-fatal */ }

        // ── Serial number ──────────────────────────────────────────────────
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT SerialNumber FROM Win32_BIOS");
            foreach (ManagementObject obj in searcher.Get())
            {
                string? serial = obj["SerialNumber"]?.ToString()?.Trim();
                if (!string.IsNullOrWhiteSpace(serial) &&
                    serial != "To Be Filled By O.E.M." &&
                    serial != "Default string" &&
                    serial.Length >= 4)
                {
                    id.SerialNumber = serial;
                }
            }
        }
        catch { }

        // ── WMI computer ID (GUID from Win32_ComputerSystemProduct.IdentifyingNumber) ──
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT IdentifyingNumber FROM Win32_ComputerSystemProduct");
            foreach (ManagementObject obj in searcher.Get())
            {
                string? idn = obj["IdentifyingNumber"]?.ToString()?.Trim();
                if (!string.IsNullOrWhiteSpace(idn) && idn.Length >= 4)
                    id.WmiIdentifyingNumber = idn;
            }
        }
        catch { }

        // ── MAC addresses (physical, non-loopback, non-virtual) ────────────
        try
        {
            var macs = new List<string>();
            foreach (var nic in NetworkInterface.GetAllNetworkInterfaces())
            {
                if (nic.NetworkInterfaceType == NetworkInterfaceType.Loopback) continue;
                if (nic.OperationalStatus == OperationalStatus.Down) continue;

                string mac = string.Join(":", nic.GetPhysicalAddress().GetAddressBytes()
                    .Select(b => b.ToString("X2")));
                if (mac == "00:00:00:00:00:00") continue;
                if (mac.Length < 17) continue;

                macs.Add(mac);
            }
            id.MacAddresses = macs;
        }
        catch { }

        // ── Hostname ────────────────────────────────────────────────────────
        id.Hostname = Environment.MachineName;
        try { id.Fqdn = System.Net.Dns.GetHostEntry("").HostName; } catch { }

        return id;
    }

    public sealed class IdentityPayload
    {
        [JsonPropertyName("bios_uuid")]
        public string? BiosUuid { get; set; }

        [JsonPropertyName("serial_number")]
        public string? SerialNumber { get; set; }

        [JsonPropertyName("wmi_id")]
        public string? WmiIdentifyingNumber { get; set; }

        [JsonPropertyName("mac_addresses")]
        public List<string> MacAddresses { get; set; } = new();

        [JsonPropertyName("hostname")]
        public string Hostname { get; set; } = Environment.MachineName;

        [JsonPropertyName("fqdn")]
        public string? Fqdn { get; set; }
    }
}
