namespace LiderCollector.Modules.Virtualization;

/// <summary>
/// Marker interface for virtualization platform modules (Hyper-V, VMware).
/// Both implement ICollectorModule as well; this interface allows type-checking
/// so CollectorWorker can handle them differently if needed.
/// </summary>
public interface IVirtualizationModule : ICollectorModule
{
    /// <summary>Returns false if the platform is not present on this host.</summary>
    bool IsAvailable();
}
