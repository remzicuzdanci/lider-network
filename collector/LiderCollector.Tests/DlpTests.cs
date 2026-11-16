using System.Text.Json;
using LiderCollector.Core;
using LiderCollector.Dlp;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace LiderCollector.Tests;

public class PrintJobParserTests
{
    public static string Xml(int eventId = 307, string doc = "Rapor.docx - Word", string user = "uci\\ahmet", string printer = "HP LaserJet 400", string pages = "4", string bytes = "63414", long rec = 1234, string time = "2026-11-16T14:20:11.1234567Z") => $"""
        <Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event">
          <System><Provider Name="Microsoft-Windows-PrintService" Guid="747ef6fd-e535-4d16-b510-42c90f6873a1"/><EventID>{eventId}</EventID>
            <TimeCreated SystemTime="{time}"/><EventRecordID>{rec}</EventRecordID><Channel>Microsoft-Windows-PrintService/Operational</Channel><Computer>PC01.uci.local</Computer></System>
          <UserData><DocumentPrinted xmlns="http://manifests.microsoft.com/win/2005/08/windows/printing/spooler/core/events">
            <Param1>3</Param1><Param2>{doc}</Param2><Param3>{user}</Param3><Param4>PC01</Param4><Param5>{printer}</Param5><Param6>IP_10.0.0.9</Param6><Param7>{bytes}</Param7><Param8>{pages}</Param8>
          </DocumentPrinted></UserData>
        </Event>
        """;

    [Fact]
    public void A_real_shaped_event_307_becomes_a_print_job_with_all_metadata()
    {
        var e = PrintJobParser.Parse(Xml(), "full")!;
        Assert.Equal("print_job", e.Type); Assert.Equal("PC01", e.Host);
        Assert.Equal(new DateTime(2026, 11, 16, 14, 20, 11, DateTimeKind.Utc).AddTicks(1234567), e.OccurredUtc);
        Assert.Equal("HP LaserJet 400", e.Data["printer"]); Assert.Equal("uci\\ahmet", e.Data["user"]); Assert.Equal("Rapor.docx - Word", e.Data["document"]);
        Assert.Equal(4L, e.Data["pages"]); Assert.Equal(63414L, e.Data["bytes"]); Assert.Equal(3L, e.Data["job_id"]); Assert.Equal("IP_10.0.0.9", e.Data["port"]);
    }

    [Fact] public void Other_events_and_garbage_return_null_and_never_throw()
    {
        Assert.Null(PrintJobParser.Parse(Xml(eventId: 306))); Assert.Null(PrintJobParser.Parse("<not xml")); Assert.Null(PrintJobParser.Parse("")); Assert.Null(PrintJobParser.Parse("<Event/>"));
        Assert.Null(PrintJobParser.Parse(Xml(time: "yesterday")));
    }

    [Fact] public void The_uid_is_stable_for_the_same_event_and_differs_for_another()
    {
        Assert.Equal(PrintJobParser.Parse(Xml())!.Uid, PrintJobParser.Parse(Xml())!.Uid);
        Assert.NotEqual(PrintJobParser.Parse(Xml())!.Uid, PrintJobParser.Parse(Xml(rec: 1235))!.Uid);
        Assert.Matches("^prt-[0-9a-f]{40}$", PrintJobParser.Parse(Xml())!.Uid);
    }

    [Fact] public void Bad_numbers_are_dropped_not_guessed_and_negative_numbers_are_clamped()
    {
        var e = PrintJobParser.Parse(Xml(pages: "many", bytes: "-9"))!;
        Assert.False(e.Data.ContainsKey("pages")); Assert.Equal(0L, e.Data["bytes"]);
    }

    [Theory]
    [InlineData("full", "Maas Bordrosu.XLSX", "Maas Bordrosu.XLSX")]
    [InlineData("extension", "Maas Bordrosu.XLSX", "*.xlsx")]
    [InlineData("none", "Maas Bordrosu.XLSX", null)]
    public void The_document_name_follows_the_privacy_mode(string mode, string name, string? expected) => Assert.Equal(expected, PrintJobParser.Parse(Xml(doc: name), mode)!.Data["document"]);

