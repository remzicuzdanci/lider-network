using LiderCollector.Core;
using LiderCollector.Modules;
using Microsoft.Extensions.Logging.Abstractions;
using System.Text.Json;
using static LiderCollector.Modules.ServicesModule;

namespace LiderCollector.Tests;

/// <summary>Windows service inventory: payload shape, failure semantics, privacy and backward compatibility. No WMI access.</summary>
public sealed class ServicesModuleTests
{
    private static readonly DateTime Now = new(2026, 11, 10, 13, 41, 40, DateTimeKind.Utc);

    private static RawService Svc(string? name, string state = "Running", string mode = "Auto", string? display = null, bool delayed = false, string? account = "LocalSystem")
        => new(name, display ?? $"Display {name}", state, mode, delayed, account);

    [Fact]
    public void Build_KeepsNameDisplayNameStateStartModeDelayedFlagAndAccount()
    {
        var p = Build(new[] { Svc("WinDefend", "Running", "Auto", "Microsoft Defender Antivirus Service", delayed: true, account: "LocalSystem") }, Now);
        var s = Assert.Single(p.Items);
        Assert.Equal("WinDefend", s.Name);
        Assert.Equal("Microsoft Defender Antivirus Service", s.DisplayName);
        Assert.Equal("Running", s.State);
        Assert.Equal("Auto", s.StartMode);
        Assert.True(s.DelayedAutoStart);
        Assert.Equal("LocalSystem", s.Account);
        Assert.Equal("2026-11-10T13:41:40Z", p.CollectedAt);   // collection time, UTC
        Assert.Equal(1, p.Count);
    }

    [Fact]
    public void Build_DropsNamelessRowsAndCaseInsensitiveDuplicates_TrimsAndSorts()
    {
        var p = Build(new[] { Svc("Spooler"), Svc("  "), Svc(null), Svc("spooler", "Stopped"), Svc(" BITS ", "Stopped", "Manual") }, Now);
        Assert.Equal(new[] { "BITS", "Spooler" }, p.Items.Select(i => i.Name).ToArray());
        Assert.Equal("Running", p.Items.Single(i => i.Name == "Spooler").State);   // first occurrence wins
    }

    [Fact]
    public void Build_FillsUnknownWhenWindowsReportsNoStateOrStartMode()
    {
        var s = Assert.Single(Build(new[] { new RawService("X", null, null, "", false, "") }, Now).Items);
        Assert.Equal("Unknown", s.State);
        Assert.Equal("Unknown", s.StartMode);
        Assert.Null(s.DisplayName);
        Assert.Null(s.Account);
    }

    [Fact]
    public async Task RunAsync_ReturnsPayloadAndASuccessReport()
    {
        var m = new ServicesModule(NullLogger<ServicesModule>.Instance, () => new[] { Svc("A"), Svc("B", "Stopped", "Manual") }, () => Now);
        var result = await m.RunAsync(CancellationToken.None);
        var payload = Assert.IsType<ServicesPayload>(result);
        Assert.Equal(2, payload.Count);
        Assert.Equal(ModuleReport.Success, m.LastReport!.Status);
        Assert.Equal("services", m.Name);
    }

    [Fact]
    public async Task RunAsync_AnEmptyReadIsFailed_NotAMachineWithoutServices()
    {
        var m = new ServicesModule(NullLogger<ServicesModule>.Instance, () => Array.Empty<RawService>(), () => Now);
        Assert.Null(await m.RunAsync(CancellationToken.None));                 // the server then keeps the previous inventory
        Assert.Equal(ModuleReport.Failed, m.LastReport!.Status);
        Assert.Contains("no services", m.LastReport.Error);
    }

    [Fact]
    public async Task RunAsync_AReaderExceptionIsFailedWithTheReason()
    {
        var m = new ServicesModule(NullLogger<ServicesModule>.Instance, () => throw new InvalidOperationException("WMI repository inconsistent"), () => Now);
        Assert.Null(await m.RunAsync(CancellationToken.None));
        Assert.Equal(ModuleReport.Failed, m.LastReport!.Status);
        Assert.Contains("WMI repository inconsistent", m.LastReport.Error);
    }

    [Fact]
    public void JsonContract_UsesTheServerFieldNames_AndNeverCarriesAPath()
    {
        var json = JsonSerializer.Serialize(Build(new[] { Svc("Spooler", "Running", "Auto", "Print Spooler", false, @"NT AUTHORITY\LocalService") }, Now));
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        Assert.Equal("2026-11-10T13:41:40Z", root.GetProperty("collected_at").GetString());
        Assert.Equal(1, root.GetProperty("count").GetInt32());
        var item = root.GetProperty("items")[0];
        foreach (var k in new[] { "name", "display_name", "state", "start_mode", "delayed_auto_start", "account" })
            Assert.True(item.TryGetProperty(k, out _), $"missing {k}");
        foreach (var forbidden in new[] { "path", "path_name", "pathname", "command_line", "binary_path", "image_path" })
            Assert.False(item.TryGetProperty(forbidden, out _), $"{forbidden} must never be sent");
        Assert.DoesNotContain("PathName", json, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void BackwardCompat_AnOldCollectorJsonWithoutTheServicesKeyGetsTheModuleEnabled()
    {
        var dir = Path.Combine(Path.GetTempPath(), "lc-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(dir);
        try
        {
            // what a 1.1.x installation wrote: a Modules block that knows nothing about "Services"
            var path = Path.Combine(dir, "collector.json");
            File.WriteAllText(path, "{ \"collector_id\": 4, \"server_url\": \"http://192.168.20.61\", \"modules\": { \"system\": true, \"software\": true, \"performance\": true, \"event_log\": true, \"windows_update\": true } }");
            var cfg = CollectorConfig.Load(path);
            Assert.True(cfg.Modules.Services);
            Assert.True(cfg.Modules.System);
            Assert.Equal(4, cfg.CollectorId);

            File.WriteAllText(path, "{ \"collector_id\": 4, \"modules\": { \"services\": false } }");       // an admin can still switch it off
            Assert.False(CollectorConfig.Load(path).Modules.Services);
        }
        finally { Directory.Delete(dir, true); }
    }

    [Fact]
    public void Version_IsTheCurrentRelease()
    {
        Assert.Equal(new Version(1, 4, 4, 0), typeof(ServicesModule).Assembly.GetName().Version);   // 1.4.4 = 1.4.3 (queue health) + reliable Windows Update last-scan date
    }
}
