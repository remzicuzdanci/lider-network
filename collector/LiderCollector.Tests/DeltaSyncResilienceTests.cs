using System.Text.Json;
using System.Xml.Linq;
using LiderCollector.Core;
using Xunit;

namespace LiderCollector.Tests;

/// <summary>
/// Long-run, fault-injection and policy tests for delta sync. A model server (same rules as InventoryDeltaService: acknowledge what it stores,
/// verify "unchanged" claims against its own store, ask for a resync otherwise) is driven for thousands of cycles with a drifting machine,
/// dropped connections, lost server state, failing modules and restarts. The invariant after every DELIVERED cycle: the server holds
/// exactly what the machine currently has.
/// </summary>
public class DeltaSyncResilienceTests
{
    private static readonly string[] Mods = { "system", "network", "software", "services", "windows_update" };

    // ── a drifting machine ────────────────────────────────────────────────

    private sealed class Machine
    {
        private readonly Random _r;
        public long BaseFree = 202_500_000_000;                 // mid-bucket (bucket = 5 GB)
        public long Free = 202_500_000_000;
        public long Uptime;
        public List<string> Apps = Enumerable.Range(1, 120).Select(i => $"App{i}").ToList();
        public Dictionary<string, string> Svc = Enumerable.Range(1, 80).ToDictionary(i => $"Svc{i}", i => i % 5 == 0 ? "Stopped" : "Running");
        public string Mac = "00:11:22:33:44:55";
        public int Kb = 5;
        public Machine(int seed) => _r = new Random(seed);

        /// <summary>noise only (never a real change): uptime, timestamps, free space jitter inside the 1 % bucket, enumeration order</summary>
        public void Noise()
        {
            Uptime += _r.Next(30, 900);
            Free = BaseFree + _r.Next(-50_000_000, 50_000_000);   // ±50 MB jitter around the base: inside the bucket
            Apps = Apps.OrderBy(_ => _r.Next()).ToList();
        }

        /// <summary>a real change in one random module; returns its name</summary>
        public string Change()
        {
            switch (_r.Next(5))
            {
                case 0: BaseFree -= 30_000_000_000; Free = BaseFree; return "system";
                case 1: Mac = $"00:11:22:33:44:{_r.Next(10, 99)}"; return "network";
                case 2: Apps.Add($"New{_r.Next(100000)}"); return "software";
                case 3: { var k = Svc.Keys.ElementAt(_r.Next(Svc.Count)); Svc[k] = Svc[k] == "Running" ? "Stopped" : "Running"; return "services"; }
                default: Kb++; return "windows_update";
            }
        }

        public Dictionary<string, object?> Snapshot(int tick) => new()
        {
            ["system"] = new Dictionary<string, object?>
            {
                ["hostname"] = "PC",
                ["uptime_seconds"] = Uptime,
                ["volumes"] = new List<object> { new Dictionary<string, object?> { ["letter"] = "C:", ["size_bytes"] = 500_000_000_000L, ["free_bytes"] = Free, ["used_bytes"] = 500_000_000_000L - Free } },
            },
            ["network"] = new Dictionary<string, object?> { ["adapters"] = new List<object> { new Dictionary<string, object?> { ["mac_address"] = Mac } } },
            ["software"] = new Dictionary<string, object?> { ["items"] = Apps.Select(a => (object)new Dictionary<string, object?> { ["name"] = a }).ToList() },
            ["services"] = new Dictionary<string, object?>
            {
                ["collected_at"] = $"t{tick}",
                ["count"] = Svc.Count,
                ["items"] = Svc.Select(s => (object)new Dictionary<string, object?> { ["name"] = s.Key, ["state"] = s.Value }).ToList(),
            },
            ["windows_update"] = new Dictionary<string, object?> { ["installed"] = Enumerable.Range(1, Kb).Select(k => $"KB{k}").ToList(), ["pending_queried_at"] = $"t{tick}" },
        };
    }

    // ── a model server ────────────────────────────────────────────────────

