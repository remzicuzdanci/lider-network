using LiderCollector.Core;
using LiderCollector.Enrollment;
using LiderCollector.Modules;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace LiderCollector;

/// <summary>
/// Main background worker.  Orchestrates:
///   • Enrollment (once, if not yet enrolled)
///   • Heartbeat every HeartbeatIntervalSeconds (default 60s)
///   • Inventory sync every InventorySyncIntervalSeconds (default 900s)
///   • Performance metrics every PerformanceIntervalSeconds (default 120s)
///   • Offline queue flush whenever connectivity is restored
/// </summary>
public sealed class CollectorWorker : BackgroundService
{
    private readonly CollectorConfig _config;
    private readonly SecureStorage _secure;
    private readonly LocalQueue _queue;
    private readonly DeviceIdentity _identity;
    private readonly ApiClient _api;
    private readonly BootstrapEnrollment _bootstrap;
    private readonly ILogger<CollectorWorker> _log;

    private readonly IReadOnlyList<ICollectorModule> _modules;
    private readonly CollectorState _state;

    // Connectivity state tracking for offline queue management
    private bool _lastOnline = true;
    private int _consecutiveMissedHeartbeats = 0;
    // Auth failure tracking — count transient 401s without wiping credentials
    private int _consecutiveAuthFailures = 0;
    private const int AuthFailureWarningThreshold = 5;

    private static readonly JsonSerializerOptions _jsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public CollectorWorker(
        CollectorConfig config,
        SecureStorage secure,
        LocalQueue queue,
        DeviceIdentity identity,
        ApiClient api,
        BootstrapEnrollment bootstrap,
        ILogger<CollectorWorker> log,
        ILoggerFactory loggerFactory)
    {
        _config = config;
        _secure = secure;
        _queue = queue;
        _identity = identity;
        _api = api;
        _bootstrap = bootstrap;
        _log = log;

        _state = CollectorState.Load();

        _modules = new List<ICollectorModule>
        {
            new SystemInfoModule(loggerFactory.CreateLogger<SystemInfoModule>()),
            new NetworkModule(loggerFactory.CreateLogger<NetworkModule>()),
            new SoftwareModule(loggerFactory.CreateLogger<SoftwareModule>()),
            new PerformanceModule(loggerFactory.CreateLogger<PerformanceModule>()),
            new WindowsUpdateModule(loggerFactory.CreateLogger<WindowsUpdateModule>()),
            new EventLogModule(loggerFactory.CreateLogger<EventLogModule>(), _state),
        };
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _log.LogInformation("CollectorWorker starting. Server={Server}", _config.ServerUrl);

        // ── HTTPS enforcement ─────────────────────────────────────────────────
        // Allow HTTP only when explicitly opt-in (development environments).
        // Production deployments must use HTTPS; a plain-HTTP ServerUrl is a
        // critical misconfiguration that sends API keys and inventory data in clear.
        if (!_config.AllowHttp &&
            _config.ServerUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase))
        {
            _log.LogCritical(
                "ServerUrl uses plain HTTP but AllowHttp=false (production default). " +
                "Update collector.json with an HTTPS URL, or set allow_http=true for development only. " +
                "ServerUrl={Url}", _config.ServerUrl);
            return; // stop the worker; SCM will not auto-restart
        }

        // ── Enrollment ─────────────────────────────────────────────────────────
        // Runs on first start and after server-driven re-enrollment (HeartbeatAsync 401).
        if (!_config.IsEnrolled || !_secure.Has("api_key"))
        {
            await EnrollWithRetryAsync(stoppingToken);
        }

        if (!_config.IsEnrolled)
        {
            _log.LogCritical("Enrollment failed. Cannot continue without a valid API key.");
            return;
        }

        var identity = _identity.Collect();

        // Flush any items queued during a previous offline session before starting the loop.
        long pending = _queue.Count();
        if (pending > 0)
        {
            _log.LogInformation("Startup: {Count} queued item(s) from prior offline session — flushing.", pending);
            await FlushQueueAsync(stoppingToken);
        }

