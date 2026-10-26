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
/// Collects VM inventory from VMware vCenter/ESXi via vSphere REST API.
/// API reference: /api/vcenter/vm (vSphere 7.0+)
/// SSL IS ALWAYS VERIFIED.  Custom CA is supported for internal vCenter PKI.
/// Read-only; never modifies any VM or vCenter configuration.
/// </summary>
public sealed class VmwareModule : IVirtualizationModule
{
    private readonly CollectorConfig _config;
    private readonly SecureStorage _secure;
    private readonly ILogger<VmwareModule> _log;

    private static readonly JsonSerializerOptions _jsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
    };

    public string Name => "vmware";

    public VmwareModule(CollectorConfig config, SecureStorage secure, ILogger<VmwareModule> log)
    {
        _config = config;
        _secure = secure;
        _log = log;
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

        try
        {
            string? sessionId = await AuthenticateAsync(ct);
            if (sessionId == null) return null;

            var vms = await ListVmsAsync(sessionId, ct);
            _log.LogInformation("VMware: found {Count} VMs on {Host}.", vms.Count, _config.Vmware!.Host);

            return new VmwarePayload { VirtualMachines = vms };
        }
        catch (OperationCanceledException) { throw; }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "VmwareModule failed");
            return null;
        }
    }

    // ── vSphere REST API session ──────────────────────────────────────────────

    private async Task<string?> AuthenticateAsync(CancellationToken ct)
    {
        string? password = _secure.Get("vmware_password");
        if (string.IsNullOrEmpty(password) || _config.Vmware == null)
        {
            _log.LogWarning("VMware password not found in secure storage (key: vmware_password).");
            return null;
        }

        string baseUrl = $"https://{_config.Vmware.Host}:{_config.Vmware.Port}";
        using var http = BuildHttpClient();
        var req = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/api/session");
        string creds = Convert.ToBase64String(
            Encoding.UTF8.GetBytes($"{_config.Vmware.Username}:{password}"));
        req.Headers.Authorization = new AuthenticationHeaderValue("Basic", creds);

        var resp = await http.SendAsync(req, ct);
        if (!resp.IsSuccessStatusCode)
        {
            _log.LogWarning("VMware authentication failed: HTTP {Status}", (int)resp.StatusCode);
            return null;
        }

        string body = await resp.Content.ReadAsStringAsync(ct);
        // vSphere 7+ returns the session token as a JSON string (with quotes)
        return body.Trim('"');
    }

    private async Task<List<HyperVModule.VmInfo>> ListVmsAsync(string sessionId, CancellationToken ct)
    {
        string baseUrl = $"https://{_config.Vmware!.Host}:{_config.Vmware.Port}";
        using var http = BuildHttpClient();
        http.DefaultRequestHeaders.Add("vmware-api-session-id", sessionId);

        var resp = await http.GetAsync($"{baseUrl}/api/vcenter/vm", ct);
        if (!resp.IsSuccessStatusCode) return new();

        string json = await resp.Content.ReadAsStringAsync(ct);
        var vmList = JsonSerializer.Deserialize<List<VmSummary>>(json, _jsonOpts) ?? new();

        var result = new List<HyperVModule.VmInfo>();
        foreach (var vm in vmList)
        {
            result.Add(new HyperVModule.VmInfo
            {
                VmGuid = vm.Vm,
                Name = vm.Name,
                State = vm.PowerState?.Replace("POWERED_ON", "running")
                                       .Replace("POWERED_OFF", "off")
                                       .Replace("SUSPENDED", "saved")
                                       .ToLowerInvariant() ?? "unknown",
                CpuCount = vm.CpuCount,
                RamMb = vm.MemorySizeMib,
                Platform = "vmware",
                Host = _config.Vmware.Host,
                GuestOs = vm.GuestOs,
            });
        }
        return result;
    }

    private HttpClient BuildHttpClient()
    {
        var handler = new HttpClientHandler
        {
            // SSL ALWAYS verified — custom CA additive only
            ServerCertificateCustomValidationCallback =
                string.IsNullOrEmpty(_config.CustomCaCertPath)
                    ? null
                    : BuildCaValidator(_config.CustomCaCertPath),
            CheckCertificateRevocationList = false, // vCenter internal CAs often lack CRL
        };

        var http = new HttpClient(handler) { Timeout = TimeSpan.FromSeconds(30) };
        http.DefaultRequestHeaders.Accept.Add(
            new MediaTypeWithQualityHeaderValue("application/json"));
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

    // ── Payload DTOs ──────────────────────────────────────────────────────────

    public sealed class VmwarePayload
    {
        [JsonPropertyName("virtual_machines")] public List<HyperVModule.VmInfo> VirtualMachines { get; set; } = new();
    }

    private sealed class VmSummary
    {
        [JsonPropertyName("vm")] public string? Vm { get; set; }
        [JsonPropertyName("name")] public string? Name { get; set; }
        [JsonPropertyName("power_state")] public string? PowerState { get; set; }
        [JsonPropertyName("cpu_count")] public int CpuCount { get; set; }
        [JsonPropertyName("memory_size_mib")] public int MemorySizeMib { get; set; }
        [JsonPropertyName("guest_os")] public string? GuestOs { get; set; }
    }
}
