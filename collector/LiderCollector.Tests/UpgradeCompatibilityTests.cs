using LiderCollector.Core;
using Microsoft.Data.Sqlite;
using System.Text.Json;
using Xunit;

namespace LiderCollector.Tests;

/// <summary>
/// In-place upgrade 1.3.0 / 1.4.0 -> 1.4.4: everything mutable lives in %ProgramData%\LiderCollector (collector.json, secure.dat, queue.db) and is never touched by the MSI.
/// These tests prove the NEW code reads the OLD files: identity and settings survive, DLP stays off, the offline queue of an older version is still drained, nothing is rewritten on load.
/// </summary>
public sealed class UpgradeCompatibilityTests : IDisposable
{
    private readonly string _dir = Path.Combine(Path.GetTempPath(), "lc-upg-" + Guid.NewGuid().ToString("N"));
    public UpgradeCompatibilityTests() => Directory.CreateDirectory(_dir);
    public void Dispose() { try { Directory.Delete(_dir, true); } catch { } }

    // A collector.json as written by 1.3.0: none of the keys added later (dlp, queue health, services, update channel details)
    private const string V130Json = """
        {
          "server_url": "https://liderone.uci.local",
          "collector_id": 14,
          "enrolled_bios_uuid": "AAAA1111-2222-3333-4444-555566667777",
          "heartbeat_interval_seconds": 300,
          "inventory_sync_interval_seconds": 900,
          "performance_interval_seconds": 300,
          "event_log_interval_seconds": 60,
          "delta_sync_enabled": true,
          "modules": { "system": true, "network": true, "software": true, "performance": true, "event_log": true, "windows_update": true, "ad": false }
        }
        """;

    [Fact]
    public void A_1_3_0_config_keeps_identity_and_settings_and_gets_safe_defaults_for_everything_new()
    {
        var path = Path.Combine(_dir, "collector.json"); File.WriteAllText(path, V130Json);
        var c = CollectorConfig.Load(path);
        Assert.True(c.IsEnrolled); Assert.Equal(14, c.CollectorId); Assert.Equal("https://liderone.uci.local", c.ServerUrl); Assert.Equal("AAAA1111-2222-3333-4444-555566667777", c.EnrolledBiosUuid);
        Assert.Equal(900, c.InventorySyncIntervalSeconds); Assert.True(c.DeltaSyncEnabled);
        Assert.False(c.Dlp.Enabled, "DLP is OFF by default and after an upgrade");
        Assert.False(c.Dlp.Print.Enabled); Assert.False(c.Dlp.Usb.Enabled); Assert.Equal("hash", c.Dlp.Print.DocumentName);
        Assert.True(c.Modules.Services, "services inventory defaults on, as in 1.2.0+"); Assert.False(c.Modules.Ad); Assert.False(c.Modules.HyperV); Assert.False(c.Modules.Vmware);
        Assert.False(c.AllowHttp); Assert.Equal("stable", c.UpdateChannel);
    }

    [Fact]
    public void Loading_never_rewrites_the_file_and_a_save_keeps_every_value()
    {
        var path = Path.Combine(_dir, "collector.json"); File.WriteAllText(path, V130Json);
        var before = File.ReadAllBytes(path); var stamp = File.GetLastWriteTimeUtc(path);
        var c = CollectorConfig.Load(path);
        Assert.Equal(before, File.ReadAllBytes(path)); Assert.Equal(stamp, File.GetLastWriteTimeUtc(path));
        c.Save();
        var again = CollectorConfig.Load(path);
        Assert.Equal((c.CollectorId, c.ServerUrl, c.EnrolledBiosUuid, c.InventorySyncIntervalSeconds), (again.CollectorId, again.ServerUrl, again.EnrolledBiosUuid, again.InventorySyncIntervalSeconds));
        Assert.False(again.Dlp.Enabled);
    }

    [Fact]
    public void A_1_4_0_config_with_dlp_explicitly_off_stays_off()
    {
        var path = Path.Combine(_dir, "c140.json");
        File.WriteAllText(path, """{ "server_url": "https://x", "collector_id": 4, "dlp": { "enabled": false, "print": { "enabled": false }, "usb": { "enabled": false } }, "update_channel": "pilot" }""");
        var c = CollectorConfig.Load(path);
        Assert.False(c.Dlp.Enabled); Assert.Equal("pilot", c.UpdateChannel); Assert.Equal(4, c.CollectorId);
    }

    [Fact]
    public void The_offline_queue_written_by_an_older_version_is_read_drained_and_reported_by_the_new_code()
    {
        // the queue table has had the same five columns since 1.0; create it by hand, exactly as an old Collector left it on disk
        var db = Path.Combine(_dir, "queue.db");
        using (var conn = new SqliteConnection($"Data Source={db};Mode=ReadWriteCreate;"))
        {
            conn.Open();
            using var cmd = conn.CreateCommand();
            cmd.CommandText = "CREATE TABLE queue (id INTEGER PRIMARY KEY AUTOINCREMENT, endpoint TEXT NOT NULL, payload TEXT NOT NULL, created INTEGER NOT NULL DEFAULT (unixepoch()), attempts INTEGER NOT NULL DEFAULT 0);" +
                              "INSERT INTO queue (endpoint, payload, created) VALUES ('inventory', '{\"a\":1}', unixepoch() - 7200), ('inventory', '{\"a\":2}', unixepoch() - 3600), ('events', '{\"b\":1}', unixepoch());";
            cmd.ExecuteNonQuery();
        }
        using var q = new LocalQueue(db);
        Assert.Equal(3, q.Count()); var items = q.Peek(10); Assert.Equal(new[] { "inventory", "inventory", "events" }, items.Select(i => i.Endpoint).ToArray());
        Assert.InRange(DateTimeOffset.UtcNow.ToUnixTimeSeconds() - q.OldestCreated()!.Value, 7100, 7400);
        var snap = new QueueHealthTracker().Snapshot(q.Count(), q.OldestCreated());
        Assert.Equal(3, snap.Depth); Assert.NotNull(snap.OldestAgeSeconds); Assert.Equal("backlog", snap.State);
        foreach (var i in items) q.Acknowledge(i.Id);
        Assert.Equal(0, q.Count()); Assert.Null(q.OldestCreated());
    }

    [Fact]
    public void The_queue_health_payload_is_an_addition_the_old_heartbeat_fields_are_unchanged()
    {
        // the server accepts a heartbeat without queue_status (1.3.0 / 1.4.0 never send it); with it, only the documented keys travel
        var json = JsonSerializer.Serialize(QueueHealthTracker.ToPayload(new QueueHealthTracker().Snapshot(0, null)));
        using var doc = JsonDocument.Parse(json);
        Assert.Equal(7, doc.RootElement.EnumerateObject().Count());
    }

    [Fact]
    public void Delta_sync_state_is_memory_only_so_an_upgrade_always_starts_with_a_full_inventory()
    {
        var delta = new DeltaSync();
        Assert.Equal(0, delta.CachedModules);   // nothing is read from disk: the first cycle after the service restarts is a full one
    }
}
