using LiderCollector.Dlp;
using Xunit;

namespace LiderCollector.Tests;

public class DlpFileActivityTests
{
    private sealed class FakeEnv : IFileEnvironment
    {
        public List<RawFileEvent> Raw = new(); public Dictionary<string, Dictionary<string, FileStamp>> Disk = new(StringComparer.OrdinalIgnoreCase);
        public Dictionary<string, FileStamp> Stats = new(StringComparer.OrdinalIgnoreCase); public Dictionary<string, string> Owners = new(StringComparer.OrdinalIgnoreCase);
        public string? Session = "uci\\ahmet"; public string Kind = "local"; public List<string> Watched = new();
        public void Watch(IReadOnlyCollection<string> roots) { Watched = roots.ToList(); }
        public IReadOnlyList<RawFileEvent> Drain(int max) { var r = Raw.Take(max).ToList(); Raw.RemoveRange(0, r.Count); return r; }
        public IReadOnlyDictionary<string, FileStamp> Scan(string root, int max) => Disk.TryGetValue(root, out var d) ? d : new();
        public FileStamp? Stat(string path) => Stats.TryGetValue(path, out var s) ? s : null;
        public string? Owner(string path) => Owners.TryGetValue(path, out var o) ? o : null;
        public string? SessionUser() => Session;
        public string RootKind(string path) => Kind;
    }

    private const string Root = @"C:\PilotTest";
    private static DlpConfig Cfg(Action<DlpConfig.FilesConfig>? t = null) { var c = new DlpConfig { Enabled = true }; c.Files.Enabled = true; c.Files.Paths.Add(Root); t?.Invoke(c.Files); return c; }
    private static readonly DateTime T0 = new(2026, 11, 18, 9, 0, 0, DateTimeKind.Utc);
    private static (FileActivitySource Src, FakeEnv Env, FileIndex Idx) Make(DateTime? now = null) { var e = new FakeEnv(); var i = new FileIndex(); return (new FileActivitySource(e, i, () => now ?? T0.AddMinutes(5), "PC01"), e, i); }
    private static RawFileEvent Ev(RawFileKind k, string path, string? old = null, int sec = 0) => new(k, path, old, T0.AddSeconds(sec), Root);

    [Fact]
    public void Create_modify_rename_move_and_delete_each_become_their_own_event_with_user_size_and_paths()
    {
        var (s, e, _) = Make(); var f = Root + @"\Plan.docx";
        e.Stats[f] = new FileStamp(2048, T0); e.Owners[f] = "UCI\\ahmet";
        e.Raw.Add(Ev(RawFileKind.Created, f)); e.Raw.Add(Ev(RawFileKind.Changed, f, sec: 10));
        e.Stats[Root + @"\Plan-v2.docx"] = new FileStamp(2048, T0); e.Owners[Root + @"\Plan-v2.docx"] = "UCI\\ahmet";
        e.Raw.Add(Ev(RawFileKind.Renamed, Root + @"\Plan-v2.docx", f, 20));
        e.Stats[Root + @"\Archive\Plan-v2.docx"] = new FileStamp(2048, T0); e.Owners[Root + @"\Archive\Plan-v2.docx"] = "UCI\\ahmet";
        e.Raw.Add(Ev(RawFileKind.Renamed, Root + @"\Archive\Plan-v2.docx", Root + @"\Plan-v2.docx", 30));
        e.Raw.Add(Ev(RawFileKind.Deleted, Root + @"\Archive\Plan-v2.docx", sec: 40));
        var r = s.ReadNew(0, 50, Cfg());
        Assert.Equal(new[] { "file_created", "file_modified", "file_renamed", "file_moved", "file_deleted" }, r.Select(x => x.Event.Type).ToArray());
        var created = r[0].Event.Data; Assert.Equal("Plan.docx", created["name"]); Assert.Equal("docx", created["extension"]); Assert.Equal(f, created["path"]);
        Assert.Equal(2048L, created["size_bytes"]); Assert.Equal("UCI\\ahmet", created["user"]); Assert.Equal("file_owner", created["user_source"]); Assert.Equal("fsw", created["source"]);
        var moved = r[3].Event.Data; Assert.Equal(Root + @"\Plan-v2.docx", moved["old_path"]); Assert.Equal(Root + @"\Archive\Plan-v2.docx", moved["path"]);
        var deleted = r[4].Event.Data; Assert.Equal(2048L, deleted["size_bytes"]);   // last known size, no content
        Assert.Equal("uci\\ahmet", deleted["user"]); Assert.Equal("session", deleted["user_source"]);   // the owner of a deleted file cannot be read
        Assert.All(r, x => Assert.False(x.Event.Data.ContainsKey("process")));   // the process is never invented
        Assert.All(r, x => Assert.Equal("PC01", x.Event.Host));
    }