    private sealed class ModelServer
    {
        public readonly Dictionary<string, (string hash, string data)> Store = new();
        public bool FullMarker;
        public Random Chaos;
        public double LoseStateRate, DropRate, FailModuleRate;
        public int Resyncs, Requests, BytesIn, Drops;

        public ModelServer(int seed) => Chaos = new Random(seed ^ 0x5eed);

        public Task<ApiClient.ApiResult?> Send(object payloadObj, CancellationToken ct)
        {
            Requests++;
            string json = JsonSerializer.Serialize(payloadObj);
            BytesIn += json.Length;
            if (Chaos.NextDouble() < DropRate) { Drops++; return Task.FromResult<ApiClient.ApiResult?>(null); }   // request lost: nothing stored

            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            bool has = root.TryGetProperty("Sync", out var s) && s.ValueKind == JsonValueKind.Object;
            var mods = root.GetProperty("Modules");

            var ack = new List<string>();
            var resync = new List<string>();
            if (!has)
            {
                foreach (var p in mods.EnumerateObject()) Store[p.Name] = ("", p.Value.GetRawText());   // legacy: stores everything, no fingerprints
                return Task.FromResult<ApiClient.ApiResult?>(new ApiClient.ApiResult { Success = true });
            }

            string mode = s.GetProperty("mode").GetString()!;
            var hashes = s.GetProperty("hashes").EnumerateObject().ToDictionary(p => p.Name, p => p.Value.GetString()!);
            var unchanged = s.GetProperty("unchanged").EnumerateObject().ToDictionary(p => p.Name, p => p.Value.GetString()!);

            if (Chaos.NextDouble() < LoseStateRate) { Store.Clear(); FullMarker = false; }       // the server forgot everything (restore, wipe)

            foreach (var p in mods.EnumerateObject())
            {
                if (Array.IndexOf(Mods, p.Name) < 0) { Store[p.Name] = ("", p.Value.GetRawText()); continue; }
                if (Chaos.NextDouble() < FailModuleRate) { Store.Remove(p.Name); continue; }     // processing failed: not acknowledged, fingerprint dropped
                Store[p.Name] = (hashes.GetValueOrDefault(p.Name, ""), p.Value.GetRawText());
                if (hashes.ContainsKey(p.Name)) ack.Add(p.Name);
            }
            if (mode == "full" && ack.Count > 0) FullMarker = true;

            foreach (var (m, h) in unchanged)
                if (!FullMarker || !Store.TryGetValue(m, out var st) || st.hash != h) resync.Add(m);
            Resyncs += resync.Count;

            return Task.FromResult<ApiClient.ApiResult?>(new ApiClient.ApiResult
            {
                Success = true,
                Sync = new DeltaSync.SyncResponse { Ack = ack, Resync = resync, FullRequired = resync.Count > 0 },
            });
        }

        /// <summary>the server holds, for every eligible module, data whose fingerprint equals the machine's current one</summary>
        public void AssertConsistentWith(Dictionary<string, object?> truth, string context)
        {
            foreach (var m in Mods)
            {
                Assert.True(Store.TryGetValue(m, out var st), $"{context}: server has no {m}");
                var stored = JsonSerializer.Deserialize<Dictionary<string, object?>>(st.data)!;
                Assert.Equal(DeltaSync.Fingerprint(m, truth[m]), DeltaSync.Fingerprint(m, Normalise(stored)));
            }
        }

        private static Dictionary<string, object?> Normalise(Dictionary<string, object?> d) => d;
    }

    private sealed record Wire(Dictionary<string, object?> Modules, object? Sync);

    private static InventoryDispatcher.Outcome Cycle(InventoryDispatcher d, Dictionary<string, object?> snap, bool enabled = true) =>
        d.RunAsync(snap, p => new Wire(p.Modules, p.IncludeSync ? p.SyncBlock : null), enabled, 72000, CancellationToken.None).GetAwaiter().GetResult();

    // ── tests ─────────────────────────────────────────────────────────────

