using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;

namespace LiderCollector.Core;

/// <summary>
/// Delta inventory synchronisation (agent side, 1.3.0).
///
/// Every inventory cycle the agent still COLLECTS every module (cheap, local), fingerprints each result and sends
/// only the modules whose fingerprint differs from the one the SERVER last acknowledged. Unchanged modules travel as a
/// 64-character fingerprint instead of their data.
///
/// Safety rules (each one is covered by tests):
///  * the cache lives in memory only: a service restart always starts with a full inventory;
///  * a fingerprint enters the cache only for a module the server ACKNOWLEDGED in its response — a failed or lost send never commits;
///  * any failure (network, 4xx/5xx, queueing for offline) invalidates the cache, and what is queued is always a FULL payload;
///  * the server may answer "resync" for modules it cannot verify (state lost, data wiped, device gone): they are resent in full at once;
///  * a server that does not answer with a sync block (older server) turns delta off for this process — behaviour stays 1.2.0;
///  * a full inventory is forced at least every <see cref="CollectorConfig.FullSyncIntervalSeconds"/> regardless of what the cache says.
/// </summary>
public sealed class DeltaSync
{
    /// <summary>Modules that may be omitted. Performance and event log are streams with their own schedule.</summary>
    public static readonly string[] Eligible = { "system", "network", "software", "windows_update", "services" };

    private static readonly JsonSerializerOptions FpOptions = new() { DefaultIgnoreCondition = JsonIgnoreCondition.Never };

    private readonly Func<DateTime> _now;
    private readonly Dictionary<string, string> _acked = new(StringComparer.Ordinal);
    private DateTime _lastFullAt = DateTime.MinValue;
    private bool _serverUnsupported;

    public DeltaSync(Func<DateTime>? now = null) => _now = now ?? (() => DateTime.UtcNow);

    public bool ServerUnsupported => _serverUnsupported;

    public int CachedModules => _acked.Count;

    /// <summary>What goes on the wire for one inventory request.</summary>
    public sealed class Plan
    {
        public bool Delta { get; init; }
        /// <summary>false = send a plain 1.2.0-style payload (feature off, or the server has no delta support)</summary>
        public bool IncludeSync { get; init; } = true;
        public Dictionary<string, object?> Modules { get; init; } = new();
        public Dictionary<string, string> Hashes { get; init; } = new();
        public Dictionary<string, string> Unchanged { get; init; } = new();
        public object SyncBlock => new SyncBlockDto
        {
            Version = 1,
            Mode = Delta ? "delta" : "full",
            Hashes = Hashes,
            Unchanged = Unchanged,
        };
    }

    /// <param name="all">every module result collected in this cycle (name → data)</param>
    /// <param name="fullIntervalSeconds">forced full inventory at least this often</param>
    public Plan BuildPlan(Dictionary<string, object?> all, int fullIntervalSeconds, bool enabled = true)
    {
        var hashes = new Dictionary<string, string>();
        foreach (var name in Eligible)
            if (all.TryGetValue(name, out var d) && d != null)
                hashes[name] = Fingerprint(name, d);

        bool full = !enabled
                    || _serverUnsupported
                    || _acked.Count == 0
                    || (_now() - _lastFullAt).TotalSeconds >= Math.Max(300, fullIntervalSeconds);

        var send = new Dictionary<string, object?>();
        var unchanged = new Dictionary<string, string>();
        foreach (var (name, data) in all)
        {
            bool eligible = hashes.ContainsKey(name);
            if (full || !eligible || !_acked.TryGetValue(name, out var known) || known != hashes[name])
                send[name] = data;
            else
                unchanged[name] = hashes[name];
        }

        return new Plan
        {
            Delta = !full,
            IncludeSync = enabled && !_serverUnsupported,
            Modules = send,
            // fingerprints of the modules whose data IS included (the server stores them once it has stored the data)
            Hashes = hashes.Where(h => send.ContainsKey(h.Key)).ToDictionary(h => h.Key, h => h.Value),
            Unchanged = unchanged,
        };
    }

    /// <summary>The same cycle as a complete inventory (resync, or what is queued offline).</summary>
    public Plan BuildFullPlan(Dictionary<string, object?> all)
    {
        var hashes = new Dictionary<string, string>();
        foreach (var name in Eligible)
            if (all.TryGetValue(name, out var d) && d != null)
                hashes[name] = Fingerprint(name, d);
        return new Plan { Delta = false, IncludeSync = !_serverUnsupported, Modules = new Dictionary<string, object?>(all), Hashes = hashes, Unchanged = new() };
    }

