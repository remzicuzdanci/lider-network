using System.Security.Principal;
using LiderCollector.Dlp;
using Xunit;

namespace LiderCollector.Tests;

public class DlpAppUsageTests
{
    private static readonly DateTime T0 = new(2026, 11, 18, 9, 0, 0, DateTimeKind.Utc);
    private static DlpConfig.AppUsageConfig Cfg(Action<DlpConfig.AppUsageConfig>? t = null) { var c = new DlpConfig.AppUsageConfig { Enabled = true, SampleSeconds = 5, IdleThresholdSeconds = 120, MaxIntervalSeconds = 300 }; t?.Invoke(c); return c; }
    private static AppSample S(int sec, string? proc, int idle = 0, bool locked = false, string user = "UCI\\ahmet", int session = 2, string? title = null) => new(T0.AddSeconds(sec), session, user, proc, title, idle, locked);
    private static List<AppInterval> Feed(AppUsageAggregator a, params AppSample[] s) { var r = new List<AppInterval>(); foreach (var x in s) r.AddRange(a.Add(x)); return r; }

    [Fact]
    public void Time_in_the_foreground_application_is_counted_and_a_switch_closes_the_interval()
    {
        var a = new AppUsageAggregator(Cfg());
        var done = Feed(a, S(0, "WINWORD.EXE"), S(5, "WINWORD.EXE"), S(10, "WINWORD.EXE"), S(15, "chrome.exe"), S(20, "chrome.exe"));
        var w = Assert.Single(done); Assert.Equal("WINWORD.EXE", w.Process); Assert.Equal(15, w.ActiveSeconds); Assert.Equal(0, w.IdleSeconds); Assert.Equal(T0, w.StartUtc); Assert.Equal(T0.AddSeconds(15), w.EndUtc);
        var c = a.Flush(T0.AddMinutes(10)); Assert.Equal(5, Assert.Single(c).ActiveSeconds);   // the browser: 5 s from 15 to 20
    }

    [Fact]
    public void Idle_time_and_a_locked_screen_are_never_added_to_active_use()
    {
        var a = new AppUsageAggregator(Cfg());
        var done = Feed(a, S(0, "excel.exe"), S(5, "excel.exe"), S(10, "excel.exe", idle: 130), S(15, "excel.exe", idle: 140), S(20, null, locked: true), S(25, null, locked: true), S(30, "excel.exe", idle: 1));
        // active 0..10 (10 s); the idle stretch and the locked stretch produce no interval at all (zero active time)
        var one = Assert.Single(done); Assert.Equal(10, one.ActiveSeconds); Assert.Equal("excel.exe", one.Process);
    }

    [Fact]
    public void A_gap_between_samples_is_capped_so_a_sleeping_computer_cannot_create_phantom_hours()
    {
        var a = new AppUsageAggregator(Cfg());
        var done = Feed(a, S(0, "WINWORD.EXE"), S(3600, "WINWORD.EXE"), S(3605, "chrome.exe"));
        Assert.Equal(10 + 5, done.Sum(d => d.ActiveSeconds));   // the hour-long gap counts for at most 10 s (twice the sampling period), then 5 s
    }

    [Fact]
    public void A_long_session_in_one_application_is_cut_into_bounded_intervals()
    {
        var a = new AppUsageAggregator(Cfg(c => c.MaxIntervalSeconds = 60)); var done = new List<AppInterval>();
        for (int s = 0; s <= 200; s += 5) done.AddRange(a.Add(S(s, "WINWORD.EXE")));
        Assert.True(done.Count >= 3); Assert.All(done, d => Assert.True((d.EndUtc - d.StartUtc).TotalSeconds <= 65));
        Assert.InRange(done.Sum(d => d.ActiveSeconds) + a.Flush(T0.AddHours(1)).Sum(d => d.ActiveSeconds), 190, 200);
    }

    [Fact]
    public void When_samples_stop_the_open_interval_is_closed_by_the_flush_and_nothing_is_added_afterwards()
    {
        var a = new AppUsageAggregator(Cfg()); Feed(a, S(0, "WINWORD.EXE"), S(5, "WINWORD.EXE"));
        Assert.Empty(a.Flush(T0.AddSeconds(8))); var f = Assert.Single(a.Flush(T0.AddMinutes(5))); Assert.Equal(5, f.ActiveSeconds); Assert.Empty(a.Flush(T0.AddHours(1)));
    }

    [Fact]
    public void Two_users_in_two_sessions_are_counted_separately_and_a_sample_without_a_user_is_ignored()
    {
        var a = new AppUsageAggregator(Cfg());
        var d = Feed(a, S(0, "a.exe", user: "UCI\\x", session: 2), S(0, "b.exe", user: "UCI\\y", session: 3), S(10, "a.exe", user: "UCI\\x", session: 2), S(10, "b.exe", user: "UCI\\y", session: 3), S(12, "c.exe", user: "", session: 4));
        Assert.Empty(d); var f = a.Flush(T0.AddHours(1)); Assert.Equal(new[] { "UCI\\x", "UCI\\y" }, f.Select(x => x.User).OrderBy(x => x).ToArray()); Assert.All(f, x => Assert.Equal(10, x.ActiveSeconds));
    }

    [Theory]
    [InlineData("none", null)]
    [InlineData("hash", "sha256:")]
    [InlineData("full", "Gizli Plan - Word")]
    public void The_window_title_is_not_sent_unless_the_policy_says_so(string mode, string? expectStart)
    {
                var first = Feed(new AppUsageAggregator(Cfg(c => c.TitleMode = mode)), S(0, "WINWORD.EXE", title: "Gizli Plan - Word"), S(10, "x.exe")).Single();
        if (expectStart is null) Assert.Null(first.Title); else { Assert.StartsWith(expectStart, first.Title); if (mode == "hash") Assert.DoesNotContain("Gizli", first.Title); }
    }

