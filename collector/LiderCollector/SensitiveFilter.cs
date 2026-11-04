namespace LiderCollector;

/// <summary>
/// Masks sensitive data in event log messages before sending to the server.
/// Extracted to a public static class so it can be unit tested independently.
/// </summary>
public static class SensitiveFilter
{
    // Checked case-insensitively; whole message is redacted if any pattern matches.
    // Intentionally broad: false positives (legitimate messages redacted) are preferred
    // over false negatives (credential leaks reaching the server).
    public static readonly string[] Patterns =
        ["password", "passwd", "token", "secret", " key=", "credential", "pwd=", "apikey"];

    public static string? Mask(string? msg)
    {
        if (string.IsNullOrEmpty(msg)) return msg;
        foreach (string pattern in Patterns)
        {
            if (msg.Contains(pattern, StringComparison.OrdinalIgnoreCase))
                return "[REDACTED]";
        }
        return msg;
    }

    public static bool IsSensitive(string? msg)
        => !string.IsNullOrEmpty(msg) && Mask(msg) == "[REDACTED]";
}
