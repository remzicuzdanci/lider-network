using System.Text.Json;
using System.Text.Json.Serialization;

namespace LiderCollector.Core;

/// <summary>
/// Persistent configuration stored in collector.json (non-sensitive parts).
/// Sensitive values (api_key) are stored separately via SecureStorage / DPAPI.
/// </summary>
public sealed class CollectorConfig
{
    private static readonly JsonSerializerOptions _jsonOpts = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    private string _filePath = string.Empty;

    // ── Connection ──────────────────────────────────────────────────────────
    public string ServerUrl { get; set; } = string.Empty;

    /// <summary>Path to a custom CA certificate in PEM/CRT format (null = use system trust store).</summary>
    public string? CustomCaCertPath { get; set; }

    /// <summary>
    /// Set true for private networks where the CA does not publish a CRL endpoint.
    /// Certificate chain validation still runs; only the online CRL fetch is skipped.
    /// </summary>
    public bool DisableCrlCheck { get; set; } = false;

    /// <summary>Populated during enrollment; not the API key itself (that lives in DPAPI).</summary>
    public int CollectorId { get; set; }

    // ── Intervals (seconds) ─────────────────────────────────────────────────
    public int HeartbeatIntervalSeconds { get; set; } = 60;
    public int InventorySyncIntervalSeconds { get; set; } = 900;
    public int PerformanceIntervalSeconds { get; set; } = 120;

    /// <summary>Consecutive missed heartbeats before offline alarm is raised.</summary>
    public int OfflineThresholdMissedHeartbeats { get; set; } = 3;

    // ── Modules ─────────────────────────────────────────────────────────────
    public ModulesConfig Modules { get; set; } = new();

    // ── Logging ─────────────────────────────────────────────────────────────
    public string LogLevel { get; set; } = "Information";

    public class ModulesConfig
    {
        public bool System { get; set; } = true;
        public bool Software { get; set; } = true;
        public bool Performance { get; set; } = true;
        public bool EventLog { get; set; } = true;
        public bool WindowsUpdate { get; set; } = true;
        public bool Ad { get; set; } = false;
        public bool HyperV { get; set; } = false;
        public bool Vmware { get; set; } = false;
    }

    // ── VMware connection (if Modules.Vmware = true) ─────────────────────
    public VmwareConfig? Vmware { get; set; }

    public class VmwareConfig
    {
        public string Host { get; set; } = string.Empty;
        public int Port { get; set; } = 443;
        public string Username { get; set; } = string.Empty;
        // Password stored in SecureStorage under key "vmware_password"
    }

    // ── Factory ─────────────────────────────────────────────────────────────
    public static CollectorConfig Load(string filePath)
    {
        CollectorConfig cfg;
        if (File.Exists(filePath))
        {
            string json = File.ReadAllText(filePath);
            cfg = JsonSerializer.Deserialize<CollectorConfig>(json, _jsonOpts)
                  ?? new CollectorConfig();
        }
        else
        {
            cfg = new CollectorConfig();
        }
        cfg._filePath = filePath;
        return cfg;
    }

    public void Save()
    {
        if (string.IsNullOrEmpty(_filePath))
            throw new InvalidOperationException("Config file path not set.");
        string json = JsonSerializer.Serialize(this, _jsonOpts);
        File.WriteAllText(_filePath, json);
    }

    public bool IsEnrolled => CollectorId > 0;
}
