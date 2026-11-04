using System.IO;
using System.Text.Json;
using LiderCollector;

namespace LiderCollector.Tests;

/// <summary>
/// Tests for CollectorState JSON roundtrip and cursor semantics.
/// These tests use temp files, not ProgramData, so no elevation required.
/// Windows Server 2025: test edilmedi — no test environment available (TD-5).
/// </summary>
public sealed class CollectorStateTests : IDisposable
{
    private static readonly JsonSerializerOptions _opts = new() { WriteIndented = true };

    private readonly string _tempDir;

    public CollectorStateTests()
    {
        _tempDir = Path.Combine(Path.GetTempPath(), $"LiderCollectorTests_{Guid.NewGuid():N}");
        Directory.CreateDirectory(_tempDir);
    }

    public void Dispose()
    {
        try { Directory.Delete(_tempDir, recursive: true); } catch { }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static CollectorState LoadFromFile(string path)
    {
        var state = new CollectorState();
        try
        {
            if (File.Exists(path))
            {
                var loaded = JsonSerializer.Deserialize<CollectorState>(File.ReadAllText(path));
                if (loaded != null) state.EventLogCursors = loaded.EventLogCursors;
            }
        }
        catch { }
        return state;
    }

    private static void SaveToFile(CollectorState state, string path)
        => File.WriteAllText(path, JsonSerializer.Serialize(state, _opts));

    // ── Tests ─────────────────────────────────────────────────────────────────

    [Fact]
    public void NewInstance_HasEmptyCursors()
    {
        var state = new CollectorState();
        Assert.Empty(state.EventLogCursors);
    }

    [Fact]
    public void Load_MissingFile_ReturnsEmptyCursors()
    {
        var state = LoadFromFile(Path.Combine(_tempDir, "missing.json"));
        Assert.Empty(state.EventLogCursors);
    }

    [Fact]
    public void SaveAndLoad_RoundTrip_PreservesCursors()
    {
        var path  = Path.Combine(_tempDir, "state.json");
        var state = new CollectorState();
        state.EventLogCursors["System"]      = 12345L;
        state.EventLogCursors["Application"] = 67890L;
        SaveToFile(state, path);

        var loaded = LoadFromFile(path);
        Assert.Equal(12345L, loaded.EventLogCursors["System"]);
        Assert.Equal(67890L, loaded.EventLogCursors["Application"]);
    }

    [Fact]
    public void Load_CorruptJson_ReturnsEmptyCursors()
    {
        var path = Path.Combine(_tempDir, "corrupt.json");
        File.WriteAllText(path, "{ not valid json !!!");
        var state = LoadFromFile(path);
        Assert.Empty(state.EventLogCursors);
    }

    [Fact]
    public void Load_EmptyJsonObject_ReturnsEmptyCursors()
    {
        var path = Path.Combine(_tempDir, "empty.json");
        File.WriteAllText(path, "{}");
        var state = LoadFromFile(path);
        Assert.Empty(state.EventLogCursors);
    }

    [Fact]
    public void Cursors_DefaultValueIsZero()
    {
        var state = new CollectorState();
        long val  = state.EventLogCursors.GetValueOrDefault("System", 0);
        Assert.Equal(0L, val);
    }

    [Fact]
    public void SaveAndLoad_MultipleRoundTrips_Idempotent()
    {
        var path   = Path.Combine(_tempDir, "multi.json");
        var state  = new CollectorState();
        state.EventLogCursors["System"] = 100L;
        SaveToFile(state, path);

        var state2 = LoadFromFile(path);
        state2.EventLogCursors["System"] = 200L;
        SaveToFile(state2, path);

        var final = LoadFromFile(path);
        Assert.Equal(200L, final.EventLogCursors["System"]);
    }

    [Fact]
    public void Cursors_UpdatedInPlace_ReflectsNewValue()
    {
        var state = new CollectorState();
        state.EventLogCursors["System"] = 50L;
        state.EventLogCursors["System"] = 75L; // advance cursor
        Assert.Equal(75L, state.EventLogCursors["System"]);
    }
}
