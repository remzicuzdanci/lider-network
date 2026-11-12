using System.Text.Json;
using LiderCollector.Core;
using Xunit;

namespace LiderCollector.Tests;

/// <summary>Delta inventory synchronisation (agent side): fingerprints, planning, acknowledgement, resync, failure and compatibility paths.</summary>
public class DeltaSyncTests
{
    // ── fixtures ──────────────────────────────────────────────────────────

    private static Dictionary<string, object?> System_(long free = 200_000_000_000, long uptime = 1000, string host = "PC-1") => new()
    {
        ["hostname"] = host,
        ["uptime_seconds"] = uptime,
        ["volumes"] = new List<object> { new Dictionary<string, object?> { ["letter"] = "C:", ["size_bytes"] = 500_000_000_000L, ["free_bytes"] = free, ["used_bytes"] = 500_000_000_000L - free } },
        ["disks"] = new List<object> { new Dictionary<string, object?> { ["model"] = "A" }, new Dictionary<string, object?> { ["model"] = "B" } },
    };

    private static Dictionary<string, object?> Software(params string[] names) => new()
    {
        ["items"] = names.Select(n => (object)new Dictionary<string, object?> { ["name"] = n, ["version"] = "1.0" }).ToList(),
    };

    private static Dictionary<string, object?> Services(string state = "Running", string collectedAt = "t1") => new()
    {
        ["collected_at"] = collectedAt,
        ["count"] = 1,
        ["items"] = new List<object> { new Dictionary<string, object?> { ["name"] = "Spooler", ["state"] = state } },
    };

    private static Dictionary<string, object?> Cycle(
        Dictionary<string, object?>? system = null, Dictionary<string, object?>? software = null, Dictionary<string, object?>? services = null) => new()
    {
        ["system"] = system ?? System_(),
        ["network"] = new Dictionary<string, object?> { ["adapters"] = new List<object> { new Dictionary<string, object?> { ["mac_address"] = "00:11" } } },
        ["software"] = software ?? Software("A", "B", "C"),
        ["services"] = services ?? Services(),
        ["windows_update"] = new Dictionary<string, object?> { ["pending_count"] = 0, ["pending_queried_at"] = "t1" },
        ["hyperv"] = new Dictionary<string, object?> { ["vms"] = 3 },   // not delta-eligible
    };

    private static DeltaSync.SyncResponse Ack(DeltaSync.Plan p, params string[] resync) => new()
    {
        Ack = p.Hashes.Keys.Except(resync).ToList(),
        Resync = resync.ToList(),
        FullRequired = resync.Length > 0,
    };

    // ── fingerprint ───────────────────────────────────────────────────────

    [Fact]
    public void Fingerprint_is_independent_of_key_order_and_array_order()
    {
        var a = new Dictionary<string, object?> { ["x"] = 1, ["y"] = new List<object> { "b", "a", "c" } };
        var b = new Dictionary<string, object?> { ["y"] = new List<object> { "c", "b", "a" }, ["x"] = 1 };
        Assert.Equal(DeltaSync.Fingerprint("network", a), DeltaSync.Fingerprint("network", b));
        Assert.Equal(64, DeltaSync.Fingerprint("network", a).Length);
    }

    [Fact]
    public void Fingerprint_ignores_volatile_fields_but_sees_real_changes()
    {
        string f(string m, object d) => DeltaSync.Fingerprint(m, d);
        Assert.Equal(f("system", System_(uptime: 1)), f("system", System_(uptime: 999999)));                    // uptime is derived data
        Assert.Equal(f("services", Services("Running", "t1")), f("services", Services("Running", "t2")));      // collection timestamp
        Assert.NotEqual(f("services", Services("Running")), f("services", Services("Stopped")));              // a real state change
        Assert.NotEqual(f("software", Software("A", "B")), f("software", Software("A", "B", "C")));
        Assert.NotEqual(f("system", System_(host: "PC-1")), f("system", System_(host: "PC-2")));
    }

