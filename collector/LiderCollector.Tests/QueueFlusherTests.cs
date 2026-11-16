using LiderCollector.Core;
using Xunit;

namespace LiderCollector.Tests;

public class QueueFlusherTests
{
    private sealed class Store : IQueueStore
    {
        public List<LocalQueue.QueueItem> Items = new(); public Dictionary<long, int> Attempts = new();
        public Store(int n) { for (int i = 1; i <= n; i++) Items.Add(new LocalQueue.QueueItem(i, "inventory", "{}", 0)); }
        public IReadOnlyList<LocalQueue.QueueItem> Peek(int count = 10) => Items.Take(count).ToList();
        public void Acknowledge(long id) => Items.RemoveAll(x => x.Id == id);
        public void IncrementAttempts(long id) => Attempts[id] = Attempts.GetValueOrDefault(id) + 1;
    }
    private sealed class Clock { public DateTime Now = new(2026, 11, 16, 12, 0, 0, DateTimeKind.Utc); public DateTime Get() => Now; }

    [Fact]
    public async Task A_big_backlog_is_never_sent_faster_than_the_pace_limit()
    {
        var s = new Store(161); var c = new Clock(); var stamps = new List<DateTime>();
        var f = new QueueFlusher(s, (_, _) => { stamps.Add(c.Now); return Task.FromResult((SendOutcome.Ok, (TimeSpan?)null)); }, c.Get, maxPerMinute: 30, maxItemsPerCall: 20);
        int ticks = 0;
        while (s.Items.Count > 0 && ticks++ < 100) { await f.FlushAsync(CancellationToken.None); c.Now = c.Now.AddSeconds(60); }   // one flush per minute tick
        Assert.Empty(s.Items);
        for (int i = 0; i < stamps.Count; i++) Assert.True(stamps.Count(x => x >= stamps[i] && x < stamps[i].AddSeconds(60)) <= 30);   // never more than 30 in any 60 s window
        Assert.True(stamps.GroupBy(x => x).All(g => g.Count() <= 20));                                                                    // never more than 20 in one tick
    }

    [Fact]
    public async Task Rate_limiting_stops_the_flush_keeps_the_item_untouched_and_waits_for_retry_after()
    {
        var s = new Store(10); var c = new Clock(); int calls = 0;
        var f = new QueueFlusher(s, (_, _) => { calls++; return Task.FromResult(calls <= 2 ? (SendOutcome.Ok, (TimeSpan?)null) : (SendOutcome.RateLimited, (TimeSpan?)TimeSpan.FromSeconds(90))); }, c.Get);
        var r = await f.FlushAsync(CancellationToken.None);
        Assert.Equal(2, r.Delivered); Assert.True(r.RateLimited); Assert.Equal(8, s.Items.Count); Assert.Empty(s.Attempts);   // a 429 is not the item's fault
        Assert.Equal(c.Now.AddSeconds(90), f.BackoffUntil);
        c.Now = c.Now.AddSeconds(30); calls = 0; var r2 = await f.FlushAsync(CancellationToken.None);
        Assert.True(r2.RateLimited); Assert.Equal(0, calls);                                                                  // still backing off: nothing is sent
        c.Now = c.Now.AddSeconds(61); calls = 0; await f.FlushAsync(CancellationToken.None);
        Assert.True(calls > 0);                                                                                              // resumes
    }

    [Fact]
    public async Task A_missing_retry_after_defaults_to_one_minute()
    {
        var s = new Store(3); var c = new Clock();
        var f = new QueueFlusher(s, (_, _) => Task.FromResult((SendOutcome.RateLimited, (TimeSpan?)null)), c.Get);
        await f.FlushAsync(CancellationToken.None); Assert.Equal(c.Now.AddSeconds(60), f.BackoffUntil);
    }

    [Fact]
    public async Task A_real_failure_counts_against_the_item_and_stops_in_order()
    {
        var s = new Store(5); var c = new Clock(); int calls = 0;
        var f = new QueueFlusher(s, (_, _) => { calls++; return Task.FromResult(calls == 1 ? (SendOutcome.Ok, (TimeSpan?)null) : (SendOutcome.Failed, (TimeSpan?)null)); }, c.Get);
        var r = await f.FlushAsync(CancellationToken.None);
        Assert.Equal(1, r.Delivered); Assert.Equal(1, r.Failed); Assert.False(r.RateLimited);
        Assert.Equal(4, s.Items.Count); Assert.Equal(1, s.Attempts[2]); Assert.Equal(2, calls);
    }

    [Fact]
    public async Task An_exception_in_the_sender_is_a_failure_not_a_crash()
    {
        var s = new Store(2);
        var f = new QueueFlusher(s, (_, _) => throw new InvalidOperationException("boom"));
        var r = await f.FlushAsync(CancellationToken.None); Assert.Equal(1, r.Failed); Assert.Equal(2, s.Items.Count);
    }

    [Fact]
    public async Task Cancellation_is_not_swallowed()
    {
        var s = new Store(2); using var cts = new CancellationTokenSource();
        var f = new QueueFlusher(s, (_, ct) => { cts.Cancel(); ct.ThrowIfCancellationRequested(); return Task.FromResult((SendOutcome.Ok, (TimeSpan?)null)); });
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => f.FlushAsync(cts.Token));
    }

    [Fact]
    public async Task An_empty_queue_is_a_no_op()
    {
        var f = new QueueFlusher(new Store(0), (_, _) => throw new Exception("must not be called"));
        var r = await f.FlushAsync(CancellationToken.None); Assert.Equal(0, r.Delivered); Assert.False(r.BudgetReached);
    }
}
