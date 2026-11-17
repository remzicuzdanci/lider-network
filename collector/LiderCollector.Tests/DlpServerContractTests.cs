using System.Text.RegularExpressions;
using LiderCollector.Dlp;
using Xunit;

namespace LiderCollector.Tests;

/// <summary>
/// Contract between what the Collector SENDS and what the server ACCEPTS: every field of every DLP event type the Collector can produce must be in the server's whitelist
/// (read from the server source in this repository); otherwise the server would silently drop it. Skipped when the server source is not next to the Collector.
/// </summary>
public class DlpServerContractTests
{
    private static string? ServerSource()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null) { var p = Path.Combine(dir.FullName, "envanter", "app", "Services", "Dlp", "DlpEventIngestService.php"); if (File.Exists(p)) return File.ReadAllText(p); dir = dir.Parent; }
        return null;
    }

    private static Dictionary<string, HashSet<string>> Whitelist(string php)
    {
        var res = new Dictionary<string, HashSet<string>>();
        var fileFields = Regex.Match(php, @"FILE_FIELDS = \[(.*?)\];", RegexOptions.Singleline).Groups[1].Value;
        var keys = (string s) => Regex.Matches(s, @"'([a-z_]+)'\s*=>").Select(m => m.Groups[1].Value).ToHashSet();
        var types = Regex.Match(php, @"public const TYPES = \[(.*?)\n    \];", RegexOptions.Singleline).Groups[1].Value;
        foreach (Match m in Regex.Matches(types, @"'([a-z_]+)' => \[(.*?)\](?=,\s*\n|,\s*'file_|,\s*$)", RegexOptions.Singleline)) res[m.Groups[1].Value] = keys(m.Groups[2].Value);
        foreach (var ft in new[] { "file_created", "file_modified", "file_deleted", "file_renamed", "file_moved" }) res[ft] = keys(fileFields);
        return res;
    }

    private static readonly DateTime T0 = new(2026, 11, 18, 9, 0, 0, DateTimeKind.Utc);

    private sealed class FEnv : IFileEnvironment
    {
        public List<RawFileEvent> Raw = new(); public Dictionary<string, FileStamp> Stats = new();
        public void Watch(IReadOnlyCollection<string> r) { }
        public IReadOnlyList<RawFileEvent> Drain(int m) { var x = Raw.ToList(); Raw.Clear(); return x; }
        public IReadOnlyDictionary<string, FileStamp> Scan(string r, int m) => new Dictionary<string, FileStamp>();
        public FileStamp? Stat(string p) => Stats.TryGetValue(p, out var s) ? s : null;
        public string? Owner(string p) => "UCI\ahmet"; public string? SessionUser() => "UCI\ahmet"; public string RootKind(string p) => "local";
    }
    private sealed class UEnv : IUsbEnvironment
    {
        public List<UsbVolume> V = new(); public List<UsbFile> F = new();
        public IReadOnlyList<UsbVolume> Snapshot() => V.ToList(); public IReadOnlyList<UsbFile> DrainFileEvents(int m) { var x = F.ToList(); F.Clear(); return x; }
    }

    [Fact]
    public void Every_field_of_every_event_the_collector_can_produce_is_accepted_by_the_server_whitelist()
    {
        var php = ServerSource(); if (php is null) { Assert.False(Environment.GetEnvironmentVariable("LIDER_REQUIRE_SERVER_CONTRACT") == "1", "server source not found but required"); return; }   // outside the monorepo there is nothing to compare
        var wl = Whitelist(php); Assert.True(wl.Count >= 12, "parsed types: " + string.Join(",", wl.Keys));
        var all = new List<DlpEvent>();
        var cfg = new DlpConfig { Enabled = true }; cfg.Files.Enabled = true; cfg.Files.Paths.Add(@"C:\PilotTest"); cfg.Files.DebounceSeconds = 1; cfg.Usb.Enabled = true; cfg.AppUsage.Enabled = true; cfg.AppUsage.TitleMode = "full";

        var fe = new FEnv(); var idx = new FileIndex(); var fs = new FileActivitySource(fe, idx, () => T0.AddMinutes(5), "PC01"); string a = @"C:\PilotTest\a.docx", b = @"C:\PilotTest\Arsiv\a.docx";
        fe.Stats[a] = new FileStamp(10, T0); fe.Stats[b] = new FileStamp(10, T0);
        fe.Raw.AddRange(new[] { new RawFileEvent(RawFileKind.Created, a, null, T0, @"C:\PilotTest"), new RawFileEvent(RawFileKind.Changed, a, null, T0.AddSeconds(30), @"C:\PilotTest"), new RawFileEvent(RawFileKind.Renamed, @"C:\PilotTest\a2.docx", a, T0.AddSeconds(40), @"C:\PilotTest"),
            new RawFileEvent(RawFileKind.Renamed, b, a, T0.AddSeconds(50), @"C:\PilotTest"), new RawFileEvent(RawFileKind.Deleted, b, null, T0.AddSeconds(60), @"C:\PilotTest"), new RawFileEvent(RawFileKind.Overflow, @"C:\PilotTest", null, T0.AddSeconds(70), @"C:\PilotTest") });
        all.AddRange(fs.ReadNew(0, 100, cfg).Select(x => x.Event));

        var ue = new UEnv(); var us = new UsbSource(ue, () => T0, "PC01", idx, () => "UCI\ahmet"); cfg.Usb.FileEvents = true; us.ReadNew(0, 10, cfg);
        ue.V.Add(new UsbVolume("E:", "USB", "NTFS", 1000, "SanDisk", "Ultra", "abc", "0781", "5581", "usb_removable")); all.AddRange(us.ReadNew(0, 10, cfg).Select(x => x.Event));
        idx.Set(@"C:\PilotTest\Plan.docx", new FileStamp(2048, T0), T0);
        ue.F.Add(new UsbFile("E:", "Plan.docx", 2048, "created", T0, @"E:\Plan.docx")); ue.F.Add(new UsbFile("E:", "z.txt", 5, "created", T0, @"E:\z.txt")); all.AddRange(us.ReadNew(0, 10, cfg).Select(x => x.Event));
        ue.V.Clear(); all.AddRange(us.ReadNew(0, 10, cfg).Select(x => x.Event));

        var buf = new AppSampleBuffer(); var apps = new AppUsageSource(buf, () => T0.AddHours(1), "PC01");
        foreach (var s in new[] { new AppSample(T0, 2, "UCI\ahmet", "msedge.exe", "T", 0, false), new AppSample(T0.AddSeconds(10), 2, "UCI\ahmet", "msedge.exe", "T", 0, false), new AppSample(T0.AddSeconds(20), 2, "UCI\ahmet", "x.exe", null, 0, false) }) buf.Add(s);
        all.AddRange(apps.ReadNew(0, 10, cfg).Select(x => x.Event));
        all.Add(PrintJobParser.Parse(PrintJobParserTests.Xml(), "full")!);

        var types = all.Select(e => e.Type).Distinct().OrderBy(x => x).ToList();
        foreach (var t in new[] { "file_created", "file_modified", "file_renamed", "file_moved", "file_deleted", "file_activity_gap", "usb_connected", "usb_disconnected", "usb_file_event", "file_copied_to_usb", "app_usage", "print_job" })
            Assert.Contains(t, types);
        foreach (var e in all)
        {
            Assert.True(wl.ContainsKey(e.Type), "the server does not know the type " + e.Type);
            using var doc = System.Text.Json.JsonDocument.Parse(System.Text.Json.JsonSerializer.Serialize(e.ToWire()));
            foreach (var p in doc.RootElement.GetProperty("data").EnumerateObject())
                Assert.True(wl[e.Type].Contains(p.Name), $"field '{p.Name}' of {e.Type} is not in the server whitelist (it would be dropped silently)");
        }
    }
}
