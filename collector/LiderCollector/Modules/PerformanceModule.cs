using Microsoft.Extensions.Logging;
using System.Diagnostics;
using System.Text.Json.Serialization;

namespace LiderCollector.Modules;

/// <summary>
/// Collects real-time CPU, RAM, and disk I/O metrics using PerformanceCounter.
/// Counters are sampled once (first reading may be 0 for rate-based counters; a second
/// sample 1s later is taken for CPU to get a meaningful value).
/// </summary>
public sealed class PerformanceModule : ICollectorModule
{
    private readonly ILogger<PerformanceModule> _log;
    public string Name => "performance";

    public PerformanceModule(ILogger<PerformanceModule> log) => _log = log;

    public async Task<object?> RunAsync(CancellationToken ct)
    {
        try
        {
            var payload = new PerformancePayload();

            // CPU — two samples 1s apart for a non-zero reading
            using var cpuCounter = new PerformanceCounter("Processor", "% Processor Time", "_Total");
            cpuCounter.NextValue(); // prime
            await Task.Delay(1000, ct);
            payload.CpuPercent = (float)Math.Round(cpuCounter.NextValue(), 1);

            // RAM
            using var ramAvailCounter = new PerformanceCounter("Memory", "Available Bytes");
            long availableBytes = (long)ramAvailCounter.NextValue();
            long totalBytes = GetTotalRamBytes();
            payload.RamTotalBytes = totalBytes;
            payload.RamAvailableBytes = availableBytes;
            payload.RamUsedPercent = totalBytes > 0
                ? (float)Math.Round((double)(totalBytes - availableBytes) / totalBytes * 100, 1)
                : 0;

            // Disk I/O (aggregate across all drives)
            try
            {
                using var diskRead = new PerformanceCounter("PhysicalDisk", "Disk Read Bytes/sec", "_Total");
                using var diskWrite = new PerformanceCounter("PhysicalDisk", "Disk Write Bytes/sec", "_Total");
                diskRead.NextValue();
                diskWrite.NextValue();
                await Task.Delay(500, ct);
                payload.DiskReadBytesPerSec = (long)diskRead.NextValue();
                payload.DiskWriteBytesPerSec = (long)diskWrite.NextValue();
            }
            catch { /* PhysicalDisk counter may not exist on all systems */ }

            // Page file usage
            try
            {
                using var pageCounter = new PerformanceCounter("Paging File", "% Usage", "_Total");
                payload.PageFilePercent = (float)Math.Round(pageCounter.NextValue(), 1);
            }
            catch { }

            payload.CollectedAt = DateTime.UtcNow;
            return payload;
        }
        catch (OperationCanceledException) { throw; }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "PerformanceModule failed");
            return null;
        }
    }

    private static long GetTotalRamBytes()
    {
        try
        {
            using var s = new System.Management.ManagementObjectSearcher(
                "SELECT TotalVisibleMemorySize FROM Win32_OperatingSystem");
            foreach (System.Management.ManagementObject o in s.Get())
                return Convert.ToInt64(o["TotalVisibleMemorySize"] ?? 0) * 1024;
        }
        catch { }
        return 0;
    }

    public sealed class PerformancePayload
    {
        [JsonPropertyName("cpu_percent")] public float CpuPercent { get; set; }
        [JsonPropertyName("ram_total_bytes")] public long RamTotalBytes { get; set; }
        [JsonPropertyName("ram_available_bytes")] public long RamAvailableBytes { get; set; }
        [JsonPropertyName("ram_used_percent")] public float RamUsedPercent { get; set; }
        [JsonPropertyName("disk_read_bytes_per_sec")] public long DiskReadBytesPerSec { get; set; }
        [JsonPropertyName("disk_write_bytes_per_sec")] public long DiskWriteBytesPerSec { get; set; }
        [JsonPropertyName("page_file_percent")] public float PageFilePercent { get; set; }
        [JsonPropertyName("collected_at")] public DateTime CollectedAt { get; set; }
    }
}
