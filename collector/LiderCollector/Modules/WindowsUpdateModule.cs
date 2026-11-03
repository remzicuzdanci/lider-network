using Microsoft.Extensions.Logging;
using Microsoft.Win32;
using System.Management;
using System.Text.Json.Serialization;

namespace LiderCollector.Modules;

/// <summary>
/// Collects Windows Update status via Win32_QuickFixEngineering (installed KBs)
/// and registry keys (reboot-required, last scan time, last install result).
/// Does NOT use Win32_Product — avoids MSI reconfiguration side-effects.
/// Caps installed updates at 100 items, limited to the last 90 days.
/// </summary>
public sealed class WindowsUpdateModule : ICollectorModule
{
    private readonly ILogger<WindowsUpdateModule> _log;
    public string Name => "windows_update";

    private const int MaxUpdates = 100;
    private const int LookbackDays = 90;

    public WindowsUpdateModule(ILogger<WindowsUpdateModule> log) => _log = log;

    public Task<object?> RunAsync(CancellationToken ct)
    {
        try
        {
            var payload = new WindowsUpdatePayload();
            CollectInstalledUpdates(payload);
            CollectRegistryStatus(payload);
            return Task.FromResult<object?>(payload);
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "WindowsUpdateModule failed");
            return Task.FromResult<object?>(null);
        }
    }

    private static void CollectInstalledUpdates(WindowsUpdatePayload p)
    {
        var updates = new List<InstalledUpdate>();
        var cutoff  = DateTime.UtcNow.AddDays(-LookbackDays);

        using var s = new ManagementObjectSearcher(
            "SELECT HotFixID,Description,InstalledOn FROM Win32_QuickFixEngineering");

        foreach (ManagementObject o in s.Get())
        {
            if (updates.Count >= MaxUpdates) break;

            string? kb = o["HotFixID"]?.ToString();
            if (string.IsNullOrEmpty(kb) || kb == "File 1") continue;

            DateTime? installedAt = null;
            if (o["InstalledOn"] is string dateStr && !string.IsNullOrEmpty(dateStr))
            {
                // InstalledOn can be "M/D/YYYY" or "YYYY-MM-DD" depending on locale
                if (DateTime.TryParse(dateStr, out var dt))
                    installedAt = dt.ToUniversalTime();
            }

            // Skip very old updates when we have a date; include undated ones
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

    private static void CollectRegistryStatus(WindowsUpdatePayload p)
    {
        // Reboot required: key exists when a reboot is pending
        try
        {
            using var key = Registry.LocalMachine.OpenSubKey(
                @"SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\RebootRequired",
                writable: false);
            p.RebootRequired = key != null;
        }
        catch { /* registry access denied — leave false */ }

        // Last successful scan timestamp
        try
        {
            using var key = Registry.LocalMachine.OpenSubKey(
                @"SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\Results\Detect",
                writable: false);
            if (key?.GetValue("LastSuccessTime") is string ts && !string.IsNullOrEmpty(ts))
                p.LastScanAt = ts;
        }
        catch { }

        // Last install result code (0 = success, non-zero = error)
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
        [JsonPropertyName("reboot_required")]     public bool    RebootRequired    { get; set; }
        [JsonPropertyName("last_scan_at")]        public string? LastScanAt        { get; set; }
        [JsonPropertyName("last_install_result")] public int?    LastInstallResult { get; set; }
    }

    public sealed class InstalledUpdate
    {
        [JsonPropertyName("kb_number")]    public string? KbNumber    { get; set; }
        [JsonPropertyName("description")]  public string? Description { get; set; }
        [JsonPropertyName("installed_at")] public string? InstalledAt { get; set; }
    }
}