    [Fact] public void The_hash_mode_hides_the_name_but_keeps_the_same_document_recognisable()
    {
        string a = (string)PrintJobParser.Parse(Xml(doc: "Gizli Plan.docx"), "hash")!.Data["document"]!, b = (string)PrintJobParser.Parse(Xml(doc: "gizli plan.DOCX"), "hash")!.Data["document"]!;
        Assert.Matches("^sha256:[0-9a-f]{16}\\.docx$", a); Assert.Equal(a, b); Assert.DoesNotContain("Gizli", a);
    }

    [Fact] public void Control_characters_are_removed_and_long_names_are_cut()
    {
        var e = PrintJobParser.Parse(Xml(doc: "a\tb\nc" + new string('x', 1000)), "full")!;   // (characters that XML cannot carry at all never reach the parser)
        string d = (string)e.Data["document"]!; Assert.True(d.Length <= 400); Assert.DoesNotContain("\t", d); Assert.DoesNotContain("\n", d);
    }

    [Fact] public void The_wire_form_has_the_fields_the_server_expects_and_no_nulls()
    {
        string json = JsonSerializer.Serialize(PrintJobParser.Parse(Xml(), "none")!.ToWire());
        using var d = JsonDocument.Parse(json); var r = d.RootElement;
        Assert.Equal("print_job", r.GetProperty("type").GetString()); Assert.EndsWith("Z", r.GetProperty("occurred_at").GetString());
        Assert.False(r.GetProperty("data").TryGetProperty("document", out _)); Assert.Equal(4, r.GetProperty("data").GetProperty("pages").GetInt32());
    }
}

public class DlpCollectorTests
{
    private sealed class FakeSource : IDlpSource
    {
        public string Name => "print"; public bool Enabled = true; public string? Problem; public List<(long, DlpEvent)> Log = new(); public long LastAsked = -1;
        public bool IsEnabled(DlpConfig c) => Enabled;
        public bool Prepare(DlpConfig c, out string? p) { p = Problem; return Problem is null; }
        public IReadOnlyList<(long, DlpEvent)> ReadNew(long after, int max, DlpConfig c) { LastAsked = after; return Log.Where(x => x.Item1 > after).Take(max).ToList(); }
    }
    private sealed class State : IDlpStateStore { public Dictionary<string, long> V = new(); public long Get(string s) => V.GetValueOrDefault(s); public void Set(string s, long p) => V[s] = p; }
    private sealed class Sink : IQueueSink { public List<(string, object)> Items = new(); public long Rows; public void Enqueue(string e, object p) { Items.Add((e, p)); Rows++; } public long Count() => Rows; }
    private static DlpEvent Ev(int n) => new($"prt-{n:D40}", "print_job", DateTime.UtcNow, "PC", new Dictionary<string, object?> { ["printer"] = "P" });
    private static FakeSource Src(int count) { var s = new FakeSource(); for (int i = 1; i <= count; i++) s.Log.Add((i, Ev(i))); return s; }
    private static DlpConfig On(Action<DlpConfig>? tweak = null) { var c = new DlpConfig { Enabled = true, Print = { Enabled = true } }; tweak?.Invoke(c); return c; }

    [Fact] public void Everything_is_off_by_default_and_each_source_is_switchable_on_its_own()
    {
        var c = new DlpConfig(); Assert.False(c.Enabled); Assert.False(c.Print.Enabled); Assert.False(c.Usb.Enabled);
        Assert.False(new CollectorConfig().Dlp.Enabled);
        Assert.Equal("hash", c.Print.DocumentName); Assert.True(c.Print.AutoEnableLog);   // the document name is hashed unless the customer policy says otherwise
    }

    [Fact] public void The_limits_are_clamped_to_sane_values()
    {
        var c = new DlpConfig { PollSeconds = 1, MaxBatch = 5000, MaxPerPoll = 0 };
        Assert.Equal(10, c.EffectivePollSeconds); Assert.Equal(100, c.EffectiveMaxBatch); Assert.Equal(1, c.EffectiveMaxPerPoll);
    }

