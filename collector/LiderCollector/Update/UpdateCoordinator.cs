using System.Diagnostics;
using System.Text.Json;
using System.Text.Json.Serialization;
using LiderCollector.Core;
using Microsoft.Extensions.Logging;

namespace LiderCollector.Update;

/// <summary>GET update/manifest answer. The download address in it is deliberately NOT used: the package is only ever fetched from our own server endpoint.</summary>
internal sealed class UpdateManifestDto
{
    [JsonPropertyName("update_available")]        public bool    UpdateAvailable { get; set; }
    [JsonPropertyName("version")]                 public string  Version { get; set; } = "";
    [JsonPropertyName("channel")]                 public string  Channel { get; set; } = "";
    [JsonPropertyName("package_type")]            public string? PackageType { get; set; }
    [JsonPropertyName("size")]                    public long    Size { get; set; }
    [JsonPropertyName("sha256_hash")]             public string  Sha256Hash { get; set; } = "";
    [JsonPropertyName("signature_base64")]        public string  SignatureBase64 { get; set; } = "";
    [JsonPropertyName("signing_cert_thumbprint")] public string? SigningCertThumbprint { get; set; }
    [JsonPropertyName("min_from_version")]        public string? MinFromVersion { get; set; }
}

/// <summary>
/// Network side of the self-update, run inside the service (which already has the API key and the TLS policy):
///   manifest -> download to a protected folder -> write the plan -> start the updater (a COPY of this exe) -> after the restart, report the result.
/// It never installs anything itself and never trusts the manifest's download URL.
/// </summary>
internal sealed class UpdateCoordinator
{
    private readonly ApiClient _api;
    private readonly string _data;
    private readonly ILogger _log;
    private int _busy;
    public const long MaxPackageBytes = 400L * 1024 * 1024;

    public UpdateCoordinator(ApiClient api, string dataPath, ILogger log) { _api = api; _data = dataPath; _log = log; }

    public async Task TryUpdateAsync(CancellationToken ct)
    {
        if (Interlocked.Exchange(ref _busy, 1) == 1) return;
        try
        {
            if (File.Exists(Path.Combine(_data, UpdateMarkers.PlanFile)) || File.Exists(Path.Combine(_data, UpdateMarkers.ResultFile))) return;   // one update at a time
            var m = await _api.GetUpdateManifestAsync(ct);
            if (m is null || !m.UpdateAvailable) return;
            if (!string.Equals(m.PackageType, "msi", StringComparison.OrdinalIgnoreCase)) { _log.LogWarning("Update {Ver} ignored: package type '{T}' is not an MSI", m.Version, m.PackageType); return; }
            if (!Version.TryParse(m.Version, out var target) || !Version.TryParse(AppVersion.Current, out var mine) || target <= mine) return;
            if (m.Size <= 0 || m.Size > MaxPackageBytes) { _log.LogWarning("Update {Ver} ignored: unreasonable size {S}", m.Version, m.Size); return; }

            string corr = Guid.NewGuid().ToString("N")[..12];
            string dir = Path.Combine(_data, "updates", corr); Directory.CreateDirectory(dir);
            string pkg = Path.Combine(dir, "package.msi");
            await _api.ReportUpdateProgressAsync(m.Version, "downloading", AppVersion.Current, ct);
            if (!await _api.DownloadUpdatePackageAsync(pkg, m.Size, ct)) { _log.LogWarning("Update {Ver}: download failed", m.Version); TryDeleteDir(dir); return; }

            var plan = new UpdatePlan
            {
                CorrelationId = corr, Version = m.Version, Channel = m.Channel, PackagePath = pkg, Sha256Hash = m.Sha256Hash, Size = m.Size, SignatureBase64 = m.SignatureBase64,
                SigningCertThumbprint = m.SigningCertThumbprint, MinFromVersion = m.MinFromVersion, CreatedAt = DateTime.UtcNow.ToString("O"),
            };
            string planPath = Path.Combine(_data, UpdateMarkers.PlanFile);
            UpdateMarkers.WriteAtomic(planPath, JsonSerializer.Serialize(plan));
            await _api.ReportUpdateProgressAsync(m.Version, "installing", AppVersion.Current, ct);
            _log.LogInformation("Update {Ver} downloaded ({S} bytes); starting the updater", m.Version, m.Size);
            UpdateLauncher.Start(_data, planPath, _log);
        }
        catch (OperationCanceledException) { throw; }
        catch (Exception ex) { _log.LogWarning(ex, "Self-update attempt failed (nothing was installed)"); }
        finally { Volatile.Write(ref _busy, 0); }
    }

    /// <summary>After a restart: tell the server how the last update ended, then clear the markers.</summary>
    public async Task ReportPendingResultAsync(CancellationToken ct)
    {
        string path = Path.Combine(_data, UpdateMarkers.ResultFile);
        if (!File.Exists(path)) return;
        try
        {
            var r = JsonSerializer.Deserialize<UpdateResult>(File.ReadAllText(path));
            if (r is null || string.IsNullOrEmpty(r.Status)) { File.Delete(path); return; }
            string status = r.Status switch { "success" => "success", "rolled_back" => "rolled_back", "skipped" => "", _ => "failed" };
            string? msg = r.Status == "rollback_failed" ? "ROLLBACK FAILED - needs a person: " + r.Error : r.Error;
            if (status != "")
                await _api.ReportUpdateCompleteAsync(r.ToVersion ?? "", status, r.FromVersion, r.ToVersion, msg is null ? null : (msg.Length > 900 ? msg[..900] : msg), ct);
            _log.LogInformation("Self-update result reported: {Status} {From}->{To}", r.Status, r.FromVersion, r.ToVersion);
            File.Delete(path);
            if (r.Status == "success") TryDeleteDir(Path.Combine(_data, "updates", r.CorrelationId));       // failed runs keep their folder (saved MSI, logs) for the investigation
        }
        catch (OperationCanceledException) { throw; }
        catch (Exception ex) { _log.LogWarning(ex, "Could not report the self-update result yet; it stays for the next attempt"); }
    }

    private static void TryDeleteDir(string d) { try { if (Directory.Exists(d)) Directory.Delete(d, true); } catch { /* cosmetic */ } }
}

internal static class UpdateLauncher
{
    /// <summary>Copies this exe next to the data (so the installed exe is free to be replaced) and starts it detached in update mode.</summary>
    public static void Start(string dataPath, string planPath, ILogger log)
    {
        string runDir = Path.Combine(dataPath, "updates", "run"); Directory.CreateDirectory(runDir);
        string copy = Path.Combine(runDir, "LiderCollectorUpdate.exe");
        File.Copy(Environment.ProcessPath!, copy, overwrite: true);
        var psi = new ProcessStartInfo(copy) { UseShellExecute = false, CreateNoWindow = true, WorkingDirectory = runDir };
        psi.ArgumentList.Add("--apply-update"); psi.ArgumentList.Add(planPath);
        using var p = Process.Start(psi);
        log.LogInformation("Updater started (pid {Pid}) from {Copy}", p?.Id, copy);
    }
}
