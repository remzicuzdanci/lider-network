using System.Diagnostics;
using System.Management;
using System.Reflection;
using System.Security.Cryptography;
using System.ServiceProcess;
using System.Text.Json;

namespace LiderCollector.Update;

/// <summary>The pins. They live in the (signed) executable on purpose: a file on disk or a server response must never decide who is trusted.</summary>
internal static class UpdatePolicy
{
    public const string ServiceName = "LiderITONECollector";
    public const string UpgradeCode = "{B6A3F291-9D4E-4C7B-8F12-3A5E6D1C0847}";
    /// <summary>SHA-1 thumbprint of "LIDER IT ONE Collector Code Signing" (public, valid until 2029-11-11).</summary>
    public const string SignerSha1 = "83739ABFDBD3B8654141FE1F2BF1A131F99BA71F";
    /// <summary>SHA-256 of "LIDER IT ONE Internal Root CA".</summary>
    public const string RootSha256 = "21E94EC9750C21E2442E0818107BE870BE6C83AD1369D8DAAEACBE6D4EC733E2";

    /// <summary>Writes the embedded PUBLIC certificates to a private folder and returns the policy that points at them.</summary>
    public static PackagePolicy Create(string workDir)
    {
        string pki = Path.Combine(workDir, "pki"); Directory.CreateDirectory(pki);
        string root = Path.Combine(pki, "lider-root-ca.pem"), cert = Path.Combine(pki, "update-signing-cert.cer");
        Extract("pki.lider-root-ca.pem", root); Extract("pki.update-signing-cert.pem", cert);
        return new PackagePolicy(SignerSha1, UpgradeCode, RootSha256, root, pki);
    }

    private static void Extract(string resource, string dest)
    {
        using var s = Assembly.GetExecutingAssembly().GetManifestResourceStream(resource) ?? throw new InvalidOperationException("missing embedded resource " + resource);
        using var f = File.Create(dest); s.CopyTo(f);
    }
}

/// <summary>Marker files shared between the service and the updater (both run as LocalSystem; the folder is SYSTEM/Administrators only).</summary>
internal static class UpdateMarkers
{
    public const string CheckinFile = "last-checkin-ok.txt", PlanFile = "update-plan.json", ResultFile = "update-result.json";

    public static void WriteCheckinOk(string dataPath)
    {
        try { File.WriteAllText(Path.Combine(dataPath, CheckinFile), DateTime.UtcNow.ToString("O")); } catch { /* informational only */ }
    }

    public static void WriteAtomic(string path, string content)
    {
        string tmp = path + ".tmp"; File.WriteAllText(tmp, content); File.Move(tmp, path, overwrite: true);
    }
}

/// <summary>The real machine behind <see cref="IUpdateEnvironment"/>.</summary>
internal sealed class WindowsUpdateEnvironment : IUpdateEnvironment
{
    public string DataPath { get; }
    public WindowsUpdateEnvironment(string dataPath) => DataPath = dataPath;
    public DateTime UtcNow => DateTime.UtcNow;
    public Task DelayAsync(TimeSpan t, CancellationToken ct) => Task.Delay(t, ct);

    public InstalledProduct? FindInstalled(string upgradeCode) => MsiNative.FindInstalled(upgradeCode);

    public bool IsMsiBusy()
    {
        if (!Mutex.TryOpenExisting(@"Global\_MSIExecute", out var m)) return false;
        using (m) { try { if (m.WaitOne(0)) { m.ReleaseMutex(); return false; } return true; } catch (AbandonedMutexException) { return false; } }
    }

    public int RunMsi(IReadOnlyList<string> args, TimeSpan timeout)
    {
        var psi = new ProcessStartInfo("msiexec.exe") { UseShellExecute = false, CreateNoWindow = true };
        foreach (var a in args) psi.ArgumentList.Add(a);
        using var p = Process.Start(psi)!;
        if (!p.WaitForExit((int)timeout.TotalMilliseconds)) return -1;     // never kill msiexec mid-transaction
        return p.ExitCode;
    }

    public SvcState ServiceState()
    {
        try { using var sc = new ServiceController(UpdatePolicy.ServiceName); sc.Refresh(); return sc.Status == ServiceControllerStatus.Running ? SvcState.Running : sc.Status == ServiceControllerStatus.Stopped ? SvcState.Stopped : SvcState.Other; }
        catch (InvalidOperationException) { return SvcState.Missing; }
    }

    public void StopService() => ServiceManager.Stop(UpdatePolicy.ServiceName);
    public void StartService() => ServiceManager.Start(UpdatePolicy.ServiceName);

    public string? InstalledExeVersion()
    {
        try
        {
            using var s = new ManagementObjectSearcher($"SELECT PathName FROM Win32_Service WHERE Name='{UpdatePolicy.ServiceName}'");
            foreach (ManagementObject o in s.Get())
            {
                string raw = (o["PathName"] as string ?? "").Trim();
                string exe = raw.StartsWith('"') ? raw.Split('"')[1] : raw.Split(' ')[0];
                return File.Exists(exe) ? FileVersionInfo.GetVersionInfo(exe).FileVersion : null;
            }
        }
        catch { /* not readable right now: the poll tries again */ }
        return null;
    }

    public const string WatchdogTaskOnce = "LiderCollectorUpdateWatchdog", WatchdogTaskBoot = "LiderCollectorUpdateWatchdogBoot";

