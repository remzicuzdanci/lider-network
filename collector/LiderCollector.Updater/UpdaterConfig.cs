using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace LiderCollector.Updater;

/// <summary>
/// Reads the collector's config.json and DPAPI-protected api_key to authenticate
/// with the update API endpoints.  Read-only — the updater never writes config.
/// </summary>
internal sealed class UpdaterConfig
{
    // DataPath must match Program.cs: Path.Combine(CommonApplicationData, "LiderCollector")
    // DefaultInstallPath: use the updater binary's own directory — it ships alongside the service.
    private static readonly string DefaultDataPath    =
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "LiderCollector");
    private static readonly string DefaultInstallPath =
        string.IsNullOrEmpty(AppContext.BaseDirectory)
        ? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "LiderNetwork", "LiderCollector")
        : AppContext.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
    private const string ServiceName = "LiderCollector";

    public string ServerUrl    { get; private set; } = string.Empty;
    public string DataPath     { get; private set; } = DefaultDataPath;
    public string InstallPath  { get; private set; } = DefaultInstallPath;
    public string ServiceName_ => ServiceName;
    public string ApiKey       { get; private set; } = string.Empty;

    private UpdaterConfig() { }

    // Test-only constructor: sets properties directly without reading ProgramData or DPAPI.
    internal UpdaterConfig(string serverUrl, string dataPath, string installPath)
    {
        ServerUrl   = serverUrl;
        DataPath    = dataPath;
        InstallPath = installPath;
    }

    public static UpdaterConfig Load()
    {
        var cfg     = new UpdaterConfig();
        var dataPath = DefaultDataPath;

        string configPath = Path.Combine(dataPath, "config.json");
        if (File.Exists(configPath))
        {
            var raw = JsonSerializer.Deserialize<RawConfig>(
                File.ReadAllText(configPath),
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (raw != null)
            {
                cfg.ServerUrl   = raw.ServerUrl?.TrimEnd('/') ?? string.Empty;
                cfg.DataPath    = raw.DataPath ?? dataPath;
                cfg.InstallPath = raw.InstallPath ?? DefaultInstallPath;
            }
        }

        // Read DPAPI-protected API key (machine scope, same as main service writes it)
        string keyFile = Path.Combine(dataPath, "dpapi_api_key.bin");
        if (File.Exists(keyFile))
        {
            try
            {
                byte[] cipher  = File.ReadAllBytes(keyFile);
                byte[] plain   = System.Security.Cryptography.ProtectedData.Unprotect(cipher, null, DataProtectionScope.LocalMachine);
                cfg.ApiKey     = System.Text.Encoding.UTF8.GetString(plain);
            }
            catch
            {
                cfg.ApiKey = string.Empty;
            }
        }

        return cfg;
    }

    private sealed class RawConfig
    {
        [JsonPropertyName("server_url")]   public string? ServerUrl   { get; set; }
        [JsonPropertyName("data_path")]    public string? DataPath    { get; set; }
        [JsonPropertyName("install_path")] public string? InstallPath { get; set; }
    }
}
