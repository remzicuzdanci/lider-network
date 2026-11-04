using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace LiderCollector.Updater;

/// <summary>
/// Thin HTTP client for the three update API endpoints.
/// Never logs the API key — it is only included in the Authorization header.
/// </summary>
internal sealed class UpdateApiClient : IDisposable
{
    private readonly HttpClient _http;

    private static readonly JsonSerializerOptions _opts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public UpdateApiClient(string serverUrl, string apiKey)
    {
        _http = new HttpClient
        {
            BaseAddress = new Uri(serverUrl.TrimEnd('/') + "/api/v1/collector/"),
            Timeout     = TimeSpan.FromSeconds(30),
        };
        // Set auth header once — never sent to any other host
        _http.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
    }

    public async Task<ManifestResponse?> GetManifestAsync(CancellationToken ct = default)
    {
        using var resp = await _http.GetAsync("update/manifest", ct);
        if (resp.StatusCode == System.Net.HttpStatusCode.NoContent) return null;
        resp.EnsureSuccessStatusCode();
        string json = await resp.Content.ReadAsStringAsync(ct);
        return JsonSerializer.Deserialize<ManifestResponse>(json, _opts);
    }

    public async Task<int?> ReportProgressAsync(
        string manifestVersion, string status, string? fromVersion,
        CancellationToken ct = default)
    {
        var body = new { manifest_version = manifestVersion, status, from_version = fromVersion };
        using var resp = await PostAsync("update/progress", body, ct);
        resp.EnsureSuccessStatusCode();
        string json = await resp.Content.ReadAsStringAsync(ct);
        var doc = JsonDocument.Parse(json);
        return doc.RootElement.TryGetProperty("log_id", out var id) ? id.GetInt32() : (int?)null;
    }

    public async Task ReportCompleteAsync(
        int?   logId,
        string manifestVersion,
        string status,
        string? fromVersion,
        string? toVersion,
        string? errorMessage,
        CancellationToken ct = default)
    {
        var body = new
        {
            log_id           = logId,
            manifest_version = manifestVersion,
            status,
            from_version     = fromVersion,
            to_version       = toVersion,
            error_message    = errorMessage,
        };
        using var resp = await PostAsync("update/complete", body, ct);
        resp.EnsureSuccessStatusCode();
    }

    private async Task<HttpResponseMessage> PostAsync(string path, object body, CancellationToken ct)
    {
        string json = JsonSerializer.Serialize(body, _opts);
        using var content = new StringContent(json, Encoding.UTF8, "application/json");
        return await _http.PostAsync(path, content, ct);
    }

    public void Dispose() => _http.Dispose();
}