    [Fact] public async Task Disabled_means_nothing_is_read_at_all()
    {
        var src = Src(3); var sent = 0;
        var d = new DlpCollector(new DlpConfig(), new[] { src }, new State(), (e, _) => { sent += e.Count; return Task.FromResult(SendOutcome.Ok); }, new Sink(), NullLogger.Instance);
        var r = await d.RunAsync(true, default); Assert.Equal(0, r.Read); Assert.Equal(0, sent); Assert.Equal(-1, src.LastAsked);
    }

    [Fact] public async Task Online_events_are_sent_in_batches_and_the_position_moves_only_after_delivery()
    {
        var src = Src(120); var st = new State(); var batches = new List<int>();
        var d = new DlpCollector(On(c => c.MaxPerPoll = 1000), new[] { src }, st, (e, _) => { batches.Add(e.Count); return Task.FromResult(SendOutcome.Ok); }, new Sink(), NullLogger.Instance);
        var r = await d.RunAsync(true, default);
        Assert.Equal(120, r.Sent); Assert.Equal(new[] { 50, 50, 20 }, batches); Assert.Equal(120, st.V["print"]);
        await d.RunAsync(true, default); Assert.Equal(120, src.LastAsked);   // the next poll continues after the stored position, nothing is re-read
    }

    [Fact] public async Task A_failed_send_queues_the_events_and_still_moves_the_position()
    {
        var src = Src(5); var st = new State(); var q = new Sink();
        var d = new DlpCollector(On(), new[] { src }, st, (e, _) => Task.FromResult(SendOutcome.Failed), q, NullLogger.Instance);
        var r = await d.RunAsync(true, default);
        Assert.Equal(5, r.Queued); Assert.Equal(0, r.Sent); Assert.Equal(5, st.V["print"]); Assert.Single(q.Items); Assert.Equal("dlp-events", q.Items[0].Item1);
        using var doc = JsonDocument.Parse(JsonSerializer.Serialize(q.Items[0].Item2)); Assert.Equal(5, doc.RootElement.GetProperty("events").GetArrayLength());
    }

    [Fact] public async Task Offline_goes_straight_to_the_queue_without_trying_the_server()
    {
        var src = Src(3); int calls = 0; var q = new Sink();
        var d = new DlpCollector(On(), new[] { src }, new State(), (e, _) => { calls++; return Task.FromResult(SendOutcome.Ok); }, q, NullLogger.Instance);
        var r = await d.RunAsync(false, default); Assert.Equal(0, calls); Assert.Equal(3, r.Queued);
    }

    [Fact] public async Task A_rate_limited_server_queues_instead_of_losing_events()
    {
        var src = Src(4); var q = new Sink();
        var d = new DlpCollector(On(), new[] { src }, new State(), (e, _) => Task.FromResult(SendOutcome.RateLimited), q, NullLogger.Instance);
        Assert.Equal(4, (await d.RunAsync(true, default)).Queued);
    }

    [Fact] public async Task A_full_offline_queue_stops_collecting_without_moving_the_position_so_nothing_is_lost()
    {
        var src = Src(10); var st = new State(); var q = new Sink { Rows = 5000 };
        var d = new DlpCollector(On(), new[] { src }, st, (e, _) => Task.FromResult(SendOutcome.Failed), q, NullLogger.Instance);
        var r = await d.RunAsync(false, default);
        Assert.Equal(0, r.Queued); Assert.Equal(10, r.Dropped); Assert.False(st.V.ContainsKey("print"), "the events stay in the source log");
        q.Rows = 0; var r2 = await d.RunAsync(false, default); Assert.Equal(10, r2.Queued);   // later, with room again, they are collected
    }

