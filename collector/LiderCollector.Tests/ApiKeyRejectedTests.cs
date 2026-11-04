using LiderCollector.Core;
using System.Security.Cryptography;
using Xunit;

namespace LiderCollector.Tests;

/// <summary>
/// Tests for the HTTP 401 → credential wipe → re-enrollment flow.
///
/// ApiClient.CheckinAsync now returns (CheckinResponse? Response, bool ApiKeyRejected).
/// HeartbeatAsync uses ApiKeyRejected to clear credentials and trigger re-enrollment.
/// These tests verify the supporting components behave correctly during that flow.
/// </summary>
public sealed class ApiKeyRejectedTests : IDisposable
{
    private readonly string _dir;

    public ApiKeyRejectedTests()
    {
        _dir = Path.Combine(Path.GetTempPath(), $"lider_401_test_{Guid.NewGuid():N}");
        Directory.CreateDirectory(_dir);
    }

    public void Dispose()
    {
        try { Directory.Delete(_dir, recursive: true); }
        catch { /* cleanup best-effort */ }
    }

    // ── CollectorConfig enrollment state ─────────────────────────────────────

    [Fact]
    public void CollectorConfig_IsEnrolled_FalseWhenCollectorIdZero()
    {
        var cfg = CollectorConfig.Load(Path.Combine(_dir, "collector.json"));
        cfg.CollectorId = 0;
        Assert.False(cfg.IsEnrolled);
    }

    [Fact]
    public void CollectorConfig_IsEnrolled_TrueWhenCollectorIdPositive()
    {
        var cfg = CollectorConfig.Load(Path.Combine(_dir, "collector.json"));
        cfg.CollectorId = 42;
        Assert.True(cfg.IsEnrolled);
    }

    [Fact]
    public void CollectorConfig_ClearingCollectorId_SetsNotEnrolled()
    {
        var path = Path.Combine(_dir, "collector.json");
        var cfg = CollectorConfig.Load(path);
        cfg.CollectorId = 99;
        cfg.EnrolledBiosUuid = "some-uuid";
        Assert.True(cfg.IsEnrolled);

        // Simulate what HeartbeatAsync does on 401
        cfg.CollectorId = 0;
        cfg.EnrolledBiosUuid = null;
        cfg.Save();

        // Reload from disk — verify persisted correctly
        var reloaded = CollectorConfig.Load(path);
        Assert.False(reloaded.IsEnrolled);
        Assert.Null(reloaded.EnrolledBiosUuid);
    }

    // ── SecureStorage key deletion (api_key wipe on 401) ─────────────────────

    [Fact]
    public void SecureStorage_DeleteApiKey_KeyNoLongerPresent()
    {
        var store = new SecureStorage(Path.Combine(_dir, "secure.dat"));
        store.Set("api_key", "some-api-key-value");
        Assert.True(store.Has("api_key"));

        // Simulate HeartbeatAsync wipe on 401
        store.Delete("api_key");

        Assert.False(store.Has("api_key"));
        Assert.Null(store.Get("api_key"));
    }

    [Fact]
    public void SecureStorage_DeleteApiKey_OtherKeysPreserved()
    {
        var store = new SecureStorage(Path.Combine(_dir, "secure.dat"));
        store.Set("api_key", "some-api-key-value");
        store.Set("enroll_token", "pending-token");

        store.Delete("api_key");

        Assert.False(store.Has("api_key"));
        Assert.True(store.Has("enroll_token"));
        Assert.Equal("pending-token", store.Get("enroll_token"));
    }

    [Fact]
    public void SecureStorage_DeleteNonExistentKey_DoesNotThrow()
    {
        var store = new SecureStorage(Path.Combine(_dir, "secure.dat"));
        // Must not throw
        store.Delete("api_key");
        Assert.False(store.Has("api_key"));
    }

    // ── enrollment.json priority over stale DPAPI token ───────────────────────
    // After a 401 wipe, CollectorWorker clears api_key but keeps enroll_token
    // in DPAPI (or the IT drops a new enrollment.json).  These tests verify
    // that the SecureStorage overwrite behaviour is correct.

    [Fact]
    public void SecureStorage_SetOverwritesExistingKey()
    {
        var store = new SecureStorage(Path.Combine(_dir, "secure.dat"));
        store.Set("enroll_token", "old-stale-token");
        store.Set("enroll_token", "new-fresh-token"); // enrollment.json has priority

        Assert.Equal("new-fresh-token", store.Get("enroll_token"));
    }

    [Fact]
    public void SecureStorage_PersistAndReload_KeySurvivesRoundtrip()
    {
        var path = Path.Combine(_dir, "secure.dat");
        var store1 = new SecureStorage(path);
        store1.Set("api_key", "persisted-key-value");

        var store2 = new SecureStorage(path); // reload from disk
        Assert.Equal("persisted-key-value", store2.Get("api_key"));
    }
}
