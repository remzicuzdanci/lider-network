using System.Text.Json;
using System.Text.Json.Serialization;

namespace LiderCollector.Dlp;

/// <summary>The DLP policy the server sends in the heartbeat answer ("dlp" block). Absent block = no policy: the Collector keeps what it has (OFF by default).</summary>
public sealed class DlpPolicyDto
{
    [JsonPropertyName("enabled")] public bool Enabled { get; set; }
    [JsonPropertyName("print")] public PrintDto? Print { get; set; }
    [JsonPropertyName("usb")] public UsbDto? Usb { get; set; }
    public sealed class PrintDto { [JsonPropertyName("enabled")] public bool Enabled { get; set; } [JsonPropertyName("document_name")] public string? DocumentName { get; set; } }
    public sealed class UsbDto { [JsonPropertyName("enabled")] public bool Enabled { get; set; } [JsonPropertyName("file_events")] public bool FileEvents { get; set; } = true; }
}

public static class DlpPolicy
{
    private static readonly string[] NameModes = { "full", "extension", "hash", "none" };
    public const string FileName = "dlp-policy.json";

    /// <summary>Applies a policy to the running settings. Unknown / invalid values are ignored (never guessed); a source can only be ON when the master switch is ON. Returns true when something changed.</summary>
    public static bool Apply(DlpConfig cfg, DlpPolicyDto? p)
    {
        if (p is null) return false;
        var before = State(cfg);
        cfg.Enabled = p.Enabled;
        cfg.Print.Enabled = p.Enabled && p.Print?.Enabled == true;
        if (p.Print?.DocumentName is { } m && NameModes.Contains(m)) cfg.Print.DocumentName = m;
        cfg.Usb.Enabled = p.Enabled && p.Usb?.Enabled == true;
        if (p.Usb is not null) cfg.Usb.FileEvents = p.Usb.FileEvents;
        return before != State(cfg);
    }

    private static (bool, bool, string, bool, bool) State(DlpConfig c) => (c.Enabled, c.Print.Enabled, c.Print.DocumentName, c.Usb.Enabled, c.Usb.FileEvents);

    public static void Save(string dataPath, DlpPolicyDto p)
    {
        string path = Path.Combine(dataPath, FileName), tmp = path + ".tmp";
        File.WriteAllText(tmp, JsonSerializer.Serialize(p)); File.Move(tmp, path, overwrite: true);   // atomic
    }

    public static DlpPolicyDto? Load(string dataPath)
    {
        try { string p = Path.Combine(dataPath, FileName); return File.Exists(p) ? JsonSerializer.Deserialize<DlpPolicyDto>(File.ReadAllText(p)) : null; } catch { return null; }
    }
}
