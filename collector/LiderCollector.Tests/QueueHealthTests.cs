using LiderCollector.Core;
using Xunit;

namespace LiderCollector.Tests;

public class QueueHealthTests
{
    private static (QueueHealthTracker T, Func<DateTime> Now, Action<TimeSpan> Adv) Make()
    {
        var t = new DateTime(2026, 11, 17, 8, 0, 0, DateTimeKind.Utc);
        return (new QueueHealthTracker(() => t), () => t, d => t += d);
    }

    [Fact]
    public void Empty_queue_is_ok_without_age()
    {
        var (tr, _, _) = Make();
        var s = tr.Snapshot(0, null);
        Assert.Equal("ok", s.State); Assert.Null(s.OldestAgeSeconds); Assert.Equal(0, s.Depth);
    }

    [Fact]
    public void Backlog_reports_depth_and_oldest_age()
    {
        var t0 = new DateTime(2026, 11, 17, 8, 0, 0, DateTimeKind.Utc);
        var now = t0.AddMinutes(10);
        var tr = new QueueHealthTracker(() => now);
        var s = tr.Snapshot(7, new DateTimeOffset(t0).ToUnixTimeSeconds());
        Assert.Equal("backlog", s.State); Assert.Equal(7, s.Depth); Assert.Equal(600, s.OldestAgeSeconds);
    }

    [Fact]
    public void Successful_flush_records_time_and_clears_failures()
    {
        var (tr, now, adv) = Make();
        tr.Record(new FlushStats(0, 1, false, false)); tr.Record(new FlushStats(0, 1, false, false));
        adv(TimeSpan.FromMinutes(1));
        tr.Record(new FlushStats(5, 0, false, false));
        var s = tr.Snapshot(3, null);
        Assert.Equal(0, s.ConsecutiveFailures); Assert.Equal(now(), s.LastFlushOkUtc); Assert.Equal("backlog", s.State);
    }

    [Fact]
    public void Three_failed_flushes_mean_stalled_with_fixed_error_code()
    {
        var (tr, _, _) = Make();
        for (int i = 0; i < 3; i++) tr.Record(new FlushStats(0, 1, false, false));
        var s = tr.Snapshot(4, null);
        Assert.Equal("stalled", s.State); Assert.Equal("server_unreachable", s.LastError); Assert.Equal(3, s.ConsecutiveFailures);
    }

    [Fact]
    public void Waiting_items_with_no_delivery_for_30_minutes_are_stalled()
    {
        var (tr, _, adv) = Make();
        adv(TimeSpan.FromMinutes(31));
        Assert.Equal("stalled", tr.Snapshot(1, null).State);
    }

    [Fact]
    public void Rate_limit_is_its_own_state_and_is_not_a_failure()
    {
        var (tr, _, _) = Make();
        tr.Record(new FlushStats(0, 0, true, false));
        var s = tr.Snapshot(9, null);
        Assert.Equal("rate_limited", s.State); Assert.Equal(0, s.ConsecutiveFailures); Assert.Equal("rate_limited", s.LastError);
    }

    [Fact]
    public void Payload_has_no_free_text_and_only_the_documented_keys()
    {
        var (tr, _, _) = Make();
        tr.Record(new FlushStats(0, 1, false, false));
        var json = System.Text.Json.JsonSerializer.Serialize(QueueHealthTracker.ToPayload(tr.Snapshot(2, null)));
        using var doc = System.Text.Json.JsonDocument.Parse(json);
        var keys = doc.RootElement.EnumerateObject().Select(p => p.Name).OrderBy(x => x).ToArray();
        Assert.Equal(new[] { "consecutive_failures", "depth", "last_error", "last_error_at", "last_flush_ok", "oldest_age_seconds", "state" }, keys);
    }

    [Fact]
    public void LocalQueue_oldest_created_is_null_when_empty_and_set_when_not()
    {
        var path = Path.Combine(Path.GetTempPath(), "qh-" + Guid.NewGuid().ToString("N") + ".db");
        try
        {
            using var q = new LocalQueue(path);
            Assert.Null(q.OldestCreated());
            q.Enqueue("inventory", new { a = 1 });
            Assert.NotNull(q.OldestCreated());
        }
        finally { foreach (var f in Directory.GetFiles(Path.GetTempPath(), Path.GetFileName(path) + "*")) { try { File.Delete(f); } catch { } } }
    }
}
