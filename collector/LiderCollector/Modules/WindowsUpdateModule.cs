using Microsoft.Extensions.Logging;
using Microsoft.Win32;
using System.Management;
using System.Text.Json.Serialization;

namespace LiderCollector.Modules;

/// <summary>
/// Collects Windows Update status via two complementary APIs (TD-1):
///
///   1. Win32_QuickFixEngineering — historically installed KBs (last 90 days, max 100).
///      Does NOT use Win32_Product — avoids MSI reconfiguration side-effects.
///
///   2. Windows Update Agent (WUA) COM API — pending (not-yet-installed) updates.
///      searcher.Online = false → queries the local WU cache ONLY; never triggers
///      a new scan or any network traffic.  Returns up to 20 pending items.
///      If the COM server is unavailable (e.g. WU service disabled) the call is
///      silently swallowed and pending_count is reported as 0.
///
///   3. Registry keys — reboot-required flag, last error code.
///   4. Last successful scan time (1.4.4): WUA Microsoft.Update.AutoUpdate Results.LastSearchSuccessDate first, the legacy registry value as fallback;
///      source and status are reported, never estimated (see WuLastScan).
/// </summary>
public sealed class WindowsUpdateModule : IReportingModule
{
    private readonly ILogger<WindowsUpdateModule> _log;
    private readonly IWuScanSource _scan;
    private readonly Func<DateTime> _now;
    public string Name => "windows_update";
    public ModuleReport? LastReport { get; private set; }

    private const int MaxInstalled  = 100;
    private const int LookbackDays  = 90;
    private const int MaxPending    = 20;

    public WindowsUpdateModule(ILogger<WindowsUpdateModule> log, IWuScanSource? scan = null, Func<DateTime>? now = null)
    {
        _log = log; _scan = scan ?? new WindowsWuScanSource(); _now = now ?? (() => DateTime.UtcNow);
    }

