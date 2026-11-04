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
    Log.Information("Lider IT ONE Collector v{Version} starting...", "1.0.0");

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
                CollectorConfig.Load(Path.Combine(dataPath, "collector.json")));

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
