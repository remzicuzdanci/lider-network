using Microsoft.Extensions.Logging;
using System.Diagnostics;
using System.Text.Json.Serialization;

namespace LiderCollector.Modules;

/// <summary>
/// Collects recent Error and Warning events from System and Application logs.
/// Limits: last 24 hours, max 50 events total, message truncated to 500 chars.
/// Sensitive data masking: any event whose message contains a sensitive keyword
/// has its message replaced with [REDACTED] before transmission.
/// Reads backwards from the newest entry for efficiency — avoids scanning
/// tens of thousands of older entries.
/// </summary>
public sealed class EventLogModule : ICollectorModule
{
    private readonly ILogger<EventLogModule> _log;
    public string Name => "event_log";

    private const int MaxEvents     = 50;
    private const int MessageMaxLen = 500;
    // Checked case-insensitively; whole message is redacted if any pattern matches
    private static readonly string[] SensitivePatterns =
        ["password", "passwd", "token", "secret", " key=", "credential", "pwd=", "apikey"];

    public EventLogModule(ILogger<EventLogModule> log) => _log = log;

    public Task<object?> RunAsync(CancellationToken ct)
    {
        try
        {
            var since  = DateTime.UtcNow.AddHours(-24);
            var events = new List<EventEntry>();

            foreach (string logName in new[] { "System", "Application" })
            {
                if (events.Count >= MaxEvents) break;
                CollectFromLog(logName, since, events);
            }

            return Task.FromResult<object?>(new EventLogPayload
            {
                Events      = events,
                Since       = since.ToString("o"),
                CollectedAt = DateTime.UtcNow.ToString("o"),
            });
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "EventLogModule failed");
            return Task.FromResult<object?>(null);
        }
    }

    private static void CollectFromLog(string logName, DateTime since, List<EventEntry> events)
    {
        try
        {
            using var log = new EventLog(logName);
            int count = log.Entries.Count;
            // Scan from newest entry backward; stop at LookbackDays boundary
            for (int i = count - 1; i >= 0 && events.Count < MaxEvents; i--)
            {
                EventLogEntry? e = null;
                try { e = log.Entries[i]; }
                catch { continue; } // entry may disappear during iteration

                var utc = e.TimeGenerated.ToUniversalTime();
                if (utc < since) break; // older entries won't qualify

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
                    Level      = e.EntryType == EventLogEntryType.Error ? "error" : "warning",
                    Message    = MaskSensitive(msg),
                    OccurredAt = utc.ToString("o"),
                });
            }
        }
        catch
        {
            // Log may be inaccessible (permissions, corrupted) — skip silently
        }
    }

    private static string? MaskSensitive(string? msg)
    {
        if (string.IsNullOrEmpty(msg)) return msg;
        foreach (string pattern in SensitivePatterns)
        {
            if (msg.Contains(pattern, StringComparison.OrdinalIgnoreCase))
                return "[REDACTED]";
        }
        return msg;
    }

    // ── Payload DTOs ──────────────────────────────────────────────────────────

    public sealed class EventLogPayload
    {
        [JsonPropertyName("events")]       public List<EventEntry> Events      { get; set; } = new();
        [JsonPropertyName("since")]        public string?          Since       { get; set; }
        [JsonPropertyName("collected_at")] public string?          CollectedAt { get; set; }
    }

    public sealed class EventEntry
    {
        [JsonPropertyName("log_name")]    public string? LogName    { get; set; }
        [JsonPropertyName("source")]      public string? Source     { get; set; }
        [JsonPropertyName("event_id")]    public int     EventId    { get; set; }
        [JsonPropertyName("level")]       public string? Level      { get; set; }
        [JsonPropertyName("message")]     public string? Message    { get; set; }
        [JsonPropertyName("occurred_at")] public string? OccurredAt { get; set; }
    }
}
