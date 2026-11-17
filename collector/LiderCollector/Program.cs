using LiderCollector;
using LiderCollector.Core;
using LiderCollector.Enrollment;
using Serilog;
using Serilog.Events;

// ── Path constants ────────────────────────────────────────────────────────────
// binPath  : install directory (service executables — wiped on MajorUpgrade)
// dataPath : %ProgramData%\LiderCollector\ (config, keys, queue — preserved on upgrade)
string binPath  = AppContext.BaseDirectory;
string dataPath = Path.Combine(
    Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
    "LiderCollector");

Directory.CreateDirectory(dataPath); // ensure data dir exists before first log write

// ── Bootstrap logger (before DI) ─────────────────────────────────────────────
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File(
        Path.Combine(dataPath, "logs", "collector-.log"),
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 30,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateBootstrapLogger();

try
{
    Log.Information("Lider IT ONE Collector v{Version} starting...", AppVersion.Current);

    // "--apply-update <plan>": the self-update worker (a COPY of this exe, started by the service). Offline; never contacts the server.
    if (args.Length >= 2 && args[0].Equals("--apply-update", StringComparison.OrdinalIgnoreCase))
    {
        Environment.ExitCode = await LiderCollector.Update.UpdateRunner.RunAsync(args[1]);
        return;
    }

    // "--update-watchdog <dataDir>": recovery after an update whose updater died (scheduled task, or started by the service at boot)
    if (args.Length >= 2 && args[0].Equals("--update-watchdog", StringComparison.OrdinalIgnoreCase))
    {
        Environment.ExitCode = await LiderCollector.Update.UpdateRunner.RunWatchdogAsync(args[1]);
        return;
    }

    // "--user-agent <servicePid> <sampleSeconds>": the application-usage helper, started by the service INSIDE a user session (a service cannot see any desktop). Metadata only; exits when the service is gone.
    if (args.Length >= 1 && args[0].Equals("--user-agent", StringComparison.OrdinalIgnoreCase))
    {
        int pid = args.Length > 1 && int.TryParse(args[1], out var p1) ? p1 : 0, every = args.Length > 2 && int.TryParse(args[2], out var p2) ? p2 : 5;
        Environment.ExitCode = await LiderCollector.Dlp.AppUsageAgent.RunAsync(every, pid, CancellationToken.None);
        return;
    }

    // "diag": inspect this machine's inventory without starting the service or contacting the server
    if (args.Length > 0 && args[0].Equals("diag", StringComparison.OrdinalIgnoreCase))
    {
        Environment.ExitCode = await Diagnostics.RunAsync(args);
        return;
    }

    IHost host = Host.CreateDefaultBuilder(args)
        .UseWindowsService(options =>
        {
            options.ServiceName = "LiderITONECollector";
        })
        .UseSerilog((ctx, services, cfg) => cfg
            .ReadFrom.Configuration(ctx.Configuration)
            .ReadFrom.Services(services)
            .Enrich.FromLogContext()
            .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
            .WriteTo.Console()
            .WriteTo.File(
                Path.Combine(dataPath, "logs", "collector-.log"),
                rollingInterval: RollingInterval.Day,
                retainedFileCountLimit: 30,
                outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}"))
        .ConfigureServices((ctx, services) =>
        {
            // ── Core singletons ──────────────────────────────────────────────
            // All file paths use dataPath so they survive MajorUpgrade
            services.AddSingleton<CollectorConfig>(sp =>
            {
                var cfg = CollectorConfig.Load(Path.Combine(dataPath, "collector.json"));
                cfg.DataPath = dataPath; // runtime-only: for update trigger file path
                cfg.AgentVersion = AppVersion.Current; // never trust the persisted value after an upgrade
                cfg.DeltaSyncPolicy = PolicyOverrides.ReadDeltaSync(); // GPO (ADMX "Delta synchronisation"), runtime-only
                return cfg;
            });

            services.AddSingleton<SecureStorage>(sp =>
                new SecureStorage(Path.Combine(dataPath, "secure.dat")));

            services.AddSingleton<LocalQueue>(sp =>
                new LocalQueue(Path.Combine(dataPath, "queue.db")));

            services.AddSingleton<DeviceIdentity>();
            services.AddSingleton<ApiClient>();

            // Bootstrap enrollment reads enrollment.json from dataPath
            services.AddSingleton<BootstrapEnrollment>(sp =>
                new BootstrapEnrollment(
                    dataPath,
                    sp.GetRequiredService<ILogger<BootstrapEnrollment>>()));

            // Main worker
            services.AddHostedService<CollectorWorker>();
        })
        .Build();

    // ── CLI: install / uninstall (runs as administrator, not as the service) ──
    if (args.Length > 0)
    {
        string cmd = args[0].ToLowerInvariant();
        if (cmd == "install" || cmd == "uninstall")
        {
            ServiceInstaller.Run(args);
            return;
        }
    }

    await host.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Collector terminated unexpectedly");
    throw;
}
finally
{
    Log.CloseAndFlush();
}
