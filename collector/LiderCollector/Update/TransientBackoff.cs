using System.Text.Json;

namespace LiderCollector.Update;

/// <summary>
/// Controlled retry for the update path when the SERVER or the NETWORK is the problem (HTTP 429 / 5xx, timeouts, interrupted download) - not the package. Without it every heartbeat started
/// another 70 MB download attempt. Schedule 2 / 5 / 15 / 30 / 60 minutes (then 60), Retry-After wins when it is longer; a good download clears it. Separate from the 6 h back-off of a FAILED update.
/// Persisted (atomic) so a service restart does not reset the waiting.
/// </summary>
internal static class TransientBackoff
{
    private static readonly int[] Minutes = { 2, 5, 15, 30, 60 };
    private static string File_(string data) => Path.Combine(data, "update-transient.json");

    public static TimeSpan DelayFor(int failures, TimeSpan? retryAfter = null)
    {
        var d = TimeSpan.FromMinutes(Minutes[Math.Clamp(failures - 1, 0, Minutes.Length - 1)]);
        return retryAfter is { } r && r > d ? (r > TimeSpan.FromHours(6) ? TimeSpan.FromHours(6) : r) : d;
    }

    public static bool Active(string data, DateTime? nowUtc = null)
    {
        try { using var d = JsonDocument.Parse(File.ReadAllText(File_(data))); return DateTime.Parse(d.RootElement.GetProperty("until").GetString()!, null, System.Globalization.DateTimeStyles.RoundtripKind).ToUniversalTime() > (nowUtc ?? DateTime.UtcNow); }
        catch { return false; }
    }

    /// <summary>Records one more transient failure and returns how long to wait.</summary>
    public static TimeSpan Fail(string data, string why, TimeSpan? retryAfter = null, DateTime? nowUtc = null)
    {
        int n = 1;
        try { using var d = JsonDocument.Parse(File.ReadAllText(File_(data))); n = d.RootElement.GetProperty("failures").GetInt32() + 1; } catch { }
        var wait = DelayFor(n, retryAfter); var now = nowUtc ?? DateTime.UtcNow;
        try { UpdateMarkers.WriteAtomic(File_(data), JsonSerializer.Serialize(new { failures = n, until = (now + wait).ToString("O"), why = why.Length > 200 ? why[..200] : why })); } catch { /* informational */ }
        return wait;
    }

    public static void Clear(string data) { try { File.Delete(File_(data)); } catch { } }
}
