using System.Text.Json;
using System.Text.Json.Serialization;

namespace LiderCollector.Updater;

/// <summary>
/// Writes structured JSON audit log entries for each update phase.
/// Never logs sensitive data (API keys, tokens, credentials).
/// Log file: %ProgramData%\LiderNetwork\LiderCollector\update-audit.log
/// </summary>
internal sealed class UpdateAuditLogger
{
    private readonly string _logPath;
    private readonly string _correlationId;

    private static readonly JsonSerializerOptions _opts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public UpdateAuditLogger(string dataPath, string correlationId)
    {
        _logPath       = Path.Combine(dataPath, "update-audit.log");
        _correlationId = correlationId;
    }

    public void Log(string phase, string status, string? message = null, string? errorCode = null)
    {
        var entry = new AuditEntry
        {
            Timestamp     = DateTimeOffset.UtcNow.ToString("O"),
            CorrelationId = _correlationId,
            Phase         = phase,
            Status        = status,
            Message       = message,
            ErrorCode     = errorCode,
        };

        try
        {
            string line = JsonSerializer.Serialize(entry, _opts);
            File.AppendAllText(_logPath, line + Environment.NewLine);
        }
        catch
        {
            // Audit log failure must never crash the updater
        }
    }

    private sealed class AuditEntry
    {
        public string  Timestamp     { get; set; } = string.Empty;
        public string  CorrelationId { get; set; } = string.Empty;
        public string  Phase         { get; set; } = string.Empty;
        public string  Status        { get; set; } = string.Empty;
        public string? Message       { get; set; }
        public string? ErrorCode     { get; set; }
    }
}
