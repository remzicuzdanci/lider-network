using System.Diagnostics;
using System.Reflection;

namespace LiderCollector;

/// <summary>
/// Installs and uninstalls the Windows Service using sc.exe.
/// Invoked when the executable is run with "install" or "uninstall" as the first argument.
/// Requires Administrator privileges.
/// </summary>
public static class ServiceInstaller
{
    private const string ServiceName = "LiderITONECollector";
    private const string DisplayName = "Lider IT ONE Collector";
    private const string Description = "Lider IT ONE Site Collector - hardware and software inventory agent";

    public static void Run(string[] args)
    {
        string cmd = args[0].ToLowerInvariant();

        switch (cmd)
        {
            case "install":
                Install(args.Length > 1 ? args[1..] : Array.Empty<string>());
                break;
            case "uninstall":
                Uninstall();
                break;
            default:
                Console.Error.WriteLine($"Unknown command: {cmd}");
                break;
        }
    }

    private static void Install(string[] extraArgs)
    {
        string exePath = Process.GetCurrentProcess().MainModule?.FileName
            ?? Assembly.GetExecutingAssembly().Location;

        Console.WriteLine($"Installing service: {DisplayName}");
        Console.WriteLine($"Executable: {exePath}");

        string args = string.Join(" ", extraArgs);
        string binPath = string.IsNullOrEmpty(args)
            ? $"\"{exePath}\""
            : $"\"{exePath}\" {args}";

        // Create the service
        RunSc($"create \"{ServiceName}\" binPath= \"{binPath}\" " +
              $"DisplayName= \"{DisplayName}\" start= auto");

        // Set description
        RunSc($"description \"{ServiceName}\" \"{Description}\"");

        // Configure failure actions: restart after 60s, up to 3 times
        RunSc($"failure \"{ServiceName}\" reset= 86400 " +
              $"actions= restart/60000/restart/60000/restart/60000");

        Console.WriteLine("Service installed. Starting...");
        RunSc($"start \"{ServiceName}\"");
        Console.WriteLine("Done.");
    }

    private static void Uninstall()
    {
        Console.WriteLine($"Stopping and removing service: {ServiceName}");
        RunSc($"stop \"{ServiceName}\"");
        System.Threading.Thread.Sleep(2000);
        RunSc($"delete \"{ServiceName}\"");
        Console.WriteLine("Service removed.");
    }

    private static void RunSc(string arguments)
    {
        var psi = new ProcessStartInfo("sc.exe", arguments)
        {
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true,
        };

        using var proc = Process.Start(psi);
        if (proc == null) throw new InvalidOperationException("Failed to start sc.exe");

        string output = proc.StandardOutput.ReadToEnd();
        string error = proc.StandardError.ReadToEnd();
        proc.WaitForExit();

        if (!string.IsNullOrWhiteSpace(output)) Console.WriteLine(output.Trim());
        if (!string.IsNullOrWhiteSpace(error)) Console.Error.WriteLine(error.Trim());

        if (proc.ExitCode != 0)
            Console.Error.WriteLine($"sc.exe exited with code {proc.ExitCode}");
    }
}
