using System.Net;
using System.Net.Sockets;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace LiderCollector.Core;

/// <summary>
/// Transport security rules.
///
///   • https://   → always allowed.
///   • http://    → allowed ONLY when collector.json has allow_http=true AND the server is on a private /
///                  loopback / link-local address or a single-label / .local / .lan / .test host name.
///                  A public host name or public IP is never allowed over plain HTTP, whatever the flag says.
///
/// The flag can be set on an already-enrolled machine in exactly one automatic way: an MSI upgrade
/// (<see cref="TryApplyUpgradePolicy"/>), under the strict conditions documented there.
/// </summary>
public static class TransportPolicy
{
    public const string PolicyFileName = "transport-policy.json";

    /// <summary>The window in which a policy file written by the installer is honoured.</summary>
    public static readonly TimeSpan PolicyMaxAge = TimeSpan.FromHours(6);

    public static bool IsHttp(string? url) =>
        !string.IsNullOrWhiteSpace(url) && url.StartsWith("http://", StringComparison.OrdinalIgnoreCase);

    /// <summary>True when the host is a private-network address or an internal-only name (test / lab environments).</summary>
    public static bool IsPrivateHost(string? url)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri)) return false;
        string host = uri.DnsSafeHost;
        if (string.IsNullOrEmpty(host)) return false;

        if (IPAddress.TryParse(host, out var ip))
        {
            if (IPAddress.IsLoopback(ip)) return true;
            if (ip.AddressFamily == AddressFamily.InterNetworkV6)
                return ip.IsIPv6LinkLocal || ip.IsIPv6SiteLocal || (ip.GetAddressBytes()[0] & 0xFE) == 0xFC; // fe80::/10, fec0::/10, fc00::/7
            var b = ip.GetAddressBytes();
            return b[0] == 10
                || (b[0] == 172 && b[1] >= 16 && b[1] <= 31)
                || (b[0] == 192 && b[1] == 168)
                || (b[0] == 169 && b[1] == 254);
        }

        host = host.ToLowerInvariant();
        if (!host.Contains('.')) return true; // single-label (NetBIOS) name, never routable on the internet
        return host == "localhost"
            || host.EndsWith(".localhost") || host.EndsWith(".local") || host.EndsWith(".lan")
            || host.EndsWith(".test") || host.EndsWith(".internal") || host.EndsWith(".home.arpa");
    }

    /// <summary>Decision for one URL. <paramref name="reason"/> explains a refusal (goes to the log / state file).</summary>
    public static bool IsAllowed(string? serverUrl, bool allowHttp, out string reason)
    {
        reason = string.Empty;
        if (string.IsNullOrWhiteSpace(serverUrl)) return true; // not configured yet (fresh install)
        if (!IsHttp(serverUrl)) return true;
        if (!allowHttp)
        {
            reason = "ServerUrl uses plain HTTP but AllowHttp=false (production default).";
            return false;
        }
        if (!IsPrivateHost(serverUrl))
        {
            reason = "Plain HTTP is only permitted for private-network test servers; this server address is not private.";
            return false;
        }
        return true;
    }

    /// <summary>scheme://host:port, lower-case, no trailing slash / path — for comparing two server URLs.</summary>
    public static string Normalize(string? url)
    {
        if (!Uri.TryCreate((url ?? string.Empty).Trim(), UriKind.Absolute, out var u)) return string.Empty;
        return $"{u.Scheme.ToLowerInvariant()}://{u.DnsSafeHost.ToLowerInvariant()}:{u.Port}";
    }

    public sealed class UpgradeResult
    {
        public bool Applied { get; init; }
        public bool FilePresent { get; init; }
        public string Reason { get; init; } = string.Empty;
    }

    /// <summary>
    /// Handles %ProgramData%\LiderCollector\transport-policy.json, written by the MSI when it upgrades a machine that
    /// is ALREADY enrolled to a plain-HTTP (test) server. The file is always consumed (deleted) here. It sets
    /// AllowHttp=true only if EVERY condition holds:
    ///   1. this agent is enrolled (collector_id &gt; 0) and holds an API key;
    ///   2. the policy names the same collector_id that this machine is enrolled as (the installer read it from collector.json);
    ///   3. the policy server_url equals the agent's current server_url (scheme, host, port);
    ///   4. the current URL is http and AllowHttp is still false (never changes an https configuration);
    ///   5. the host is a private-network / internal name (never a public address);
    ///   6. environment == "test" and the file is fresh (issued_at within <see cref="PolicyMaxAge"/>, not in the future);
    ///   7. the BIOS UUID recorded at enrollment equals this machine's current BIOS UUID (same physical/virtual machine).
    /// </summary>
    public static UpgradeResult TryApplyUpgradePolicy(
        string dataDir, CollectorConfig config, bool hasApiKey, Func<string?> currentBiosUuid, ILogger log, DateTime? nowUtc = null)
    {
        string path = Path.Combine(dataDir, PolicyFileName);
        if (!File.Exists(path)) return new UpgradeResult();

        string reason;
        bool apply = false;
        try
        {
            string json = File.ReadAllText(path);
            using var doc = JsonDocument.Parse(json);
            var r = doc.RootElement;

            string? S(string n) => r.TryGetProperty(n, out var e) && e.ValueKind == JsonValueKind.String ? e.GetString() : null;
            int pid = r.TryGetProperty("collector_id", out var ce) && ce.ValueKind == JsonValueKind.Number && ce.TryGetInt32(out var ci) ? ci : 0;
            bool wants = r.TryGetProperty("allow_http", out var ah) && ah.ValueKind == JsonValueKind.True;
            DateTime now = nowUtc ?? DateTime.UtcNow;
            bool haveStamp = DateTime.TryParse(S("issued_at"), null, System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal, out var issued);

            if (!wants) reason = "policy does not request allow_http";
            else if (!config.IsEnrolled || !hasApiKey) reason = "agent is not enrolled on this machine";
            else if (pid != config.CollectorId) reason = "policy collector_id does not match the enrolled identity";
            else if (TransportPolicy.Normalize(S("server_url")) == string.Empty
                     || TransportPolicy.Normalize(S("server_url")) != TransportPolicy.Normalize(config.ServerUrl)) reason = "policy server_url differs from the enrolled server";
            else if (!IsHttp(config.ServerUrl)) reason = "current server URL is not plain HTTP (https configurations are never relaxed)";
            else if (config.AllowHttp) { reason = "allow_http already set"; }
            else if (!IsPrivateHost(config.ServerUrl)) reason = "server address is not a private-network address";
            else if (!string.Equals(S("environment"), "test", StringComparison.Ordinal)) reason = "policy is not marked as a test environment";
            else if (!haveStamp || issued > now.AddMinutes(5) || now - issued > PolicyMaxAge) reason = "policy is missing, from the future, or expired";
            else
            {
                string? enrolledBios = config.EnrolledBiosUuid;
                string? currentBios = null;
                try { currentBios = currentBiosUuid(); } catch { /* treated as unknown below */ }
                if (string.IsNullOrWhiteSpace(enrolledBios) || string.IsNullOrWhiteSpace(currentBios)
                    || !string.Equals(enrolledBios, currentBios, StringComparison.OrdinalIgnoreCase))
                    reason = "hardware identity (BIOS UUID) does not match the one recorded at enrollment";
                else { apply = true; reason = "all conditions met"; }
            }
        }
        catch (Exception ex)
        {
            reason = "policy file unreadable: " + ex.GetType().Name;
        }
        finally
        {
            try { File.Delete(path); } catch (Exception ex) { log.LogWarning(ex, "Could not delete {File}", PolicyFileName); }
        }

        if (apply)
        {
            config.AllowHttp = true;
            config.Save();
            log.LogWarning("Plain-HTTP transport inherited from the MSI upgrade for the already-enrolled test server {Url} (collector #{Id}). Use HTTPS before any customer deployment.",
                config.ServerUrl, config.CollectorId);
        }
        else
        {
            log.LogWarning("Ignored {File}: {Reason}.", PolicyFileName, reason);
        }
        return new UpgradeResult { Applied = apply, FilePresent = true, Reason = reason };
    }
}
