using System.Text.Json.Serialization;

namespace LiderCollector.Updater;

/// <summary>
/// Deserialized from GET /api/v1/collector/update/manifest
/// </summary>
internal sealed class ManifestResponse
{
    [JsonPropertyName("update_available")]        public bool    UpdateAvailable       { get; set; }
    [JsonPropertyName("version")]                 public string  Version               { get; set; } = string.Empty;
    [JsonPropertyName("channel")]                 public string  Channel               { get; set; } = string.Empty;
    [JsonPropertyName("download_url")]            public string  DownloadUrl           { get; set; } = string.Empty;
    [JsonPropertyName("sha256_hash")]             public string  Sha256Hash            { get; set; } = string.Empty;
    [JsonPropertyName("signature_base64")]        public string  SignatureBase64        { get; set; } = string.Empty;
    [JsonPropertyName("signing_cert_thumbprint")] public string? SigningCertThumbprint { get; set; }
    [JsonPropertyName("min_from_version")]        public string? MinFromVersion        { get; set; }
    [JsonPropertyName("release_notes")]           public string? ReleaseNotes          { get; set; }
}
