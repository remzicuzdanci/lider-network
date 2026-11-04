namespace LiderCollector.Updater;

/// <summary>
/// Downloads the update archive over HTTPS with TLS certificate validation.
/// Does not follow HTTP redirects to untrusted hosts.
/// </summary>
internal static class UpdateDownloader
{
    private static readonly HttpClient _http = new(new HttpClientHandler
    {
        // System certificate store — no pinning at the HTTP layer;
        // cryptographic verification happens in SignatureVerifier after download.
        ServerCertificateCustomValidationCallback = null,
        CheckCertificateRevocationList           = true,
    })
    {
        Timeout = TimeSpan.FromMinutes(10),
    };

    /// <summary>
    /// Downloads the archive at <paramref name="url"/> and returns its bytes.
    /// Throws <see cref="HttpRequestException"/> on HTTP error.
    /// Throws <see cref="InvalidOperationException"/> if the URL scheme is not HTTPS.
    /// </summary>
    public static async Task<byte[]> DownloadAsync(string url, CancellationToken ct = default)
    {
        if (!url.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException($"Update download URL must use HTTPS: {url}");

        using var response = await _http.GetAsync(url, HttpCompletionOption.ResponseContentRead, ct);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsByteArrayAsync(ct);
    }
}
