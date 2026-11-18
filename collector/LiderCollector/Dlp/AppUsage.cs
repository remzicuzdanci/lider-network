using System.Collections.Concurrent;

namespace LiderCollector.Dlp;

/// <summary>One look at the signed-in user's desktop: which application is in front, how long since the last keyboard/mouse input, whether the screen is locked.</summary>
public sealed record AppSample(DateTime AtUtc, int SessionId, string? User, string? Process, string? Title, int IdleSeconds, bool Locked);

/// <summary>A finished stretch of use of one application by one user. <see cref="ActiveSeconds"/> counts only time with the application in front AND recent input AND an unlocked screen.</summary>
/// <param name="Locked">true for a stretch with the screen locked (no application in front: <c>Process</c> is then null).</param>
public sealed record AppInterval(DateTime StartUtc, DateTime EndUtc, string User, int SessionId, string? Process, string? Title, int ActiveSeconds, int IdleSeconds, bool Locked = false)
{
    /// <summary>active = the application was in front with recent input; idle = it was in front but nobody touched the computer; locked = the screen was locked.</summary>
    public string State => Locked ? "locked" : ActiveSeconds > 0 ? "active" : "idle";
}

/// <summary>
/// Turns samples into usage intervals. Pure (no clock, no Windows): the rules are tested one by one.
///  - Only the FOREGROUND application is ever counted; programs that merely stay open in the background are never counted.
///  - Locked screen, or no input for <see cref="DlpConfig.AppUsageConfig.IdleThresholdSeconds"/>, = idle: the time is recorded as idle, never as active.
///  - The time between two samples belongs to the state of the EARLIER sample, and is capped at twice the sampling period, so a sleeping/stopped computer cannot create phantom hours.
///  - One interval per application per user; it is closed when the application, the user or the session changes, after <see cref="DlpConfig.AppUsageConfig.MaxIntervalSeconds"/>, or when samples stop arriving.
/// </summary>
public sealed class AppUsageAggregator
{
    private sealed class Open { public AppSample First = null!; public AppSample Last = null!; public int Active, Idle; public DateTime Start; }
    private readonly DlpConfig.AppUsageConfig _cfg; private readonly Dictionary<int, Open> _open = new();   // per session
    public AppUsageAggregator(DlpConfig.AppUsageConfig cfg) { _cfg = cfg; }

    private bool IsActive(AppSample s) => !s.Locked && s.Process is { Length: > 0 } && s.IdleSeconds < Math.Max(10, _cfg.IdleThresholdSeconds);
    private int Cap => Math.Max(2, _cfg.SampleSeconds) * 2;

    public List<AppInterval> Add(AppSample s)
    {
        var done = new List<AppInterval>();
        if (string.IsNullOrWhiteSpace(s.User)) return done;
        if (_open.TryGetValue(s.SessionId, out var o))
        {
            int dt = (int)Math.Clamp((s.AtUtc - o.Last.AtUtc).TotalSeconds, 0, Cap);
            if (IsActive(o.Last)) o.Active += dt; else o.Idle += dt;
            bool same = string.Equals(o.Last.User, s.User, StringComparison.OrdinalIgnoreCase) && string.Equals(o.Last.Process, s.Process, StringComparison.OrdinalIgnoreCase) && IsActive(s) == IsActive(o.Last);
            if (!same || (s.AtUtc - o.Start).TotalSeconds >= _cfg.MaxIntervalSeconds) { Close(o, s.AtUtc, done); _open.Remove(s.SessionId); o = null; }
            else { o.Last = s; return done; }
        }
        _open[s.SessionId] = new Open { First = s, Last = s, Start = s.AtUtc };
        return done;
    }

    /// <summary>Closes intervals whose samples stopped arriving (helper gone, user logged off, computer asleep).</summary>
    public List<AppInterval> Flush(DateTime nowUtc)
    {
        var done = new List<AppInterval>();
        foreach (var (sid, o) in _open.ToList())
            if ((nowUtc - o.Last.AtUtc).TotalSeconds > Cap * 2) { Close(o, o.Last.AtUtc, done); _open.Remove(sid); }
        return done;
    }

