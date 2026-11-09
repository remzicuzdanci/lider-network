using System.Text.Json;
using LiderCollector.Core;
using LiderCollector.Modules;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace LiderCollector;

/// <summary>
/// "LiderCollector.exe diag [--out file.json]": runs the inventory modules once on THIS machine and prints
/// what would be sent (plus per-module status). Nothing is sent to the server, nothing is installed or changed.
/// Useful for support ("why is my inventory empty?") and for verifying WMI access.
/// </summary>
public static class Diagnostics
{
    public static async Task<int> RunAsync(string[] args)
    {
        ILoggerFactory lf = NullLoggerFactory.Instance;
        string? outFile = null;
        for (int i = 1; i < args.Length - 1; i++) if (args[i] == "--out") outFile = args[i + 1];

        var modules = new List<ICollectorModule>
        {
            new SystemInfoModule(lf.CreateLogger<SystemInfoModule>()),
            new NetworkModule(lf.CreateLogger<NetworkModule>()),
            new SoftwareModule(lf.CreateLogger<SoftwareModule>()),
            new PerformanceModule(lf.CreateLogger<PerformanceModule>()),
        };

        var data = new Dictionary<string, object?>();
        var status = new Dictionary<string, ModuleReport>();
        foreach (var m in modules)
        {
            var sw = System.Diagnostics.Stopwatch.StartNew();
            var report = new ModuleReport();
            try
            {
                var result = await Task.Run(() => m.RunAsync(CancellationToken.None))
                                       .WaitAsync(TimeSpan.FromSeconds(180));
                data[m.Name] = result;
                if (m is IReportingModule rm && rm.LastReport != null) report = rm.LastReport;
                else if (result == null) { report.Status = ModuleReport.Failed; report.Error = "module returned no data"; }
            }
            catch (Exception ex) { report.Status = ModuleReport.Failed; report.Error = $"{ex.GetType().Name}: {ex.Message}"; }
            if (report.DurationMs == 0) report.DurationMs = (int)sw.ElapsedMilliseconds;
            status[m.Name] = report;
        }

        var opts = new JsonSerializerOptions { WriteIndented = true };
        var doc = new { agent_version = AppVersion.Current, collected_at = DateTime.UtcNow, module_status = status, modules = data };
        string json = JsonSerializer.Serialize(doc, opts);
        if (outFile != null) { File.WriteAllText(outFile, json); Console.WriteLine($"Written: {outFile}"); }
        else Console.WriteLine(json);

        Console.Error.WriteLine();
        foreach (var kv in status)
            Console.Error.WriteLine($"  {kv.Key,-14} {kv.Value.Status,-8} {kv.Value.DurationMs,6} ms  {kv.Value.Error ?? ""}");
        return status.Values.Any(s => s.Status == ModuleReport.Failed) ? 2 : 0;
    }
}
