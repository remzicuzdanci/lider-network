using LiderCollector.Modules;
using Microsoft.Extensions.Logging.Abstractions;
using System.Text.Json;
using Xunit;

namespace LiderCollector.Tests;

/// <summary>Windows Update last-scan time (1.4.4): WUA first, legacy registry as fallback, plain status when nothing is available, never an estimate.</summary>
public sealed class WuLastScanTests
{
    private static readonly DateTime Now = new(2026, 11, 17, 12, 0, 0, DateTimeKind.Utc);

    private sealed class Fake : IWuScanSource
    {
        public Func<DateTime?> Com = () => null; public Func<string?> Reg = () => null;
        public DateTime? AutoUpdateLastSearchSuccess() => Com();
        public string? RegistryDetectLastSuccess() => Reg();
    }

    [Fact]
    public void Wua_date_wins_and_is_reported_with_its_source()
    {
        var d = new DateTime(2026, 11, 16, 9, 30, 0, DateTimeKind.Utc);
        var r = WuLastScan.Resolve(new Fake { Com = () => d, Reg = () => "2020-01-01 00:00:00" }, Now);
        Assert.Equal(d, r.Utc); Assert.Equal("wua_autoupdate", r.Source); Assert.Equal("ok", r.Status); Assert.Null(r.Detail);
    }

    [Fact]
    public void The_legacy_registry_value_is_the_fallback_when_wua_cannot_be_used()
    {
        var r = WuLastScan.Resolve(new Fake { Com = () => throw new InvalidOperationException("not registered"), Reg = () => "2026-11-10 08:15:42" }, Now);
        Assert.Equal(new DateTime(2026, 11, 10, 8, 15, 42, DateTimeKind.Utc), r.Utc); Assert.Equal("registry_detect", r.Source); Assert.Equal("ok", r.Status);
    }

    [Fact]
    public void Registry_text_is_read_as_utc_regardless_of_the_machine_culture()
    {
        var old = System.Globalization.CultureInfo.CurrentCulture;
        try
        {
            System.Globalization.CultureInfo.CurrentCulture = new System.Globalization.CultureInfo("tr-TR");
            var r = WuLastScan.Resolve(new Fake { Com = () => null, Reg = () => "2026-11-10 08:15:42" }, Now);
            Assert.Equal(new DateTime(2026, 11, 10, 8, 15, 42, DateTimeKind.Utc), r.Utc);
        }
        finally { System.Globalization.CultureInfo.CurrentCulture = old; }
    }

    [Fact]
    public void Windows_saying_never_is_reported_as_never_scanned_not_invented()
    {
        var r = WuLastScan.Resolve(new Fake { Com = () => null, Reg = () => null }, Now);
        Assert.Null(r.Utc); Assert.Equal("never_scanned", r.Status); Assert.Equal("none", r.Source); Assert.Contains("no update search has succeeded", r.Detail);
    }

    [Fact]
    public void An_unusable_api_and_no_registry_value_is_unavailable_with_the_reason()
    {
        var r = WuLastScan.Resolve(new Fake { Com = () => throw new InvalidOperationException("Microsoft.Update.AutoUpdate is not registered"), Reg = () => null }, Now);
        Assert.Null(r.Utc); Assert.Equal("error", r.Status); Assert.Contains("InvalidOperationException", r.Detail); Assert.Contains("registry value not present", r.Detail);
    }

    [Fact]
    public void A_disabled_update_service_is_unavailable_not_error()
    {
        var r = WuLastScan.Resolve(new Fake { Com = () => throw new System.Runtime.InteropServices.COMException("disabled", unchecked((int)0x80070422)), Reg = () => null }, Now);
        Assert.Equal("unavailable", r.Status); Assert.Contains("0x80070422", r.Detail);
    }

