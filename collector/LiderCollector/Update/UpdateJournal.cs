using System.Text.Json;
using System.Text.Json.Serialization;

namespace LiderCollector.Update;

/// <summary>
/// Crash-safe record of where an update is. The updater rewrites it (atomically) at every phase; it is removed when the update ends in ANY final state.
/// If the updater dies (killed, crash, power loss, hang), this file is what the watchdog uses to decide how to get back to a working Collector.
/// It holds versions, phase names, a file path and file hashes only - no keys, no tokens.
/// </summary>
internal sealed class UpdateJournal
{
    public const string FileName = "update-journal.json";
    public const string Unknown = "unknown";

    [JsonPropertyName("correlation_id")]  public string CorrelationId { get; set; } = "";
    /// <summary>verify | snapshot | installing | health | rolling_back | unknown (file unreadable)</summary>
    [JsonPropertyName("phase")]           public string Phase { get; set; } = "";
    [JsonPropertyName("from_version")]    public string? FromVersion { get; set; }
    [JsonPropertyName("to_version")]      public string? ToVersion { get; set; }
    [JsonPropertyName("previous_msi")]    public string? PreviousMsi { get; set; }
    [JsonPropertyName("started_at")]      public string StartedAt { get; set; } = "";
    [JsonPropertyName("phase_at")]        public string PhaseAt { get; set; } = "";
    [JsonPropertyName("updater_pid")]     public int UpdaterPid { get; set; }
    [JsonPropertyName("identity")]        public Dictionary<string, string> Identity { get; set; } = new();

    public DateTime StartedUtc => Parse(StartedAt);
    public DateTime PhaseUtc => Parse(PhaseAt);
    private static DateTime Parse(string s) => DateTime.TryParse(s, null, System.Globalization.DateTimeStyles.RoundtripKind, out var d) ? d.ToUniversalTime() : DateTime.MinValue;

    public static string PathIn(string dataPath) => Path.Combine(dataPath, FileName);

    public void Save(string dataPath) => UpdateMarkers.WriteAtomic(PathIn(dataPath), JsonSerializer.Serialize(this));

    /// <summary>null = no update in flight. An unreadable file comes back as phase "unknown" (the watchdog then only makes sure the service runs).</summary>
    public static UpdateJournal? Read(string dataPath)
    {
        string p = PathIn(dataPath);
        if (!File.Exists(p)) return null;
        try { return JsonSerializer.Deserialize<UpdateJournal>(File.ReadAllText(p)) ?? new UpdateJournal { Phase = Unknown }; }
        catch { return new UpdateJournal { Phase = Unknown }; }
    }

    public static void Clear(string dataPath) { try { File.Delete(PathIn(dataPath)); } catch { /* the watchdog treats a leftover as "nothing to do" once the state is healthy */ } }
}
