namespace LiderCollector.Update;

/// <summary>
/// Pure host check used by the TEST-PKI build (always compiled so it is unit-tested in the normal build).
/// A test-PKI Collector may talk ONLY to the hosts it was built for; everything else - in particular the production server - is refused.
/// </summary>
internal static class TestBuildPolicy
{
    public static bool IsServerAllowed(string? url, string allowedHosts)
    {
        if (string.IsNullOrWhiteSpace(url) || string.IsNullOrWhiteSpace(allowedHosts)) return false;
        if (!Uri.TryCreate(url.Trim(), UriKind.Absolute, out var u) || (u.Scheme != Uri.UriSchemeHttp && u.Scheme != Uri.UriSchemeHttps)) return false;
        foreach (var h in allowedHosts.Split(new[] { ';', ',' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            if (string.Equals(h, u.Host, StringComparison.OrdinalIgnoreCase)) return true;
        return false;
    }
}

/// <summary>
/// Compile-time switch. The PRODUCTION build (no LIDER_TESTPKI symbol) keeps the production pins and <see cref="Is"/> is false; this is the ONLY code that differs between the two builds (plus the embedded public certificates).
/// The TEST-PKI build (tools\vmtest\Build-TestPkiMsi.ps1) pins a throw-away test CA / test signer and refuses every server that is not on the test allow-list.
/// </summary>
internal static class TestBuild
{
#if LIDER_TESTPKI
    public const bool Is = true;
    public static bool ServerAllowed(string? url) => TestBuildPolicy.IsServerAllowed(url, TestBuildPins.AllowedHosts);
#else
    public const bool Is = false;
    public static bool ServerAllowed(string? url) => true;
#endif
}
