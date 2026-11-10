using Microsoft.Extensions.Logging;
using System.Management;
using System.Text.Json.Serialization;

namespace LiderCollector.Modules;

/// <summary>
/// Windows service inventory (Win32_Service): service name, display name, state, start type, delayed-start flag, logon account.
/// Deliberately NOT collected: the service binary path / command line (it can carry credentials or tokens as arguments).
/// Server contract (modules.services):
///   { "collected_at": "2026-11-10T13:41:40Z", "count": 245,
///     "items": [ { "name", "display_name", "state", "start_mode", "delayed_auto_start", "account" } ] }
/// Values are the strings Windows reports ("Running", "Stopped", "Start Pending", "Auto", "Manual", "Disabled", ...);
/// the server normalises them. A read that returns nothing is reported as FAILED, never as "this machine has no services",
/// so the server keeps the previous inventory.
/// </summary>
public sealed class ServicesModule : IReportingModule
{
    private readonly ILogger<ServicesModule> _log;
    private readonly Func<IEnumerable<RawService>> _reader;
    private readonly Func<DateTime> _clock;

    public string Name => "services";
    public ModuleReport? LastReport { get; private set; }

    public ServicesModule(ILogger<ServicesModule> log, Func<IEnumerable<RawService>>? reader = null, Func<DateTime>? clock = null)
    {
        _log = log;
        _reader = reader ?? ReadFromWmi;
        _clock = clock ?? (() => DateTime.UtcNow);
    }

    public Task<object?> RunAsync(CancellationToken ct)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        var report = new ModuleReport();
        try
        {
            var payload = Build(_reader(), _clock());
            report.DurationMs = (int)sw.ElapsedMilliseconds;
            if (payload.Items.Count == 0)
            {
                report.Status = ModuleReport.Failed;
                report.Error = "Win32_Service returned no services";
                LastReport = report;
                return Task.FromResult<object?>(null);
            }
            report.Sources["Win32_Service"] = "ok";
            LastReport = report;
            return Task.FromResult<object?>(payload);
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "ServicesModule failed");
            report.Status = ModuleReport.Failed;
            report.Error = $"{ex.GetType().Name}: {ex.Message}";
            report.Sources["Win32_Service"] = report.Error;
            report.DurationMs = (int)sw.ElapsedMilliseconds;
            LastReport = report;
            return Task.FromResult<object?>(null);
        }
    }

    /// <summary>Pure transformation (unit-tested): drops nameless rows and duplicates, trims, sorts by name.</summary>
    public static ServicesPayload Build(IEnumerable<RawService> raw, DateTime nowUtc)
    {
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var items = new List<ServiceEntry>();
        foreach (var r in raw)
        {
            string? name = Clean(r.Name);
            if (name == null || !seen.Add(name)) continue;
            items.Add(new ServiceEntry
            {
                Name = name,
                DisplayName = Clean(r.DisplayName),
                State = Clean(r.State) ?? "Unknown",
                StartMode = Clean(r.StartMode) ?? "Unknown",
                DelayedAutoStart = r.DelayedAutoStart,
                Account = Clean(r.Account),
            });
        }
        items.Sort((a, b) => string.Compare(a.Name, b.Name, StringComparison.OrdinalIgnoreCase));
        return new ServicesPayload { CollectedAt = nowUtc.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ"), Count = items.Count, Items = items };
    }

    private static string? Clean(string? v)
    {
        var t = v?.Trim();
        return string.IsNullOrEmpty(t) ? null : t;
    }

    private static IEnumerable<RawService> ReadFromWmi()
    {
        var opts = new System.Management.EnumerationOptions { Timeout = TimeSpan.FromSeconds(60), ReturnImmediately = false };
        using var searcher = new ManagementObjectSearcher(
            new ManagementScope(@"root\cimv2"),
            new ObjectQuery("SELECT Name,DisplayName,State,StartMode,DelayedAutoStart,StartName FROM Win32_Service"), opts);
        foreach (ManagementObject o in searcher.Get())
        {
            using (o)
            {
                bool delayed = false;
                try { delayed = o["DelayedAutoStart"] is bool b && b; } catch { /* property absent on very old systems */ }
                yield return new RawService(o["Name"]?.ToString(), o["DisplayName"]?.ToString(), o["State"]?.ToString(), o["StartMode"]?.ToString(), delayed, o["StartName"]?.ToString());
            }
        }
    }

    /// <summary>One row as read from the system (before cleaning).</summary>
    public sealed record RawService(string? Name, string? DisplayName, string? State, string? StartMode, bool DelayedAutoStart, string? Account);

    public sealed class ServicesPayload
    {
        [JsonPropertyName("collected_at")] public string CollectedAt { get; set; } = "";
        [JsonPropertyName("count")] public int Count { get; set; }
        [JsonPropertyName("items")] public List<ServiceEntry> Items { get; set; } = new();
    }

    public sealed class ServiceEntry
    {
        [JsonPropertyName("name")] public string Name { get; set; } = "";
        [JsonPropertyName("display_name")] public string? DisplayName { get; set; }
        [JsonPropertyName("state")] public string State { get; set; } = "Unknown";
        [JsonPropertyName("start_mode")] public string StartMode { get; set; } = "Unknown";
        [JsonPropertyName("delayed_auto_start")] public bool DelayedAutoStart { get; set; }
        [JsonPropertyName("account")] public string? Account { get; set; }
    }
}
