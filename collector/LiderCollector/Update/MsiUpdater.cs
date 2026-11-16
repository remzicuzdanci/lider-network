using System.Security.Cryptography;

namespace LiderCollector.Update;

internal enum SvcState { Missing, Stopped, Running, Other }

/// <summary>Everything the updater touches on the machine. Faked in tests so every failure path is exercised without a Windows service.</summary>
internal interface IUpdateEnvironment
{
    InstalledProduct? FindInstalled(string upgradeCode);
    bool IsMsiBusy();
    /// <summary>Runs msiexec with these arguments and waits. Returns the exit code, or -1 if it did not finish in time.</summary>
    int RunMsi(IReadOnlyList<string> args, TimeSpan timeout);
    SvcState ServiceState();
    void StopService();
    void StartService();
    /// <summary>File version of the installed LiderCollector.exe, e.g. "1.4.0.0".</summary>
    string? InstalledExeVersion();
    /// <summary>When the service last had a heartbeat accepted by the server (UTC), or null if never recorded.</summary>
    DateTime? LastCheckinOkUtc();
    string DataPath { get; }
    DateTime UtcNow { get; }
    Task DelayAsync(TimeSpan t, CancellationToken ct);

    // ── watchdog support (defaults keep simple fakes working) ──
    /// <summary>Process id of the running updater (written to the journal).</summary>
    int SelfPid => Environment.ProcessId;
    /// <summary>Is this updater process still alive (and really our updater copy)?</summary>
    bool UpdaterRunning(int pid) => false;
    /// <summary>Ends a HUNG updater process (never msiexec).</summary>
    void KillUpdater(int pid) { }
    /// <summary>Schedules an independent one-time recovery run (and one at the next boot) in case the updater itself dies. Cleared by <see cref="DisarmWatchdog"/>.</summary>
    void ArmWatchdog(TimeSpan after) { }
    void DisarmWatchdog() { }
}

/// <summary>
/// Applies one verified MSI over the installed Collector, proves the new version is healthy, and otherwise puts the old version back.
/// Order is deliberate: (1) nothing is touched until the package passed every check AND a rollback copy of the installed MSI exists;
/// (2) Windows Installer does the swap (it rolls itself back on an install error); (3) "healthy" = service running + the new file version +
/// a heartbeat accepted by the server AFTER the install; (4) if not healthy: uninstall the new, install the saved old (downgrades are blocked by the
/// MSI, so it is uninstall + install), restore the identity files if they differ, check health again.
/// %ProgramData%\LiderCollector (collector.json, secure.dat, queue.db) is never removed by either direction.
/// </summary>
internal sealed class MsiUpdater
{
    private readonly IUpdateEnvironment _env;
    private readonly PackagePolicy _policy;
    private readonly IAuthenticode _auth;
    private readonly IMsiReader _msi;
    private readonly UpdateAuditLogger _audit;
    public TimeSpan InstallTimeout { get; init; } = TimeSpan.FromMinutes(20);
    public TimeSpan HealthTimeout { get; init; } = TimeSpan.FromMinutes(3);
    public TimeSpan PollInterval { get; init; } = TimeSpan.FromSeconds(3);
    public bool RequireCheckin { get; init; } = true;
    /// <summary>If the updater has not finished by then, the scheduled watchdog takes over (must be longer than InstallTimeout + HealthTimeout).</summary>
    public TimeSpan WatchdogAfter { get; init; } = TimeSpan.FromMinutes(45);
    /// <summary>A live updater whose journal has not moved for this long is considered hung.</summary>
    public TimeSpan HungAfter { get; init; } = TimeSpan.FromMinutes(40);

    private static readonly string[] IdentityFiles = { "collector.json", "secure.dat" };

    public MsiUpdater(IUpdateEnvironment env, PackagePolicy policy, IAuthenticode auth, IMsiReader msi, UpdateAuditLogger audit)
    { _env = env; _policy = policy; _auth = auth; _msi = msi; _audit = audit; }