        DateTime nextInventory = DateTime.UtcNow; // Run immediately on first start
        DateTime nextPerf     = DateTime.UtcNow;
        DateTime nextEventLog = DateTime.UtcNow;

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // ── Re-enrollment check (after server-driven revocation) ──────
                if (!_config.IsEnrolled || !_secure.Has("api_key"))
                {
                    _log.LogInformation("Agent is not enrolled — running enrollment.");
                    await EnrollWithRetryAsync(stoppingToken);
                    if (!_config.IsEnrolled)
                    {
                        _log.LogWarning("Re-enrollment failed. Waiting before retry.");
                        await Task.Delay(TimeSpan.FromSeconds(_config.HeartbeatIntervalSeconds), stoppingToken);
                        continue;
                    }
                    // Update identity after re-enrollment
                    identity = _identity.Collect();
                }

                // ── Heartbeat ─────────────────────────────────────────────────
                var (heartbeatOk, pendingUpdate) = await HeartbeatAsync(identity, stoppingToken);

                if (heartbeatOk)
                {
                    _consecutiveMissedHeartbeats = 0;
                    _consecutiveAuthFailures = 0;
                    if (!_lastOnline)
                    {
                        _log.LogInformation("Connectivity restored. Flushing offline queue ({Count} items).",
                            _queue.Count());
                        await FlushQueueAsync(stoppingToken);
                    }
                    _lastOnline = true;

                    if (pendingUpdate != null)
                        TriggerUpdate(pendingUpdate);
                }
                else
                {
                    // After explicit revocation, IsEnrolled is now false — go back to re-enrollment check
                    if (!_config.IsEnrolled) continue;

                    _consecutiveMissedHeartbeats++;
                    _lastOnline = false;
                    _log.LogWarning("Heartbeat missed. Consecutive misses: {Count}/{Threshold}",
                        _consecutiveMissedHeartbeats,
                        _config.OfflineThresholdMissedHeartbeats);
                }

                // ── Inventory sync ────────────────────────────────────────────
                if (DateTime.UtcNow >= nextInventory)
                {
                    await RunInventorySyncAsync(identity, stoppingToken);
                    nextInventory = DateTime.UtcNow.AddSeconds(_config.InventorySyncIntervalSeconds);
                }

                // ── Performance metrics ───────────────────────────────────────
                if (DateTime.UtcNow >= nextPerf)
                {
                    await RunPerformanceAsync(identity, stoppingToken);
                    nextPerf = DateTime.UtcNow.AddSeconds(_config.PerformanceIntervalSeconds);
                }

