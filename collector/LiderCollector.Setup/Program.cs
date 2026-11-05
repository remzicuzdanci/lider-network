using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

await RunSetupAsync();

static async Task RunSetupAsync()
{
    const string ServerUrl         = "http://192.168.20.61";
    const string LogPath           = @"C:\ProgramData\LiderCollector\setup.log";
    const string EnrollmentJson    = @"C:\ProgramData\LiderCollector\enrollment.json";
    const string MsiUrl            = ServerUrl + "/downloads/LiderITONECollector-1.0.0.msi";
    const string MsiPath           = @"C:\ProgramData\LiderCollector\LiderITONECollector.msi";

    Directory.CreateDirectory(@"C:\ProgramData\LiderCollector");
    Log(LogPath, "=== Lider IT ONE Collector Setup başladı ===");

    // 1 — Read deploy token from filename
    //     Filename format: LiderCollectorSetup-{anything}-{token}.exe
    //     The token is always the last segment after the last hyphen.
    var exePath   = Environment.ProcessPath!;
    var exeName   = Path.GetFileNameWithoutExtension(exePath);
    Log(LogPath, $"EXE: {exeName}");

    var lastDash = exeName.LastIndexOf('-');
    if (lastDash < 0 || lastDash == exeName.Length - 1)
    {
        Fatal(LogPath, "EXE adından token okunamadı. Orijinal indirilen kurulum dosyasını kullanın.");
        return;
    }
    var deployToken = exeName[(lastDash + 1)..];
    Log(LogPath, $"Deploy token: {deployToken[..Math.Min(8, deployToken.Length)]}...");

    // 2 — Call auto-enroll: returns a per-device one-time enrollment_token
    Log(LogPath, "Sunucuya kayıt isteği gönderiliyor...");
    string enrollmentToken;
    try
    {
        using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
        var body = new
        {
            deploy_token = deployToken,
            hostname     = Environment.MachineName,
            version      = "1.0.0",
            os_name      = Environment.OSVersion.VersionString,
            os_arch      = System.Runtime.InteropServices.RuntimeInformation
                               .OSArchitecture.ToString(),
        };

        var resp = await http.PostAsJsonAsync($"{ServerUrl}/api/v1/collector/auto-enroll", body);
        if (!resp.IsSuccessStatusCode)
        {
            var err = await resp.Content.ReadAsStringAsync();
            Fatal(LogPath, $"Sunucu hatası {(int)resp.StatusCode}: {err}");
            return;
        }

        var json   = await resp.Content.ReadFromJsonAsync<JsonElement>();
        enrollmentToken = json.GetProperty("enrollment_token").GetString()!;
        Log(LogPath, "Kayıt yetkisi alındı.");
    }
    catch (Exception ex)
    {
        Fatal(LogPath, $"Sunucu bağlantı hatası: {ex.Message}");
        return;
    }

    // 3 — Write enrollment.json  (BootstrapEnrollment reads this on service start)
    var enrollData = JsonSerializer.Serialize(new
    {
        server_url        = ServerUrl,
        enrollment_token  = enrollmentToken,
    });
    await File.WriteAllTextAsync(EnrollmentJson, enrollData, Encoding.UTF8);
    Log(LogPath, "enrollment.json yazıldı.");

    // 4 — Download MSI
    Log(LogPath, "MSI indiriliyor...");
    try
    {
        using var http = new HttpClient { Timeout = TimeSpan.FromMinutes(5) };
        var bytes = await http.GetByteArrayAsync(MsiUrl);
        await File.WriteAllBytesAsync(MsiPath, bytes);
        Log(LogPath, $"MSI indirildi: {bytes.Length:N0} byte");
    }
    catch (Exception ex)
    {
        Fatal(LogPath, $"MSI indirme hatası: {ex.Message}");
        return;
    }

    // 5 — Install MSI silently
    Log(LogPath, "MSI kuruluyor...");
    var proc = Process.Start(new ProcessStartInfo
    {
        FileName               = "msiexec.exe",
        Arguments              = $"/i \"{MsiPath}\" /qb- /norestart",
        UseShellExecute        = false,
        CreateNoWindow         = true,
        RedirectStandardOutput = true,
        RedirectStandardError  = true,
    })!;
    proc.WaitForExit(600_000); // 10 min timeout

    // msiexec success codes: 0=ok, 1641=restart required, 3010=restart scheduled
    if (proc.ExitCode != 0 && proc.ExitCode != 1641 && proc.ExitCode != 3010)
    {
        Fatal(LogPath, $"MSI kurulum başarısız (exit code {proc.ExitCode}). Log: {MsiPath}.log");
        return;
    }

    Log(LogPath, "=== Kurulum tamamlandı ===");
    Console.WriteLine("Kurulum başarıyla tamamlandı.");
}

static void Log(string path, string msg)
{
    var line = $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] {msg}";
    try { File.AppendAllText(path, line + "\n"); } catch { /* ignore log failures */ }
    Console.WriteLine(line);
}

static void Fatal(string path, string msg)
{
    Log(path, "HATA: " + msg);
    Console.Error.WriteLine("HATA: " + msg);
    Console.WriteLine("\nÇıkmak için Enter'a basın...");
    Console.ReadLine();
    Environment.Exit(1);
}
