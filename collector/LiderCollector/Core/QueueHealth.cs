namespace LiderCollector.Core;

/// <summary>What the heartbeat reports about the offline queue. No payload content, only counts, ages and a fixed error code.</summary>
public sealed record QueueHealthSnapshot(
    long Depth,
    long? OldestAgeSeconds,
    DateTime? LastFlushOkUtc,
    string? LastError,
    DateTime? LastErrorUtc,
    int ConsecutiveFailures,
    string State);

/// <summary>
/// Tracks how the offline queue is doing. Fed by the flusher outcome, read by the heartbeat.
/// States: <c>ok</c> (empty), <c>backlog</c> (items waiting, still draining), <c>rate_limited</c> (server asked us to slow down),
/// <c>stalled</c> (items waiting and nothing delivered for <see cref="StallAfter"/>, or 3 consecutive failed flushes).
/// Error codes are fixed strings (<c>server_unreachable</c>, <c>rate_limited</c>) so no URL, host or payload ever leaves the machine through this path.
/// </summary>
public sealed class QueueHealthTracker
{
    public static readonly TimeSpan StallAfter = TimeSpan.FromMinutes(30);
    private readonly Func<DateTime> _now;
    private readonly object _lock = new();
    private DateTime? _lastOk, _lastErrAt;
    private string? _lastErr;
    private int _failures;
    private DateTime _sinceUtc;

    public QueueHealthTracker(Func<DateTime>? now = null) { _now = now ?? (() => DateTime.UtcNow); _sinceUtc = _now(); }

    public void Record(FlushStats st)
    {
        lock (_lock)
        {
            var t = _now();
            if (st.Delivered > 0) { _lastOk = t; _failures = 0; }
            if (st.Failed > 0) { _failures++; _lastErr = "server_unreachable"; _lastErrAt = t; }
            else if (st.RateLimited) { _lastErr = "rate_limited"; _lastErrAt = t; }
            else if (st.Delivered > 0 || st.BudgetReached) { /* healthy progress */ }
        }
    }

    public QueueHealthSnapshot Snapshot(long depth, long? oldestCreatedUnix)
    {
        lock (_lock)
        {
            var now = _now();
            long? age = oldestCreatedUnix is { } c && depth > 0 ? Math.Max(0, new DateTimeOffset(now).ToUnixTimeSeconds() - c) : null;
            string state;
            if (depth == 0) state = "ok";
            else if (_failures >= 3 || now - (_lastOk ?? _sinceUtc) > StallAfter) state = "stalled";
            else if (_lastErr == "rate_limited" && _lastErrAt is { } e && now - e < TimeSpan.FromMinutes(5)) state = "rate_limited";
            else state = "backlog";
            return new QueueHealthSnapshot(depth, age, _lastOk, _lastErr, _lastErrAt, _failures, state);
        }
    }

    /// <summary>Shape sent in the heartbeat as <c>queue_status</c>.</summary>
    public static object ToPayload(QueueHealthSnapshot s) => new
    {
        depth = s.Depth,
        oldest_age_seconds = s.OldestAgeSeconds,
        last_flush_ok = s.LastFlushOkUtc?.ToString("O"),
        last_error = s.LastError,
        last_error_at = s.LastErrorUtc?.ToString("O"),
        consecutive_failures = s.ConsecutiveFailures,
        state = s.State,
    };
}
