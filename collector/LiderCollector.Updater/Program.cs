using LiderCollector.Updater;
using Microsoft.Extensions.Logging;
using Serilog;
using System.Text.Json;

// ── Bootstrap ──────────────────────────────────────────────────────────────────
// The updater is invoked by the main CollectorWorker when it detects a pending update.
// It runs as a short-lived console process (not a Windows service) with elevated
// privileges inherited from the service host, then exits.
//
// Exit codes:
//   0 — update succeeded
//   1 — update skipped (no manifest, MSI running, already up-to-date)
//   2 — update failed; details in audit log and Windows Event Log
//
// Arguments: [data-path] [trigger-file-path]  (both optional; defaults used if absent)

var correlationId = Guid.NewGuid().ToString("N")[..12];

// ── Load config ───────────────────────────────────────────────────────────────
var cfg = UpdaterConfig.Load();

// ── Configure logging ─────────────────────────────────────────────────────────
var serilog = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File(
        Path.Combine(cfg.DataPath, "updater-.log"),
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 7,
        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
    .Enrich.WithProperty("CorrelationId", correlationId)
    .CreateLogger();

using var loggerFactory = LoggerFactory.Create(b => b.AddSerilog(serilog, dispose: true));
var log = loggerFactory.CreateLogger<UpdateOrchestrator>();

var audit = new UpdateAuditLogger(cfg.DataPath, correlationId);
audit.Log("startup", "started", $"pid={Environment.ProcessId} correlation={correlationId}");

// ── Validate config ───────────────────────────────────────────────────────────
if (string.IsNullOrEmpty(cfg.ServerUrl))
{
    audit.Log("startup", "failed", "server_url not configured");
    log.LogError("server_url not configured in config.json; cannot proceed");
    return 2;
}

if (string.IsNullOrEmpty(cfg.ApiKey))
{
    audit.Log("startup", "failed", "api_key not available (not enrolled or DPAPI error)");
    log.LogError("API key not available; collector may not be enrolled");
    return 2;
}

// ── Read trigger file ─────────────────────────────────────────────────────────
string triggerPath = args.Length >= 2
    ? args[1]
    : Path.Combine(cfg.DataPath, "update-trigger.json");

if (!File.Exists(triggerPath))
{
    audit.Log("startup", "skipped", "trigger file not found");
    log.LogInformation("No update-trigger.json found; nothing to do");
    return 1;
}

UpdateTrigger? trigger;
try
{
    string json = File.ReadAllText(triggerPath);
    trigger = JsonSerializer.Deserialize<UpdateTrigger>(json, new JsonSerializerOptions
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
    });
}
catch (Exception ex)
{
    audit.Log("startup", "failed", $"trigger_parse_error: {ex.Message}");
    log.LogError(ex, "Failed to parse update-trigger.json");
    return 2;
}

if (trigger is null || string.IsNullOrEmpty(trigger.TargetVersion))
{
    audit.Log("startup", "skipped", "trigger has no target_version");
    return 1;
}

log.LogInformation("Update requested: target_version={Ver} requested_at={At}",
    trigger.TargetVersion, trigger.RequestedAt);

// ── Run orchestrator ──────────────────────────────────────────────────────────
using var apiClient   = new UpdateApiClient(cfg.ServerUrl, cfg.ApiKey);
var       orchestrator = new UpdateOrchestrator(cfg, apiClient, audit, correlationId, log);

using var cts = new CancellationTokenSource(TimeSpan.FromMinutes(30)); // hard timeout

bool success = await orchestrator.RunAsync(trigger, cts.Token);

audit.Log("shutdown", success ? "success" : "failed");
return success ? 0 : 2;
