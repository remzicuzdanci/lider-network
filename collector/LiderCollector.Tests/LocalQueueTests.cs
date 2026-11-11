using LiderCollector.Core;
using Xunit;

namespace LiderCollector.Tests;

/// <summary>Offline queue: nothing is lost during an outage or a service restart; delivery is FIFO and at-least-once.</summary>
public class LocalQueueTests : IDisposable
{
    private readonly string _dir = Path.Combine(Path.GetTempPath(), "lq-" + Guid.NewGuid().ToString("N"));
    private string Db => Path.Combine(_dir, "queue.db");

    public LocalQueueTests() => Directory.CreateDirectory(_dir);

    public void Dispose()
    {
        Microsoft.Data.Sqlite.SqliteConnection.ClearAllPools();
        try { Directory.Delete(_dir, true); } catch { /* best effort */ }
    }

    [Fact]
    public void Items_survive_a_service_restart_and_come_back_in_order()
    {
        using (var q = new LocalQueue(Db))
        {
            for (int i = 1; i <= 5; i++) q.Enqueue("inventory", new { seq = i });
        }
        using var reopened = new LocalQueue(Db);
        Assert.Equal(5, reopened.Count());
        var items = reopened.Peek(10);
        Assert.Equal(new[] { 1, 2, 3, 4, 5 }, items.Select(x => System.Text.Json.JsonDocument.Parse(x.PayloadJson).RootElement.GetProperty("seq").GetInt32()));
    }

    [Fact]
    public void An_item_is_removed_only_after_it_is_acknowledged()
    {
        using var q = new LocalQueue(Db);
        q.Enqueue("inventory", new { a = 1 });
        var first = q.Peek(1)[0];
        Assert.Equal(1, q.Count());                 // peeking never removes
        Assert.Equal(1, q.Peek(1).Count);
        q.IncrementAttempts(first.Id);              // a failed delivery keeps the item
        Assert.Equal(1, q.Count());
        Assert.Equal(1, q.Peek(1)[0].Attempts);
        q.Acknowledge(first.Id);                    // delivered
        Assert.Equal(0, q.Count());
    }

    [Fact]
    public void Only_poison_items_are_purged_and_healthy_ones_are_kept()
    {
        using var q = new LocalQueue(Db);
        q.Enqueue("inventory", new { poison = true });
        q.Enqueue("inventory", new { ok = true });
        var poison = q.Peek(2)[0];
        for (int i = 0; i < 20; i++) q.IncrementAttempts(poison.Id);
        q.PurgeExceeded(20);
        Assert.Equal(1, q.Count());
        Assert.Contains("ok", q.Peek(1)[0].PayloadJson);
    }

    [Fact]
    public async Task Concurrent_enqueues_are_all_stored()
    {
        using var q = new LocalQueue(Db);
        await Task.WhenAll(Enumerable.Range(0, 50).Select(i => Task.Run(() => q.Enqueue("inventory", new { i }))));
        Assert.Equal(50, q.Count());
    }
}
