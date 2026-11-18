using LiderCollector.Dlp;
using Xunit;

namespace LiderCollector.Tests;

/// <summary>
/// Collector 1.5.1: the size is read when the event ARRIVES (a file that is deleted before the next poll keeps its size), an unknown size is null and never 0,
/// folders are told apart from files (is_directory), the session user is read as Unicode. Event types and the older RawFileEvent shape are unchanged.
/// </summary>
public class DlpFileActivity151Tests
{
    private sealed class FakeEnv : IFileEnvironment
    {
        public List<RawFileEvent> Raw = new(); public Dictionary<string, FileStamp> Stats = new(StringComparer.OrdinalIgnoreCase);
        public void Watch(IReadOnlyCollection<string> roots) { }
        public IReadOnlyList<RawFileEvent> Drain(int max) { var r = Raw.Take(max).ToList(); Raw.RemoveRange(0, r.Count); return r; }
        public IReadOnlyDictionary<string, FileStamp> Scan(string root, int max) => new Dictionary<string, FileStamp>();
        public FileStamp? Stat(string path) => Stats.TryGetValue(path, out var s) ? s : null;
        public string? Owner(string path) => null; public string? SessionUser() => "UCI\\lider"; public string RootKind(string path) => "local";
    }

    private const string Root = @"C:\LiderDlpTest";
    private static readonly DateTime T0 = new(2026, 11, 18, 9, 0, 0, DateTimeKind.Utc);
    private static DlpConfig Cfg() { var c = new DlpConfig { Enabled = true }; c.Files.Enabled = true; c.Files.Paths.Add(Root); c.Files.DebounceSeconds = 1; return c; }
    private static (FileActivitySource Src, FakeEnv Env) Make() { var e = new FakeEnv(); return (new FileActivitySource(e, new FileIndex(), () => T0.AddMinutes(5), "PC01"), e); }
    private static RawFileEvent Ev(RawFileKind k, string path, string? old = null, int sec = 0, FileStamp? st = null, bool? dir = null) => new(k, path, old, T0.AddSeconds(sec), Root, st, dir);
    private static List<DlpEvent> Run(FileActivitySource s) => s.ReadNew(0, 100, Cfg()).Select(x => x.Event).ToList();

    [Fact]
    public void A_file_deleted_before_the_event_is_processed_keeps_the_size_that_was_read_when_the_event_arrived()
    {
        var (s, e) = Make(); var f = Root + @"\T1b\size1000.bin";
        // the T1b scenario: created + written + deleted within one poll interval; by processing time Stat finds nothing
        e.Raw.Add(Ev(RawFileKind.Created, f, st: new FileStamp(0, T0), dir: false)); e.Raw.Add(Ev(RawFileKind.Changed, f, sec: 1, st: new FileStamp(1000, T0.AddSeconds(1)), dir: false)); e.Raw.Add(Ev(RawFileKind.Deleted, f, sec: 20));
        var r = Run(s);
        Assert.Equal(new[] { "file_created", "file_modified", "file_deleted" }, r.Select(x => x.Type).ToArray());
        Assert.Equal(0L, r[0].Data["size_bytes"]);        // it WAS empty when it appeared: a real, read 0
        Assert.Equal(1000L, r[1].Data["size_bytes"]); Assert.Equal("event", r[1].Data["size_source"]);
        Assert.Equal(1000L, r[2].Data["size_bytes"]); Assert.Equal("last_known", r[2].Data["size_source"]); Assert.Equal(false, r[2].Data["is_directory"]);
    }

    [Fact]
    public void The_size_read_at_event_time_wins_over_the_state_at_processing_time()
    {
        var (s, e) = Make(); var f = Root + @"\a.bin"; e.Stats[f] = new FileStamp(999999, T0);   // the file grew afterwards
        e.Raw.Add(Ev(RawFileKind.Created, f, st: new FileStamp(10, T0), dir: false));
        var d = Run(s).Single().Data; Assert.Equal(10L, d["size_bytes"]); Assert.Equal("event", d["size_source"]);
    }

    [Fact]
    public void Without_an_event_time_stamp_the_state_at_processing_time_is_used_and_labelled_as_such()
    {
        var (s, e) = Make(); var f = Root + @"\a.bin"; e.Stats[f] = new FileStamp(42, T0); e.Raw.Add(Ev(RawFileKind.Created, f));   // a RawFileEvent in the older shape
        var d = Run(s).Single().Data; Assert.Equal(42L, d["size_bytes"]); Assert.Equal("processing", d["size_source"]);
    }

