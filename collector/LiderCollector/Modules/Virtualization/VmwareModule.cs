using LiderCollector.Core;
using Microsoft.Extensions.Logging;
using System.Net.Http.Headers;
using System.Net.Security;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace LiderCollector.Modules.Virtualization;

/// <summary>
/// Collects VM inventory from VMware vCenter (7.0+) or standalone ESXi via vSphere REST API.
/// vCenter:    /api/vcenter/* endpoints (REST API available since vSphere 7.0)
/// Standalone ESXi: same base path but many list endpoints absent; falls back gracefully.
///
/// SSL is ALWAYS verified (custom CA additive only).
/// Read-only — never modifies any VM or vCenter configuration.
///
/// IMPORTANT: Standalone ESXi REST API != vCenter REST API.
/// ESXi lacks /api/vcenter/host, /api/vcenter/datastore, /api/vcenter/network lists.
/// VMs are enumerable via /api/vcenter/vm on ESXi 7.0+ only.
/// </summary>
public sealed class VmwareModule : IVirtualizationModule
{
    private readonly CollectorConfig _config;
    private readonly SecureStorage _secure;
    private readonly ILogger<VmwareModule> _log;

    private static readonly JsonSerializerOptions _jsonOpts = new()
    {
        PropertyNamingPolicy        = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive = true,
    };

    public string Name => "vmware";

    public VmwareModule(CollectorConfig config, SecureStorage secure, ILogger<VmwareModule> log)
    {
        _config = config;
        _secure = secure;
        _log    = log;
    }

    public bool IsAvailable() =>
        _config.Modules.Vmware && _config.Vmware != null &&
        !string.IsNullOrEmpty(_config.Vmware.Host);

