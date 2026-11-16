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
        var e = PrintJobParser.Parse(Xml())!;
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
        var e = PrintJobParser.Parse(Xml(doc: "a\tb\nc" + new string('x', 1000)))!;   // (characters that XML cannot carry at all never reach the parser)
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
        Assert.Equal("full", c.Print.DocumentName); Assert.True(c.Print.AutoEnableLog);
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