    /// <summary>
    /// Applies the server's answer. Returns the modules the server wants in full (empty = done).
    /// A response WITHOUT a sync block means an older server: delta is switched off for this process.
    /// </summary>
    public IReadOnlyList<string> Apply(Plan sent, SyncResponse? answer)
    {
        if (answer == null)
        {
            _serverUnsupported = true;
            _acked.Clear();
            return Array.Empty<string>();
        }

        foreach (var m in answer.Ack)
            if (sent.Hashes.TryGetValue(m, out var h)) _acked[m] = h;

        // anything the server asked for again, or did not acknowledge although we sent it, is no longer known to be stored
        foreach (var m in answer.Resync) _acked.Remove(m);
        foreach (var m in sent.Hashes.Keys)
            if (!answer.Ack.Contains(m)) _acked.Remove(m);

        // the "unchanged" claims stay valid only if the server did not ask for them again (handled above)
        if (!sent.Delta && answer.Resync.Count == 0 && answer.Ack.Count > 0)
            _lastFullAt = _now();

        return answer.Resync.Where(m => Array.IndexOf(Eligible, m) >= 0).ToList();
    }

    /// <summary>Anything uncertain (failed send, queued offline): forget everything, the next inventory is complete.</summary>
    public void Invalidate()
    {
        _acked.Clear();
        _lastFullAt = DateTime.MinValue;
    }

    // ── fingerprint ───────────────────────────────────────────────────────

    /// <summary>
    /// Stable fingerprint of a module result: volatile fields are dropped or quantised, object keys are ordered and arrays are
    /// treated as sets (WMI/registry enumeration order is not guaranteed), so an unchanged machine yields the same value every time.
    /// </summary>
    public static string Fingerprint(string module, object? data)
    {
        var node = JsonSerializer.SerializeToNode(data, FpOptions);
        node = Normalise(module, node);
        var sb = new StringBuilder(4096);
        Canonical(node, sb);
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(sb.ToString()))).ToLowerInvariant();
    }

    private static JsonNode? Normalise(string module, JsonNode? node)
    {
        if (node is not JsonObject o) return node;
        switch (module)
        {
            case "system":
                o.Remove("uptime_seconds");                       // derived from the boot time on the server
                if (o["volumes"] is JsonArray vols)
                    foreach (var v in vols.OfType<JsonObject>())
                        QuantiseVolume(v);
                break;
            case "services":
                o.Remove("collected_at");
                o.Remove("count");
                break;
            case "windows_update":
                o.Remove("pending_queried_at");
                break;
        }
        return o;
    }

    /// <summary>Free space is bucketed to 1 % of the volume (at least 1 GiB): small drifts do not count as a change.</summary>
    private static void QuantiseVolume(JsonObject v)
    {
        long size = v["size_bytes"]?.GetValue<long>() ?? 0;
        long bucket = Math.Max(1L << 30, size / 100);
        v.Remove("used_bytes");                                   // size - free: derived, would only double the boundary flips
        if (v["free_bytes"] is JsonValue jv && jv.TryGetValue<long>(out var bytes))
            v["free_bytes"] = bytes / bucket;
    }

    private static void Canonical(JsonNode? n, StringBuilder sb)
    {
        switch (n)
        {
            case null:
                sb.Append("null");
                break;
            case JsonObject o:
                sb.Append('{');
                bool first = true;
                foreach (var kv in o.OrderBy(k => k.Key, StringComparer.Ordinal))
                {
                    if (!first) sb.Append(',');
                    first = false;
                    sb.Append(JsonSerializer.Serialize(kv.Key)).Append(':');
                    Canonical(kv.Value, sb);
                }
                sb.Append('}');
                break;
            case JsonArray a:
                var parts = a.Select(e => { var s = new StringBuilder(); Canonical(e, s); return s.ToString(); })
                             .OrderBy(s => s, StringComparer.Ordinal);
                sb.Append('[').Append(string.Join(',', parts)).Append(']');
                break;
            default:
                sb.Append(n.ToJsonString());
                break;
        }
    }

    // ── wire DTOs ─────────────────────────────────────────────────────────

    public sealed class SyncBlockDto
    {
        [JsonPropertyName("v")] public int Version { get; set; }
        [JsonPropertyName("mode")] public string Mode { get; set; } = "full";
        [JsonPropertyName("hashes")] public Dictionary<string, string> Hashes { get; set; } = new();
        [JsonPropertyName("unchanged")] public Dictionary<string, string> Unchanged { get; set; } = new();
    }

    public sealed class SyncResponse
    {
        [JsonPropertyName("ack")] public List<string> Ack { get; set; } = new();
        [JsonPropertyName("resync")] public List<string> Resync { get; set; } = new();
        [JsonPropertyName("full_required")] public bool FullRequired { get; set; }
    }
}
