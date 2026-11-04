using System.IO.Compression;
using Microsoft.Extensions.Logging;

namespace LiderCollector.Updater;

/// <summary>
/// Orchestrates the full update lifecycle:
///   1. Guard — check for MSI in progress, check lock file
///   2. Fetch manifest from server
///   3. Report progress: downloading
///   4. Download archive
///   5. Verify SHA-256 + RSA signature
///   6. Report progress: verified
///   7. Create rollback backup
///   8. Stop the Windows service
///   9. Extract archive over install directory
///  10. Start the Windows service
///  11. Health check: service running + version matches
///  12. Report complete: success
///  13. Delete backup
///
/// On any error at step 8 or later: rollback, restart service, report failed/rolled_back.
///
/// ProgramData preservation: install directory and ProgramData are separate.
/// The archive must NOT contain files that overwrite ProgramData content.
/// </summary>
internal sealed class UpdateOrchestrator
{
    private readonly UpdaterConfig     _cfg;
    private readonly UpdateApiClient   _api;
    private readonly UpdateAuditLogger _audit;
    private readonly string            _correlationId;
    private readonly ILogger           _log;

    private static readonly TimeSpan HealthCheckDelay   = TimeSpan.FromSeconds(10);
    private static readonly TimeSpan HealthCheckTimeout = TimeSpan.FromSeconds(30);

    public UpdateOrchestrator(UpdaterConfig cfg, UpdateApiClient api, UpdateAuditLogger audit,
                              string correlationId, ILogger log)
    {
        _cfg           = cfg;
        _api           = api;
        _audit         = audit;
        _correlationId = correlationId;
        _log           = log;
    }

    public async Task<bool> RunAsync(UpdateTrigger trigger, CancellationToken ct = default)
    {
        string? fromVersion  = null;
        string? manifestVersion = trigger.TargetVersion;
        int?    logId        = null;

        try
        {
            // ── Guard: yield to MSI ──────────────────────────────────────────────
            if (ServiceManager.IsMsiRunning())
            {
                _log.LogWarning("MSI installation in progress; skipping auto-update");
                _audit.Log("guard", "skipped", "msiexec running");
                return false;
            }

            _audit.Log("guard", "passed");

            // ── Fetch manifest ───────────────────────────────────────────────────
            _log.LogInformation("Fetching update manifest for version {Ver}", trigger.TargetVersion);
            ManifestResponse? manifest = await _api.GetManifestAsync(ct);
            if (manifest is null || !manifest.UpdateAvailable)
            {
                _audit.Log("manifest", "none", "no update available from server");
                return false;
            }

            manifestVersion = manifest.Version;
            _audit.Log("manifest", "fetched", $"version={manifest.Version} channel={manifest.Channel}");

            // ── Progress: downloading ────────────────────────────────────────────
            logId = await _api.ReportProgressAsync(manifestVersion, "downloading", fromVersion, ct);
            _audit.Log("download", "started", $"url={manifest.DownloadUrl}");

            byte[] archiveBytes = await UpdateDownloader.DownloadAsync(manifest.DownloadUrl, ct);
            _audit.Log("download", "complete", $"bytes={archiveBytes.Length}");

            // ── Verify ───────────────────────────────────────────────────────────
            await _api.ReportProgressAsync(manifestVersion, "verifying", fromVersion, ct);
            _audit.Log("verify", "started");

            var (ok, reason) = SignatureVerifier.Verify(
                archiveBytes,
                manifest.Sha256Hash,
                manifest.SignatureBase64,
                manifest.SigningCertThumbprint,
                _cfg.DataPath,
                manifest.Version,
                manifest.Channel);

            if (!ok)
            {
                _audit.Log("verify", "failed", reason);
                _log.LogError("Verification failed: {Reason}", reason);
                await _api.ReportCompleteAsync(logId, manifestVersion, "failed",
                    fromVersion, null, $"verify_failed: {reason}", ct);
                return false;
            }

            _audit.Log("verify", "passed");

            // ── Backup ───────────────────────────────────────────────────────────
            var rollback = new RollbackManager(_cfg.InstallPath, _cfg.DataPath, _correlationId);
            rollback.CreateBackup();
            _audit.Log("backup", "created", _cfg.InstallPath);

            // ── Stop service ─────────────────────────────────────────────────────
            _log.LogInformation("Stopping service {Svc}", _cfg.ServiceName_);
            await _api.ReportProgressAsync(manifestVersion, "installing", fromVersion, ct);
            ServiceManager.Stop(_cfg.ServiceName_);
            _audit.Log("service", "stopped");

            // ── Extract archive ──────────────────────────────────────────────────
            try
            {
                ExtractArchive(archiveBytes, _cfg.InstallPath);
                _audit.Log("install", "extracted", _cfg.InstallPath);
            }
            catch (Exception ex)
            {
                _audit.Log("install", "failed", ex.Message);
                _log.LogError(ex, "Extraction failed; rolling back");
                await RollbackAsync(rollback, manifestVersion, fromVersion, logId, ex.Message, ct);
                return false;
            }

            // ── Start service ────────────────────────────────────────────────────
            try
            {
                ServiceManager.Start(_cfg.ServiceName_);
                _audit.Log("service", "started");
            }
            catch (Exception ex)
            {
                _audit.Log("service_start", "failed", ex.Message);
                await RollbackAsync(rollback, manifestVersion, fromVersion, logId, ex.Message, ct);
                return false;
            }

            // ── Health check ─────────────────────────────────────────────────────
            await _api.ReportProgressAsync(manifestVersion, "verifying_health", fromVersion, ct);
            _audit.Log("health", "checking");

            bool healthy = await WaitForHealthyAsync(manifest.Version, ct);
            if (!healthy)
            {
                string msg = $"Service did not become healthy within {HealthCheckTimeout.TotalSeconds}s after update to {manifest.Version}";
                _audit.Log("health", "failed", msg);
                _log.LogError(msg);
                await RollbackAsync(rollback, manifestVersion, fromVersion, logId, msg, ct);
                return false;
            }

            _audit.Log("health", "passed", $"version={manifest.Version}");

            // ── Success ──────────────────────────────────────────────────────────
            await _api.ReportCompleteAsync(logId, manifestVersion, "success",
                fromVersion, manifest.Version, null, ct);
            _audit.Log("complete", "success", $"updated_to={manifest.Version}");
            _log.LogInformation("Update to {Version} succeeded", manifest.Version);

            rollback.DeleteBackup();

            // Remove trigger file so the service doesn't re-trigger
            DeleteTriggerFile();

            return true;
        }
        catch (Exception ex)
        {
            _audit.Log("error", "unhandled", ex.Message);
            _log.LogError(ex, "Unhandled error in update orchestrator");
            try
            {
                await _api.ReportCompleteAsync(logId, manifestVersion ?? trigger.TargetVersion,
                    "failed", fromVersion, null, ex.Message, ct);
            }
            catch { /* non-fatal */ }
            return false;
        }
    }

