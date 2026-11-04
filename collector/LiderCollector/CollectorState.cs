using System.Text.Json;

namespace LiderCollector;

/// <summary>
/// Persists small agent state between collection cycles.
/// Stored as JSON at AppContext.BaseDirectory/collector-state.json.
/// All reads/writes are wrapped in try/catch — a corrupt or missing file
/// simply starts the agent with an empty state (no crash, no data loss).
/// </summary>
public sealed class CollectorState
{
    private static readonly JsonSerializerOptions _opts = new() { WriteIndented = true };
    private readonly string _path;

    /// <summary>Highest EventLog RecordId seen per log name ("System", "Application", …).</summary>
    public Dictionary<string, long> EventLogCursors { get; set; } = new();

    private CollectorState(string path) => _path = path;

    public static CollectorState Load()
    {
        var path  = Path.Combine(AppContext.BaseDirectory, "collector-state.json");
        var state = new CollectorState(path);
        try
        {
            if (File.Exists(path))
            {
                var loaded = JsonSerializer.Deserialize<CollectorState>(File.ReadAllText(path));
                if (loaded != null) state.EventLogCursors = loaded.EventLogCursors;
            }
        }
        catch { /* corrupt state — start fresh */ }
        return state;
    }

    public void Save()
    {
        try { File.WriteAllText(_path, JsonSerializer.Serialize(this, _opts)); }
        catch { /* non-fatal — next cycle starts fresh */ }
    }
}
