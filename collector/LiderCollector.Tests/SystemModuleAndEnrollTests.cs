using System.Text.Json;
using LiderCollector.Core;
using LiderCollector.Enrollment;
using LiderCollector.Modules;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace LiderCollector.Tests;

public sealed class SystemModuleAndEnrollTests : IDisposable
{
    private readonly string _dir = Path.Combine(Path.GetTempPath(), "lider-tests-" + Guid.NewGuid().ToString("N"));
    public SystemModuleAndEnrollTests() => Directory.CreateDirectory(_dir);
    public void Dispose() { try { Directory.Delete(_dir, true); } catch { } }

    // ── Module status aggregation ───────────────────────────────────────────
    private static readonly NullLogger _log = NullLogger.Instance;

    [Fact]
    public void Tracker_all_sources_ok_is_success()
    {
        var t = new SourceTracker();
        t.Run("A", () => { }, true, _log); t.Run("B", () => { }, true, _log);
        Assert.Equal(ModuleReport.Success, t.Finish().Status);
    }

    [Fact]
    public void Tracker_one_required_failure_is_partial_and_records_reason()
    {
        var t = new SourceTracker();
        t.Run("A", () => { }, true, _log);
        t.Run("B", () => throw new InvalidOperationException("boom"), true, _log);
        var r = t.Finish();
        Assert.Equal(ModuleReport.Partial, r.Status);
        Assert.Contains("boom", r.Error);
        Assert.Contains("boom", r.Sources["B"]);
        Assert.Equal("ok", r.Sources["A"]);
    }

    [Fact]
    public void Tracker_all_required_fail_is_failed()
    {
        var t = new SourceTracker();
        t.Run("A", () => throw new Exception("x"), true, _log);
        Assert.Equal(ModuleReport.Failed, t.Finish().Status);
    }

    [Fact]
    public void Tracker_optional_failure_is_only_a_warning()
    {
        var t = new SourceTracker();
        t.Run("A", () => { }, true, _log);
        t.Run("Opt", () => throw new Exception("nope"), false, _log);
        var r = t.Finish();
        Assert.Equal(ModuleReport.Partial, r.Status);
        Assert.Single(r.Warnings);
        Assert.Null(r.Error);
    }

    // ── Normalisation ───────────────────────────────────────────────────────
    [Theory]
    [InlineData("To Be Filled By O.E.M.")]
    [InlineData("Default string")]
    [InlineData("  None ")]
    [InlineData("")]
    public void Junk_serials_are_dropped(string raw) => Assert.Null(SystemInfoModule.NormalizeSerial(raw));

    [Fact]
    public void Real_serial_is_kept() => Assert.Equal("PF2ABC12", SystemInfoModule.NormalizeSerial(" PF2ABC12 "));

    [Theory]
    [InlineData("00000000-0000-0000-0000-000000000000")]
    [InlineData("03000200-0400-0500-0006-000700080009")]
    public void Fake_uuids_are_dropped(string raw) => Assert.Null(SystemInfoModule.NormalizeUuid(raw));

    // ── Payload contract with the Laravel processors ────────────────────────
    [Fact]
    public void Payload_serialises_the_fields_the_server_reads()
    {
        var p = new SystemInfoModule.SystemPayload
        {
            Hostname = "PC1", OsName = "Windows 10", TotalRamBytes = 17_179_869_184, LogicalCores = 8,
            Processors = { new SystemInfoModule.CpuInfo { Name = "Test CPU", Cores = 4, LogicalProcessors = 8 } },
            Volumes = { new SystemInfoModule.VolumeInfo { Letter = "C:", SizeBytes = 100, FreeBytes = 40, UsedBytes = 60 } },
            Partitions = { new SystemInfoModule.PartitionInfo { Id = "Disk #0, Partition #1", DriveLetter = "C:" } },
        };
        using var doc = JsonDocument.Parse(JsonSerializer.Serialize<object>(p));
        var r = doc.RootElement;
        Assert.Equal(16.0, r.GetProperty("ram_gb").GetDouble());
        Assert.Equal("Test CPU", r.GetProperty("cpu_model").GetString());
        Assert.Equal(4, r.GetProperty("cpu_cores").GetInt32());
        Assert.Equal(60, r.GetProperty("volumes")[0].GetProperty("used_bytes").GetInt64());
        Assert.Equal("C:", r.GetProperty("partitions")[0].GetProperty("drive_letter").GetString());
    }

    // ── Regression: the UUID property bug ───────────────────────────────────
    // Win32_ComputerSystem has no UUID property; selecting it threw "Invalid query" and the module
    // returned nothing at all. This runs the real module against the real WMI of the build machine.
    [Fact]
    public async Task System_module_collects_real_data_and_never_fails_on_a_normal_windows_host()
    {
        var m = new SystemInfoModule(NullLogger<SystemInfoModule>.Instance);
        var result = await m.RunAsync(CancellationToken.None);
        var p = Assert.IsType<SystemInfoModule.SystemPayload>(result);
        Assert.NotNull(m.LastReport);
        Assert.Equal("ok", m.LastReport!.Sources["ComputerSystem"]);
        Assert.NotEqual(ModuleReport.Failed, m.LastReport.Status);
        Assert.False(string.IsNullOrWhiteSpace(p.Hostname));
        Assert.False(string.IsNullOrWhiteSpace(p.OsName));
        Assert.True(p.TotalRamBytes > 0);
        Assert.NotEmpty(p.Processors);
        Assert.NotEmpty(p.Volumes);
    }

    // ── Bootstrap enrollment: transport policy flag ─────────────────────────
    private BootstrapEnrollment Boot() => new(_dir, NullLogger<BootstrapEnrollment>.Instance);

    [Fact]
    public void Bootstrap_reads_allow_http_true()
    {
        File.WriteAllText(Path.Combine(_dir, "enrollment.json"), "{\"server_url\":\"http://x\",\"enrollment_token\":\"ldt_abc\",\"allow_http\":true}");
        var c = Boot().TryRead();
        Assert.NotNull(c);
        Assert.True(c!.AllowHttp);
        Assert.False(File.Exists(Path.Combine(_dir, "enrollment.json"))); // single-use: file is gone after the read
    }

    [Fact]
    public void Bootstrap_allow_http_defaults_to_false()
    {
        File.WriteAllText(Path.Combine(_dir, "enrollment.json"), "{\"server_url\":\"https://x\",\"enrollment_token\":\"ldt_abc\"}");
        Assert.False(Boot().TryRead()!.AllowHttp);
    }

    [Fact]
    public void Version_comes_from_the_assembly_not_the_config_file()
    {
        Assert.Matches(@"^\d+\.\d+\.\d+", AppVersion.Current);
        Assert.NotEqual("0.0.0", AppVersion.Current);
    }
}