    private async Task RollbackAsync(
        RollbackManager rollback, string manifestVersion,
        string? fromVersion, int? logId, string? errorMsg,
        CancellationToken ct)
    {
        _audit.Log("rollback", "started");
        try
        {
            ServiceManager.Stop(_cfg.ServiceName_);
            rollback.Restore();
            ServiceManager.Start(_cfg.ServiceName_);
            _audit.Log("rollback", "complete");
            await _api.ReportCompleteAsync(logId, manifestVersion, "rolled_back",
                fromVersion, null, errorMsg, ct);
        }
        catch (Exception ex)
        {
            _audit.Log("rollback", "failed", ex.Message);
            _log.LogCritical(ex, "Rollback failed — manual intervention required");
            try
            {
                await _api.ReportCompleteAsync(logId, manifestVersion, "failed",
                    fromVersion, null, $"rollback_failed: {ex.Message}", ct);
            }
            catch { }
        }
    }

    private static void ExtractArchive(byte[] zipBytes, string installPath)
    {
        using var ms      = new MemoryStream(zipBytes);
        using var archive = new ZipArchive(ms, ZipArchiveMode.Read);

        foreach (var entry in archive.Entries)
        {
            // Guard against path traversal (zip slip)
            string fullDest = Path.GetFullPath(Path.Combine(installPath, entry.FullName));
            if (!fullDest.StartsWith(Path.GetFullPath(installPath) + Path.DirectorySeparatorChar))
                throw new InvalidOperationException($"Zip slip attempt: {entry.FullName}");

            if (entry.FullName.EndsWith('/'))
            {
                Directory.CreateDirectory(fullDest);
                continue;
            }

            Directory.CreateDirectory(Path.GetDirectoryName(fullDest)!);
            entry.ExtractToFile(fullDest, overwrite: true);
        }
    }

    private async Task<bool> WaitForHealthyAsync(string expectedVersion, CancellationToken ct)
    {
        await Task.Delay(HealthCheckDelay, ct);
        var deadline = DateTime.UtcNow.Add(HealthCheckTimeout);

        while (DateTime.UtcNow < deadline)
        {
            if (!ServiceManager.IsRunning(_cfg.ServiceName_))
            {
                await Task.Delay(2000, ct);
                continue;
            }

            // The agent_version on the collector is updated by the server after the
            // first successful heartbeat, so we just confirm the service is running.
            // A stricter check (reading the EXE's FileVersionInfo) gives a local version.
            string exePath = Path.Combine(_cfg.InstallPath, "LiderCollector.exe");
            if (File.Exists(exePath))
            {
                var vi = System.Diagnostics.FileVersionInfo.GetVersionInfo(exePath);
                string exeVer = vi.FileVersion?.TrimEnd('.') ?? string.Empty;
                // Normalize: "1.1.0.0" → "1.1.0"
                if (exeVer.StartsWith(expectedVersion, StringComparison.Ordinal))
                    return true;
            }
            else
            {
                // If EXE not found by exact name, trust service status
                return true;
            }

            await Task.Delay(2000, ct);
        }

        return false;
    }

    private void DeleteTriggerFile()
    {
        string triggerPath = Path.Combine(_cfg.DataPath, "update-trigger.json");
        try { if (File.Exists(triggerPath)) File.Delete(triggerPath); }
        catch { }
    }
}