    [Fact] public async Task The_per_poll_limit_bounds_the_work_after_a_long_pause()
    {
        var src = Src(500); var d = new DlpCollector(On(c => c.MaxPerPoll = 200), new[] { src }, new State(), (e, _) => Task.FromResult(SendOutcome.Ok), new Sink(), NullLogger.Instance);
        Assert.Equal(200, (await d.RunAsync(true, default)).Read);
    }

    [Fact] public async Task An_unavailable_source_is_skipped_not_fatal_and_reported_once()
    {
        var src = Src(3); src.Problem = "log switched off"; var d = new DlpCollector(On(), new[] { src }, new State(), (e, _) => Task.FromResult(SendOutcome.Ok), new Sink(), NullLogger.Instance);
        var r = await d.RunAsync(true, default); Assert.Equal(0, r.Read); await d.RunAsync(true, default);
    }

    [Fact] public async Task Unparsable_records_are_passed_over_but_never_sent()
    {
        var src = new FakeSource(); src.Log.Add((1, new DlpEvent("skip-1", "skipped", DateTime.UtcNow, null, new Dictionary<string, object?>()))); src.Log.Add((2, Ev(2)));
        var st = new State(); var sent = new List<string>();
        var d = new DlpCollector(On(), new[] { src }, st, (e, _) => { sent.AddRange(e.Select(x => x.Uid)); return Task.FromResult(SendOutcome.Ok); }, new Sink(), NullLogger.Instance);
        await d.RunAsync(true, default); Assert.Single(sent); Assert.Equal(2, st.V["print"]);
    }

    [Fact] public void The_state_file_survives_a_restart_and_is_written_atomically()
    {
        string dir = Path.Combine(Path.GetTempPath(), "dlp-" + Guid.NewGuid().ToString("N")[..8]); Directory.CreateDirectory(dir);
        try { new FileDlpState(dir).Set("print", 777); Assert.Equal(777, new FileDlpState(dir).Get("print")); Assert.Empty(Directory.GetFiles(dir, "*.tmp")); File.WriteAllText(Path.Combine(dir, "dlp-state.json"), "garbage"); Assert.Equal(0, new FileDlpState(dir).Get("print")); }
        finally { Directory.Delete(dir, true); }
    }
}

public class UsbSourceTests
{
    private sealed class Env : IUsbEnvironment
    {
        public List<UsbVolume> Vols = new(); public List<UsbFile> Files = new();
        public IReadOnlyList<UsbVolume> Snapshot() => Vols.ToList();
        public IReadOnlyList<UsbFile> DrainFileEvents(int max) { var r = Files.Take(max).ToList(); Files.RemoveRange(0, r.Count); return r; }
    }
    private static readonly UsbVolume Stick = new("E:", "BACKUP", "FAT32", 16_000_000_000, "Kingston", "DataTraveler", "abc123abc123abc123abc123");
    private static DlpConfig Cfg(Action<DlpConfig>? t = null) { var c = new DlpConfig { Enabled = true, Usb = { Enabled = true }, Print = { DocumentName = "full" } }; t?.Invoke(c); return c; }
    private static UsbSource Make(Env e) => new(e, () => new DateTime(2026, 11, 16, 12, 0, 0, DateTimeKind.Utc), "PC01");

    [Fact] public void Sticks_that_are_already_in_are_only_a_baseline_not_events()
    {
        var e = new Env { Vols = { Stick } }; var s = Make(e);
        Assert.Empty(s.ReadNew(0, 100, Cfg()));
    }

    [Fact] public void Plug_and_unplug_become_events_with_the_volume_metadata_and_a_hashed_serial()
    {
        var e = new Env(); var s = Make(e); s.ReadNew(0, 100, Cfg());
        e.Vols.Add(Stick); var plug = s.ReadNew(0, 100, Cfg()); Assert.Single(plug);
        var ev = plug[0].Event; Assert.Equal("usb_connected", ev.Type); Assert.Equal("E:", ev.Data["drive"]); Assert.Equal("BACKUP", ev.Data["label"]); Assert.Equal("Kingston", ev.Data["vendor"]); Assert.Equal(16_000_000_000, ev.Data["size_bytes"]);
        Assert.Equal("abc123abc123abc123abc123", ev.Data["serial_hash"]);
        e.Vols.Clear(); var unplug = s.ReadNew(plug[0].Position, 100, Cfg()); Assert.Single(unplug); Assert.Equal("usb_disconnected", unplug[0].Event.Type); Assert.True(unplug[0].Position > plug[0].Position);
    }

