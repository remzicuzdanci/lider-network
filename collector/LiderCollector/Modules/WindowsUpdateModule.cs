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
///   3. Registry keys — reboot-required flag, last scan timestamp, last error code.
/// </summary>
public sealed class WindowsUpdateModule : ICollectorModule
{
    private readonly ILogger<WindowsUpdateModule> _log;
    public string Name => "windows_update";

    private const int MaxInstalled  = 100;
    private const int LookbackDays  = 90;
    private const int MaxPending    = 20;

    public WindowsUpdateModule(ILogger<WindowsUpdateModule> log) => _log = log;

    public Task<object?> RunAsync(CancellationToken ct)
    {
        try
        {
            var payload = new WindowsUpdatePayload();
            CollectInstalledUpdates(payload);
            CollectPendingUpdates(payload);
            CollectRegistryStatus(payload);
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

    private void CollectPendingUpdates(WindowsUpdatePayload p)
    {
        try
        {
            // Late-bind to avoid compile-time dependency on WUA COM registration
            var type = Type.GetTypeFromProgID("Microsoft.Update.Session");
            if (type == null) return;

            dynamic session  = Activator.CreateInstance(type)!;
            dynamic searcher = session.CreateUpdateSearcher();
            searcher.Online  = false; // cached results only — NEVER trigger a scan

            dynamic result = searcher.Search("IsInstalled=0 and IsHidden=0");
            int total      = (int)result.Updates.Count;

            p.PendingCount   = total;
            p.PendingUpdates = new List<PendingUpdate>();

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
            // WUA unavailable (disabled service, restricted environment) — not fatal
            _log.LogDebug(ex, "WUA COM unavailable; pending_count will be 0");
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
                @"SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\Results\Detect",
                writable: false);
            if (key?.GetValue("LastSuccessTime") is string ts && !string.IsNullOrEmpty(ts))
                p.LastScanAt = ts;
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
        [JsonPropertyName("installed_updates")]   public List<InstalledUpdate> InstalledUpdates { get; set; } = new();
        [JsonPropertyName("pending_count")]       public int?                  PendingCount     { get; set; }
        [JsonPropertyName("pending_updates")]     public List<PendingUpdate>?  PendingUpdates   { get; set; }
        [JsonPropertyName("reboot_required")]     public bool                  RebootRequired   { get; set; }
        [JsonPropertyName("last_scan_at")]        public string?               LastScanAt       { get; set; }
        [JsonPropertyName("last_install_result")] public int?                  LastInstallResult { get; set; }
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
