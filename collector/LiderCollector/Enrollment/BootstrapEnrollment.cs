using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace LiderCollector.Enrollment;

/// <summary>
/// Reads a one-time enrollment.json placed in the data directory by IT
/// (via GPO Preferences file copy, SCCM, PSEXEC, or any management tool).
///
/// The file is deleted immediately after a successful read so that the token
/// cannot be recovered from disk.  The token must NEVER appear in:
///   - MSI install properties
///   - Command-line arguments (visible in process list / Event Log)
///   - Group Policy registry settings
///   - collector.json
///
/// Format of enrollment.json:
/// {
///   "server_url":        "https://lider.example.com",
///   "enrollment_token":  "&lt;one-time token from Lider IT ONE dashboard&gt;"
/// }
/// </summary>
public sealed class BootstrapEnrollment
{
    private readonly string _dataDir;
    private readonly ILogger<BootstrapEnrollment> _log;

    public sealed record Config(string ServerUrl, string EnrollmentToken);

    public BootstrapEnrollment(string dataDir, ILogger<BootstrapEnrollment> log)
    {
        _dataDir = dataDir;
        _log     = log;
    }

    /// <summary>
    /// Returns bootstrap config if enrollment.json exists and is valid; null otherwise.
    /// The file is deleted on successful read regardless of whether enrollment later succeeds.
    /// A failed deletion is logged and the method still returns the config — the agent
    /// will re-read and re-enroll on the next start (the server rejects replayed tokens).
    /// </summary>
    public Config? TryRead()
    {
        string path = Path.Combine(_dataDir, "enrollment.json");
        if (!File.Exists(path)) return null;

        try
        {
            string json = File.ReadAllText(path);
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            string? serverUrl = root.TryGetProperty("server_url", out var urlElem)
                ? urlElem.GetString() : null;
            string? token = root.TryGetProperty("enrollment_token", out var tokElem)
                ? tokElem.GetString() : null;

            if (string.IsNullOrWhiteSpace(serverUrl))
            {
                _log.LogWarning("enrollment.json: missing or empty server_url — ignoring file.");
                return null;
            }
            if (string.IsNullOrWhiteSpace(token))
            {
                _log.LogWarning("enrollment.json: missing or empty enrollment_token — ignoring file.");
                return null;
            }

            // Delete immediately — token is single-use; re-read on next start is handled
            // by the server rejecting replayed tokens, not by blocking reads here.
            TryDeleteFile(path);

            // Log server URL only; never log the token value.
            _log.LogInformation("Bootstrap enrollment loaded. ServerUrl={Url}", serverUrl);
            return new Config(serverUrl, token);
        }
        catch (JsonException ex)
        {
            _log.LogWarning(ex, "enrollment.json is not valid JSON — ignoring.");
            return null;
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "Could not read enrollment.json — skipping bootstrap.");
            return null;
        }
    }

    private void TryDeleteFile(string path)
    {
        try
        {
            File.Delete(path);
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex,
                "Could not delete enrollment.json after reading. " +
                "File will be retried on next start; server will reject replayed tokens.");
        }
    }
}