    public async Task<UpdateResult> ApplyAsync(UpdatePlan plan, CancellationToken ct = default)
    {
        var res = new UpdateResult { CorrelationId = plan.CorrelationId, ToVersion = plan.Version, StartedAt = _env.UtcNow.ToString("O") };
        UpdateJournal? jr = null;
        UpdateResult Done(string status, string? error = null)
        {
            res.Status = status; res.Error = error; res.FinishedAt = _env.UtcNow.ToString("O"); _audit.Log("result", status, error);
            try { _env.DisarmWatchdog(); } catch { /* a leftover task only finds an empty journal */ }
            UpdateJournal.Clear(_env.DataPath);
            return res;
        }
        void Phase(string phase) { if (jr is null) return; jr.Phase = phase; jr.PhaseAt = _env.UtcNow.ToString("O"); jr.Save(_env.DataPath); }
        try
        {
            if (_env.IsMsiBusy()) return Done("skipped", "another Windows Installer operation is running");
            var inst = _env.FindInstalled(_policy.UpgradeCode);
            if (inst is null) return Done("failed", "the Collector is not installed from an MSI on this computer");
            res.FromVersion = inst.Version;
            if (!Version.TryParse(inst.Version, out var from) || !Version.TryParse(plan.Version, out var to)) return Done("failed", "version is not parseable");
            if (to <= from) return Done("skipped", $"installed {inst.Version} is already at or above {plan.Version}");
            if (!string.IsNullOrEmpty(plan.MinFromVersion) && Version.TryParse(plan.MinFromVersion, out var min) && from < min) return Done("failed", $"{inst.Version} is below the minimum upgrade source {plan.MinFromVersion}");

            // 1) the package must pass everything BEFORE anything on the machine is touched
            var v = PackageVerifier.Verify(plan.PackagePath, plan, _policy, _auth, _msi, _env.UtcNow);
            foreach (var n in v.Notes) _audit.Log("verify", "ok", n);
            if (!v.Ok) { _audit.Log("verify", "failed", v.Reason); return Done("failed", "package rejected: " + v.Reason); }

            // 2) no rollback copy, no update
            string runDir = Path.Combine(_env.DataPath, "updates", plan.CorrelationId); Directory.CreateDirectory(runDir);
            string? prev = PrepareRollbackCopy(inst, runDir);
            if (prev is null) return Done("failed", "cannot save the installed MSI for rollback; update refused (nothing changed)");
            var identity = SnapshotIdentity(runDir);
            _audit.Log("snapshot", "ok", $"previous={Path.GetFileName(prev)} identity files={identity.Count}");

            // the journal + the scheduled watchdog exist from here on: whatever happens to this process, a recovery run will finish the job
            jr = new UpdateJournal { CorrelationId = plan.CorrelationId, FromVersion = inst.Version, ToVersion = plan.Version, PreviousMsi = prev, StartedAt = _env.UtcNow.ToString("O"), UpdaterPid = _env.SelfPid, Identity = identity };
            Phase("installing");
            try { _env.ArmWatchdog(WatchdogAfter); _audit.Log("watchdog", "armed", $"{WatchdogAfter.TotalMinutes:0} min"); }
            catch (Exception ex) { _audit.Log("watchdog", "arm_failed", ex.Message); }

            // 3) install
            DateTime started = _env.UtcNow;
            int rc = _env.RunMsi(new[] { "/i", plan.PackagePath, "/qn", "/norestart", "/l*v", Path.Combine(runDir, "install.log") }, InstallTimeout);
            _audit.Log("install", rc is 0 or 3010 ? "ok" : "failed", $"msiexec exit {rc}");
            if (rc is not (0 or 3010))
            {
                var after = _env.FindInstalled(_policy.UpgradeCode);
                if (after is not null && after.Version == inst.Version)
                {
                    // Windows Installer rolled itself back: the old version is still in place
                    if (_env.ServiceState() != SvcState.Running) { try { _env.StartService(); } catch { /* reported below */ } }
                    return Done("failed", $"msiexec exit code {rc}; Windows Installer kept the installed version");
                }
                Phase("rolling_back");
                return await RollbackAsync(res, inst, prev, identity, $"msiexec exit code {rc} left an unexpected state", Done);
            }

            // 4) prove health
            Phase("health");
            bool healthy = await WaitHealthyAsync(plan.Version, started, RequireCheckin, ct);
            _audit.Log("health", healthy ? "passed" : "failed", plan.Version);
            if (healthy)
            {
                TryDelete(prev);
                return Done("success");
            }
            Phase("rolling_back");
            return await RollbackAsync(res, inst, prev, identity, $"{plan.Version} was installed but did not become healthy in {HealthTimeout.TotalSeconds:0}s", Done);
        }
        catch (Exception ex)
        {
            _audit.Log("error", "unhandled", ex.Message);
            try { if (_env.ServiceState() == SvcState.Stopped) _env.StartService(); } catch { /* best effort */ }
            // an exception AFTER the install started may leave a half-way state: the journal stays so the watchdog (or the next service start) finishes the job
            if (jr is not null && jr.Phase is "installing" or "health" or "rolling_back")
            {
                res.Status = "failed"; res.Error = "unhandled: " + ex.Message; res.FinishedAt = _env.UtcNow.ToString("O");
                return res;
            }
            return Done("failed", "unhandled: " + ex.Message);
        }
    }

