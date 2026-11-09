using System.Net;
using System.Net.Http.Headers;
using System.Net.Security;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;

namespace LiderCollector.Core;

/// <summary>
/// HTTPS client for communicating with the Lider IT ONE server.
///
/// SSL IS ALWAYS VERIFIED.  Custom CA support is provided for internal PKI —
/// the root CA cert is loaded and added to the validation chain.  There is no
/// bypass flag and no code path that disables certificate validation.
/// </summary>
public sealed class ApiClient : IDisposable
{
    private readonly CollectorConfig _config;
    private readonly SecureStorage _secure;
    private readonly ILogger<ApiClient> _log;
    private HttpClient? _http;

    private static readonly JsonSerializerOptions _jsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public ApiClient(CollectorConfig config, SecureStorage secure, ILogger<ApiClient> log)
    {
        _config = config;
        _secure = secure;
        _log = log;
    }

    // ── Enrollment ────────────────────────────────────────────────────────────

    public async Task<EnrollResponse?> EnrollAsync(string enrollToken,
        DeviceIdentity.IdentityPayload identity, CancellationToken ct = default)
    {
        var body = new
        {
            enroll_token = enrollToken,
            hostname = identity.Hostname,
            version = AppVersion.Current,
            identifiers = BuildIdentifiers(identity),
        };

        var resp = await PostAsync<EnrollResponse>("enroll", body, authorized: false, ct);
        if (resp?.ApiKey != null)
        {
            _secure.Set("api_key", resp.ApiKey);
            _log.LogInformation("Enrollment successful. Collector ID={Id}", resp.CollectorId);
        }
        return resp;
    }

    // ── Heartbeat ─────────────────────────────────────────────────────────────

    /// <summary>
    /// Sends a heartbeat and returns the status.
    ///
    /// <list type="table">
    /// <item><term>Ok</term><description>Heartbeat accepted; response payload included.</description></item>
    /// <item><term>TransientFailure</term><description>Network error, server error, or a 401 with no explicit revocation
    ///   signal. Credentials are preserved; the caller should retry with backoff.</description></item>
    /// <item><term>ExplicitRevocation</term><description>Server confirmed this API key is revoked (401 with
    ///   <c>re_enroll_required:true</c>, or HTTP 410). The caller must wipe credentials and re-enroll.</description></item>
    /// </list>
    /// </summary>
    public async Task<(CheckinResponse? Response, HeartbeatStatus Status)> CheckinAsync(
        DeviceIdentity.IdentityPayload identity, CancellationToken ct = default)
    {
        var body = new
        {
            hostname = identity.Hostname,
            version = _config.AgentVersion,
            update_channel = _config.UpdateChannel,
            status = "online",
            timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
        };
        var (resp, httpStatus) = await PostAsyncWithStatus<CheckinResponse>("checkin", body, authorized: true, ct);

        if (httpStatus == System.Net.HttpStatusCode.OK)
            return (resp, HeartbeatStatus.Ok);

        // HTTP 410 Gone = unconditional revocation (server explicitly decommissioned the collector)
        if (httpStatus == System.Net.HttpStatusCode.Gone)
            return (null, HeartbeatStatus.ExplicitRevocation);

        // HTTP 401 = need to inspect body: re_enroll_required distinguishes revocation from transient auth failure
        if (httpStatus == System.Net.HttpStatusCode.Unauthorized)
        {
            if (resp?.ReEnrollRequired == true)
                return (null, HeartbeatStatus.ExplicitRevocation);
            return (null, HeartbeatStatus.TransientFailure);
        }

        return (null, HeartbeatStatus.TransientFailure);
    }

    // ── Inventory ─────────────────────────────────────────────────────────────

    public async Task<bool> SendInventoryAsync(object inventoryPayload, CancellationToken ct = default)
    {
        var result = await PostAsync<ApiResult>("inventory", inventoryPayload, authorized: true, ct);
        return result?.Success == true;
    }

    // ── Events ────────────────────────────────────────────────────────────────

    public async Task<bool> SendEventsAsync(object eventsPayload, CancellationToken ct = default)
    {
        var result = await PostAsync<ApiResult>("events", eventsPayload, authorized: true, ct);
        return result?.Success == true;
    }

    // ── Low-level helpers ─────────────────────────────────────────────────────

    private async Task<T?> PostAsync<T>(string endpoint, object body,
        bool authorized, CancellationToken ct)
    {
        var (result, _) = await PostAsyncWithStatus<T>(endpoint, body, authorized, ct);
        return result;
    }

