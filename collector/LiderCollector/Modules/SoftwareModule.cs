using Microsoft.Extensions.Logging;
using Microsoft.Win32;
using System.Text.Json.Serialization;

namespace LiderCollector.Modules;

/// <summary>
/// Reads installed software from the Windows registry.
/// Enumerates both HKLM\SOFTWARE\...\Uninstall (64-bit) and
/// HKLM\SOFTWARE\Wow6432Node\...\Uninstall (32-bit on 64-bit OS).
/// Server contract: { "items": [ { "name", "vendor", "version", "install_date",
///   "architecture", "source_type", "is_system" } ] }
/// </summary>
public sealed class SoftwareModule : ICollectorModule
{
    private readonly ILogger<SoftwareModule> _log;
    public string Name => "software";

    // (path, source_type, architecture) tuples — order matters for dedup: x64 wins over x86
    private static readonly (string Path, string SourceType, string Architecture)[] _uninstallPaths =
    [
        (@"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",        "registry_x64", "x64"),
        (@"SOFTWARE\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall", "registry_x86", "x86"),
    ];

    public SoftwareModule(ILogger<SoftwareModule> log) => _log = log;

    public Task<object?> RunAsync(CancellationToken ct)
    {
        try
        {
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var items = new List<SoftwareEntry>();

            foreach (var (path, sourceType, arch) in _uninstallPaths)
            {
                using var key = Registry.LocalMachine.OpenSubKey(path);
                if (key == null) continue;

                foreach (string sub in key.GetSubKeyNames())
                {
                    using var appKey = key.OpenSubKey(sub);
                    if (appKey == null) continue;

                    string? name = appKey.GetValue("DisplayName")?.ToString();
                    if (string.IsNullOrWhiteSpace(name)) continue;

                    string? version  = appKey.GetValue("DisplayVersion")?.ToString();
                    string? vendor   = appKey.GetValue("Publisher")?.ToString();
                    string? installDate = appKey.GetValue("InstallDate")?.ToString();

                    // SystemComponent=1 are driver/OS components — still useful, mark them
                    bool isSystem = Convert.ToInt32(appKey.GetValue("SystemComponent") ?? 0) == 1;

                    // Dedup by name+version+vendor across both hives; x64 hive is enumerated first
                    string dedupeKey = $"{name}|{version}|{vendor}".ToLowerInvariant();
                    if (!seen.Add(dedupeKey)) continue;

                    items.Add(new SoftwareEntry
                    {
                        Name        = name,
                        Version     = version,
                        Vendor      = vendor,
                        InstallDate = ParseInstallDate(installDate),
                        Architecture = arch,
                        SourceType  = sourceType,
                        IsSystem    = isSystem,
                    });
                }
            }

            items.Sort((a, b) => string.Compare(a.Name, b.Name, StringComparison.OrdinalIgnoreCase));
            return Task.FromResult<object?>(new SoftwarePayload { Items = items });
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
        [JsonPropertyName("items")] public List<SoftwareEntry> Items { get; set; } = new();
    }

    public sealed class SoftwareEntry
    {
        [JsonPropertyName("name")]         public string? Name         { get; set; }
        [JsonPropertyName("version")]      public string? Version      { get; set; }
        [JsonPropertyName("vendor")]       public string? Vendor       { get; set; }
        [JsonPropertyName("install_date")] public string? InstallDate  { get; set; }
        [JsonPropertyName("architecture")] public string? Architecture { get; set; }
        [JsonPropertyName("source_type")]  public string? SourceType   { get; set; }
        [JsonPropertyName("is_system")]    public bool    IsSystem      { get; set; }
    }
}
