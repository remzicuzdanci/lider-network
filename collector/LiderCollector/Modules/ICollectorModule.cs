namespace LiderCollector.Modules;

/// <summary>
/// Each discovery module (SystemInfo, Network, Software, etc.) implements this interface.
/// CollectorWorker calls RunAsync on each enabled module during an inventory cycle.
/// </summary>
public interface ICollectorModule
{
    /// <summary>Short internal name used in logging and module_enabled lists.</summary>
    string Name { get; }

    /// <summary>
    /// Collect data and return it as an object that will be serialised into the inventory payload.
    /// Return null if the module produced no data (e.g. Hyper-V not present).
    /// </summary>
    Task<object?> RunAsync(CancellationToken ct);
}
