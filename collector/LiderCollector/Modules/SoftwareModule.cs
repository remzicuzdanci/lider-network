using Microsoft.Extensions.Logging;
using Microsoft.Win32;
using System.Text.Json.Serialization;

namespace LiderCollector.Modules;

/// <summary>
/// Reads installed software from the Windows registry.
/// Enumerates both HKLM\SOFTWARE\...\Uninstall (64-bit) and
/// HKLM\SOFTWARE\Wow6432Node\...\Uninstall (32-bit on 64-bit OS).
/// </summary>
public sealed class SoftwareModule : ICollectorModule
{
    private readonly ILogger<SoftwareModule> _log;
    public string Name => "software";

    private static readonly string[] _uninstallPaths =
    [
        @"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
        @"SOFTWARE\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall",
    ];

    public SoftwareModule(ILogger<SoftwareModule> log) => _log = log;

    public Task<object?> RunAsync(CancellationToken ct)
    {
        try
        {
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var apps = new List<SoftwareEntry>();

            foreach (string path in _uninstallPaths)
            {
                using var key = Registry.LocalMachine.OpenSubKey(path);
                if (key == null) continue;

                foreach (string sub in key.GetSubKeyNames())
                {
                    using var appKey = key.OpenSubKey(sub);
                    if (appKey == null) continue;

                    string? name = appKey.GetValue("DisplayName")?.ToString();
                    if (string.IsNullOrWhiteSpace(name)) continue;

                    string? version = appKey.GetValue("DisplayVersion")?.ToString();
                    string? publisher = appKey.GetValue("Publisher")?.ToString();
                    string? installDate = appKey.GetValue("InstallDate")?.ToString();
                    string? installLocation = appKey.GetValue("InstallLocation")?.ToString();

                    // SystemComponent=1 are driver/OS components — still useful, include them
                    // but mark them so the UI can filter.
                    bool isSystem = Convert.ToInt32(appKey.GetValue("SystemComponent") ?? 0) == 1;

                    string dedupeKey = $"{name}|{version}|{publisher}".ToLowerInvariant();
                    if (!seen.Add(dedupeKey)) continue;

                    apps.Add(new SoftwareEntry
                    {
                        Name = name,
                        Version = version,
                        Publisher = publisher,
                        InstallDate = ParseInstallDate(installDate),
                        InstallLocation = installLocation,
                        IsSystemComponent = isSystem,
                    });
                }
            }

            apps.Sort((a, b) => string.Compare(a.Name, b.Name, StringComparison.OrdinalIgnoreCase));
            return Task.FromResult<object?>(new SoftwarePayload { Applications = apps });
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "SoftwareModule failed");
            return Task.FromResult<object?>(null);
        }
    }

    private static string? ParseInstallDate(string? raw)
    {
        // Registry stores as YYYYMMDD
        if (raw?.Length == 8 &&
            DateTime.TryParseExact(raw, "yyyyMMdd",
                System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.None, out var dt))
            return dt.ToString("yyyy-MM-dd");
        return raw;
    }

    public sealed class SoftwarePayload
    {
        [JsonPropertyName("applications")] public List<SoftwareEntry> Applications { get; set; } = new();
    }

    public sealed class SoftwareEntry
    {
        [JsonPropertyName("name")] public string? Name { get; set; }
        [JsonPropertyName("version")] public string? Version { get; set; }
        [JsonPropertyName("publisher")] public string? Publisher { get; set; }
        [JsonPropertyName("install_date")] public string? InstallDate { get; set; }
        [JsonPropertyName("install_location")] public string? InstallLocation { get; set; }
        [JsonPropertyName("is_system_component")] public bool IsSystemComponent { get; set; }
    }
}