    [Fact]
    public void Noise_alone_never_causes_a_resend_over_a_long_run()
    {
        var m = new Machine(1);
        var srv = new ModelServer(1);
        var disp = new InventoryDispatcher(new DeltaSync(() => new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)), srv.Send);
        Cycle(disp, m.Snapshot(0));                                      // first: full
        int bytesAfterFull = srv.BytesIn;

        for (int i = 1; i <= 1000; i++)
        {
            m.Noise();
            var o = Cycle(disp, m.Snapshot(i));
            Assert.True(o.Delivered);
            Assert.True(o.WasDelta);
            Assert.Equal(0, o.ModulesSent);
        }
        Assert.Equal(0, srv.Resyncs);
        Assert.True(srv.BytesIn - bytesAfterFull < 1000 * 1800, $"1000 idle cycles cost {srv.BytesIn - bytesAfterFull} bytes");   // ~fingerprints only
        Assert.True((srv.BytesIn - bytesAfterFull) / 1000.0 < bytesAfterFull * 0.2, "an idle cycle costs far less than a full inventory");
    }

    [Fact]
    public void A_real_change_is_seen_even_when_it_is_small_and_the_server_always_ends_up_consistent()
    {
        var m = new Machine(2);
        var srv = new ModelServer(2);
        var disp = new InventoryDispatcher(new DeltaSync(), srv.Send);
        Cycle(disp, m.Snapshot(0));
        var rnd = new Random(2);
        for (int i = 1; i <= 400; i++)
        {
            m.Noise();
            string? changed = rnd.NextDouble() < 0.1 ? m.Change() : null;
            var snap = m.Snapshot(i);
            var o = Cycle(disp, snap);
            Assert.True(o.Delivered);
            if (changed != null) Assert.True(o.ModulesSent >= 1, $"cycle {i}: change in {changed} not sent");
            srv.AssertConsistentWith(snap, $"cycle {i}");
        }
    }

    [Theory]
    [InlineData(11)] [InlineData(12)] [InlineData(13)] [InlineData(14)] [InlineData(15)] [InlineData(16)]
    public void Chaos_dropped_requests_lost_server_state_failed_modules_and_restarts_never_leave_the_server_inconsistent(int seed)
    {
        var m = new Machine(seed);
        var srv = new ModelServer(seed) { DropRate = 0.15, LoseStateRate = 0.05, FailModuleRate = 0.04 };
        var delta = new DeltaSync();
        var disp = new InventoryDispatcher(delta, srv.Send);
        var rnd = new Random(seed);
        int consistentChecks = 0;

        for (int i = 0; i < 1500; i++)
        {
            m.Noise();
            if (rnd.NextDouble() < 0.12) m.Change();
            if (rnd.NextDouble() < 0.02)                                  // service restart: in-memory cache gone
            {
                delta = new DeltaSync();
                disp = new InventoryDispatcher(delta, srv.Send);
            }
            var snap = m.Snapshot(i);
            var o = Cycle(disp, snap);
            if (!o.Delivered)
            {
                // what would be queued is COMPLETE, and the cache is empty, so the next cycle is complete again
                Assert.NotNull(o.ToQueue);
                Assert.Equal(snap.Count, ((Wire)o.ToQueue!).Modules.Count);
                Assert.Equal(0, delta.CachedModules);
                continue;
            }
            // a module the (model) server failed to store is, by protocol, retried on the next cycle: retry until a quiet cycle, then compare
            if (srv.FailModuleRate > 0)
            {
                var saved = srv.FailModuleRate; srv.FailModuleRate = 0; var saveDrop = srv.DropRate; srv.DropRate = 0; var saveLose = srv.LoseStateRate; srv.LoseStateRate = 0;
                int guard = 0;
                InventoryDispatcher.Outcome q;
                do { q = Cycle(disp, snap); guard++; } while ((q.ModulesSent > 0 || !q.Delivered) && guard < 5);
                Assert.True(guard < 5, $"cycle {i}: did not converge");
                srv.AssertConsistentWith(snap, $"seed {seed} cycle {i}");
                consistentChecks++;
                srv.FailModuleRate = saved; srv.DropRate = saveDrop; srv.LoseStateRate = saveLose;
            }
        }
        Assert.True(consistentChecks > 800);
        Assert.True(srv.Drops > 50 && srv.Resyncs > 0, "the chaos actually happened");
    }

    [Fact]
    public void Delta_saves_most_of_the_traffic_on_a_realistic_day()
    {
        // one inventory every 15 minutes for a day, 3 real changes in the day
        var m = new Machine(3);
        var srvDelta = new ModelServer(3);
        var clock = new DateTime(2026, 11, 12, 0, 0, 0, DateTimeKind.Utc);
        var disp = new InventoryDispatcher(new DeltaSync(() => clock), srvDelta.Send);
        var srvFull = new ModelServer(3);
        var dispFull = new InventoryDispatcher(new DeltaSync(), srvFull.Send);

        for (int i = 0; i < 96; i++)
        {
            clock = clock.AddMinutes(15);
            m.Noise();
            if (i is 20 or 50 or 80) m.Change();
            var snap = m.Snapshot(i);
            Cycle(disp, snap);
            Cycle(dispFull, snap, enabled: false);
        }
        double ratio = (double)srvDelta.BytesIn / srvFull.BytesIn;
        Assert.True(ratio < 0.20, $"delta/full traffic = {ratio:P1}");
    }

    [Fact]
    public void Free_space_crossing_a_bucket_is_always_reported_and_drift_inside_a_bucket_is_not()
    {
        var m = new Machine(4);
        var srv = new ModelServer(4);
        var disp = new InventoryDispatcher(new DeltaSync(), srv.Send);
        Cycle(disp, m.Snapshot(0));
        m.Free = 202_500_000_000;                                      // middle of a 5 GB bucket
        Cycle(disp, m.Snapshot(1));
        m.Free += 1_000_000_000;                                       // +1 GB inside the bucket: not a change
        Assert.Equal(0, Cycle(disp, m.Snapshot(2)).ModulesSent);
        m.Free -= 8_000_000_000;                                       // 8 GB gone: crosses a bucket, health must see it
        Assert.Equal(1, Cycle(disp, m.Snapshot(3)).ModulesSent);
    }

    [Fact]
    public void A_server_that_loses_its_state_is_healed_in_the_same_cycle()
    {
        var m = new Machine(5);
        var srv = new ModelServer(5);
        var disp = new InventoryDispatcher(new DeltaSync(), srv.Send);
        Cycle(disp, m.Snapshot(0));
        srv.Store.Clear(); srv.FullMarker = false;
        var snap = m.Snapshot(1);
        var o = Cycle(disp, snap);
        Assert.True(o.Delivered);
        Assert.Equal(2, o.Requests);                                   // delta, then the immediate complete resend
        srv.AssertConsistentWith(snap, "after wipe");
        Assert.Equal(0, Cycle(disp, m.Snapshot(2)).ModulesSent);
    }

    // ── policy / config / ADMX ────────────────────────────────────────────

    [Theory]
    [InlineData(1, true)] [InlineData(0, false)]
    public void Policy_value_one_or_zero_is_honoured(int value, bool expected) =>
        Assert.Equal(expected, PolicyOverrides.ReadDeltaSync((_, _) => value));

    [Theory]
    [InlineData(2)] [InlineData(-1)] [InlineData("1")] [InlineData(null)]
    public void Anything_else_means_not_configured(object? value) =>
        Assert.Null(PolicyOverrides.ReadDeltaSync((_, _) => value));

    [Fact]
    public void An_unreadable_registry_never_changes_behaviour() =>
        Assert.Null(PolicyOverrides.ReadDeltaSync((_, _) => throw new UnauthorizedAccessException()));

    [Fact]
    public void The_policy_beats_the_file_but_is_never_written_back_to_collector_json()
    {
        var c = new CollectorConfig { DeltaSyncEnabled = true, DeltaSyncPolicy = false };
        Assert.False(c.EffectiveDeltaSync);
        c.DeltaSyncPolicy = null;
        Assert.True(c.EffectiveDeltaSync);

        var withPolicy = new CollectorConfig { DeltaSyncEnabled = true, DeltaSyncPolicy = false };
        string path = Path.Combine(Path.GetTempPath(), $"lc-{Guid.NewGuid():N}.json");
        try
        {
            var loaded = CollectorConfig.Load(path);
            loaded.DeltaSyncPolicy = false;
            loaded.Save();
            string json = File.ReadAllText(path);
            Assert.Contains("\"delta_sync_enabled\": true", json);     // the file keeps its own value
            Assert.DoesNotContain("policy", json, StringComparison.OrdinalIgnoreCase);
        }
        finally { File.Delete(path); }
    }

    [Fact]
    public void An_old_collector_json_without_the_new_keys_gets_the_safe_defaults()
    {
        string path = Path.Combine(Path.GetTempPath(), $"lc-{Guid.NewGuid():N}.json");
        try
        {
            File.WriteAllText(path, "{\"server_url\":\"https://x\",\"collector_id\":5}");
            var c = CollectorConfig.Load(path);
            Assert.True(c.DeltaSyncEnabled);
            Assert.Equal(72000, c.FullSyncIntervalSeconds);
        }
        finally { File.Delete(path); }
    }

    private static string? FindFile(string relative)
    {
        for (var d = new DirectoryInfo(AppContext.BaseDirectory); d != null; d = d.Parent)
        {
            var p = Path.Combine(d.FullName, relative);
            if (File.Exists(p)) return p;
        }
        return null;
    }

    [Fact]
    public void The_admx_policy_exists_is_well_formed_and_every_string_it_references_is_defined()
    {
        var admxPath = FindFile(Path.Combine("GPO", "LiderCollector.admx"));
        var admlPath = FindFile(Path.Combine("GPO", "en-US", "LiderCollector.adml"));
        Assert.NotNull(admxPath); Assert.NotNull(admlPath);
        XNamespace ns = "http://schemas.microsoft.com/GroupPolicy/2006/07/PolicyDefinitions";
        var admx = XDocument.Load(admxPath!);
        var adml = XDocument.Load(admlPath!);

        var policy = admx.Descendants(ns + "policy").Single(p => (string?)p.Attribute("name") == "DeltaSync");
        Assert.Equal("Machine", (string?)policy.Attribute("class"));
        Assert.Equal("DeltaSyncEnabled", (string?)policy.Attribute("valueName"));
        Assert.Equal(@"SOFTWARE\Policies\LiderNetwork\LiderCollector", (string?)policy.Attribute("key"));
        Assert.Equal("1", (string?)policy.Element(ns + "enabledValue")!.Element(ns + "decimal")!.Attribute("value"));
        Assert.Equal("0", (string?)policy.Element(ns + "disabledValue")!.Element(ns + "decimal")!.Attribute("value"));
        Assert.Equal(PolicyOverrides.DeltaSyncValue, (string?)policy.Attribute("valueName"));

        var ids = adml.Descendants(ns + "string").Select(s => (string?)s.Attribute("id")).ToHashSet();
        var refs = admx.Descendants().SelectMany(e => e.Attributes()).Where(a => a.Value.StartsWith("$(string.")).Select(a => a.Value[9..^1]);
        Assert.All(refs, r => Assert.Contains(r, ids));
        Assert.Contains("PolicyDeltaSync_Name", ids);
        Assert.Equal(ids.Count, adml.Descendants(ns + "string").Count());     // no duplicate ids
    }

    [Fact]
    public void The_wire_name_of_the_json_key_is_snake_case_so_collector_json_and_docs_agree()
    {
        string path = Path.Combine(Path.GetTempPath(), $"lc-{Guid.NewGuid():N}.json");
        try
        {
            var c = CollectorConfig.Load(path);
            c.Save();
            var json = File.ReadAllText(path);
            Assert.Contains("\"delta_sync_enabled\"", json);
            Assert.Contains("\"full_sync_interval_seconds\"", json);
        }
        finally { File.Delete(path); }
    }
}