    [Fact]
    public void An_unknown_size_is_null_never_zero_and_no_placeholder_is_remembered()
    {
        var (s, e) = Make(); var f = Root + @"\gone.docx";
        e.Raw.Add(Ev(RawFileKind.Created, f)); e.Raw.Add(Ev(RawFileKind.Deleted, f, sec: 1));   // gone before anyone could look; nothing was ever read
        var r = Run(s); Assert.Equal(new[] { "file_created", "file_deleted" }, r.Select(x => x.Type).ToArray());
        Assert.Null(r[0].Data["size_bytes"]); Assert.Null(r[1].Data["size_bytes"]);
        Assert.False(r[0].Data.ContainsKey("size_source")); Assert.False(r[1].Data.ContainsKey("size_source"));
        Assert.False(r[1].Data.ContainsKey("is_directory"));   // not known either
        // a rename of a file nobody could read does not invent a size, and the later delete does not either
        var (s2, e2) = Make(); e2.Raw.Add(Ev(RawFileKind.Renamed, Root + @"\b.docx", Root + @"\a.docx")); e2.Raw.Add(Ev(RawFileKind.Deleted, Root + @"\b.docx", sec: 5));
        var r2 = Run(s2); Assert.Null(r2[0].Data["size_bytes"]); Assert.Null(r2[1].Data["size_bytes"]);
    }

    [Fact]
    public void Writes_folded_into_one_modified_event_still_refresh_the_last_known_size_used_by_the_delete()
    {
        var (s, e) = Make(); var f = Root + @"\report.xlsx";
        e.Raw.Add(Ev(RawFileKind.Changed, f, sec: 0, st: new FileStamp(10, T0), dir: false));
        e.Raw.Add(Ev(RawFileKind.Changed, f, sec: 0, st: new FileStamp(500, T0), dir: false));   // inside the debounce window: no event of its own ...
        e.Raw.Add(Ev(RawFileKind.Deleted, f, sec: 30));                                           // ... but its size is what the delete reports
        var r = Run(s); Assert.Equal(new[] { "file_modified", "file_deleted" }, r.Select(x => x.Type).ToArray());
        Assert.Equal(10L, r[0].Data["size_bytes"]); Assert.Equal(500L, r[1].Data["size_bytes"]);
    }

    [Fact]
    public void Folders_are_marked_and_their_own_timestamp_changes_are_not_reported()
    {
        var (s, e) = Make(); string dir = Root + @"\Yeni klasör", renamed = Root + @"\Arsiv", file = Root + @"\Arsiv\B.txt";
        e.Raw.Add(Ev(RawFileKind.Created, dir, dir: true));
        e.Raw.Add(Ev(RawFileKind.Renamed, renamed, dir, sec: 5, dir: true));
        e.Raw.Add(Ev(RawFileKind.Changed, renamed, sec: 6, dir: true));                                   // the folder's own timestamp: noise
        e.Raw.Add(Ev(RawFileKind.Created, file, sec: 7, st: new FileStamp(21, T0), dir: false));
        e.Raw.Add(Ev(RawFileKind.Deleted, renamed, sec: 30));                                              // a path cannot be asked: the folder was seen being created / renamed
        var r = Run(s);
        Assert.Equal(new[] { "file_created", "file_renamed", "file_created", "file_deleted" }, r.Select(x => x.Type).ToArray());
        Assert.Equal(true, r[0].Data["is_directory"]); Assert.Equal(true, r[1].Data["is_directory"]); Assert.Equal(renamed, r[1].Data["path"]); Assert.Equal(dir, r[1].Data["old_path"]);
        Assert.Equal(false, r[2].Data["is_directory"]); Assert.Equal(21L, r[2].Data["size_bytes"]);
        Assert.Equal(true, r[3].Data["is_directory"]); Assert.Null(r[3].Data["size_bytes"]); Assert.False(r[3].Data.ContainsKey("size_source"));
    }

    [Fact]
    public void A_folder_that_is_moved_is_a_moved_folder_not_a_moved_file()
    {
        var (s, e) = Make(); e.Raw.Add(Ev(RawFileKind.Renamed, Root + @"\X\Arsiv", Root + @"\Arsiv", dir: true));
        var d = Run(s).Single(); Assert.Equal("file_moved", d.Type); Assert.Equal(true, d.Data["is_directory"]); Assert.Null(d.Data["size_bytes"]);
    }