    [Fact] public void An_unchanged_snapshot_produces_nothing_and_a_replaced_stick_on_the_same_letter_is_both_events()
    {
        var e = new Env { Vols = { Stick } }; var s = Make(e); s.ReadNew(0, 100, Cfg());
        Assert.Empty(s.ReadNew(0, 100, Cfg()));
        e.Vols[0] = Stick with { SerialHash = "ffffffffffffffffffffffff", Label = "OTHER" };
        var r = s.ReadNew(0, 100, Cfg()); Assert.Equal(new[] { "usb_connected", "usb_disconnected" }, r.Select(x => x.Event.Type).OrderBy(x => x, StringComparer.Ordinal).ToArray());
    }

    [Fact] public void File_activity_on_a_removable_drive_is_reported_by_name_extension_and_size_only()
    {
        var e = new Env { Files = { new UsbFile("E:", "Musteri Listesi.XLSX", 123456, "created", new DateTime(2026, 11, 16, 12, 0, 1, DateTimeKind.Utc)) } };
        var s = Make(e); var r = s.ReadNew(0, 100, Cfg()); Assert.Single(r);
        var ev = r[0].Event; Assert.Equal("file_copied_to_usb", ev.Type); Assert.Equal("Musteri Listesi.XLSX", ev.Data["name"]); Assert.Equal("xlsx", ev.Data["extension"]); Assert.Equal(123456L, ev.Data["size_bytes"]); Assert.Equal("created", ev.Data["action"]);
        Assert.DoesNotContain("path", ev.Data.Keys); Assert.DoesNotContain("content", ev.Data.Keys);
    }

    [Fact] public void The_file_name_follows_the_same_privacy_mode_as_the_print_document_name()
    {
        var e = new Env { Files = { new UsbFile("E:", "plan.docx", 1, "created", DateTime.UtcNow) } };
        var r = Make(e).ReadNew(0, 100, Cfg(c => c.Print.DocumentName = "extension")); Assert.Equal("*.docx", r[0].Event.Data["name"]);
    }

    [Fact] public void By_default_the_file_name_is_hashed_like_the_print_document_name()
    {
        var e = new Env { Files = { new UsbFile("E:", "Gizli Plan.docx", 1, "created", DateTime.UtcNow) } };
        var r = Make(e).ReadNew(0, 100, new DlpConfig { Enabled = true, Usb = { Enabled = true } });
        Assert.Matches("^sha256:[0-9a-f]{16}\\.docx$", (string)r[0].Event.Data["name"]!); Assert.DoesNotContain("Gizli", (string)r[0].Event.Data["name"]!);
    }

    [Fact] public void File_events_can_be_switched_off_while_plug_events_stay_on()
    {
        var e = new Env { Files = { new UsbFile("E:", "a.txt", 1, "created", DateTime.UtcNow) } }; var s = Make(e);
        Assert.Empty(s.ReadNew(0, 100, Cfg(c => c.Usb.FileEvents = false))); Assert.Single(e.Files);   // not even drained
    }

    [Fact] public void Positions_only_grow_so_a_restart_cannot_replay_old_events_and_after_position_filters()
    {
        var e = new Env(); var s = Make(e); s.ReadNew(0, 100, Cfg());
        e.Files.Add(new UsbFile("E:", "a.txt", 1, "created", DateTime.UtcNow)); e.Files.Add(new UsbFile("E:", "b.txt", 2, "created", DateTime.UtcNow));
        var r = s.ReadNew(0, 100, Cfg()); Assert.Equal(2, r.Count); Assert.True(r[1].Position > r[0].Position);
        e.Files.Add(new UsbFile("E:", "c.txt", 3, "created", DateTime.UtcNow));
        var r2 = s.ReadNew(r[1].Position, 100, Cfg()); Assert.Single(r2); Assert.Equal("c.txt", r2[0].Event.Data["name"]);
    }

