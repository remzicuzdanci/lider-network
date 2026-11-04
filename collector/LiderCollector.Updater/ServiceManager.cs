using System.ServiceProcess;

namespace LiderCollector.Updater;

/// <summary>
/// Stop, start, and query a Windows service by name.
/// All operations use the .NET ServiceController and do not invoke sc.exe,
/// which avoids quoting/injection risk.
/// </summary>
internal static class ServiceManager
{
    private static readonly TimeSpan StopTimeout  = TimeSpan.FromSeconds(30);
    private static readonly TimeSpan StartTimeout = TimeSpan.FromSeconds(30);

    public static bool IsRunning(string serviceName)
    {
        using var sc = new ServiceController(serviceName);
        try
        {
            sc.Refresh();
            return sc.Status == ServiceControllerStatus.Running;
        }
        catch (InvalidOperationException)
        {
            return false; // service not found
        }
    }

    public static void Stop(string serviceName)
    {
        using var sc = new ServiceController(serviceName);
        sc.Refresh();
        if (sc.Status == ServiceControllerStatus.Stopped) return;

        if (sc.CanStop)
            sc.Stop();

        sc.WaitForStatus(ServiceControllerStatus.Stopped, StopTimeout);
        sc.Refresh();
        if (sc.Status != ServiceControllerStatus.Stopped)
            throw new InvalidOperationException($"Service '{serviceName}' did not stop within {StopTimeout.TotalSeconds}s");
    }

    public static void Start(string serviceName)
    {
        using var sc = new ServiceController(serviceName);
        sc.Refresh();
        if (sc.Status == ServiceControllerStatus.Running) return;

        sc.Start();
        sc.WaitForStatus(ServiceControllerStatus.Running, StartTimeout);
        sc.Refresh();
        if (sc.Status != ServiceControllerStatus.Running)
            throw new InvalidOperationException($"Service '{serviceName}' did not start within {StartTimeout.TotalSeconds}s");
    }

    public static ServiceControllerStatus GetStatus(string serviceName)
    {
        using var sc = new ServiceController(serviceName);
        sc.Refresh();
        return sc.Status;
    }

    /// <summary>
    /// Returns true if msiexec.exe is currently running, which indicates an MSI-based
    /// upgrade may be in progress.  The updater yields to MSI in that case.
    /// </summary>
    public static bool IsMsiRunning()
    {
        return System.Diagnostics.Process
            .GetProcessesByName("msiexec")
            .Length > 0;
    }
}