    [Fact]
    public void Disk_free_space_is_bucketed_to_one_percent_so_noise_does_not_count_as_change()
    {
        string f(long free) => DeltaSync.Fingerprint("system", System_(free));
        Assert.Equal(f(202_500_000_000), f(202_500_000_000 + 200_000_000));     // +0.2 GB on a 500 GB disk: same bucket (bucket 5 GB)
        Assert.NotEqual(f(202_500_000_000), f(202_500_000_000 - 20_000_000_000)); // 20 GB gone: a change the health check must see
    }

    // ── planning ──────────────────────────────────────────────────────────

    [Fact]
    public void The_first_inventory_is_complete_and_after_an_acknowledgement_an_identical_cycle_sends_nothing()
    {
        var d = new DeltaSync();
        var c = Cycle();
        var p1 = d.BuildPlan(c, 72000);
        Assert.False(p1.Delta);
        Assert.Equal(c.Count, p1.Modules.Count);
        Assert.Empty(p1.Unchanged);
        Assert.Empty(d.Apply(p1, Ack(p1)));

        var p2 = d.BuildPlan(Cycle(), 72000);
        Assert.True(p2.Delta);
        Assert.Equal(new[] { "hyperv" }, p2.Modules.Keys);                       // the non-eligible module always travels
        Assert.Equal(5, p2.Unchanged.Count);
        Assert.Empty(p2.Hashes);
    }

    [Fact]
    public void Only_the_changed_module_is_sent()
    {
        var d = new DeltaSync();
        var p1 = d.BuildPlan(Cycle(), 72000);
        d.Apply(p1, Ack(p1));

        var p2 = d.BuildPlan(Cycle(software: Software("A", "B", "C", "D")), 72000);
        Assert.True(p2.Delta);
        Assert.Contains("software", p2.Modules.Keys);
        Assert.DoesNotContain("system", p2.Modules.Keys);
        Assert.Equal(new[] { "software" }, p2.Hashes.Keys);
        Assert.DoesNotContain("software", p2.Unchanged.Keys);
        Assert.Equal(4, p2.Unchanged.Count);
    }

    [Fact]
    public void A_module_the_server_did_not_acknowledge_is_never_committed_and_is_sent_again()
    {
        var d = new DeltaSync();
        var p1 = d.BuildPlan(Cycle(), 72000);
        d.Apply(p1, new DeltaSync.SyncResponse { Ack = p1.Hashes.Keys.Where(k => k != "windows_update").ToList() });   // windows_update failed on the server

        var p2 = d.BuildPlan(Cycle(), 72000);
        Assert.Contains("windows_update", p2.Modules.Keys);
        Assert.DoesNotContain("windows_update", p2.Unchanged.Keys);
        Assert.Contains("system", p2.Unchanged.Keys);
    }

    [Fact]
    public void A_restart_always_starts_with_a_complete_inventory()
    {
        var first = new DeltaSync();
        var p = first.BuildPlan(Cycle(), 72000);
        first.Apply(p, Ack(p));
        Assert.True(first.BuildPlan(Cycle(), 72000).Delta);

        var afterRestart = new DeltaSync();                                      // the cache is in memory only
        Assert.False(afterRestart.BuildPlan(Cycle(), 72000).Delta);
    }

    [Fact]
    public void A_complete_inventory_is_forced_after_the_full_interval_even_if_nothing_changed()
    {
        var now = new DateTime(2026, 11, 12, 8, 0, 0, DateTimeKind.Utc);
        var d = new DeltaSync(() => now);
        var p = d.BuildPlan(Cycle(), 72000);
        d.Apply(p, Ack(p));

        now = now.AddHours(19);
        Assert.True(d.BuildPlan(Cycle(), 72000).Delta);
        now = now.AddHours(2);                                                   // 21 h > 20 h
        var forced = d.BuildPlan(Cycle(), 72000);
        Assert.False(forced.Delta);
        Assert.Empty(forced.Unchanged);
    }