    public async Task<object?> RunAsync(CancellationToken ct)
    {
        if (!IsAvailable())
        {
            _log.LogDebug("VMware module disabled or not configured.");
            return null;
        }

        var vmwareCfg = _config.Vmware!;
        string baseUrl = $"https://{vmwareCfg.Host}:{vmwareCfg.Port}";

        string? sessionId = await AuthenticateAsync(baseUrl, ct);
        if (sessionId == null) return null;

        try
        {
            using var http = BuildHttpClient(sessionId);
            bool isEsxi = await DetectEsxiAsync(http, baseUrl, ct);

            if (isEsxi)
                _log.LogInformation("VMware: connected to standalone ESXi host {Host}", vmwareCfg.Host);
            else
                _log.LogInformation("VMware: connected to vCenter {Host}", vmwareCfg.Host);

            var payload = new VirtSyncPayload
            {
                Platform      = isEsxi ? "vmware_esxi" : "vmware_vcenter",
                ConnectionRef = vmwareCfg.Host,
                CollectedAt   = DateTime.UtcNow.ToString("O"),
                SyncType      = "full",
            };

            // Hosts (vCenter only — ESXi exposes itself differently)
            if (!isEsxi)
                payload.Hosts.AddRange(await CollectHostsAsync(http, baseUrl, ct));

            // VMs — enumerate summary list, then fetch detail for each
            var vmSummaries = await ListVmSummariesAsync(http, baseUrl, ct);
            foreach (var summary in vmSummaries)
            {
                ct.ThrowIfCancellationRequested();
                var detail = await FetchVmDetailAsync(http, baseUrl, summary.Vm!, ct);
                payload.VMs.Add(MapVmDetail(summary, detail));
            }

            // Datastores + networks only on vCenter (lists not available on standalone ESXi)
            if (!isEsxi)
            {
                payload.Datastores.AddRange(await CollectDatastoresAsync(http, baseUrl, ct));
                payload.Networks.AddRange(await CollectNetworksAsync(http, baseUrl, ct));
            }

            _log.LogInformation(
                "VMware [{Platform}]: {Hosts} hosts, {VMs} VMs, {DS} datastores, {Nets} networks.",
                payload.Platform, payload.Hosts.Count, payload.VMs.Count,
                payload.Datastores.Count, payload.Networks.Count);

            return payload;
        }
        catch (OperationCanceledException) { throw; }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "VmwareModule failed");
            return null;
        }
        finally
        {
            await LogoutAsync(baseUrl, sessionId);
        }
    }

    // ── Authentication ────────────────────────────────────────────────────────

    private async Task<string?> AuthenticateAsync(string baseUrl, CancellationToken ct)
    {
        string? password = _secure.Get("vmware_password");
        if (string.IsNullOrEmpty(password))
        {
            _log.LogWarning("VMware password not found in secure storage (key: vmware_password).");
            return null;
        }

        using var http = BuildHttpClient(null);
        var req = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/api/session");
        string creds = Convert.ToBase64String(
            Encoding.UTF8.GetBytes($"{_config.Vmware!.Username}:{password}"));
        req.Headers.Authorization = new AuthenticationHeaderValue("Basic", creds);

        try
        {
            var resp = await http.SendAsync(req, ct);
            if (!resp.IsSuccessStatusCode)
            {
                _log.LogWarning("VMware auth failed: HTTP {Status}", (int)resp.StatusCode);
                return null;
            }
            string body = await resp.Content.ReadAsStringAsync(ct);
            return body.Trim('"');
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "VMware auth request failed");
            return null;
        }
    }

    private async Task LogoutAsync(string baseUrl, string sessionId)
    {
        try
        {
            using var http = BuildHttpClient(sessionId);
            await http.DeleteAsync($"{baseUrl}/api/session");
        }
        catch { }
    }

    // ── vCenter/ESXi detection ────────────────────────────────────────────────

    /// <summary>
    /// Probe for vCenter-only endpoints to determine if this is standalone ESXi.
    /// ESXi 7.0+ has /api/vcenter/vm but lacks /api/vcenter/datacenter.
    /// </summary>
    private static async Task<bool> DetectEsxiAsync(HttpClient http, string baseUrl, CancellationToken ct)
    {
        try
        {
            var resp = await http.GetAsync($"{baseUrl}/api/vcenter/datacenter", ct);
            // 200 or 400 → vCenter (endpoint exists). 404 or 405 → likely ESXi.
            return resp.StatusCode == System.Net.HttpStatusCode.NotFound ||
                   resp.StatusCode == System.Net.HttpStatusCode.MethodNotAllowed;
        }
        catch { return false; }
    }

    // ── Hosts ────────────────────────────────────────────────────────────────

    private async Task<List<VirtHostData>> CollectHostsAsync(HttpClient http, string baseUrl, CancellationToken ct)
    {
        var hosts = new List<VirtHostData>();
        try
        {
            var resp = await http.GetAsync($"{baseUrl}/api/vcenter/host", ct);
            if (!resp.IsSuccessStatusCode) return hosts;

            string json = await resp.Content.ReadAsStringAsync(ct);
            var list = JsonSerializer.Deserialize<List<HostSummary>>(json, _jsonOpts) ?? new();
            foreach (var h in list)
            {
                if (h.Host == null) continue;
                hosts.Add(new VirtHostData
                {
                    PlatformId         = h.Host,
                    Name               = h.Name ?? h.Host,
                    Fqdn               = h.Name,
                    HypervisorVersion  = h.SoftwarePackage,
                    Status             = MapHostState(h.ConnectionState),
                    ClusterName        = h.ClusterName,
                    DatacenterName     = h.DatacenterName,
                });
            }
        }
        catch (Exception ex) { _log.LogDebug(ex, "CollectHosts failed"); }
        return hosts;
    }

    // ── VM list (summary) ─────────────────────────────────────────────────────

    private async Task<List<VmSummary>> ListVmSummariesAsync(HttpClient http, string baseUrl, CancellationToken ct)
    {
        try
        {
            var resp = await http.GetAsync($"{baseUrl}/api/vcenter/vm", ct);
            if (!resp.IsSuccessStatusCode) return new();
            string json = await resp.Content.ReadAsStringAsync(ct);
            return JsonSerializer.Deserialize<List<VmSummary>>(json, _jsonOpts) ?? new();
        }
        catch (Exception ex) { _log.LogDebug(ex, "ListVmSummaries failed"); return new(); }
    }

    // ── VM detail — gets vmUUID, instanceUUID, BIOS UUID, disks, NICs ─────────

    private async Task<VmDetail?> FetchVmDetailAsync(HttpClient http, string baseUrl, string moref, CancellationToken ct)
    {
        try
        {
            var resp = await http.GetAsync($"{baseUrl}/api/vcenter/vm/{moref}", ct);
            if (!resp.IsSuccessStatusCode) return null;
            string json = await resp.Content.ReadAsStringAsync(ct);
            return JsonSerializer.Deserialize<VmDetail>(json, _jsonOpts);
        }
        catch (Exception ex) { _log.LogDebug(ex, "FetchVmDetail({Moref}) failed", moref); return null; }
    }

    // ── Datastores ────────────────────────────────────────────────────────────

    private async Task<List<VirtDatastoreData>> CollectDatastoresAsync(HttpClient http, string baseUrl, CancellationToken ct)
    {
        var ds = new List<VirtDatastoreData>();
        try
        {
            var resp = await http.GetAsync($"{baseUrl}/api/vcenter/datastore", ct);
            if (!resp.IsSuccessStatusCode) return ds;
            string json = await resp.Content.ReadAsStringAsync(ct);
            var list = JsonSerializer.Deserialize<List<DatastoreSummary>>(json, _jsonOpts) ?? new();
            foreach (var d in list)
            {
                if (d.Datastore == null) continue;
                ds.Add(new VirtDatastoreData
                {
                    DatastoreId = d.Datastore,
                    Name        = d.Name ?? d.Datastore,
                    Type        = d.Type,
                    CapacityGb  = d.CapacityBytes > 0
                                    ? Math.Round(d.CapacityBytes / (1024.0 * 1024 * 1024), 1)
                                    : null,
                    FreeGb      = d.FreeSpaceBytes > 0
                                    ? Math.Round(d.FreeSpaceBytes / (1024.0 * 1024 * 1024), 1)
                                    : null,
                    Accessible  = d.Accessible ?? true,
                });
            }
        }
        catch (Exception ex) { _log.LogDebug(ex, "CollectDatastores failed"); }
        return ds;
    }

    // ── Networks ──────────────────────────────────────────────────────────────

    private async Task<List<VirtNetworkData>> CollectNetworksAsync(HttpClient http, string baseUrl, CancellationToken ct)
    {
        var nets = new List<VirtNetworkData>();
        try
        {
            var resp = await http.GetAsync($"{baseUrl}/api/vcenter/network", ct);
            if (!resp.IsSuccessStatusCode) return nets;
            string json = await resp.Content.ReadAsStringAsync(ct);
            var list = JsonSerializer.Deserialize<List<NetworkSummary>>(json, _jsonOpts) ?? new();
            foreach (var n in list)
            {
                if (n.Network == null) continue;
                nets.Add(new VirtNetworkData
                {
                    NetworkId = n.Network,
                    Name      = n.Name ?? n.Network,
                    Type      = MapNetworkType(n.Type),
                });
            }
        }
        catch (Exception ex) { _log.LogDebug(ex, "CollectNetworks failed"); }
        return nets;
    }

    // ── DTO mapping ───────────────────────────────────────────────────────────

    private static VirtVmData MapVmDetail(VmSummary summary, VmDetail? detail)
    {
        var vm = new VirtVmData
        {
            // MoRef is NOT the vmUUID — store separately (opaque platform handle)
            Moref      = summary.Vm,
            Name       = summary.Name ?? summary.Vm ?? "",
            PowerState = MapPowerState(summary.PowerState),
            VcpuCount  = summary.CpuCount > 0 ? summary.CpuCount : null,
            RamMb      = summary.MemorySizeMib > 0 ? (long?)summary.MemorySizeMib : null,
            GuestOs    = summary.GuestOs,
        };

        if (detail != null)
        {
            // vmUUID (stable) — summary.config.uuid from vSphere SDK; exposed in REST via identity
            vm.VmUuid      = detail.Identity?.Uuid ?? summary.Vm ?? "";
            vm.InstanceUuid = detail.Identity?.InstanceUuid;
            vm.BiosUuid    = detail.Identity?.BiosUuidString;
            vm.GuestHostname = detail.GuestOs?.HostName;
            vm.GuestIp     = detail.GuestOs?.IpAddress;
            vm.ToolsStatus = detail.GuestOs?.ToolsStatus;

            // Disks
            if (detail.Disks != null)
            {
                foreach (var (_, d) in detail.Disks)
                {
                    vm.Disks.Add(new VirtDiskData
                    {
                        Label           = d.Label,
                        DiskType        = "vmdk",
                        DatastoreId     = d.Backing?.Datastore,
                        ThinProvisioned = d.Backing?.Type?.Contains("THIN") == true,
                    });
                }
            }

            // NICs
            if (detail.Nics != null)
            {
                foreach (var (_, n) in detail.Nics)
                {
                    vm.Nics.Add(new VirtNicData
                    {
                        MacAddress  = n.MacAddress,
                        NetworkId   = n.Backing?.Network,
                        AdapterType = n.Type?.ToLowerInvariant(),
                        Connected   = n.State?.Connected ?? false,
                    });
                }
            }

            // Host
            vm.HostPlatformId = detail.Identity?.Host;

            // Override CPU/RAM from detail if available
            if (detail.Cpu?.Count > 0)    vm.VcpuCount = detail.Cpu.Count;
            if (detail.Memory?.SizeMib > 0) vm.RamMb = detail.Memory.SizeMib;
        }
        else
        {
            // Fallback when detail fetch failed — Moref as VmUuid placeholder
            vm.VmUuid = summary.Vm ?? "";
        }

        return vm;
    }

    private static string MapPowerState(string? raw) => raw?.ToUpperInvariant() switch
    {
        "POWERED_ON"  => "powered_on",
        "POWERED_OFF" => "powered_off",
        "SUSPENDED"   => "suspended",
        _             => "unknown",
    };

    private static string? MapHostState(string? raw) => raw?.ToUpperInvariant() switch
    {
        "CONNECTED"    => "connected",
        "DISCONNECTED" => "disconnected",
        "NOT_RESPONDING" => "disconnected",
        "MAINTENANCE"  => "maintenance",
        _              => raw?.ToLowerInvariant(),
    };

    private static string? MapNetworkType(string? raw) => raw?.ToUpperInvariant() switch
    {
        "STANDARD_PORTGROUP" => "standard_vswitch",
        "DISTRIBUTED_PORTGROUP" => "dvs",
        "OPAQUE_NETWORK" => "opaque",
        _ => raw?.ToLowerInvariant(),
    };

    // ── HTTP client ───────────────────────────────────────────────────────────

    private HttpClient BuildHttpClient(string? sessionId)
    {
        var handler = new HttpClientHandler
        {
            // SSL always verified; custom CA is additive
            ServerCertificateCustomValidationCallback =
                string.IsNullOrEmpty(_config.CustomCaCertPath)
                    ? null
                    : BuildCaValidator(_config.CustomCaCertPath),
            CheckCertificateRevocationList = !_config.DisableCrlCheck,
        };

        if (_config.DisableCrlCheck)
            _log.LogWarning(
                "DisableCrlCheck=true: online CRL fetch skipped for VMware connection. " +
                "Certificate chain trust is still enforced.");

        var http = new HttpClient(handler) { Timeout = TimeSpan.FromSeconds(60) };
        http.DefaultRequestHeaders.Accept.Add(
            new MediaTypeWithQualityHeaderValue("application/json"));

        if (sessionId != null)
            http.DefaultRequestHeaders.Add("vmware-api-session-id", sessionId);

        return http;
    }

    private static Func<HttpRequestMessage, X509Certificate2?, X509Chain?, SslPolicyErrors, bool>
        BuildCaValidator(string caCertPath)
    {
        var caCert = new X509Certificate2(caCertPath);
        return (_, cert, chain, _) =>
        {
            if (cert == null || chain == null) return false;
            chain.ChainPolicy.ExtraStore.Add(caCert);
            chain.ChainPolicy.VerificationFlags = X509VerificationFlags.AllowUnknownCertificateAuthority;
            if (!chain.Build(cert)) return false;
            var root = chain.ChainElements[^1].Certificate;
            return root.Thumbprint.Equals(caCert.Thumbprint, StringComparison.OrdinalIgnoreCase);
        };
    }

    // ── vSphere REST API response DTOs ────────────────────────────────────────

    private sealed class VmSummary
    {
        [JsonPropertyName("vm")]               public string? Vm { get; set; }
        [JsonPropertyName("name")]             public string? Name { get; set; }
        [JsonPropertyName("power_state")]      public string? PowerState { get; set; }
        [JsonPropertyName("cpu_count")]        public int CpuCount { get; set; }
        [JsonPropertyName("memory_size_mib")]  public int MemorySizeMib { get; set; }
        [JsonPropertyName("guest_os")]         public string? GuestOs { get; set; }
    }

    private sealed class VmDetail
    {
        [JsonPropertyName("identity")] public VmIdentity? Identity { get; set; }
        [JsonPropertyName("cpu")]      public VmCpu? Cpu { get; set; }
        [JsonPropertyName("memory")]   public VmMemory? Memory { get; set; }
        [JsonPropertyName("guest_OS")] public VmGuestOs? GuestOs { get; set; }
        [JsonPropertyName("disks")]    public Dictionary<string, VmDisk>? Disks { get; set; }
        [JsonPropertyName("nics")]     public Dictionary<string, VmNic>? Nics { get; set; }
    }

    private sealed class VmIdentity
    {
        [JsonPropertyName("name")]             public string? Name { get; set; }
        // vmUUID (stable, persistent — use this for dedup)
        [JsonPropertyName("uuid")]             public string? Uuid { get; set; }
        // instanceUUID (vCenter-specific, resets on unregister)
        [JsonPropertyName("instance_uuid")]    public string? InstanceUuid { get; set; }
        // BIOS UUID — matches Win32_ComputerSystemProduct.UUID in guest
        [JsonPropertyName("bios_uuid_string")] public string? BiosUuidString { get; set; }
        // Host MoRef
        [JsonPropertyName("host")]             public string? Host { get; set; }
    }

    private sealed class VmCpu
    {
        [JsonPropertyName("count")]   public int Count { get; set; }
    }

    private sealed class VmMemory
    {
        [JsonPropertyName("size_mib")] public long SizeMib { get; set; }
    }

    private sealed class VmGuestOs
    {
        [JsonPropertyName("host_name")]    public string? HostName { get; set; }
        [JsonPropertyName("ip_address")]   public string? IpAddress { get; set; }
        [JsonPropertyName("tools_status")] public string? ToolsStatus { get; set; }
    }

    private sealed class VmDisk
    {
        [JsonPropertyName("label")]   public string? Label { get; set; }
        [JsonPropertyName("backing")] public DiskBacking? Backing { get; set; }
    }

    private sealed class DiskBacking
    {
        [JsonPropertyName("type")]      public string? Type { get; set; }
        [JsonPropertyName("datastore")] public string? Datastore { get; set; }
    }

    private sealed class VmNic
    {
        [JsonPropertyName("mac_address")] public string? MacAddress { get; set; }
        [JsonPropertyName("backing")]     public NicBacking? Backing { get; set; }
        [JsonPropertyName("type")]        public string? Type { get; set; }
        [JsonPropertyName("state")]       public NicState? State { get; set; }
    }

    private sealed class NicBacking
    {
        [JsonPropertyName("network")]      public string? Network { get; set; }
        [JsonPropertyName("network_name")] public string? NetworkName { get; set; }
    }

    private sealed class NicState
    {
        [JsonPropertyName("connected")] public bool Connected { get; set; }
    }

    private sealed class HostSummary
    {
        [JsonPropertyName("host")]             public string? Host { get; set; }
        [JsonPropertyName("name")]             public string? Name { get; set; }
        [JsonPropertyName("connection_state")] public string? ConnectionState { get; set; }
        [JsonPropertyName("software_package")] public string? SoftwarePackage { get; set; }
        [JsonPropertyName("cluster_name")]     public string? ClusterName { get; set; }
        [JsonPropertyName("datacenter_name")]  public string? DatacenterName { get; set; }
    }

    private sealed class DatastoreSummary
    {
        [JsonPropertyName("datastore")]          public string? Datastore { get; set; }
        [JsonPropertyName("name")]               public string? Name { get; set; }
        [JsonPropertyName("type")]               public string? Type { get; set; }
        [JsonPropertyName("capacity")]           public long CapacityBytes { get; set; }
        [JsonPropertyName("free_space")]         public long FreeSpaceBytes { get; set; }
        [JsonPropertyName("accessible")]         public bool? Accessible { get; set; }
    }

    private sealed class NetworkSummary
    {
        [JsonPropertyName("network")] public string? Network { get; set; }
        [JsonPropertyName("name")]    public string? Name { get; set; }
        [JsonPropertyName("type")]    public string? Type { get; set; }
    }
}
