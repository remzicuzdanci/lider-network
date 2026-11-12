using System.Text.Json;
using LiderCollector.Core;
using LiderCollector.Modules;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using Xunit.Abstractions;

namespace LiderCollector.Tests;

/// <summary>
/// Opt-in measurement on the machine running the tests (LIDER_LIVE_FP=1): runs the REAL read-only modules twice, a few seconds apart,
/// and reports whether the fingerprints are stable and how many bytes a full vs. an unchanged-delta payload would be.
/// Reads local WMI/registry only; sends nothing anywhere; without the variable it does nothing.
/// </summary>
public class LiveFingerprintStabilityTests
{
    private readonly ITestOutputHelper _out;
    public LiveFingerprintStabilityTests(ITestOutputHelper output) => _out = output;

    [Fact]
    public async Task Real_modules_give_the_same_fingerprint_twice_in_a_row()
    {
        if (Environment.GetEnvironmentVariable("LIDER_LIVE_FP") != "1") return;

        var modules = new (string name, ICollectorModule m)[]
        {
            ("system", new SystemInfoModule(NullLogger<SystemInfoModule>.Instance)),
            ("network", new NetworkModule(NullLogger<NetworkModule>.Instance)),
            ("software", new SoftwareModule(NullLogger<SoftwareModule>.Instance)),
            ("services", new ServicesModule(NullLogger<ServicesModule>.Instance)),
            ("windows_update", new WindowsUpdateModule(NullLogger<WindowsUpdateModule>.Instance)),
        };

        var lines = new List<string>();
        long fullBytes = 0, unchangedBytes = 0, changedBytes = 0;
        foreach (var (name, m) in modules)
        {
            var sw = System.Diagnostics.Stopwatch.StartNew();
            var a = await m.RunAsync(CancellationToken.None);
            await Task.Delay(3000);
            var b = await m.RunAsync(CancellationToken.None);
            if (a == null || b == null) { lines.Add($"{name,-15} no data"); continue; }
            string fa = DeltaSync.Fingerprint(name, a), fb = DeltaSync.Fingerprint(name, b);
            long bytes = JsonSerializer.SerializeToUtf8Bytes(a).LongLength;
            fullBytes += bytes;
            unchangedBytes += 64 + name.Length + 8;     // "name":"<64 hex>",
            if (fa != fb) changedBytes += bytes;
            lines.Add($"{name,-15} stable={(fa == fb),-5} json={bytes,9:N0} bytes  collect+wait={sw.ElapsedMilliseconds,6} ms");
        }
        lines.Add($"full payload (modules) : {fullBytes:N0} bytes");
        lines.Add($"unchanged delta        : ~{unchangedBytes:N0} bytes (fingerprints only)");
        lines.Add($"modules that changed in 3 s: {changedBytes:N0} bytes would be resent");
        foreach (var l in lines) _out.WriteLine(l);

        var report = Environment.GetEnvironmentVariable("LIDER_LIVE_FP_OUT");
        if (!string.IsNullOrEmpty(report)) File.WriteAllLines(report, lines);
    }
}