    [Theory]
    [InlineData("2099-01-01 00:00:00")]   // the future
    [InlineData("1999-05-05 00:00:00")]   // before Windows Update existed
    [InlineData("not a date")]
    [InlineData("0")]
    public void Implausible_or_garbled_values_are_dropped(string raw)
    {
        var r = WuLastScan.Resolve(new Fake { Com = () => null, Reg = () => raw }, Now);
        Assert.Null(r.Utc); Assert.NotEqual("ok", r.Status);
    }

    [Fact]
    public void An_implausible_wua_time_is_not_trusted_and_the_registry_is_tried()
    {
        var r = WuLastScan.Resolve(new Fake { Com = () => new DateTime(2099, 1, 1, 0, 0, 0, DateTimeKind.Utc), Reg = () => "2026-11-12 10:00:00" }, Now);
        Assert.Equal("registry_detect", r.Source); Assert.Equal(new DateTime(2026, 11, 12, 10, 0, 0, DateTimeKind.Utc), r.Utc);
    }

    // ── what the module puts on the wire and in its report ───────────────────

    [Fact]
    public void The_payload_carries_source_and_status_and_keeps_every_legacy_key()
    {
        var p = new WindowsUpdateModule.WindowsUpdatePayload { LastScanAt = "2026-11-16T09:30:00Z", LastScanSource = "wua_autoupdate", LastScanStatus = "ok", PendingQueryStatus = "ok", PendingCount = 2, RebootRequired = true, LastInstallResult = 0 };
        using var doc = JsonDocument.Parse(JsonSerializer.Serialize(p));
        var keys = doc.RootElement.EnumerateObject().Select(x => x.Name).ToHashSet();
        foreach (var legacy in new[] { "installed_updates", "pending_query_status", "pending_queried_at", "pending_count", "pending_updates", "reboot_required", "last_scan_at", "last_install_result" })
            Assert.Contains(legacy, keys);   // a 1.3.0 / 1.4.0 server contract is a subset of 1.4.4
        Assert.Contains("last_scan_source", keys); Assert.Contains("last_scan_status", keys);
        Assert.Equal("wua_autoupdate", doc.RootElement.GetProperty("last_scan_source").GetString());
    }

    [Fact]
    public async Task A_missing_scan_date_makes_the_module_partial_with_a_named_reason_and_sends_null_not_a_guess()
    {
        var m = new WindowsUpdateModule(NullLogger<WindowsUpdateModule>.Instance, new Fake { Com = () => null, Reg = () => null }, () => Now);
        var payload = (WindowsUpdateModule.WindowsUpdatePayload?)await m.RunAsync(CancellationToken.None);   // WMI/WUA calls are best effort off Windows
        Assert.NotNull(payload); Assert.Null(payload!.LastScanAt); Assert.Equal("never_scanned", payload.LastScanStatus); Assert.Equal("none", payload.LastScanSource);
        Assert.NotNull(m.LastReport); Assert.Contains(m.LastReport!.Warnings, w => w.Contains("last scan date not available (never_scanned)"));
        Assert.StartsWith("never_scanned", m.LastReport.Sources["LastScan"]); Assert.Equal(ModuleReport.Partial, m.LastReport.Status);
    }

    [Fact]
    public async Task A_found_scan_date_is_sent_in_utc_with_its_source_and_adds_no_warning_of_its_own()
    {
        var d = new DateTime(2026, 11, 16, 9, 30, 15, DateTimeKind.Utc);
        var m = new WindowsUpdateModule(NullLogger<WindowsUpdateModule>.Instance, new Fake { Com = () => d }, () => Now);
        var payload = (WindowsUpdateModule.WindowsUpdatePayload?)await m.RunAsync(CancellationToken.None);
        Assert.Equal("2026-11-16T09:30:15Z", payload!.LastScanAt); Assert.Equal("wua_autoupdate", payload.LastScanSource); Assert.Equal("ok", payload.LastScanStatus);
        Assert.Equal("ok (wua_autoupdate)", m.LastReport!.Sources["LastScan"]); Assert.DoesNotContain(m.LastReport.Warnings, w => w.Contains("last scan"));
    }
}