    [Fact] public void The_per_poll_limit_applies()
    {
        var e = new Env(); for (int i = 0; i < 50; i++) e.Files.Add(new UsbFile("E:", $"f{i}.txt", i, "created", DateTime.UtcNow));
        Assert.Equal(10, Make(e).ReadNew(0, 10, Cfg()).Count);
    }
}

public class DlpPolicyTests
{
    private static DlpPolicyDto Dto(bool on, bool print, string? name, bool usb, bool files = true) => new() { Enabled = on, Print = new() { Enabled = print, DocumentName = name }, Usb = new() { Enabled = usb, FileEvents = files } };

    [Fact] public void A_policy_switches_the_sources_and_reports_that_something_changed()
    {
        var c = new DlpConfig(); Assert.True(DlpPolicy.Apply(c, Dto(true, true, "hash", false)));
        Assert.True(c.Enabled); Assert.True(c.Print.Enabled); Assert.Equal("hash", c.Print.DocumentName); Assert.False(c.Usb.Enabled);
        Assert.False(DlpPolicy.Apply(c, Dto(true, true, "hash", false)));   // same policy again: no change, nothing to log or store
    }

    [Fact] public void The_master_switch_off_forces_every_source_off()
    {
        var c = new DlpConfig(); DlpPolicy.Apply(c, Dto(true, true, "full", true)); Assert.True(c.Usb.Enabled);
        DlpPolicy.Apply(c, Dto(false, true, "full", true)); Assert.False(c.Enabled); Assert.False(c.Print.Enabled); Assert.False(c.Usb.Enabled);
    }

    [Fact] public void Unknown_values_are_ignored_and_a_missing_policy_changes_nothing()
    {
        var c = new DlpConfig(); Assert.False(DlpPolicy.Apply(c, null));
        DlpPolicy.Apply(c, Dto(true, true, "everything-please", false)); Assert.Equal("hash", c.Print.DocumentName);
        var off = new DlpConfig(); Assert.False(DlpPolicy.Apply(off, new DlpPolicyDto { Enabled = false })); Assert.False(off.Enabled);   // an all-off policy on an all-off config: nothing changed
    }

    [Fact] public void The_policy_survives_a_restart_atomically_and_garbage_is_ignored()
    {
        string dir = Path.Combine(Path.GetTempPath(), "dlpp-" + Guid.NewGuid().ToString("N")[..8]); Directory.CreateDirectory(dir);
        try
        {
            Assert.Null(DlpPolicy.Load(dir)); DlpPolicy.Save(dir, Dto(true, true, "extension", true, false));
            var back = DlpPolicy.Load(dir)!; var c = new DlpConfig(); DlpPolicy.Apply(c, back);
            Assert.True(c.Print.Enabled); Assert.Equal("extension", c.Print.DocumentName); Assert.True(c.Usb.Enabled); Assert.False(c.Usb.FileEvents); Assert.Empty(Directory.GetFiles(dir, "*.tmp"));
            File.WriteAllText(Path.Combine(dir, DlpPolicy.FileName), "{ not json"); Assert.Null(DlpPolicy.Load(dir));
        }
        finally { Directory.Delete(dir, true); }
    }

    [Fact] public void The_server_answer_with_a_dlp_block_is_parsed_and_one_without_it_is_not()
    {
        var with = JsonSerializer.Deserialize<ApiClient.CheckinResponse>("""{"sync_interval":900,"dlp":{"enabled":true,"print":{"enabled":true,"document_name":"hash"},"usb":{"enabled":false,"file_events":true}}}""")!;
        Assert.True(with.Dlp!.Enabled); Assert.Equal("hash", with.Dlp.Print!.DocumentName);
        Assert.Null(JsonSerializer.Deserialize<ApiClient.CheckinResponse>("""{"sync_interval":900}""")!.Dlp);
    }
}