    private void Close(Open o, DateTime end, List<AppInterval> into)
    {
        if (o.First.User is null) return;
        if (o.Active > 0 && o.First.Process is not null) { into.Add(new AppInterval(o.Start, end, o.First.User, o.First.SessionId, o.First.Process, Title(o.First.Title), o.Active, o.Idle)); return; }
        // A stretch that was NOT active is reported as such (active_seconds 0, idle_seconds = its length), so that "in front but untouched" and "screen locked" can be shown next to the
        // active time and never be mixed up with it. 1.5.0/1.5.1 dropped these stretches, which is why idle_seconds was always 0.
        if (o.Idle > 0) into.Add(new AppInterval(o.Start, end, o.First.User, o.First.SessionId, o.First.Locked ? null : o.First.Process, null, 0, o.Idle, o.First.Locked));
    }

    private string? Title(string? t)
    {
        if (string.IsNullOrWhiteSpace(t)) return null;
        string mode = (_cfg.TitleMode ?? "none").ToLowerInvariant();
        return mode switch { "full" => DlpPrivacy.Name(t, "full", 200), "hash" => DlpPrivacy.Name(t, "hash", 200), _ => null };   // default: the window title is never sent
    }
}

/// <summary>Where samples come from (the named pipe fed by the per-session helper; faked in tests).</summary>
public interface IAppSampleFeed { IReadOnlyList<AppSample> Drain(int max); }

/// <summary>The application-usage DLP source: samples in, finished usage intervals out as <c>app_usage</c> events.</summary>
public sealed class AppUsageSource : IDlpSource
{
    private readonly IAppSampleFeed _feed; private readonly Func<DateTime> _now; private readonly string? _host; private AppUsageAggregator? _agg; private DlpConfig.AppUsageConfig? _bound; private long _seq;
    public AppUsageSource(IAppSampleFeed feed, Func<DateTime>? now = null, string? host = null) { _feed = feed; _now = now ?? (() => DateTime.UtcNow); _host = host; }

    public string Name => "apps";
    public bool IsEnabled(DlpConfig cfg) => cfg.AppUsage.Enabled;
    public bool Prepare(DlpConfig cfg, out string? problem) { problem = null; return true; }

    private static readonly HashSet<string> Browsers = new(StringComparer.OrdinalIgnoreCase) { "chrome", "msedge", "firefox", "opera", "brave", "iexplore", "vivaldi", "chromium" };

    public IReadOnlyList<(long Position, DlpEvent Event)> ReadNew(long afterPosition, int max, DlpConfig cfg)
    {
        if (_agg is null || !ReferenceEquals(_bound, cfg.AppUsage)) { _agg = new AppUsageAggregator(cfg.AppUsage); _bound = cfg.AppUsage; }
        var intervals = new List<AppInterval>();
        foreach (var s in _feed.Drain(5000)) intervals.AddRange(_agg.Add(s));
        intervals.AddRange(_agg.Flush(_now()));
        var res = new List<(long, DlpEvent)>();
        foreach (var i in intervals)
        {
            string? name = i.Process is null ? null : i.Process.EndsWith(".exe", StringComparison.OrdinalIgnoreCase) ? i.Process[..^4] : i.Process;
            var d = new Dictionary<string, object?>
            {
                ["process"] = i.Process, ["app"] = name, ["user"] = i.User, ["session_id"] = (long)i.SessionId, ["start"] = i.StartUtc.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"), ["end"] = i.EndUtc.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                ["active_seconds"] = (long)i.ActiveSeconds, ["idle_seconds"] = (long)i.IdleSeconds, ["title"] = i.Title, ["is_browser"] = name is not null && Browsers.Contains(name) ? "yes" : "no", ["state"] = i.State,
            };
            string uid = DlpEvent.MakeUid("app", _host, i.User, i.Process, i.StartUtc.Ticks, i.EndUtc.Ticks);
            _seq = Math.Max(_seq + 1, Math.Max(i.StartUtc.Ticks, _now().Ticks));
            res.Add((_seq, new DlpEvent(uid, "app_usage", i.StartUtc, _host, d)));
        }
        return res.Where(r => r.Item1 > afterPosition).OrderBy(r => r.Item1).Take(max).ToList();
    }
}

/// <summary>Bounded in-memory sample buffer (the named-pipe server writes, the source drains).</summary>
public sealed class AppSampleBuffer : IAppSampleFeed
{
    private readonly ConcurrentQueue<AppSample> _q = new(); private const int Max = 5000;
    public void Add(AppSample s) { if (_q.Count < Max) _q.Enqueue(s); }
    public IReadOnlyList<AppSample> Drain(int max) { var r = new List<AppSample>(); while (r.Count < max && _q.TryDequeue(out var s)) r.Add(s); return r; }
}