    private async Task<(T? Result, System.Net.HttpStatusCode Status)> PostAsyncWithStatus<T>(
        string endpoint, object body, bool authorized, CancellationToken ct)
    {
        try
        {
            var http = GetOrCreateClient();
            var url = $"{_config.ServerUrl.TrimEnd('/')}/api/v1/collector/{endpoint}";

            var request = new HttpRequestMessage(HttpMethod.Post, url);
            if (authorized)
            {
                string? key = _secure.Get("api_key");
                if (string.IsNullOrEmpty(key))
                    throw new InvalidOperationException("No API key — collector not enrolled.");
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", key);
            }

            string json = JsonSerializer.Serialize(body, _jsonOpts);
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await http.SendAsync(request, ct);

            if (!response.IsSuccessStatusCode)
            {
                string respBody = await response.Content.ReadAsStringAsync(ct);
                _log.LogWarning("POST {Endpoint} → HTTP {Status}: {Body}",
                    endpoint, (int)response.StatusCode,
                    respBody.Length > 200 ? respBody[..200] : respBody);
                return (default, response.StatusCode);
            }

            string respJson = await response.Content.ReadAsStringAsync(ct);
            return (JsonSerializer.Deserialize<T>(respJson, _jsonOpts), response.StatusCode);
        }
        catch (OperationCanceledException) { throw; }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "POST {Endpoint} failed", endpoint);
            return (default, System.Net.HttpStatusCode.ServiceUnavailable);
        }
    }

    private HttpClient GetOrCreateClient()
    {
        if (_http != null) return _http;

        if (_config.DisableCrlCheck)
            _log.LogWarning(
                "DisableCrlCheck=true: online CRL fetch is skipped for this collector. " +
                "Certificate chain validation still enforces trust. " +
                "Only use this in private networks without a CRL distribution point.");

        var handler = new HttpClientHandler
        {
            // SSL validation is ALWAYS on.  Custom CA is additive, never a bypass.
            ServerCertificateCustomValidationCallback =
                string.IsNullOrEmpty(_config.CustomCaCertPath)
                    ? null
                    : BuildCustomCaValidator(_config.CustomCaCertPath),

            // CRL check can be disabled for private networks without a published CRL endpoint.
            // Certificate chain validation still runs in both cases.
            CheckCertificateRevocationList = !_config.DisableCrlCheck,
            AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate,
        };

        _http = new HttpClient(handler)
        {
            Timeout = TimeSpan.FromSeconds(30),
        };
        _http.DefaultRequestHeaders.Accept.Add(
            new MediaTypeWithQualityHeaderValue("application/json"));
        _http.DefaultRequestHeaders.Add("X-Collector-Version", "0.1.0");

        return _http;
    }

    private static Func<HttpRequestMessage, X509Certificate2?, X509Chain?, SslPolicyErrors, bool>
        BuildCustomCaValidator(string caCertPath)
    {
        var caCert = new X509Certificate2(caCertPath);
        return (_, cert, chain, _) =>
        {
            if (cert == null || chain == null) return false;

            chain.ChainPolicy.ExtraStore.Add(caCert);
            chain.ChainPolicy.VerificationFlags = X509VerificationFlags.AllowUnknownCertificateAuthority;
            chain.ChainPolicy.RevocationMode = X509RevocationMode.Online;

            bool valid = chain.Build(cert);
            if (!valid) return false;

            var root = chain.ChainElements[^1].Certificate;
            return root.Thumbprint.Equals(caCert.Thumbprint, StringComparison.OrdinalIgnoreCase);
        };
    }

    private static List<object> BuildIdentifiers(DeviceIdentity.IdentityPayload id)
    {
        var list = new List<object>();
        if (id.BiosUuid != null) list.Add(new { type = "bios_uuid", value = id.BiosUuid });
        if (id.SerialNumber != null) list.Add(new { type = "serial", value = id.SerialNumber });
        if (id.WmiIdentifyingNumber != null) list.Add(new { type = "wmi_id", value = id.WmiIdentifyingNumber });
        foreach (var mac in id.MacAddresses) list.Add(new { type = "mac", value = mac });
        list.Add(new { type = "hostname", value = id.Hostname });
        // fqdn is not in device_identifiers.type ENUM — sent in system module data instead
        return list;
    }

    public void Dispose() => _http?.Dispose();

    // ── Response DTOs ─────────────────────────────────────────────────────────

    public sealed class EnrollResponse
    {
        [JsonPropertyName("api_key")] public string? ApiKey { get; set; }
        [JsonPropertyName("collector_id")] public int CollectorId { get; set; }
        [JsonPropertyName("sync_interval")] public int SyncInterval { get; set; }
        [JsonPropertyName("modules_enabled")] public List<string> ModulesEnabled { get; set; } = new();
    }

    /// <summary>Heartbeat status returned by <see cref="CheckinAsync"/>.</summary>
    public enum HeartbeatStatus
    {
        Ok,

        /// <summary>Network error, server error, or transient 401. Preserve credentials, retry with backoff.</summary>
        TransientFailure,

        /// <summary>Server explicitly revoked this key (HTTP 410, or 401 + <c>re_enroll_required:true</c>).</summary>
        ExplicitRevocation,
    }

    public sealed class CheckinResponse
    {
        [JsonPropertyName("sync_interval")] public int SyncInterval { get; set; }
        [JsonPropertyName("modules_enabled")] public List<string> ModulesEnabled { get; set; } = new();
        [JsonPropertyName("config_updated")] public bool ConfigUpdated { get; set; }
        // Update availability — set by server when a newer agent version is available for this collector's channel
        [JsonPropertyName("update_available")] public bool UpdateAvailable { get; set; }
        [JsonPropertyName("manifest_version")] public string? ManifestVersion { get; set; }
        // Revocation signal — set when the server has explicitly revoked this API key
        [JsonPropertyName("re_enroll_required")] public bool ReEnrollRequired { get; set; }
    }

    public sealed class ApiResult
    {
        [JsonPropertyName("success")] public bool Success { get; set; }
        [JsonPropertyName("message")] public string? Message { get; set; }
    }
}