    /// <summary>
    /// Watchdog entry: the updater that owned the journal is gone (crash, kill, power loss, hang). Brings the machine to a final, healthy state:
    /// old version running (failed), new version running and healthy (success), or the saved MSI reinstalled (rolled_back). Returns null when there is nothing to do yet
    /// (no journal, a live updater within its limits, or Windows Installer still busy). The caller writes the result file.
    /// </summary>
    public async Task<UpdateResult?> RecoverAsync(CancellationToken ct = default)
    {
        var j = UpdateJournal.Read(_env.DataPath);
        if (j is null) return null;
        if (j.UpdaterPid > 0 && _env.UpdaterRunning(j.UpdaterPid))
        {
            if (_env.UtcNow - j.PhaseUtc < HungAfter) return null;                    // alive and moving
            _audit.Log("watchdog", "hung_updater", $"pid {j.UpdaterPid}, phase {j.Phase} since {j.PhaseAt}");
            try { _env.KillUpdater(j.UpdaterPid); } catch (Exception ex) { _audit.Log("watchdog", "kill_failed", ex.Message); return null; }
            await _env.DelayAsync(TimeSpan.FromSeconds(2), ct);
        }
        else if (j.UpdaterPid <= 0 && _env.UtcNow - j.PhaseUtc < TimeSpan.FromMinutes(5)) return null;   // pid unknown: give a possibly running updater five minutes
        if (_env.IsMsiBusy()) { _audit.Log("watchdog", "deferred", "Windows Installer is busy"); return null; }

        _audit.Log("watchdog", "recovering", $"phase {j.Phase}, {j.FromVersion} -> {j.ToVersion}");
        var res = new UpdateResult { CorrelationId = j.CorrelationId, FromVersion = j.FromVersion, ToVersion = j.ToVersion, StartedAt = j.StartedAt };
        UpdateResult Final(string status, string? error)
        {
            res.Status = status; res.Error = error; res.FinishedAt = _env.UtcNow.ToString("O"); _audit.Log("result", status, "watchdog: " + error);
            try { _env.DisarmWatchdog(); } catch { }
            UpdateJournal.Clear(_env.DataPath);
            return res;
        }
        string why = $"the updater ended unexpectedly in phase '{j.Phase}'";
        try
        {
            if (j.Phase == UpdateJournal.Unknown || string.IsNullOrEmpty(j.FromVersion))
            {
                if (_env.ServiceState() != SvcState.Running) { try { _env.StartService(); } catch { } }
                return Final("failed", "update journal unreadable; the service was started if it was stopped, nothing else was changed");
            }
            var cur = _env.FindInstalled(_policy.UpgradeCode);
            if (cur is not null && cur.Version == j.FromVersion)
            {
                // the old version is installed: just make sure it is up and healthy
                if (_env.ServiceState() != SvcState.Running) { try { _env.StartService(); } catch { /* health check decides */ } }
                bool ok = await WaitHealthyAsync(j.FromVersion!, _env.UtcNow, requireCheckin: false, ct);
                return ok ? Final(j.Phase == "rolling_back" ? "rolled_back" : "failed", why + "; the old version " + j.FromVersion + " is in place and running")
                          : Final("rollback_failed", why + $"; {j.FromVersion} is installed but not healthy; the saved MSI is {j.PreviousMsi}");
            }
            if (cur is not null && cur.Version == j.ToVersion && j.Phase is "installing" or "health")
            {
                // the swap finished: the new version may well be fine
                if (_env.ServiceState() != SvcState.Running) { try { _env.StartService(); } catch { } }
                if (await WaitHealthyAsync(j.ToVersion!, j.StartedUtc, RequireCheckin, ct)) return Final("success", why + "; the new version " + j.ToVersion + " is installed and healthy");
            }
            // anything else (unhealthy new version, nothing installed, half-way rollback): back to the saved MSI
            if (string.IsNullOrEmpty(j.PreviousMsi) || !File.Exists(j.PreviousMsi)) return Final("rollback_failed", why + "; the saved MSI is missing - needs a person");
            return await RollbackAsync(res, new InstalledProduct("", j.FromVersion!, null), j.PreviousMsi!, j.Identity, why, (s, e) => Final(s, e));
        }
        catch (Exception ex)
        {
            _audit.Log("watchdog", "failed", ex.Message);
            try { if (_env.ServiceState() == SvcState.Stopped) _env.StartService(); } catch { }
            return Final("failed", why + "; recovery error: " + ex.Message);
        }
    }

