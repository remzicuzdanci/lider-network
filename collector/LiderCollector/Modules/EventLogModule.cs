using Microsoft.Extensions.Logging;
using System.Diagnostics;
using System.Text.Json.Serialization;

namespace LiderCollector.Modules;

/// <summary>
/// Collects recent Error and Warning events from System and Application logs.
///
/// Incremental collection via RecordId bookmark (TD-2):
///   - EventLogEntry.Index is the Windows EventLog RecordId (monotonically increasing).
///   - CollectorState.EventLogCursors stores the last seen RecordId per log.
///   - Only events with RecordId > cursor are returned, so no duplicates even after
///     an offline period of arbitrary length.
///   - Safety net: entries older than MaxLookbackDays (7) are skipped on first run.
///
/// Limits: max 50 events total per cycle, message truncated to 500 chars.
/// Sensitive data masking: messages containing a sensitive keyword are replaced
/// with [REDACTED] before transmission.
/// </summary>
public sealed class EventLogModule : ICollectorModule
{
    private readonly ILogger<EventLogModule> _log;
    private readonly CollectorState _state;

    public string Name => "event_log";

    private const int MaxEvents       = 50;
    private const int MessageMaxLen   = 500;
    private const int MaxLookbackDays = 7; // safety net for first run / very long offline

    public EventLogModule(ILogger<EventLogModule> log, CollectorState state)
    {
        _log   = log;
        _state = state;
    }

    public Task<object?> RunAsync(CancellationToken ct)
    {
        try
        {
            var cutoff = DateTime.UtcNow.AddDays(-MaxLookbackDays);
            var events = new List<EventEntry>();

            foreach (string logName in new[] { "System", "Application" })
            {
                if (events.Count >= MaxEvents) break;
                CollectFromLog(logName, cutoff, events);
            }

            // State is NOT saved here — CollectorWorker saves it after confirmed delivery
            // (at-least-once: cursor advances on queue-or-send; server deduplicates by RecordId)

            return Task.FromResult<object?>(new EventLogPayload
            {
                Events      = events,
                CollectedAt = DateTime.UtcNow.ToString("o"),
            });
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "EventLogModule failed");
            return Task.FromResult<object?>(null);
        }
    }

    private void CollectFromLog(string logName, DateTime cutoff, List<EventEntry> events)
    {
        try
        {
            using var log = new EventLog(logName);
            int count          = log.Entries.Count;
            long cursor        = _state.EventLogCursors.GetValueOrDefault(logName, 0);
            long maxRecordId   = cursor;

            // Scan newest → oldest; stop when we hit an already-seen entry
            for (int i = count - 1; i >= 0 && events.Count < MaxEvents; i--)
            {
                EventLogEntry? e = null;
                try { e = log.Entries[i]; }
                catch { continue; } // entry may disappear during iteration

                long recordId = e.Index; // Windows EventLog RecordId
                if (recordId <= cursor) break; // already processed

                var utc = e.TimeGenerated.ToUniversalTime();
                if (utc < cutoff) break; // safety net for first run

                if (e.EntryType != EventLogEntryType.Error &&
                    e.EntryType != EventLogEntryType.Warning)
                    continue;

                string? msg = e.Message;
                if (msg?.Length > MessageMaxLen) msg = msg[..MessageMaxLen];

                events.Add(new EventEntry
                {
                    LogName    = logName,
                    Source     = e.Source,
                    EventId    = (int)(e.InstanceId & 0xFFFF),
                    RecordId   = recordId,
                    Level      = e.EntryType == EventLogEntryType.Error ? "error" : "warning",
                    Message    = MaskSensitive(msg),
                    OccurredAt = utc.ToString("o"),
                });

                if (recordId > maxRecordId) maxRecordId = recordId;
            }

            if (maxRecordId > cursor)
                _state.EventLogCursors[logName] = maxRecordId;
        }
        catch
        {
            // Log may be inaccessible (permissions, corrupted) — skip silently
        }
    }

    private static string? MaskSensitive(string? msg) => SensitiveFilter.Mask(msg);

    // ── Payload DTOs ──────────────────────────────────────────────────────────

    public sealed class EventLogPayload
    {
        [JsonPropertyName("events")]       public List<EventEntry> Events      { get; set; } = new();
        [JsonPropertyName("collected_at")] public string?          CollectedAt { get; set; }
    }

    public sealed class EventEntry
    {
        [JsonPropertyName("log_name")]    public string? LogName    { get; set; }
        [JsonPropertyName("source")]      public string? Source     { get; set; }
        [JsonPropertyName("event_id")]    public int     EventId    { get; set; }
        [JsonPropertyName("record_id")]   public long    RecordId   { get; set; }
        [JsonPropertyName("level")]       public string? Level      { get; set; }
        [JsonPropertyName("message")]     public string? Message    { get; set; }
        [JsonPropertyName("occurred_at")] public string? OccurredAt { get; set; }
    }
}
