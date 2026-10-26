using LiderCollector;
using LiderCollector.Core;
using Serilog;
using Serilog.Events;

// Determine base path (exe dir when published, project dir when debugging)
string basePath = AppContext.BaseDirectory;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File(
        Path.Combine(basePath, "logs", "collector-.log"),
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 30,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateBootstrapLogger();

try
{
    Log.Information("Lider IT ONE Collector v{Version} starting...", "0.1.0");

    IHost host = Host.CreateDefaultBuilder(args)
        .UseWindowsService(options =>
        {
            options.ServiceName = "LiderITONECollector";
        })
        .UseSerilog((ctx, services, config) => config
            .ReadFrom.Configuration(ctx.Configuration)
            .ReadFrom.Services(services)
            .Enrich.FromLogContext()
            .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
            .WriteTo.Console()
            .WriteTo.File(
                Path.Combine(basePath, "logs", "collector-.log"),
                rollingInterval: RollingInterval.Day,
                retainedFileCountLimit: 30,
                outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}"))
        .ConfigureServices((ctx, services) =>
        {
            // Core singleton services
            services.AddSingleton<CollectorConfig>(sp =>
                CollectorConfig.Load(Path.Combine(basePath, "collector.json")));
            services.AddSingleton<SecureStorage>();
            services.AddSingleton<LocalQueue>(sp =>
                new LocalQueue(Path.Combine(basePath, "queue.db")));
            services.AddSingleton<DeviceIdentity>();
            services.AddSingleton<ApiClient>();

            // Main worker
            services.AddHostedService<CollectorWorker>();
        })
        .Build();

    // Handle install/uninstall/run args on Windows
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