    private async Task<UpdateResult> RollbackAsync(UpdateResult res, InstalledProduct old, string prevMsi, Dictionary<string, string> identity, string why, Func<string, string?, UpdateResult> done)
    {
        _audit.Log("rollback", "started", why);
        string runDir = Path.GetDirectoryName(prevMsi)!;
        try
        {
            try { _env.StopService(); } catch { /* may already be stopped */ }
            var current = _env.FindInstalled(_policy.UpgradeCode);
            if (current is not null)
            {
                int u = _env.RunMsi(new[] { "/x", current.ProductCode, "/qn", "/norestart", "/l*v", Path.Combine(runDir, "uninstall.log") }, InstallTimeout);
                if (u is not (0 or 3010)) return done("rollback_failed", $"{why}; uninstall of the new version failed (msiexec {u}); the saved MSI is {prevMsi}");
            }
            int i = _env.RunMsi(new[] { "/i", prevMsi, "/qn", "/norestart", "/l*v", Path.Combine(runDir, "reinstall.log") }, InstallTimeout);
            if (i is not (0 or 3010)) return done("rollback_failed", $"{why}; reinstalling {old.Version} failed (msiexec {i}); the saved MSI is {prevMsi}");
            RestoreIdentityIfChanged(runDir, identity);
            DateTime t = _env.UtcNow;
            try { _env.StartService(); } catch { /* health check decides */ }
            bool ok = await WaitHealthyAsync(old.Version, t, requireCheckin: false, CancellationToken.None);
            _audit.Log("rollback", ok ? "complete" : "unhealthy", old.Version);
            return ok ? done("rolled_back", why) : done("rollback_failed", $"{why}; {old.Version} was reinstalled but is not healthy; the saved MSI is {prevMsi}");
        }
        catch (Exception ex)
        {
            _audit.Log("rollback", "failed", ex.Message);
            return done("rollback_failed", $"{why}; rollback error: {ex.Message}; the saved MSI is {prevMsi}");
        }
    }

    private async Task<bool> WaitHealthyAsync(string expectedVersion, DateTime since, bool requireCheckin, CancellationToken ct)
    {
        DateTime deadline = _env.UtcNow + HealthTimeout;
        while (_env.UtcNow < deadline)
        {
            if (_env.ServiceState() == SvcState.Running && SameVersion(_env.InstalledExeVersion(), expectedVersion) && (!requireCheckin || (_env.LastCheckinOkUtc() is { } c && c > since))) return true;
            await _env.DelayAsync(PollInterval, ct);
        }
        return false;
    }

    internal static bool SameVersion(string? fileVersion, string expected)
    {
        if (!Version.TryParse(fileVersion, out var f) || !Version.TryParse(expected, out var e)) return false;
        return f.Major == e.Major && f.Minor == e.Minor && Math.Max(f.Build, 0) == Math.Max(e.Build, 0);
    }

    private string? PrepareRollbackCopy(InstalledProduct inst, string runDir)
    {
        if (string.IsNullOrEmpty(inst.LocalPackage) || !File.Exists(inst.LocalPackage)) return null;
        string dest = Path.Combine(runDir, $"previous-{inst.Version}.msi");
        File.Copy(inst.LocalPackage, dest, overwrite: true);
        string? v = _msi.ReadProperty(dest, "ProductVersion"), uc = _msi.ReadProperty(dest, "UpgradeCode");
        if (v != inst.Version || !string.Equals(uc, _policy.UpgradeCode, StringComparison.OrdinalIgnoreCase)) { TryDelete(dest); return null; }
        return dest;
    }

    private Dictionary<string, string> SnapshotIdentity(string runDir)
    {
        var map = new Dictionary<string, string>();
        string bk = Path.Combine(runDir, "identity-backup"); Directory.CreateDirectory(bk);
        foreach (var f in IdentityFiles)
        {
            string src = Path.Combine(_env.DataPath, f);
            if (!File.Exists(src)) continue;
            File.Copy(src, Path.Combine(bk, f), overwrite: true);
            map[f] = Convert.ToHexString(SHA256.HashData(File.ReadAllBytes(src)));
        }
        return map;
    }

    private void RestoreIdentityIfChanged(string runDir, Dictionary<string, string> identity)
    {
        foreach (var (f, hash) in identity)
        {
            string live = Path.Combine(_env.DataPath, f);
            bool same = File.Exists(live) && Convert.ToHexString(SHA256.HashData(File.ReadAllBytes(live))) == hash;
            if (!same) { File.Copy(Path.Combine(runDir, "identity-backup", f), live, overwrite: true); _audit.Log("rollback", "identity_restored", f); }
        }
    }

    private static void TryDelete(string path) { try { File.Delete(path); } catch { /* retention is cosmetic */ } }
}
