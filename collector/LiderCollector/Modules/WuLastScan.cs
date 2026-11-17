using Microsoft.Win32;

namespace LiderCollector.Modules;

/// <summary>Where the last-successful-scan time can be read from (faked in tests; the real one reads WUA and the registry, read-only).</summary>
public interface IWuScanSource
{
    /// <summary>
    /// Windows Update Agent, <c>Microsoft.Update.AutoUpdate</c> → <c>Results.LastSearchSuccessDate</c> (IAutomaticUpdatesResults, documented, Windows 7 / Server 2008 R2 and newer,
    /// incl. Windows 10/11 and Server 2016/2019/2022/2025). Returns null when Windows reports "never"; throws when the API cannot be used.
    /// </summary>
    DateTime? AutoUpdateLastSearchSuccess();

    /// <summary>Legacy registry value <c>Auto Update\Results\Detect\LastSuccessTime</c> (UTC text). Newer Windows builds often no longer maintain it. Null when absent.</summary>
    string? RegistryDetectLastSuccess();
}

/// <summary>Outcome of reading the last scan time: the time (UTC) or null, WHERE it came from and a plain status. Nothing is estimated.</summary>
public sealed record WuScanResult(DateTime? Utc, string Source, string Status, string? Detail)
{
    public const string SourceWua = "wua_autoupdate", SourceRegistry = "registry_detect", SourceNone = "none";
    public const string Ok = "ok", NeverScanned = "never_scanned", Unavailable = "unavailable", Error = "error";
}

public static class WuLastScan
{
    /// <summary>
    /// Order: (1) WUA AutoUpdate COM, (2) the legacy registry value. A time is accepted only when it is plausible (after 2001, not in the future).
    /// When neither gives a date the result says why: "never_scanned" (Windows itself reports it never searched), "unavailable" (API / key not present on this Windows) or "error".
    /// A history of INSTALLED updates is deliberately never used as a stand-in: an install date is not a scan date.
    /// </summary>
    public static WuScanResult Resolve(IWuScanSource src, DateTime nowUtc)
    {
        string status = WuScanResult.Unavailable; string? detail = null;
        try
        {
            var d = src.AutoUpdateLastSearchSuccess();
            if (d is null) { status = WuScanResult.NeverScanned; detail = "Windows reports that no update search has succeeded yet"; }
            else if (Plausible(d.Value, nowUtc)) return new WuScanResult(d.Value, WuScanResult.SourceWua, WuScanResult.Ok, null);
            else { status = WuScanResult.Error; detail = "WUA returned an implausible time"; }
        }
        catch (Exception ex)
        {
            status = ex.HResult == unchecked((int)0x80070422) ? WuScanResult.Unavailable : WuScanResult.Error;   // 0x80070422 = Windows Update service disabled
            detail = $"WUA AutoUpdate unavailable: {ex.GetType().Name} 0x{ex.HResult:X8}";
        }
        try
        {
            var raw = src.RegistryDetectLastSuccess();
            if (!string.IsNullOrWhiteSpace(raw))
            {
                if (DateTime.TryParse(raw, System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.AssumeUniversal | System.Globalization.DateTimeStyles.AdjustToUniversal, out var r) && Plausible(r, nowUtc))
                    return new WuScanResult(r, WuScanResult.SourceRegistry, WuScanResult.Ok, null);
                detail = (detail is null ? "" : detail + "; ") + "registry value not a valid time";
            }
            else detail = (detail is null ? "" : detail + "; ") + "registry value not present on this Windows build";
        }
        catch (Exception ex) { detail = (detail is null ? "" : detail + "; ") + $"registry unreadable: {ex.GetType().Name}"; }
        return new WuScanResult(null, WuScanResult.SourceNone, status, detail);
    }

    public static bool Plausible(DateTime utc, DateTime nowUtc) => utc.Year >= 2001 && utc <= nowUtc.AddDays(1);
}

/// <summary>Real source. Read-only: it never searches, downloads or installs anything.</summary>
public sealed class WindowsWuScanSource : IWuScanSource
{
    public DateTime? AutoUpdateLastSearchSuccess()
    {
        var type = Type.GetTypeFromProgID("Microsoft.Update.AutoUpdate") ?? throw new InvalidOperationException("Microsoft.Update.AutoUpdate is not registered");
        dynamic au = Activator.CreateInstance(type)!;
        object? v = au.Results.LastSearchSuccessDate;          // VT_DATE, local time; 1899-12-30 / empty = never
        if (v is not DateTime dt || dt.Year < 2001) return null;
        return DateTime.SpecifyKind(dt, DateTimeKind.Local).ToUniversalTime();
    }

    public string? RegistryDetectLastSuccess()
    {
        using var key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\Results\Detect", writable: false);
        return key?.GetValue("LastSuccessTime") as string;
    }
}