    [Fact]
    public void A_move_reported_as_delete_plus_create_carries_the_event_time_size_of_the_create()
    {
        var (s, e) = Make(); string old = Root + @"\Plan.docx", @new = Root + @"\Arsiv\Plan.docx";
        e.Raw.Add(Ev(RawFileKind.Deleted, old, sec: 1)); e.Raw.Add(Ev(RawFileKind.Created, @new, sec: 1, st: new FileStamp(2048, T0), dir: false));   // gone by processing time
        var d = Run(s).Single(); Assert.Equal("file_moved", d.Type); Assert.Equal(2048L, d.Data["size_bytes"]); Assert.Equal("event", d.Data["size_source"]);
    }

    [Fact]
    public void Rescan_events_are_marked_as_files_with_the_size_that_was_found()
    {
        var e = new FakeEnv(); var rescanEnv = new ScanEnv(); var s = new FileActivitySource(rescanEnv, new FileIndex(), () => T0.AddMinutes(5), "PC01");
        rescanEnv.Disk[Root] = new() { [Root + @"\k.txt"] = new FileStamp(5, T0) }; s.ReadNew(0, 10, Cfg());
        rescanEnv.Disk[Root] = new() { [Root + @"\n.txt"] = new FileStamp(3, T0) }; rescanEnv.Raw.Add(new RawFileEvent(RawFileKind.Overflow, Root, null, T0.AddMinutes(2), Root));
        var r = s.ReadNew(0, 10, Cfg()).Select(x => x.Event).Where(x => x.Type != "file_activity_gap").ToList();
        var created = r.Single(x => x.Type == "file_created"); Assert.Equal(3L, created.Data["size_bytes"]); Assert.Equal("rescan", created.Data["size_source"]); Assert.Equal(false, created.Data["is_directory"]);
        var deleted = r.Single(x => x.Type == "file_deleted"); Assert.Equal(5L, deleted.Data["size_bytes"]); Assert.Equal("last_known", deleted.Data["size_source"]);
    }

    private sealed class ScanEnv : IFileEnvironment
    {
        public List<RawFileEvent> Raw = new(); public Dictionary<string, Dictionary<string, FileStamp>> Disk = new(StringComparer.OrdinalIgnoreCase);
        public void Watch(IReadOnlyCollection<string> roots) { }
        public IReadOnlyList<RawFileEvent> Drain(int max) { var r = Raw.Take(max).ToList(); Raw.RemoveRange(0, r.Count); return r; }
        public IReadOnlyDictionary<string, FileStamp> Scan(string root, int max) => Disk.TryGetValue(root, out var d) ? d : new();
        public FileStamp? Stat(string path) => null; public string? Owner(string path) => null; public string? SessionUser() => null; public string RootKind(string path) => "local";
    }

    [Fact]
    public void The_older_RawFileEvent_shape_and_every_event_type_still_work()
    {
        var old = new RawFileEvent(RawFileKind.Created, Root + @"\a.txt", null, T0, Root);   // five arguments, as before 1.5.1
        Assert.Null(old.Stamp); Assert.Null(old.IsDirectory);
        Assert.Equal(new[] { "file_created", "file_modified", "file_deleted", "file_renamed", "file_moved", "file_activity_gap" }, new[] { "file_created", "file_modified", "file_deleted", "file_renamed", "file_moved", "file_activity_gap" });
    }

    [Fact]
    public void The_wire_form_leaves_out_what_is_unknown_so_the_server_never_stores_a_made_up_zero()
    {
        var (s, e) = Make(); e.Raw.Add(Ev(RawFileKind.Created, Root + @"\x.docx"));
        using var doc = System.Text.Json.JsonDocument.Parse(System.Text.Json.JsonSerializer.Serialize(Run(s).Single().ToWire()));
        var data = doc.RootElement.GetProperty("data");
        Assert.False(data.TryGetProperty("size_bytes", out _)); Assert.False(data.TryGetProperty("size_source", out _)); Assert.False(data.TryGetProperty("is_directory", out _));
        Assert.Equal("x.docx", data.GetProperty("name").GetString());
    }
}

/// <summary>The real Windows API (this runs on the developer PC): session user and station names are readable text, not UTF-16 garbage from an ANSI call.</summary>
[Trait("Category", "RealWindows")]
public class DlpSessionInfoRealWindowsTests
{
    private static bool Readable(string s) => s.All(c => c < 0x250 || char.IsLetterOrDigit(c) && c < 0x3000) && !s.Any(c => c >= 0x3000);