                // ── Event log (fast, incremental cycle) ───────────────────────
                if (DateTime.UtcNow >= nextEventLog)
                {
                    await RunEventLogAsync(identity, stoppingToken);
                    nextEventLog = DateTime.UtcNow.AddSeconds(_config.EventLogIntervalSeconds);
                }
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex)
            {
                _log.LogError(ex, "CollectorWorker unhandled error in main loop");
            }

            // Tick at the finest-grained interval so no schedule is missed.
            int tickSeconds = Math.Min(
                _config.HeartbeatIntervalSeconds,
                _config.EventLogIntervalSeconds);
            await Task.Delay(
                TimeSpan.FromSeconds(tickSeconds),
                stoppingToken);
        }

        _log.LogInformation("CollectorWorker stopped.");
    }

    // ── Enrollment ────────────────────────────────────────────────────────────

    private async Task EnrollWithRetryAsync(CancellationToken ct)
    {
        // 1. enrollment.json takes priority over any DPAPI-cached token.
        //    Rationale: if a previous enrollment attempt failed and the server rejected
        //    the token, the admin may have deployed a fresh enrollment.json.  Keeping the
        //    stale DPAPI token would prevent re-enrollment indefinitely.
        //    Token is NEVER logged — only server_url is logged by BootstrapEnrollment.
        var bootstrap = _bootstrap.TryRead();
        if (bootstrap != null)
        {
            // Override server URL from bootstrap if it differs (supports first-run from GPO)
            if (!string.IsNullOrWhiteSpace(bootstrap.ServerUrl) &&
                bootstrap.ServerUrl != _config.ServerUrl)
            {
                _log.LogInformation(
                    "Server URL updated from bootstrap enrollment. NewUrl={Url}",
                    bootstrap.ServerUrl);
                _config.ServerUrl = bootstrap.ServerUrl;
                _config.Save();
            }

            // Store new token in DPAPI, overwriting any stale previous token.
            // The bootstrap file is already deleted by TryRead().
            _secure.Set("enroll_token", bootstrap.EnrollmentToken);
        }

        string? enrollToken = _secure.Get("enroll_token");

        if (string.IsNullOrEmpty(enrollToken))
        {
            _log.LogCritical(
                "No enrollment token found. " +
                "Deploy enrollment.json to %ProgramData%\\LiderCollector\\ " +
                "or use the IT console to re-issue a bootstrap token.");
            return;
        }

        // 2. Clone / re-image detection (heuristic only — BIOS UUID alone is insufficient).
        //    Primary re-enrollment trigger is a 401 from the server (see HeartbeatAsync).
        //    Here we only log a warning; we do NOT auto-wipe CollectorId based on BIOS UUID
        //    because UUIDs can be non-unique across VMs, and a physical machine replacement
        //    intentionally reuses the same collector slot.
        var currentId = _identity.Collect();
        if (_config.IsEnrolled && !string.IsNullOrEmpty(_config.EnrolledBiosUuid) &&
            !string.IsNullOrEmpty(currentId.BiosUuid) &&
            _config.EnrolledBiosUuid != currentId.BiosUuid)
        {
            _log.LogWarning(
                "BIOS UUID mismatch: enrolled={Enrolled}, current={Current}. " +
                "This may indicate a cloned image, re-imaged machine, or VM UUID change. " +
                "If the server rejects this agent (401), re-enroll with a new enrollment.json.",
                _config.EnrolledBiosUuid, currentId.BiosUuid);
            // Update the stored UUID so we don't log this every startup.
            _config.EnrolledBiosUuid = currentId.BiosUuid;
            _config.Save();
        }

        // 3. Enroll with retry + exponential back-off
        int attempt = 0;
        while (!ct.IsCancellationRequested)
        {
            attempt++;
            _log.LogInformation("Enrollment attempt {N}...", attempt);
            try
            {
                var identity = _identity.Collect();
                var resp = await _api.EnrollAsync(enrollToken, identity, ct);
                if (resp?.ApiKey != null)
                {
                    _config.CollectorId          = resp.CollectorId;
                    _config.HeartbeatIntervalSeconds   = Math.Max(30, resp.SyncInterval > 0 ? 60 : 60);
                    _config.InventorySyncIntervalSeconds = resp.SyncInterval > 0 ? resp.SyncInterval : 900;
                    _config.EnrolledBiosUuid     = currentId.BiosUuid; // persist for clone detection
                    _config.Save();
                    _secure.Set("api_key", resp.ApiKey);
                    _secure.Delete("enroll_token"); // single-use — discard after successful enroll
                    _log.LogInformation("Enrolled successfully. CollectorId={Id}", _config.CollectorId);
                    return;
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _log.LogWarning(ex, "Enrollment attempt {N} failed", attempt);
            }

            int backoff = Math.Min(attempt * 10, 120);
            _log.LogInformation("Retrying enrollment in {Sec}s...", backoff);
            await Task.Delay(TimeSpan.FromSeconds(backoff), ct);
        }
    }

    // ── Heartbeat ─────────────────────────────────────────────────────────────

    /// <summary>
    /// Sends a heartbeat.
    /// Returns (true, pendingUpdate?) on success.
    /// Returns (false, null) on transient failure — credentials are NEVER wiped here.
    /// Only an explicit server revocation (HTTP 410, or 401+re_enroll_required) wipes
    /// credentials and sets IsEnrolled=false to trigger re-enrollment.
    /// </summary>
    private async Task<(bool Ok, PendingUpdateInfo? PendingUpdate)> HeartbeatAsync(
        DeviceIdentity.IdentityPayload identity, CancellationToken ct)
    {
        try
        {
            var (resp, status) = await _api.CheckinAsync(identity, ct);

            switch (status)
            {
                case ApiClient.HeartbeatStatus.Ok:
                    // Server can push interval updates
                    if (resp!.SyncInterval > 0 && resp.SyncInterval != _config.InventorySyncIntervalSeconds)
                    {
                        _config.InventorySyncIntervalSeconds = resp.SyncInterval;
                        _config.Save();
                    }
                    PendingUpdateInfo? update = null;
                    if (resp.UpdateAvailable && !string.IsNullOrEmpty(resp.ManifestVersion))
                        update = new PendingUpdateInfo(resp.ManifestVersion);
                    return (true, update);

                case ApiClient.HeartbeatStatus.ExplicitRevocation:
                    // Server has definitively revoked this agent — wipe credentials,
                    // trigger re-enrollment next iteration.
                    _log.LogWarning(
                        "Server has explicitly revoked this agent's API key. " +
                        "CollectorId={Id}. Clearing credentials — will re-enroll on next loop iteration.",
                        _config.CollectorId);
                    _secure.Delete("api_key");
                    _config.CollectorId = 0;
                    _config.EnrolledBiosUuid = null;
                    _config.Save();
                    _consecutiveAuthFailures = 0;
                    return (false, null);

                case ApiClient.HeartbeatStatus.TransientFailure:
                default:
                    // Credentials are PRESERVED. A transient 401, network error, or 5xx
                    // must NOT trigger re-enrollment — it would destroy a valid enrollment
                    // due to a momentary server issue or misconfiguration.
                    _consecutiveAuthFailures++;
                    if (_consecutiveAuthFailures >= AuthFailureWarningThreshold)
                    {
                        _log.LogWarning(
                            "Heartbeat failed {Count} consecutive times. " +
                            "CollectorId={Id}. Credentials preserved — will NOT re-enroll until server confirms revocation.",
                            _consecutiveAuthFailures, _config.CollectorId);
                    }
                    return (false, null);
            }
        }
        catch { return (false, null); }
    }

    // ── Update trigger ────────────────────────────────────────────────────────

    private void TriggerUpdate(PendingUpdateInfo info)
    {
        try
        {
            // Write a trigger file that the separate LiderCollectorUpdater process watches.
            // The updater handles download, verification, service stop/replace/start, and rollback.
            // The main service never modifies its own binary files.
            string triggerPath = Path.Combine(_config.DataPath, "update-trigger.json");
            string json = System.Text.Json.JsonSerializer.Serialize(new
            {
                requested_at = DateTimeOffset.UtcNow.ToString("O"),
                target_version = info.Version,
            });
            File.WriteAllText(triggerPath, json);
            _log.LogInformation(
                "Update trigger written for version {Version}. Updater will handle installation.",
                info.Version);
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "Failed to write update trigger file");
        }
    }

    private sealed record PendingUpdateInfo(string Version);

    // ── Inventory sync ────────────────────────────────────────────────────────

    private async Task RunInventorySyncAsync(DeviceIdentity.IdentityPayload identity, CancellationToken ct)
    {
        _log.LogInformation("Running inventory sync...");
        try
        {
            var data = new Dictionary<string, object?>();

            foreach (var module in _modules)
            {
                if (!IsModuleEnabled(module.Name)) continue;
                // Event log runs on its own faster schedule (RunEventLogAsync).
                // Skip it here to avoid double-delivery during inventory.
                if (module.Name == "event_log") continue;
                try
                {
                    var result = await module.RunAsync(ct);
                    if (result != null) data[module.Name] = result;
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    _log.LogWarning(ex, "Module {Name} error", module.Name);
                }
            }

            var payload = new InventoryPayload
            {
                CollectorId = _config.CollectorId,
                Hostname = identity.Hostname,
                Identifiers = BuildIdentifiersList(identity),
                CollectedAt = DateTime.UtcNow,
                Modules = data,
            };

            if (_lastOnline)
            {
                bool ok = await _api.SendInventoryAsync(payload, ct);
                if (!ok)
                {
                    _log.LogWarning("Inventory send failed — queuing for later.");
                    _queue.Enqueue("inventory", payload);
                    _state.Save(); // cursor committed when queued (at-least-once; server deduplicates)
                }
                else
                {
                    _state.Save(); // cursor committed after confirmed delivery
                    _log.LogInformation("Inventory sync sent ({ModuleCount} modules).", data.Count);
                }
            }
            else
            {
                _queue.Enqueue("inventory", payload);
                _state.Save(); // cursor committed when queued
                _log.LogInformation("Offline — inventory queued ({Count} in queue).", _queue.Count());
            }
        }
        catch (OperationCanceledException) { throw; }
        catch (Exception ex) { _log.LogError(ex, "Inventory sync error"); }
    }

    // ── Performance metrics ───────────────────────────────────────────────────

    private async Task RunPerformanceAsync(DeviceIdentity.IdentityPayload identity, CancellationToken ct)
    {
        try
        {
            var perfModule = _modules.OfType<PerformanceModule>().FirstOrDefault();
            if (perfModule == null || !IsModuleEnabled("performance")) return;

            var result = await perfModule.RunAsync(ct);
            if (result == null) return;

            var payload = new
            {
                collector_id = _config.CollectorId,
                hostname = identity.Hostname,
                performance = result,
            };

            if (_lastOnline)
                await _api.SendEventsAsync(payload, ct);
        }
        catch (OperationCanceledException) { throw; }
        catch (Exception ex) { _log.LogWarning(ex, "Performance collection error"); }
    }

    // ── Event log (fast, incremental) ────────────────────────────────────────

    private async Task RunEventLogAsync(DeviceIdentity.IdentityPayload identity, CancellationToken ct)
    {
        try
        {
            var elModule = _modules.OfType<EventLogModule>().FirstOrDefault();
            if (elModule == null || !IsModuleEnabled("event_log")) return;

            var result = await elModule.RunAsync(ct);
            if (result == null) return;

            // Send as a minimal inventory payload carrying only the event_log module.
            // The server's CollectorInventoryController handles any subset of modules.
            var payload = new InventoryPayload
            {
                CollectorId = _config.CollectorId,
                Hostname    = identity.Hostname,
                Identifiers = BuildIdentifiersList(identity),
                CollectedAt = DateTime.UtcNow,
                Modules     = new Dictionary<string, object?> { ["event_log"] = result },
            };

            if (_lastOnline)
            {
                bool ok = await _api.SendInventoryAsync(payload, ct);
                if (!ok)
                {
                    _queue.Enqueue("inventory", payload);
                    _state.Save();
                }
                else
                {
                    _state.Save(); // cursor committed after confirmed delivery
                }
            }
            else
            {
                _queue.Enqueue("inventory", payload);
                _state.Save(); // cursor committed when queued (at-least-once)
            }
        }
        catch (OperationCanceledException) { throw; }
        catch (Exception ex) { _log.LogWarning(ex, "Event log collection error"); }
    }

    // ── Offline queue flush ───────────────────────────────────────────────────

    private async Task FlushQueueAsync(CancellationToken ct)
    {
        _queue.PurgeExceeded(maxAttempts: 20);

        int delivered = 0;
        while (!ct.IsCancellationRequested)
        {
            var batch = _queue.Peek(5);
            if (batch.Count == 0) break;

            bool allOk = true;
            foreach (var item in batch)
            {
                try
                {
                    object? parsed = JsonSerializer.Deserialize<object>(item.PayloadJson);
                    if (parsed == null) { _queue.Acknowledge(item.Id); continue; }

                    bool ok = item.Endpoint == "inventory"
                        ? await _api.SendInventoryAsync(parsed, ct)
                        : await _api.SendEventsAsync(parsed, ct);

                    if (ok) { _queue.Acknowledge(item.Id); delivered++; }
                    else { _queue.IncrementAttempts(item.Id); allOk = false; }
                }
                catch (OperationCanceledException) { throw; }
                catch { _queue.IncrementAttempts(item.Id); allOk = false; }
            }

            if (!allOk) break; // server still unreachable — stop trying
        }

        if (delivered > 0)
            _log.LogInformation("Flushed {Count} queued items.", delivered);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private bool IsModuleEnabled(string name)
    {
        return name switch
        {
            "system"         => _config.Modules.System,
            "network"        => true, // always on — needed for identity
            "software"       => _config.Modules.Software,
            "performance"    => _config.Modules.Performance,
            "windows_update" => _config.Modules.WindowsUpdate,
            "event_log"      => _config.Modules.EventLog,
            "hyperv"         => _config.Modules.HyperV,
            "vmware"         => _config.Modules.Vmware,
            _ => false,
        };
    }

    private static List<object> BuildIdentifiersList(DeviceIdentity.IdentityPayload id)
    {
        var list = new List<object>();
        if (id.BiosUuid != null) list.Add(new { type = "bios_uuid", value = id.BiosUuid });
        if (id.SerialNumber != null) list.Add(new { type = "serial", value = id.SerialNumber });
        if (id.WmiIdentifyingNumber != null) list.Add(new { type = "wmi_id", value = id.WmiIdentifyingNumber });
        foreach (var mac in id.MacAddresses) list.Add(new { type = "mac", value = mac });
        list.Add(new { type = "hostname", value = id.Hostname });
        // fqdn is not in device_identifiers.type ENUM — sent in system module data instead
        return list;
    }

    // ── Payload DTOs ──────────────────────────────────────────────────────────

    private sealed class InventoryPayload
    {
        [JsonPropertyName("collector_id")] public int CollectorId { get; set; }
        [JsonPropertyName("hostname")] public string? Hostname { get; set; }
        [JsonPropertyName("identifiers")] public List<object> Identifiers { get; set; } = new();
        [JsonPropertyName("collected_at")] public DateTime CollectedAt { get; set; }
        [JsonPropertyName("modules")] public Dictionary<string, object?> Modules { get; set; } = new();
    }
}