    public Task<object?> RunAsync(CancellationToken ct)
    {
        try
        {
            var payload = new WindowsUpdatePayload();
            var t = new SourceTracker();
            t.Run("InstalledUpdates", () => CollectInstalledUpdates(payload), required: false, _log);
            CollectPendingUpdates(payload);
            t.Note("PendingUpdates", payload.PendingQueryStatus ?? "unknown");
            if (payload.PendingQueryStatus is "unavailable" or "error") t.Warn($"pending updates not readable ({payload.PendingQueryStatus})");
            CollectRegistryStatus(payload);
            var scan = WuLastScan.Resolve(_scan, _now());
            payload.LastScanAt = scan.Utc?.ToString("yyyy-MM-ddTHH:mm:ssZ");
            payload.LastScanSource = scan.Source; payload.LastScanStatus = scan.Status;
            t.Note("LastScan", scan.Status == WuScanResult.Ok ? $"ok ({scan.Source})" : $"{scan.Status}{(scan.Detail is null ? "" : ": " + scan.Detail)}");
            if (scan.Status != WuScanResult.Ok) t.Warn($"last scan date not available ({scan.Status}); the Collector does not estimate it");
            LastReport = t.Finish();
            return Task.FromResult<object?>(payload);
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "WindowsUpdateModule failed");
            return Task.FromResult<object?>(null);
        }
    }

    // ── Installed updates (Win32_QuickFixEngineering) ─────────────────────────

    private static void CollectInstalledUpdates(WindowsUpdatePayload p)
    {
        var updates = new List<InstalledUpdate>();
        var cutoff  = DateTime.UtcNow.AddDays(-LookbackDays);

        using var s = new ManagementObjectSearcher(
            "SELECT HotFixID,Description,InstalledOn FROM Win32_QuickFixEngineering");

        foreach (ManagementObject o in s.Get())
        {
            if (updates.Count >= MaxInstalled) break;

            string? kb = o["HotFixID"]?.ToString();
            if (string.IsNullOrEmpty(kb) || kb == "File 1") continue;

            DateTime? installedAt = null;
            if (o["InstalledOn"] is string dateStr && !string.IsNullOrEmpty(dateStr))
            {
                if (DateTime.TryParse(dateStr, out var dt))
                    installedAt = dt.ToUniversalTime();
            }

            if (installedAt.HasValue && installedAt.Value < cutoff) continue;

            updates.Add(new InstalledUpdate
            {
                KbNumber    = kb,
                Description = o["Description"]?.ToString(),
                InstalledAt = installedAt?.ToString("yyyy-MM-ddTHH:mm:ssZ"),
            });
        }

        p.InstalledUpdates = updates;
    }

    // ── Pending updates (WUA COM API — cached only) ───────────────────────────

    /// <summary>
    /// Query WUA for not-yet-installed updates.
    /// Sets PendingQueryStatus to "ok", "unavailable", or "error".
    /// PendingCount is only set when status is "ok"; null otherwise (TD-1).
    /// </summary>
    private void CollectPendingUpdates(WindowsUpdatePayload p)
    {
        p.PendingQueriedAt = DateTime.UtcNow.ToString("o");
        try
        {
            // Late-bind to avoid compile-time dependency on WUA COM registration
            var type = Type.GetTypeFromProgID("Microsoft.Update.Session");
            if (type == null)
            {
                p.PendingQueryStatus = "unavailable";
                return;
            }

            dynamic session  = Activator.CreateInstance(type)!;
            dynamic searcher = session.CreateUpdateSearcher();
            searcher.Online  = false; // cached results only — NEVER trigger a scan

            dynamic result = searcher.Search("IsInstalled=0 and IsHidden=0");
            int total      = (int)result.Updates.Count;

            p.PendingQueryStatus = "ok";
            p.PendingCount       = total;
            p.PendingUpdates     = new List<PendingUpdate>();

            for (int i = 0; i < Math.Min(total, MaxPending); i++)
            {
                dynamic u = result.Updates.Item(i);
                p.PendingUpdates.Add(new PendingUpdate
                {
                    Title       = (string?)u.Title,
                    UpdateId    = (string?)u.Identity.UpdateID,
                    IsMandatory = (bool)u.IsMandatory,
                });
            }
        }
        catch (Exception ex)
        {
            // WUA unavailable (disabled service, restricted environment, Server Core) — not fatal
            // pending_count left as null (unknown), status distinguishes from "0 pending"
            _log.LogDebug(ex, "WUA COM query failed; pending_count unknown");
            p.PendingQueryStatus = ex.HResult == unchecked((int)0x80070422)
                ? "unavailable"  // ERROR_SERVICE_DISABLED
                : "error";
        }
    }

    // ── Registry status ───────────────────────────────────────────────────────

    private static void CollectRegistryStatus(WindowsUpdatePayload p)
    {
        try
        {
            using var key = Registry.LocalMachine.OpenSubKey(
                @"SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\RebootRequired",
                writable: false);
            p.RebootRequired = key != null;
        }
        catch { }

        try
        {
            using var key = Registry.LocalMachine.OpenSubKey(
                @"SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\Results\Install",
                writable: false);
            if (key?.GetValue("LastError") is int code)
                p.LastInstallResult = code;
        }
        catch { }
    }

    // ── Payload DTOs ──────────────────────────────────────────────────────────

    public sealed class WindowsUpdatePayload
    {
        [JsonPropertyName("installed_updates")]    public List<InstalledUpdate> InstalledUpdates  { get; set; } = new();
        // WUA query fields (TD-1): pending_count is null when query failed (not 0)
        [JsonPropertyName("pending_query_status")] public string?               PendingQueryStatus { get; set; }
        [JsonPropertyName("pending_queried_at")]   public string?               PendingQueriedAt   { get; set; }
        [JsonPropertyName("pending_count")]        public int?                  PendingCount       { get; set; }
        [JsonPropertyName("pending_updates")]      public List<PendingUpdate>?  PendingUpdates     { get; set; }
        [JsonPropertyName("reboot_required")]      public bool                  RebootRequired     { get; set; }
        [JsonPropertyName("last_scan_at")]         public string?               LastScanAt         { get; set; }
        /// <summary>1.4.4: where last_scan_at came from (wua_autoupdate | registry_detect | none) and the plain status (ok | never_scanned | unavailable | error).</summary>
        [JsonPropertyName("last_scan_source")]     public string?               LastScanSource     { get; set; }
        [JsonPropertyName("last_scan_status")]     public string?               LastScanStatus     { get; set; }
        [JsonPropertyName("last_install_result")]  public int?                  LastInstallResult  { get; set; }
    }

    public sealed class InstalledUpdate
    {
        [JsonPropertyName("kb_number")]    public string? KbNumber    { get; set; }
        [JsonPropertyName("description")]  public string? Description { get; set; }
        [JsonPropertyName("installed_at")] public string? InstalledAt { get; set; }
    }

    public sealed class PendingUpdate
    {
        [JsonPropertyName("title")]        public string? Title       { get; set; }
        [JsonPropertyName("update_id")]    public string? UpdateId    { get; set; }
        [JsonPropertyName("is_mandatory")] public bool    IsMandatory { get; set; }
    }
}
