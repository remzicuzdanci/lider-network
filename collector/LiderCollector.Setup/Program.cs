using System.Diagnostics;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

// Lider IT ONE Collector Setup Launcher
// - Reads enrollment config appended to this binary (marker-delimited JSON)
// - Writes enrollment.json to %ProgramData%\LiderCollector\
// - Downloads the MSI from the server and runs it silently
// - Requires Administrator elevation (declared in app.manifest)
// - Errors are written to %ProgramData%\LiderCollector\setup.log

const string StartMarker = "[LIDERSETUP_DATA]";
const string EndMarker   = "[/LIDERSETUP_DATA]";

var logDir = Path.Combine(
    Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
    "LiderCollector");

try
{
    Directory.CreateDirectory(logDir);

    var config = ReadEmbeddedConfig();
    Log(logDir, $"Server: {config.ServerUrl}");

    // Write enrollment.json — service reads and deletes it on first start
    var enrollPayload  = new EnrollmentConfig(config.ServerUrl, config.EnrollmentToken);
    var enrollmentJson = JsonSerializer.Serialize(enrollPayload, EnrollmentConfigContext.Default.EnrollmentConfig);
    File.WriteAllText(Path.Combine(logDir, "enrollment.json"), enrollmentJson, Encoding.UTF8);
    Log(logDir, "enrollment.json written.");

    // Download MSI
    var msiUrl  = config.ServerUrl.TrimEnd('/') + "/downloads/LiderITONECollector-1.0.0.msi";
    var msiPath = Path.Combine(Path.GetTempPath(), "LiderITONECollector_setup.msi");
    Log(logDir, $"Downloading MSI from {msiUrl} ...");
    using var http = new HttpClient { Timeout = TimeSpan.FromMinutes(5) };
    var msiBytes = await http.GetByteArrayAsync(msiUrl);
    await File.WriteAllBytesAsync(msiPath, msiBytes);
    Log(logDir, $"MSI downloaded ({msiBytes.Length / 1024 / 1024} MB).");

    // Run MSI silently — /qb- shows only progress bar, no cancel button
    var psi = new ProcessStartInfo("msiexec.exe",
        $"/i \"{msiPath}\" /qb- /norestart")
    {
        UseShellExecute = false,
        CreateNoWindow  = true,
    };
    var proc = Process.Start(psi)!;
    await proc.WaitForExitAsync();
    Log(logDir, $"MSI exit code: {proc.ExitCode}");

    try { File.Delete(msiPath); } catch { /* non-critical */ }

    return proc.ExitCode;
}
catch (Exception ex)
{
    Log(logDir, $"SETUP ERROR: {ex}");
    Console.Error.WriteLine($"Lider Collector Setup hatası: {ex.Message}");
    Console.Error.WriteLine($"Detay için: {Path.Combine(logDir, "setup.log")}");
    return 1;
}

static EnrollmentConfig ReadEmbeddedConfig()
{
    var exePath  = Process.GetCurrentProcess().MainModule?.FileName
                   ?? Environment.ProcessPath
                   ?? throw new InvalidOperationException("Cannot locate current EXE.");
    var exeBytes = File.ReadAllBytes(exePath);
    var startIdx = FindLast(exeBytes, Encoding.UTF8.GetBytes(StartMarker));
    var endIdx   = FindLast(exeBytes, Encoding.UTF8.GetBytes(EndMarker));

    if (startIdx < 0 || endIdx < 0 || endIdx <= startIdx)
        throw new InvalidOperationException(
            "Bu kurulum paketi enrollment bilgisi içermiyor. " +
            "Lider IT ONE panelinden yeni bir paket indirin.");

    var jsonStart = startIdx + StartMarker.Length;
    var json      = Encoding.UTF8.GetString(exeBytes, jsonStart, endIdx - jsonStart);
    var cfg       = JsonSerializer.Deserialize(json, EnrollmentConfigContext.Default.EnrollmentConfig)
                    ?? throw new InvalidOperationException("Geçersiz enrollment yapılandırması.");

    if (string.IsNullOrWhiteSpace(cfg.ServerUrl) || string.IsNullOrWhiteSpace(cfg.EnrollmentToken))
        throw new InvalidOperationException("Enrollment yapılandırması eksik.");

    return cfg;
}

static int FindLast(byte[] data, byte[] pattern)
{
    for (int i = data.Length - pattern.Length; i >= 0; i--)
    {
        bool found = true;
        for (int j = 0; j < pattern.Length; j++)
        {
            if (data[i + j] != pattern[j]) { found = false; break; }
        }
        if (found) return i;
    }
    return -1;
}

static void Log(string dir, string message)
{
    var line = $"{DateTime.Now:yyyy-MM-dd HH:mm:ss} {message}";
    Console.WriteLine(line);
    try
    {
        File.AppendAllText(Path.Combine(dir, "setup.log"), line + Environment.NewLine);
    }
    catch { /* ignore log write failures */ }
}

[JsonSerializable(typeof(EnrollmentConfig))]
internal partial class EnrollmentConfigContext : JsonSerializerContext { }

internal sealed record EnrollmentConfig(
    [property: JsonPropertyName("server_url")]       string ServerUrl,
    [property: JsonPropertyName("enrollment_token")] string EnrollmentToken
);