    [Fact]
    public void A_burst_of_writes_is_one_modified_event_and_a_later_save_is_another()
    {
        var (s, e, _) = Make(); var f = Root + @"\a.xlsx"; e.Stats[f] = new FileStamp(10, T0);
        foreach (int sec in new[] { 0, 1, 2, 3 }) e.Raw.Add(Ev(RawFileKind.Changed, f, sec: sec));
        e.Raw.Add(Ev(RawFileKind.Changed, f, sec: 60));
        Assert.Equal(2, s.ReadNew(0, 50, Cfg()).Count(x => x.Event.Type == "file_modified"));
    }

    [Fact]
    public void A_file_that_lives_for_a_moment_is_still_reported_because_every_raw_event_is_queued()
    {
        var (s, e, _) = Make(); var f = Root + @"\tmp-secret.txt";
        e.Raw.Add(Ev(RawFileKind.Created, f)); e.Raw.Add(Ev(RawFileKind.Deleted, f, sec: 1));   // gone before the next poll: Stat finds nothing
        var r = s.ReadNew(0, 50, Cfg());
        Assert.Equal(new[] { "file_created", "file_deleted" }, r.Select(x => x.Event.Type).ToArray());
        Assert.Null(r[0].Event.Data["size_bytes"]);
    }

    [Fact]
    public void Lost_events_trigger_a_rescan_that_finds_what_the_watcher_missed_and_says_that_a_gap_existed()
    {
        var (s, e, idx) = Make();
        e.Disk[Root] = new() { [Root + @"\kept.txt"] = new FileStamp(5, T0), [Root + @"\changed.txt"] = new FileStamp(7, T0), [Root + @"\gone.txt"] = new FileStamp(9, T0) };
        s.ReadNew(0, 50, Cfg());   // starting index
        Assert.Equal(3, idx.Count);
        e.Disk[Root] = new() { [Root + @"\kept.txt"] = new FileStamp(5, T0), [Root + @"\changed.txt"] = new FileStamp(8, T0.AddMinutes(1)), [Root + @"\new.txt"] = new FileStamp(3, T0) };
        e.Raw.Add(new RawFileEvent(RawFileKind.Overflow, Root, null, T0.AddMinutes(2), Root));
        var r = s.ReadNew(0, 50, Cfg());
        var by = r.ToDictionary(x => x.Event.Type + ":" + System.IO.Path.GetFileName(x.Event.Data.TryGetValue("path", out var p) ? (string?)p ?? "" : ""), x => x.Event);
        Assert.Contains("file_created:new.txt", by.Keys); Assert.Contains("file_modified:changed.txt", by.Keys); Assert.Contains("file_deleted:gone.txt", by.Keys);
        Assert.DoesNotContain("file_created:kept.txt", by.Keys);
        Assert.All(r.Where(x => x.Event.Type != "file_activity_gap"), x => Assert.Equal("rescan", x.Event.Data["source"]));
        var gap = r.Single(x => x.Event.Type == "file_activity_gap").Event.Data; Assert.Equal(1L, gap["created"]); Assert.Equal(1L, gap["modified"]); Assert.Equal(1L, gap["deleted"]);
    }