    [Fact]
    public void Disabled_by_configuration_means_plain_legacy_payloads_every_time()
    {
        var d = new DeltaSync();
        var p = d.BuildPlan(Cycle(), 72000, enabled: false);
        Assert.False(p.IncludeSync);
        Assert.False(p.Delta);
        Assert.Equal(6, p.Modules.Count);
    }

    // ── dispatcher: acknowledgement, resync, failure, old server ─────────

    private sealed class FakeServer
    {
        public List<(bool hasSync, string mode, string[] modules, string[] unchanged)> Requests = new();
        public Func<int, DeltaSync.SyncResponse?>? Answer;
        public bool Fail;
        public int Calls;

        public Task<ApiClient.ApiResult?> Send(object payload, CancellationToken ct)
        {
            Calls++;
            var json = JsonSerializer.Serialize(payload);
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            bool has = root.TryGetProperty("Sync", out var s) && s.ValueKind == JsonValueKind.Object;
            var mods = root.GetProperty("Modules").EnumerateObject().Select(p => p.Name).ToArray();
            string mode = has ? s.GetProperty("mode").GetString()! : "legacy";
            var unch = has ? s.GetProperty("unchanged").EnumerateObject().Select(p => p.Name).ToArray() : Array.Empty<string>();
            Requests.Add((has, mode, mods, unch));
            if (Fail) return Task.FromResult<ApiClient.ApiResult?>(null);

            // answer on behalf of the server: acknowledge exactly the hashes that were sent
            var hashes = has ? s.GetProperty("hashes").EnumerateObject().Select(p => p.Name).ToList() : new List<string>();
            var resp = Answer != null ? Answer(Calls) : new DeltaSync.SyncResponse { Ack = hashes };
            return Task.FromResult<ApiClient.ApiResult?>(new ApiClient.ApiResult { Success = true, Sync = has ? resp : null });
        }
    }

    private sealed record Payload(Dictionary<string, object?> Modules, object? Sync);

    private static async Task<InventoryDispatcher.Outcome> Run(InventoryDispatcher disp, Dictionary<string, object?> c, bool enabled = true) =>
        await disp.RunAsync(c, p => new Payload(p.Modules, p.IncludeSync ? p.SyncBlock : null), enabled, 72000, CancellationToken.None);

    [Fact]
    public async Task Full_then_delta_then_change_end_to_end()
    {
        var srv = new FakeServer();
        var disp = new InventoryDispatcher(new DeltaSync(), srv.Send);

        var o1 = await Run(disp, Cycle());
        Assert.True(o1.Delivered); Assert.False(o1.WasDelta); Assert.Equal(6, o1.ModulesSent);

        var o2 = await Run(disp, Cycle());
        Assert.True(o2.Delivered); Assert.True(o2.WasDelta); Assert.Equal(1, o2.ModulesSent);          // only hyperv (not eligible)
        Assert.Equal("delta", srv.Requests[1].mode);
        Assert.Equal(5, srv.Requests[1].unchanged.Length);

        var o3 = await Run(disp, Cycle(services: Services("Stopped")));
        Assert.Equal(2, o3.ModulesSent);                                                                // services + hyperv
        Assert.Contains("services", srv.Requests[2].modules);
        Assert.DoesNotContain("services", srv.Requests[2].unchanged);
    }

    [Fact]
    public async Task A_failed_send_queues_a_COMPLETE_inventory_and_forgets_the_cache()
    {
        var srv = new FakeServer();
        var delta = new DeltaSync();
        var disp = new InventoryDispatcher(delta, srv.Send);
        await Run(disp, Cycle());                                    // cache filled
        Assert.True(delta.CachedModules > 0);

        srv.Fail = true;
        var o = await Run(disp, Cycle(software: Software("A", "Z")));
        Assert.False(o.Delivered);
        Assert.NotNull(o.ToQueue);
        var queued = (Payload)o.ToQueue!;
        Assert.Equal(6, queued.Modules.Count);                        // complete, not the delta
        Assert.Equal(0, delta.CachedModules);

        srv.Fail = false;
        var next = await Run(disp, Cycle(software: Software("A", "Z")));
        Assert.False(next.WasDelta, "after a failure the next inventory is complete again");
    }