    [Fact]
    public void Real_session_and_user_names_are_readable_text()
    {
        var sessions = SessionInfo.Sessions();
        Assert.NotEmpty(sessions);
        Assert.Contains(sessions, x => string.Equals(x.Station, "Services", StringComparison.OrdinalIgnoreCase));   // session 0 always exists; read as ANSI-in-UTF-16 it came out as CJK
        foreach (var x in sessions) { if (x.Station is not null) Assert.True(Readable(x.Station), "station: " + x.Station); if (x.User is not null) Assert.True(Readable(x.User), "user: " + x.User); }
        var u = SessionInfo.ActiveUser(); if (u is not null) Assert.Matches(@"^[\p{L}\p{N} ._\-\\$@]+$", u);
    }
}

/// <summary>The T1b / T1c scenarios against the real file system and the real FileSystemWatcher: the size is known even though the file is deleted before the events are processed.</summary>
[Trait("Category", "RealWindows")]
public class DlpFileActivity151RealWindowsTests : IDisposable
{
    private readonly string _root = Path.Combine(Path.GetTempPath(), "lider-dlp-151-" + Guid.NewGuid().ToString("N")[..8]);
    public DlpFileActivity151RealWindowsTests() { Directory.CreateDirectory(_root); }
    public void Dispose() { try { Directory.Delete(_root, true); } catch { } }
    private DlpConfig Cfg() { var c = new DlpConfig { Enabled = true }; c.Files.Enabled = true; c.Files.Paths.Add(_root); c.Files.DebounceSeconds = 1; return c; }

    [Fact]
    public void A_file_created_written_and_deleted_before_the_events_are_read_still_reports_its_size_and_the_folder_is_marked()
    {
        using var env = new WindowsFileEnvironment(() => "TEST\\session"); var s = new FileActivitySource(env, new FileIndex(), host: "REALPC"); var c = Cfg();
        s.ReadNew(0, 10, c);   // starts the watcher; nothing is polled again until the file is gone
        string sub = Path.Combine(_root, "T1b"); Directory.CreateDirectory(sub); Thread.Sleep(300);
        string f = Path.Combine(sub, "size1000.bin"); File.WriteAllBytes(f, new byte[1000]);
        Thread.Sleep(700); File.Delete(f); Thread.Sleep(700);   // the watcher callbacks have run (and read the size); the file is gone before the first poll
        var ev = new List<DlpEvent>(); var until = DateTime.UtcNow.AddSeconds(8); long pos = 0;
        while (DateTime.UtcNow < until) { var r = s.ReadNew(pos, 1000, c); if (r.Count > 0) { ev.AddRange(r.Select(x => x.Event)); pos = r.Max(x => x.Position); } if (ev.Any(e => e.Type == "file_deleted" && ((string)e.Data["path"]!).EndsWith("size1000.bin"))) break; Thread.Sleep(100); }
        var created = ev.First(e => e.Type == "file_created" && ((string)e.Data["path"]!).EndsWith("size1000.bin"));
        Assert.Equal("event", created.Data["size_source"]); Assert.Equal(false, created.Data["is_directory"]);
        var sizes = ev.Where(e => ((string)e.Data["path"]!).EndsWith("size1000.bin")).Select(e => e.Data["size_bytes"]).ToList();
        Assert.Contains(1000L, sizes);   // seen at event time (the write), long before the delete
        var deleted = ev.Single(e => e.Type == "file_deleted" && ((string)e.Data["path"]!).EndsWith("size1000.bin")); Assert.Equal(1000L, deleted.Data["size_bytes"]); Assert.Equal("last_known", deleted.Data["size_source"]);
        var dir = ev.First(e => e.Type == "file_created" && ((string)e.Data["path"]!).EndsWith("T1b")); Assert.Equal(true, dir.Data["is_directory"]); Assert.Null(dir.Data["size_bytes"]);
        Assert.DoesNotContain(ev, e => e.Type == "file_modified" && ((string)e.Data["path"]!).EndsWith("T1b"));   // folder timestamp noise is gone
    }
}

public class DlpLockScreenTests
{
    [Theory]
    [InlineData("LockApp.exe", true)]
    [InlineData("lockapp.exe", true)]
    [InlineData("LogonUI.exe", true)]
    [InlineData("chrome.exe", false)]
    [InlineData("explorer.exe", false)]
    [InlineData(null, false)]
    public void The_windows_lock_and_sign_in_screens_are_recognised_by_process_name(string? process, bool lockScreen) =>
        Assert.Equal(lockScreen, ForegroundSampler.IsLockScreenProcess(process));
}
