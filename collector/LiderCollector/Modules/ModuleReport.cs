using System.Text.Json.Serialization;

namespace LiderCollector.Modules;

/// <summary>Outcome of one module run, reported to the server next to the data.</summary>
public sealed class ModuleReport
{
    public const string Success = "success";
    public const string Partial = "partial";
    public const string Failed  = "failed";

    [JsonPropertyName("status")]      public string Status { get; set; } = Success;
    [JsonPropertyName("duration_ms")] public int DurationMs { get; set; }
    /// <summary>Non-fatal problems (a single WMI source failed, a value was implausible…).</summary>
    [JsonPropertyName("warnings")]    public List<string> Warnings { get; set; } = new();
    /// <summary>Why the module produced no usable data (only for Failed, or the most important Partial cause).</summary>
    [JsonPropertyName("error")]       public string? Error { get; set; }
    /// <summary>Per-source detail, e.g. "ComputerSystem" → "ok" | error text.</summary>
    [JsonPropertyName("sources")]     public Dictionary<string, string> Sources { get; set; } = new();
}

/// <summary>A module that can describe how its last run went.</summary>
public interface IReportingModule : ICollectorModule
{
    ModuleReport? LastReport { get; }
}

/// <summary>Collects per-source results while a module runs.</summary>
public sealed class SourceTracker
{
    private readonly ModuleReport _report = new();
    private readonly System.Diagnostics.Stopwatch _sw = System.Diagnostics.Stopwatch.StartNew();
    private int _requiredOk, _requiredFailed;

    /// <summary>Runs one data source. A failure is recorded and swallowed so the rest can continue.</summary>
    public bool Run(string source, Action action, bool required, Microsoft.Extensions.Logging.ILogger log)
    {
        try
        {
            action();
            _report.Sources[source] = "ok";
            if (required) _requiredOk++;
            return true;
        }
        catch (Exception ex)
        {
            string msg = $"{ex.GetType().Name}: {ex.Message}";
            _report.Sources[source] = msg;
            if (required) { _requiredFailed++; _report.Error ??= $"{source}: {msg}"; }
            else _report.Warnings.Add($"{source}: {msg}");
            log.LogWarning(ex, "{Module}: source {Source} failed", "module", source);
            return false;
        }
    }

    public void Warn(string text) => _report.Warnings.Add(text);

    public ModuleReport Finish()
    {
        _report.DurationMs = (int)_sw.ElapsedMilliseconds;
        _report.Status = _requiredFailed == 0 ? (_report.Warnings.Count == 0 ? ModuleReport.Success : ModuleReport.Partial)
                       : _requiredOk == 0     ? ModuleReport.Failed
                       :                        ModuleReport.Partial;
        if (_report.Status == ModuleReport.Success) _report.Error = null;
        return _report;
    }
}