    [Fact]
    public void Excluded_names_are_ignored_and_folders_without_an_extension_are_not_reported_as_deleted_files()
    {
        var (s, e, _) = Make();
        e.Raw.Add(Ev(RawFileKind.Created, Root + @"\~$Plan.docx")); e.Raw.Add(Ev(RawFileKind.Created, Root + @"\x.tmp")); e.Raw.Add(Ev(RawFileKind.Deleted, Root + @"\SomeFolder", sec: 1));
        Assert.Empty(s.ReadNew(0, 50, Cfg()));
    }

    [Theory]
    [InlineData("full", @"C:\PilotTest\Maas Listesi.xlsx", "Maas Listesi.xlsx")]
    [InlineData("folder", @"C:\PilotTest", null)]
    [InlineData("hash", null, null)]
    public void The_path_mode_decides_how_much_of_the_path_leaves_the_computer(string mode, string? path, string? name)
    {
        var (s, e, _) = Make(); var f = Root + @"\Maas Listesi.xlsx"; e.Stats[f] = new FileStamp(1, T0); e.Raw.Add(Ev(RawFileKind.Created, f));
        var d = s.ReadNew(0, 5, Cfg(c => c.PathMode = mode))[0].Event.Data;
        if (path is null) Assert.StartsWith("sha256:", (string)d["path"]!); else Assert.Equal(path, d["path"]);
        if (name is null) { Assert.StartsWith("sha256:", (string)d["name"]!); Assert.DoesNotContain("Maas", (string)d["name"]!); } else Assert.Equal(name, d["name"]);
    }

    [Fact]
    public void The_uid_is_stable_for_the_same_event_so_a_resend_never_duplicates()
    {
        var a = Make(); var b = Make(); var f = Root + @"\a.txt";
        a.Env.Raw.Add(Ev(RawFileKind.Created, f)); b.Env.Raw.Add(Ev(RawFileKind.Created, f));
        Assert.Equal(a.Src.ReadNew(0, 5, Cfg())[0].Event.Uid, b.Src.ReadNew(0, 5, Cfg())[0].Event.Uid);
        Assert.Matches("^file-[0-9a-f]{40}$", a.Src.ReadNew(0, 5, Cfg()).FirstOrDefault().Event?.Uid ?? "file-" + new string('0', 40));
    }

    [Fact]
    public void Positions_only_grow_so_a_restart_never_makes_new_events_look_old()
    {
        var (s, e, _) = Make(); e.Raw.Add(Ev(RawFileKind.Created, Root + @"\a.txt")); e.Raw.Add(Ev(RawFileKind.Created, Root + @"\b.txt", sec: 1));
        var r = s.ReadNew(0, 10, Cfg()); Assert.True(r[0].Position < r[1].Position);
        e.Raw.Add(Ev(RawFileKind.Created, Root + @"\c.txt", sec: 2)); Assert.Single(s.ReadNew(r[1].Position, 10, Cfg()));
    }

