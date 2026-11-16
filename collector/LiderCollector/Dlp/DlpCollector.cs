using System.Text.Json;
using Microsoft.Extensions.Logging;
using LiderCollector.Core;

namespace LiderCollector.Dlp;

/// <summary>A DLP source (print log, USB ...). Reads events after a stored position; knows nothing about transport.</summary>
public interface IDlpSource
{
    string Name { get; }
    bool IsEnabled(DlpConfig cfg);
    /// <summary>false + reason when the source cannot work on this computer (log channel missing, no permission ...). Not an error: it is reported once and retried later.</summary>
    bool Prepare(DlpConfig cfg, out string? problem);
    IReadOnlyList<(long Position, DlpEvent Event)> ReadNew(long afterPosition, int max, DlpConfig cfg);
}

/// <summary>Where the read position of every source is kept between runs / restarts (so events are neither lost nor re-read).</summary>
public interface IDlpStateStore { long Get(string source); void Set(string source, long position); }

public interface IQueueSink { void Enqueue(string endpoint, object payload); long Count(); }

public sealed class FileDlpState : IDlpStateStore
{
    private readonly string _path; private readonly Dictionary<string, long> _v;
    public FileDlpState(string dataPath)
    {
        _path = Path.Combine(dataPath, "dlp-state.json");
        try { _v = File.Exists(_path) ? JsonSerializer.Deserialize<Dictionary<string, long>>(File.ReadAllText(_path)) ?? new() : new(); } catch { _v = new(); }
    }
    public long Get(string source) => _v.TryGetValue(source, out var p) ? p : 0;
    public void Set(string source, long position)
    {
        _v[source] = position;
        string tmp = _path + ".tmp"; File.WriteAllText(tmp, JsonSerializer.Serialize(_v)); File.Move(tmp, _path, overwrite: true);   // atomic: a crash never leaves a half-written position
    }
}

public sealed record DlpRunResult(int Read, int Sent, int Queued, int Dropped);

/// <summary>State of one source, reported to the server in the heartbeat (no event data): ok | unavailable | error.</summary>
public sealed record DlpSourceStatus(string Source, string State, string? Message, DateTime AtUtc);

/// <summary>
/// Polls the enabled sources, delivers the events in batches (server when online, the offline queue otherwise or when the server says no) and only THEN moves the read position:
/// at-least-once delivery, the server removes duplicates by event uid. Bounded everywhere: events per poll, events per request, rows of the offline queue.
/// </summary>
public sealed class DlpCollector
{
    private readonly DlpConfig _cfg; private readonly IReadOnlyList<IDlpSource> _sources; private readonly IDlpStateStore _state;
    private readonly Func<IReadOnlyList<DlpEvent>, CancellationToken, Task<SendOutcome>> _send; private readonly IQueueSink _queue; private readonly ILogger _log;
    private readonly HashSet<string> _reported = new();
    private readonly Dictionary<string, DlpSourceStatus> _status = new();

    /// <summary>Per enabled source: the latest state. Empty while DLP is off (nothing to report).</summary>
    public IReadOnlyList<DlpSourceStatus> Status() => !_cfg.Enabled ? Array.Empty<DlpSourceStatus>() : _status.Values.OrderBy(s => s.Source).ToList();
    private void Set(string source, string state, string? msg) => _status[source] = new DlpSourceStatus(source, state, msg is { Length: > 200 } ? msg[..200] : msg, DateTime.UtcNow);

    public DlpCollector(DlpConfig cfg, IEnumerable<IDlpSource> sources, IDlpStateStore state, Func<IReadOnlyList<DlpEvent>, CancellationToken, Task<SendOutcome>> send, IQueueSink queue, ILogger log)
    { _cfg = cfg; _sources = sources.ToList(); _state = state; _send = send; _queue = queue; _log = log; }

    public async Task<DlpRunResult> RunAsync(bool online, CancellationToken ct)
    {
        int read = 0, sent = 0, queued = 0, dropped = 0;
        if (!_cfg.Enabled) return new(0, 0, 0, 0);
        foreach (var src in _sources)
        {
            if (!src.IsEnabled(_cfg)) continue;
            if (!src.Prepare(_cfg, out var problem))
            {
                if (_reported.Add(src.Name + problem)) _log.LogWarning("DLP source {Source} is not available: {Problem}", src.Name, problem);
                Set(src.Name, "unavailable", problem);
                continue;
            }
            long pos = _state.Get(src.Name);
            IReadOnlyList<(long Position, DlpEvent Event)> items;
            try { items = src.ReadNew(pos, _cfg.EffectiveMaxPerPoll, _cfg); }
            catch (Exception ex) when (ex is not OperationCanceledException) { _log.LogWarning(ex, "DLP source {Source} could not be read", src.Name); Set(src.Name, "error", ex.GetType().Name + ": " + ex.Message); continue; }
            Set(src.Name, "ok", null);
            read += items.Count;

            for (int i = 0; i < items.Count; i += _cfg.EffectiveMaxBatch)
            {
                ct.ThrowIfCancellationRequested();
                var chunk = items.Skip(i).Take(_cfg.EffectiveMaxBatch).ToList(); var events = chunk.Where(c => c.Event.Type != "skipped").Select(c => c.Event).ToList();
                if (events.Count == 0) { _state.Set(src.Name, chunk[^1].Position); continue; }   // only unparsable records: just move past them
                var outcome = online ? await _send(events, ct) : SendOutcome.Failed;
                if (outcome == SendOutcome.Ok) { sent += events.Count; online = true; }
                else
                {
                    if (_queue.Count() >= _cfg.MaxQueuedRows)
                    {   // no unbounded growth: stop here WITHOUT moving the position, the source log keeps the rest
                        dropped += items.Count - i; _log.LogWarning("DLP: the offline queue is full ({Max} rows); {Left} event(s) stay in the {Source} log for the next poll.", _cfg.MaxQueuedRows, items.Count - i, src.Name);
                        break;
                    }
                    _queue.Enqueue("dlp-events", new { events = events.Select(e => e.ToWire()).ToList() });
                    queued += events.Count; online = false;   // after a failure the rest of this poll goes straight to the queue
                }
                _state.Set(src.Name, chunk[^1].Position);       // moved only after delivery or queueing
            }
        }
        if (sent + queued > 0) _log.LogInformation("DLP: {Sent} event(s) sent, {Queued} queued.", sent, queued);
        return new(read, sent, queued, dropped);
    }
}