    [Fact]
    public async Task A_resync_answer_triggers_an_immediate_complete_resend_from_the_data_already_collected()
    {
        var srv = new FakeServer();
        var disp = new InventoryDispatcher(new DeltaSync(), srv.Send);
        await Run(disp, Cycle());

        srv.Answer = n => n == 2
            ? new DeltaSync.SyncResponse { Ack = new(), Resync = new() { "software", "services" }, FullRequired = true }   // 2nd call = the delta
            : new DeltaSync.SyncResponse { Ack = new() { "system", "network", "software", "services", "windows_update" } };

        var o = await Run(disp, Cycle());
        Assert.True(o.Delivered);
        Assert.Equal(2, o.Requests);
        Assert.Equal("full", srv.Requests[2].mode);
        Assert.Equal(6, srv.Requests[2].modules.Length);
        Assert.Empty(srv.Requests[2].unchanged);

        srv.Answer = null;
        var after = await Run(disp, Cycle());
        Assert.True(after.WasDelta, "the resend healed the cache");
        Assert.Equal(1, after.Requests);
    }

    [Fact]
    public async Task An_older_server_without_a_sync_block_switches_delta_off_and_gets_plain_payloads()
    {
        var srv = new FakeServer();
        var delta = new DeltaSync();
        var disp = new InventoryDispatcher(delta, (p, ct) =>
        {
            srv.Send(p, ct);
            return Task.FromResult<ApiClient.ApiResult?>(new ApiClient.ApiResult { Success = true, Sync = null });   // 1.2.0-era answer
        });

        var o1 = await Run(disp, Cycle());
        Assert.True(o1.Delivered);
        Assert.True(delta.ServerUnsupported);

        var o2 = await Run(disp, Cycle());
        Assert.False(o2.WasDelta);
        Assert.Equal(6, o2.ModulesSent);
        Assert.False(srv.Requests[1].hasSync, "no sync block is sent to a server that does not know it");
    }

    [Fact]
    public async Task With_the_feature_off_nothing_in_the_payload_differs_from_1_2_0()
    {
        var srv = new FakeServer();
        var disp = new InventoryDispatcher(new DeltaSync(), srv.Send);
        await Run(disp, Cycle(), enabled: false);
        await Run(disp, Cycle(), enabled: false);
        Assert.All(srv.Requests, r => { Assert.False(r.hasSync); Assert.Equal(6, r.modules.Length); });
    }

    [Fact]
    public void The_wire_format_of_the_sync_block_is_stable()
    {
        var d = new DeltaSync();
        var p = d.BuildPlan(Cycle(), 72000);
        var json = JsonSerializer.Serialize(p.SyncBlock);
        using var doc = JsonDocument.Parse(json);
        // property names are fixed by [JsonPropertyName] attributes, not by naming policy
        Assert.Equal(1, doc.RootElement.GetProperty("v").GetInt32());
        Assert.Equal("full", doc.RootElement.GetProperty("mode").GetString());
        Assert.Equal(5, doc.RootElement.GetProperty("hashes").EnumerateObject().Count());
        Assert.All(doc.RootElement.GetProperty("hashes").EnumerateObject(), h => Assert.Matches("^[0-9a-f]{64}$", h.Value.GetString()!));
    }

    [Fact]
    public void Config_defaults_enable_delta_and_force_a_full_inventory_below_the_servers_trust_window()
    {
        var c = new CollectorConfig();
        Assert.True(c.DeltaSyncEnabled);
        Assert.InRange(c.FullSyncIntervalSeconds, 3600, 86400 - 3600);
    }
}