    [Fact]
    public void The_source_needs_a_folder_and_ignores_invalid_ones_and_caps_their_number()
    {
        var (s, _, _) = Make(); var off = new DlpConfig { Enabled = true }; off.Files.Enabled = true;
        Assert.False(s.Prepare(off, out var why)); Assert.Contains("no folder", why);
        var c = Cfg(f => { f.Paths.AddRange(new[] { "relative\\dir", "C:\\", "", "  ", "\\\\srv\\share\\docs\\", @"C:\PilotTest\" }); for (int i = 0; i < 40; i++) f.Paths.Add($@"D:\p{i}"); });
        var roots = c.Files.EffectiveRoots(); Assert.Equal(DlpConfig.FilesConfig.MaxRoots, roots.Count);
        Assert.DoesNotContain("relative\\dir", roots); Assert.DoesNotContain("C:", roots); Assert.Contains(@"\\srv\share\docs", roots); Assert.Single(roots, r => r.Equals(Root, StringComparison.OrdinalIgnoreCase));
        Assert.True(s.Prepare(Cfg(), out _));
    }

    [Fact]
    public void The_events_are_bounded_per_poll_and_the_index_is_bounded()
    {
        var (s, e, _) = Make(); for (int i = 0; i < 50; i++) e.Raw.Add(Ev(RawFileKind.Created, Root + $@"\f{i}.txt", sec: i));
        Assert.Equal(10, s.ReadNew(0, 10, Cfg()).Count);
        var idx = new FileIndex(100); for (int i = 0; i < 500; i++) idx.Set($@"C:\x\{i}.bin", new FileStamp(1, T0), T0); Assert.Equal(100, idx.Count);
    }

    [Fact]
    public void FindCopy_needs_the_same_name_and_size_never_matches_empty_files_and_respects_the_window()
    {
        var idx = new FileIndex(); idx.Set(@"C:\PilotTest\Plan.docx", new FileStamp(2048, T0), T0); idx.Set(@"C:\PilotTest\empty.txt", new FileStamp(0, T0), T0);
        Assert.Equal(@"C:\PilotTest\Plan.docx", idx.FindCopy("plan.DOCX", 2048, @"E:\", T0.AddMinutes(-10)));
        Assert.Null(idx.FindCopy("Plan.docx", 2049, @"E:\", T0.AddMinutes(-10))); Assert.Null(idx.FindCopy("empty.txt", 0, @"E:\", T0.AddMinutes(-10)));
        Assert.Null(idx.FindCopy("Plan.docx", 2048, @"E:\", T0.AddMinutes(1)));          // seen too long ago
        Assert.Null(idx.FindCopy("Plan.docx", 2048, @"C:\PilotTest", T0.AddMinutes(-10)));   // the destination itself is never its own source
    }

    [Fact]
    public void A_move_to_another_folder_which_windows_reports_as_delete_plus_create_is_one_moved_event()
    {
        var (s, e, idx) = Make(); string old = Root + @"\Plan.docx", @new = Root + @"\Arsiv\Plan.docx";
        idx.Set(old, new FileStamp(2048, T0), T0); e.Stats[@new] = new FileStamp(2048, T0); e.Owners[@new] = "UCI\\ahmet";
        e.Raw.Add(Ev(RawFileKind.Deleted, old, sec: 1)); e.Raw.Add(Ev(RawFileKind.Created, @new, sec: 1));
        var r = s.ReadNew(0, 10, Cfg()); var one = Assert.Single(r);
        Assert.Equal("file_moved", one.Event.Type); Assert.Equal(old, one.Event.Data["old_path"]); Assert.Equal(@new, one.Event.Data["path"]);
        // different names, or too far apart in time, stay a delete and a create
        var (s2, e2, _) = Make(); e2.Raw.Add(Ev(RawFileKind.Deleted, Root + @"\a.txt")); e2.Raw.Add(Ev(RawFileKind.Created, Root + @"\X\b.txt")); e2.Raw.Add(Ev(RawFileKind.Deleted, Root + @"\c.txt")); e2.Raw.Add(Ev(RawFileKind.Created, Root + @"\X\c.txt", sec: 30));
        Assert.Equal(4, s2.ReadNew(0, 10, Cfg()).Count);
    }

    [Fact]
    public void A_change_of_a_file_that_is_already_gone_is_still_reported_with_its_last_known_size_but_a_folder_change_is_not()
    {
        var (s, e, idx) = Make(); idx.Set(Root + @"\a.xlsx", new FileStamp(77, T0), T0);
        e.Raw.Add(Ev(RawFileKind.Changed, Root + @"\a.xlsx")); e.Raw.Add(Ev(RawFileKind.Changed, Root + @"\Arsiv")); e.Raw.Add(Ev(RawFileKind.Created, Root + @"\Arsiv"));
        var r = Assert.Single(s.ReadNew(0, 10, Cfg())); Assert.Equal("file_modified", r.Event.Type); Assert.Equal(77L, r.Event.Data["size_bytes"]);
    }

    [Fact]
    public void Everything_is_off_by_default()
    {
        var c = new DlpConfig(); Assert.False(c.Files.Enabled); Assert.Empty(c.Files.Paths); Assert.False(c.AppUsage.Enabled); Assert.Equal("none", c.AppUsage.TitleMode); Assert.Equal("monitor", c.Usb.Mode);
        var (s, _, _) = Make(); Assert.False(s.IsEnabled(c));
    }
}
