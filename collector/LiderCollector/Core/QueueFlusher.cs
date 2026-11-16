namespace LiderCollector.Core;

public enum SendOutcome { Ok, RateLimited, Failed }

/// <summary>What the flusher needs from the offline queue (implemented by <see cref="LocalQueue"/>, faked in tests).</summary>
public interface IQueueStore
{
    IReadOnlyList<LocalQueue.QueueItem> Peek(int count = 10);
    void Acknowledge(long id);
    void IncrementAttempts(long id);
}

public sealed record FlushStats(int Delivered, int Failed, bool RateLimited, bool BudgetReached);

/// <summary>
/// Drains the offline queue WITHOUT bursts. The server answers HTTP 429 above 60 requests per minute per address; flushing a backlog of hundreds in one go (the old behaviour) got the
/// heartbeat rejected and made a healthy Collector look offline (seen in the ITMANAGAMENT pilot: 161 queued items, 429, "Heartbeat missed").
/// Rules: at most <c>maxPerMinute</c> sends in any 60 s window, at most <c>maxItemsPerCall</c> per call (the main loop is never blocked for long), HTTP 429 stops the flush and is NOT
/// counted against the item (no attempt increment), the next flush waits for Retry-After (default 60 s). A real failure increments the item's attempts and stops (server unreachable).
/// </summary>
public sealed class QueueFlusher
{
    private readonly IQueueStore _store;
    private readonly Func<LocalQueue.QueueItem, CancellationToken, Task<(SendOutcome Outcome, TimeSpan? RetryAfter)>> _send;
    private readonly Func<DateTime> _now;
    private readonly int _maxPerMinute, _maxItemsPerCall;
    private readonly Queue<DateTime> _window = new();
    private DateTime _backoffUntil = DateTime.MinValue;

    public QueueFlusher(IQueueStore store, Func<LocalQueue.QueueItem, CancellationToken, Task<(SendOutcome, TimeSpan?)>> send, Func<DateTime>? now = null, int maxPerMinute = 30, int maxItemsPerCall = 20)
    {
        _store = store; _send = send; _now = now ?? (() => DateTime.UtcNow);
        _maxPerMinute = Math.Max(1, maxPerMinute); _maxItemsPerCall = Math.Max(1, maxItemsPerCall);
    }

    public DateTime BackoffUntil => _backoffUntil;

    public async Task<FlushStats> FlushAsync(CancellationToken ct)
    {
        int delivered = 0, failed = 0;
        if (_now() < _backoffUntil) return new FlushStats(0, 0, true, false);
        while (!ct.IsCancellationRequested)
        {
            if (delivered + failed >= _maxItemsPerCall) return new FlushStats(delivered, failed, false, true);
            var now = _now();
            while (_window.Count > 0 && now - _window.Peek() >= TimeSpan.FromSeconds(60)) _window.Dequeue();
            if (_window.Count >= _maxPerMinute) return new FlushStats(delivered, failed, false, true);   // pace: the rest goes out on a later tick

            var batch = _store.Peek(1);
            if (batch.Count == 0) break;
            var item = batch[0];
            (SendOutcome outcome, TimeSpan? retry) r;
            try { r = await _send(item, ct); }
            catch (OperationCanceledException) { throw; }
            catch { r = (SendOutcome.Failed, null); }
            _window.Enqueue(_now());

            if (r.outcome == SendOutcome.Ok) { _store.Acknowledge(item.Id); delivered++; }
            else if (r.outcome == SendOutcome.RateLimited)
            {
                _backoffUntil = _now() + (r.retry is { } t && t > TimeSpan.Zero ? t : TimeSpan.FromSeconds(60));
                return new FlushStats(delivered, failed, true, false);
            }
            else { _store.IncrementAttempts(item.Id); failed++; break; }   // server unreachable: stop, keep order
        }
        return new FlushStats(delivered, failed, false, false);
    }
}