    [Fact]
    public void The_source_turns_intervals_into_app_usage_events_flags_browsers_and_never_claims_sites()
    {
        var feed = new AppSampleBuffer(); var cfg = new DlpConfig { Enabled = true }; cfg.AppUsage.Enabled = true; var now = T0.AddHours(1);
        var src = new AppUsageSource(feed, () => now, "PC01");
        foreach (var s in new[] { S(0, "msedge.exe", title: "Bank - Edge"), S(10, "msedge.exe"), S(20, "WINWORD.EXE"), S(30, "WINWORD.EXE") }) feed.Add(s);
        var ev = src.ReadNew(0, 50, cfg).Select(x => x.Event).ToList(); Assert.Equal(2, ev.Count);
        var b = ev.First(e => (string)e.Data["app"]! == "msedge"); Assert.Equal("app_usage", b.Type); Assert.Equal("yes", b.Data["is_browser"]); Assert.Null(b.Data["title"]); Assert.Equal(20L, b.Data["active_seconds"]);
        Assert.False(b.Data.ContainsKey("url")); Assert.False(b.Data.ContainsKey("site")); Assert.Equal("no", ev.First(e => (string)e.Data["app"]! == "WINWORD").Data["is_browser"]);
        Assert.Equal("UCI\\ahmet", b.Data["user"]); Assert.Matches("^app-[0-9a-f]{40}$", b.Uid);
        Assert.Equal(ev.Count, ev.Select(e => e.Uid).Distinct().Count());
    }

    [Fact]
    public void Helpers_run_only_in_active_user_sessions_never_in_session_zero_and_are_stopped_when_disabled_or_logged_off()
    {
        var sessions = new[] { new SessionDesc(0, 0, "SYSTEM", "Services"), new SessionDesc(1, 0, "UCI\\a", "Console"), new SessionDesc(2, 4, "UCI\\b", "RDP-Tcp#1"), new SessionDesc(3, 0, "UCI\\c", "RDP-Tcp#2"), new SessionDesc(4, 0, null, "") };
        var (start, stop) = AgentPlan.Decide(true, sessions, new[] { 2 });
        Assert.Equal(new[] { 1, 3 }, start.OrderBy(x => x)); Assert.Equal(new[] { 2 }, stop);
        var off = AgentPlan.Decide(false, sessions, new[] { 1, 3 }); Assert.Empty(off.Start); Assert.Equal(new[] { 1, 3 }, off.Stop.OrderBy(x => x));
    }

    [Fact]
    public void A_sample_from_the_helper_is_cleaned_and_a_wrong_clock_or_absurd_idle_value_is_not_believed()
    {
        var w = new AppSampleWire(DateTime.UtcNow.AddHours(-9).ToString("O"), "chrome.exe\n", new string('x', 1000), 999999999, false);
        var s = AppUsagePipeServer.Parse(w, 7, "UCI\\q");
        Assert.True(Math.Abs((s.AtUtc - DateTime.UtcNow).TotalMinutes) < 1); Assert.Equal("chrome.exe", s.Process); Assert.Equal(300, s.Title!.Length); Assert.Equal(7, s.SessionId); Assert.Equal("UCI\\q", s.User); Assert.Equal(86400 * 7, s.IdleSeconds);
    }

    [Fact]
    public void Everything_is_off_by_default_and_the_default_never_sends_titles()
    {
        var c = new DlpConfig(); Assert.False(c.AppUsage.Enabled); Assert.Equal("none", c.AppUsage.TitleMode); Assert.False(new AppUsageSource(new AppSampleBuffer()).IsEnabled(c));
    }
}

/// <summary>The sampler and the pipe against the real desktop of the computer the tests run on.</summary>
[Trait("Category", "RealWindows")]
public class DlpAppUsageRealWindowsTests
{
    [Fact]
    public void The_real_sampler_reads_a_foreground_process_and_the_idle_time_without_throwing()
    {
        var s = ForegroundSampler.Take(System.Diagnostics.Process.GetCurrentProcess().SessionId, "TEST");
        Assert.True(s.IdleSeconds >= 0);
        if (!s.Locked) Assert.False(string.IsNullOrWhiteSpace(s.Process));   // an unlocked interactive desktop always has a foreground window
        Assert.True(ForegroundSampler.IdleSeconds() < 60 * 60 * 24 * 7);
    }

    [Fact]
    public async Task The_helper_and_the_pipe_deliver_real_samples_with_the_user_and_session_taken_from_the_connecting_process()
    {
        var buf = new AppSampleBuffer(); using var server = new AppUsagePipeServer(buf); server.Start(); await Task.Delay(300);
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(7));
        var run = AppUsageAgent.RunAsync(2, 0, cts.Token);
        var got = new List<AppSample>(); var until = DateTime.UtcNow.AddSeconds(8);
        while (DateTime.UtcNow < until && got.Count < 2) { got.AddRange(buf.Drain(10)); await Task.Delay(200); }
        cts.Cancel(); await run;
        Assert.True(got.Count >= 2, "samples received: " + got.Count + " / server: " + server.LastError + " / agent: " + AppUsageAgent.LastError);
        Assert.All(got, s => { Assert.Equal(WindowsIdentity.GetCurrent().Name, s.User); Assert.Equal(System.Diagnostics.Process.GetCurrentProcess().SessionId, s.SessionId); });
    }
}
