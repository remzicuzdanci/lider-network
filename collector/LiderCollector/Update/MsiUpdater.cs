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

    private static readonly string[] IdentityFiles = { "collector.json", "secure.dat" };

    public MsiUpdater(IUpdateEnvironment env, PackagePolicy policy, IAuthenticode auth, IMsiReader msi, UpdateAuditLogger audit)
    { _env = env; _policy = policy; _auth = auth; _msi = msi; _audit = audit; }

    public async Task<UpdateResult> ApplyAsync(UpdatePlan plan, CancellationToken ct = default)
    {
        var res = new UpdateResult { CorrelationId = plan.CorrelationId, ToVersion = plan.Version, StartedAt = _env.UtcNow.ToString("O") };
        UpdateResult Done(string status, string? error = null) { res.Status = status; res.Error = error; res.FinishedAt = _env.UtcNow.ToString("O"); _audit.Log("result", status, error); return res; }
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
                return await RollbackAsync(res, plan, inst, prev, identity, $"msiexec exit code {rc} left an unexpected state", Done);
            }

            // 4) prove health
            bool healthy = await WaitHealthyAsync(plan.Version, started, RequireCheckin, ct);
            _audit.Log("health", healthy ? "passed" : "failed", plan.Version);
            if (healthy)
            {
                TryDelete(prev);
                return Done("success");
            }
            return await RollbackAsync(res, plan, inst, prev, identity, $"{plan.Version} was installed but did not become healthy in {HealthTimeout.TotalSeconds:0}s", Done);
        }
        catch (Exception ex)
        {
            _audit.Log("error", "unhandled", ex.Message);
            try { if (_env.ServiceState() == SvcState.Stopped) _env.StartService(); } catch { /* best effort */ }
            return Done("failed", "unhandled: " + ex.Message);
        }
    }

    private async Task<UpdateResult> RollbackAsync(UpdateResult res, UpdatePlan plan, InstalledProduct old, string prevMsi, Dictionary<string, string> identity, string why, Func<string, string?, UpdateResult> done)
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
