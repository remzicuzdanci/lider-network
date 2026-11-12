namespace LiderCollector.Core;

/// <summary>
/// Sends one inventory cycle through <see cref="DeltaSync"/>: plan → send → apply the server's acknowledgement →
/// (if the server asks) resend the cycle in full. Transport-agnostic so the whole protocol is unit-testable.
/// </summary>
public sealed class InventoryDispatcher
{
    public sealed record Outcome(bool Delivered, object? ToQueue, int Requests, bool WasDelta, int ModulesSent);

    private readonly DeltaSync _delta;
    private readonly Func<object, CancellationToken, Task<ApiClient.ApiResult?>> _send;

    public InventoryDispatcher(DeltaSync delta, Func<object, CancellationToken, Task<ApiClient.ApiResult?>> send)
    {
        _delta = delta;
        _send = send;
    }

    /// <param name="all">all module results of this cycle</param>
    /// <param name="build">builds the wire payload for a plan (modules + the sync block when plan.IncludeSync)</param>
    public async Task<Outcome> RunAsync(Dictionary<string, object?> all, Func<DeltaSync.Plan, object> build,
        bool enabled, int fullIntervalSeconds, CancellationToken ct)
    {
        var plan = _delta.BuildPlan(all, fullIntervalSeconds, enabled);
        var res = await _send(build(plan), ct);
        if (res == null)
        {
            // nothing is known about what the server stored: forget the cache; what is queued is always a COMPLETE inventory
            _delta.Invalidate();
            return new Outcome(false, build(_delta.BuildFullPlan(all)), 1, plan.Delta, plan.Modules.Count);
        }
        if (!plan.IncludeSync)
            return new Outcome(true, null, 1, false, plan.Modules.Count);

        var resync = _delta.Apply(plan, res.Sync);
        int requests = 1;
        int sent = plan.Modules.Count;
        if (resync.Count > 0)
        {
            // the server cannot vouch for something we skipped: send the whole cycle again, right now, from the data already collected
            var full = _delta.BuildFullPlan(all);
            var res2 = await _send(build(full), ct);
            requests++;
            sent += full.Modules.Count;
            if (res2 == null)
            {
                _delta.Invalidate();
                return new Outcome(false, build(full), requests, plan.Delta, sent);
            }
            _delta.Apply(full, res2.Sync);          // a second resync request is ignored: the next cycle starts from an empty/partial cache
        }
        return new Outcome(true, null, requests, plan.Delta, sent);
    }
}
