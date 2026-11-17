using LiderCollector.Dlp;
using Xunit;

namespace LiderCollector.Tests;

/// <summary>
/// The same source against the REAL Windows file system (a throw-away folder in %TEMP%): proves what a fake cannot - that the watcher delivers real create/change/rename/move/delete
/// events, that the owner can be read, and that a burst heavy enough to overflow the watcher buffer is still fully reported thanks to the rescan.
/// </summary>
[Trait("Category", "RealWindows")]
public class DlpFileActivityRealWindowsTests : IDisposable
{
    private readonly string _root = Path.Combine(Path.GetTempPath(), "lider-dlp-real-" + Guid.NewGuid().ToString("N")[..8]);
    public DlpFileActivityRealWindowsTests() { Directory.CreateDirectory(_root); }
    public void Dispose() { try { Directory.Delete(_root, true); } catch { } }

    private DlpConfig Cfg() { var c = new DlpConfig { Enabled = true }; c.Files.Enabled = true; c.Files.Paths.Add(_root); c.Files.DebounceSeconds = 1; return c; }

    private static List<DlpEvent> Collect(FileActivitySource s, DlpConfig c, TimeSpan quiet, TimeSpan max)
    {
        var all = new List<DlpEvent>(); long pos = 0; var until = DateTime.UtcNow + max; var lastNew = DateTime.UtcNow;
        while (DateTime.UtcNow < until && DateTime.UtcNow - lastNew < quiet)
        {
            var r = s.ReadNew(pos, 100000, c);
            if (r.Count > 0) { all.AddRange(r.Select(x => x.Event)); pos = r.Max(x => x.Position); lastNew = DateTime.UtcNow; }
            Thread.Sleep(100);
        }
        return all;
    }

    [Fact]
    public void Real_create_change_rename_move_and_delete_are_reported_with_the_real_owner()
    {
        using var env = new WindowsFileEnvironment(() => "TEST\\session"); var s = new FileActivitySource(env, new FileIndex(), host: "REALPC"); var c = Cfg();
        s.ReadNew(0, 10, c);   // starts the watcher
        string a = Path.Combine(_root, "Plan.docx"), b = Path.Combine(_root, "Plan-2.docx"); Directory.CreateDirectory(Path.Combine(_root, "Arsiv"));
        File.WriteAllText(a, "demo içerik (test belgesi)"); Thread.Sleep(1200); File.AppendAllText(a, " daha"); Thread.Sleep(300);
        File.Move(a, b); Thread.Sleep(300); File.Move(b, Path.Combine(_root, "Arsiv", "Plan-2.docx")); Thread.Sleep(300); File.Delete(Path.Combine(_root, "Arsiv", "Plan-2.docx"));
        var ev = Collect(s, c, TimeSpan.FromSeconds(2), TimeSpan.FromSeconds(15));
        var types = ev.Select(e => e.Type).ToList();
        var seq = string.Join(",", types); foreach (var t in new[] { "file_created", "file_modified", "file_renamed", "file_moved", "file_deleted" }) Assert.True(types.Contains(t), "missing " + t + " in: " + seq);
        var created = ev.First(e => e.Type == "file_created"); Assert.Equal("Plan.docx", created.Data["name"]); Assert.Equal("local", created.Data["root_kind"]);
        Assert.False(string.IsNullOrEmpty((string?)created.Data["user"])); Assert.Contains((string)created.Data["user_source"]!, new[] { "file_owner", "session" });   // the real owner from the file ACL; an administrator-created file is owned by the Administrators group, then the signed-in user is used
        var moved = ev.First(e => e.Type == "file_moved"); Assert.EndsWith("Plan-2.docx", (string)moved.Data["old_path"]!); Assert.Contains("Arsiv", (string)moved.Data["path"]!);
        Assert.All(ev, e => Assert.DoesNotContain("içerik", System.Text.Json.JsonSerializer.Serialize(e.ToWire())));   // never the content
        Assert.Equal(ev.Select(e => e.Uid).Distinct().Count(), ev.Count);
    }

    [Fact]
    public void A_burst_that_overflows_the_watcher_is_still_reported_completely_through_the_rescan()
    {
        using var env = new WindowsFileEnvironment(() => null); var s = new FileActivitySource(env, new FileIndex(), host: "REALPC"); var c = Cfg();
        s.ReadNew(0, 10, c);
        const int N = 6000; var cpu0 = System.Diagnostics.Process.GetCurrentProcess().TotalProcessorTime; long mem0 = GC.GetTotalMemory(true);
        Parallel.For(0, N, new ParallelOptions { MaxDegreeOfParallelism = 8 }, i => File.WriteAllBytes(Path.Combine(_root, $"burst-{i:D5}.dat"), new byte[] { 1 }));
        var ev = Collect(s, c, TimeSpan.FromSeconds(3), TimeSpan.FromSeconds(40));
        var seen = ev.Where(e => e.Type == "file_created").Select(e => Path.GetFileName((string)e.Data["path"]!)).ToHashSet();
        var cpu = System.Diagnostics.Process.GetCurrentProcess().TotalProcessorTime - cpu0; long memMb = (GC.GetTotalMemory(false) - mem0) / 1048576;
        Assert.True(cpu.TotalSeconds < 60, "cpu seconds used by writing AND monitoring 6000 files: " + cpu.TotalSeconds); Assert.True(memMb < 200, "memory growth MB: " + memMb);   // bounded: events are queued with a cap, the index has a cap
        Assert.Equal(N, seen.Count);   // every file is reported exactly once as created, whether the watcher or the rescan saw it
        Assert.Equal(seen.Count, ev.Where(e => e.Type == "file_created").Count());
    }

    [Fact]
    public void A_dropped_file_name_with_special_characters_and_a_deep_path_is_handled()
    {
        using var env = new WindowsFileEnvironment(() => null); var s = new FileActivitySource(env, new FileIndex(), host: "REALPC"); var c = Cfg(); s.ReadNew(0, 10, c);
        string deep = Path.Combine(_root, "a", "b", "c"); Directory.CreateDirectory(deep); Thread.Sleep(200);
        File.WriteAllText(Path.Combine(deep, "Çalışma Planı (ğüşiöç) #1.txt"), "x");
        var ev = Collect(s, c, TimeSpan.FromSeconds(2), TimeSpan.FromSeconds(10));
        Assert.Contains(ev, e => e.Type == "file_created" && ((string)e.Data["name"]!).Contains("Çalışma"));
    }
}
