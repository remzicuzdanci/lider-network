using System.Runtime.CompilerServices;
using System.Text.Json;
using LiderCollector.Dlp;
using Xunit;

namespace LiderCollector.Tests;

/// <summary>
/// The wire contract between the Collector and the server: what the Collector really serialises (print job, USB plug, USB file) is compared with a checked-in sample
/// (Fixtures/dlp-wire-sample.json). The SAME file is copied to the server repository (tests/Fixtures) and posted to the real ingest endpoint by its test, so a change on either side
/// that breaks the other fails a test. To refresh after an intended change: set UPDATE_DLP_FIXTURE=1, run this test once, copy the file to the server repository.
/// </summary>
public class DlpWireContractTests
{
    private sealed class Env : IUsbEnvironment
    {
        public List<UsbVolume> Vols = new(); public List<UsbFile> Files = new();
        public IReadOnlyList<UsbVolume> Snapshot() => Vols.ToList();
        public IReadOnlyList<UsbFile> DrainFileEvents(int max) { var r = Files.Take(max).ToList(); Files.Clear(); return r; }
    }

    private static string Sample()
    {
        var now = new DateTime(2026, 11, 16, 12, 0, 0, DateTimeKind.Utc);
        var events = new List<DlpEvent>();
        events.Add(PrintJobParser.Parse(PrintJobParserTests.Xml(), "hash")!);
        events.Add(PrintJobParser.Parse(PrintJobParserTests.Xml(doc: "Teklif.pdf", rec: 1235, pages: "2"), "full")!);
        var env = new Env(); var usb = new UsbSource(env, () => now, "PC01"); var cfg = new DlpConfig { Enabled = true, Usb = { Enabled = true } };
        usb.ReadNew(0, 10, cfg);                                                                                     // baseline
        env.Vols.Add(new UsbVolume("E:", "BACKUP", "FAT32", 16_000_000_000, "Kingston", "DataTraveler", "abc123abc123abc123abc123"));
        env.Files.Add(new UsbFile("E:", "Musteri Listesi.xlsx", 123456, "created", now));
        events.AddRange(usb.ReadNew(0, 10, cfg).Select(r => r.Event));
        return JsonSerializer.Serialize(new { events = events.Select(e => e.ToWire()).ToList() }, new JsonSerializerOptions { WriteIndented = true });
    }

    private static string FixturePath([CallerFilePath] string here = "") => Path.Combine(Path.GetDirectoryName(here)!, "Fixtures", "dlp-wire-sample.json");

    [Fact]
    public void What_the_collector_serialises_equals_the_sample_the_server_tests_post()
    {
        string now = Sample().Replace("\r\n", "\n");
        if (Environment.GetEnvironmentVariable("UPDATE_DLP_FIXTURE") == "1") File.WriteAllText(FixturePath(), now);
        Assert.Equal(File.ReadAllText(FixturePath()).Replace("\r\n", "\n"), now);
    }

    [Fact]
    public void The_sample_has_one_event_of_each_kind_with_the_fields_the_server_whitelists()
    {
        using var d = JsonDocument.Parse(Sample()); var ev = d.RootElement.GetProperty("events").EnumerateArray().ToList();
        Assert.Equal(new[] { "print_job", "print_job", "usb_connected", "usb_file_event" }, ev.Select(e => e.GetProperty("type").GetString()).ToArray());
        Assert.All(ev, e => Assert.Matches("^[A-Za-z0-9_:.-]{8,64}$", e.GetProperty("uid").GetString()!));
        var print = ev[0].GetProperty("data"); foreach (var k in new[] { "printer", "port", "computer", "event_id", "record_id", "job_id", "document", "user", "pages", "bytes" }) Assert.True(print.TryGetProperty(k, out _), k);
        Assert.StartsWith("sha256:", print.GetProperty("document").GetString());   // hash is the default mode
    }
}