    /// <summary>True only for a live process that really is our updater copy (never trust a recycled pid).</summary>
    public bool UpdaterRunning(int pid)
    {
        try
        {
            using var p = Process.GetProcessById(pid);
            if (p.HasExited) return false;
            string? path = p.MainModule?.FileName;
            return path is not null && string.Equals(Path.GetFileName(path), "LiderCollectorUpdate.exe", StringComparison.OrdinalIgnoreCase);
        }
        catch { return false; }
    }

    public void KillUpdater(int pid)
    {
        if (!UpdaterRunning(pid)) return;
        using var p = Process.GetProcessById(pid); p.Kill(entireProcessTree: false); p.WaitForExit(10_000);
    }

    /// <summary>Two SYSTEM tasks that run "LiderCollectorUpdate.exe --update-watchdog": once at now+after, and at every boot. Both delete themselves via DisarmWatchdog.</summary>
    public void ArmWatchdog(TimeSpan after)
    {
        string exe = Path.Combine(DataPath, "updates", "run", "LiderCollectorUpdate.exe");
        if (!File.Exists(exe)) return;                      // the updater is not running from its copy (tests, manual run): nothing to schedule
        string cmd = $"\\\"{exe}\\\" --update-watchdog \\\"{DataPath}\\\"";
        string at = (DateTime.Now + after).ToString("HH:mm");
        Schtasks($"/Create /TN {WatchdogTaskOnce} /SC ONCE /ST {at} /RU SYSTEM /RL HIGHEST /F /TR \"{cmd}\"");
        Schtasks($"/Create /TN {WatchdogTaskBoot} /SC ONSTART /RU SYSTEM /RL HIGHEST /F /TR \"{cmd}\"");
    }

    public void DisarmWatchdog() { Schtasks($"/Delete /TN {WatchdogTaskOnce} /F"); Schtasks($"/Delete /TN {WatchdogTaskBoot} /F"); }

    private static void Schtasks(string args)
    {
        try { using var p = Process.Start(new ProcessStartInfo("schtasks.exe", args) { UseShellExecute = false, CreateNoWindow = true, RedirectStandardOutput = true, RedirectStandardError = true }); p?.WaitForExit(15_000); }
        catch { /* the journal + the service's own start-up check still cover a missing task */ }
    }

    public DateTime? LastCheckinOkUtc()
    {
        try { return DateTime.Parse(File.ReadAllText(Path.Combine(DataPath, UpdateMarkers.CheckinFile)).Trim(), null, System.Globalization.DateTimeStyles.RoundtripKind).ToUniversalTime(); }
        catch { return null; }
    }
}

/// <summary>Entry point of "LiderCollector.exe --apply-update &lt;plan.json&gt;" (started from a COPY of the exe, so Windows Installer can replace the installed one).</summary>
internal static class UpdateRunner
{
    public static async Task<int> RunAsync(string planPath)
    {
        string data = Path.GetDirectoryName(Path.GetFullPath(planPath))!;
        var plan = JsonSerializer.Deserialize<UpdatePlan>(File.ReadAllText(planPath))!;
        string corr = string.IsNullOrEmpty(plan.CorrelationId) ? Guid.NewGuid().ToString("N")[..12] : plan.CorrelationId;
        plan.CorrelationId = corr;
        var audit = new UpdateAuditLogger(data, corr);
        using var single = new Mutex(false, @"Global\LiderCollectorUpdate", out _);
        if (!single.WaitOne(0)) { audit.Log("startup", "skipped", "another updater is running"); return 1; }
        audit.Log("startup", "started", $"target={plan.Version}");
        var updater = new MsiUpdater(new WindowsUpdateEnvironment(data), UpdatePolicy.Create(Path.Combine(data, "updates", "run")), new WinTrustAuthenticode(), new MsiNative(), audit);
        UpdateResult result = await updater.ApplyAsync(plan);
        UpdateMarkers.WriteAtomic(Path.Combine(data, UpdateMarkers.ResultFile), JsonSerializer.Serialize(result));
        try { File.Delete(planPath); } catch { /* the result file is what matters */ }
        return result.Status is "success" ? 0 : result.Status is "skipped" ? 1 : 2;
    }

    /// <summary>"LiderCollectorUpdate.exe --update-watchdog &lt;dataDir&gt;": finishes (or undoes) an update whose updater died. Safe to run at any time: no journal = nothing happens.</summary>
    public static async Task<int> RunWatchdogAsync(string data)
    {
        if (UpdateJournal.Read(data) is null) return 0;
        var audit = new UpdateAuditLogger(data, "watchdog");
        using var single = new Mutex(false, @"Global\LiderCollectorUpdate", out _);
        if (!single.WaitOne(0)) return 1;                                   // an updater (or another watchdog) is working
        var updater = new MsiUpdater(new WindowsUpdateEnvironment(data), UpdatePolicy.Create(Path.Combine(data, "updates", "run")), new WinTrustAuthenticode(), new MsiNative(), audit);
        var result = await updater.RecoverAsync();
        if (result is null) return 1;
        UpdateMarkers.WriteAtomic(Path.Combine(data, UpdateMarkers.ResultFile), JsonSerializer.Serialize(result));
        try { File.Delete(Path.Combine(data, UpdateMarkers.PlanFile)); } catch { }
        return result.Status is "success" or "rolled_back" or "failed" ? 0 : 2;
    }
}
