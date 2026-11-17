using System.Security.Cryptography;
using System.Text;

namespace LiderCollector.Dlp;

/// <summary>
/// DLP settings (collector.json "dlp"). SECURE DEFAULTS: everything is OFF until it is switched on (by the installer, a GPO or the server policy), and every source is switchable on its own.
/// Only METADATA is ever collected (who / which computer / which object / when / how big): no file content, no document content, no keystrokes, no message text.
/// </summary>
public sealed class DlpConfig
{
    public bool Enabled { get; set; } = false;
    /// <summary>How often the DLP sources are polled (seconds). Capped to 10..3600.</summary>
    public int PollSeconds { get; set; } = 30;
    /// <summary>Events per request to the server (1..100).</summary>
    public int MaxBatch { get; set; } = 50;
    /// <summary>Largest number of events collected per poll per source: keeps CPU/queue growth bounded after a long pause.</summary>
    public int MaxPerPoll { get; set; } = 200;
    /// <summary>The offline queue is not fed with DLP events beyond this many pending rows (oldest data is more valuable than an unbounded queue).</summary>
    public int MaxQueuedRows { get; set; } = 5000;
    public PrintConfig Print { get; set; } = new();
    public UsbConfig Usb { get; set; } = new();
    public FilesConfig Files { get; set; } = new();
    public AppUsageConfig AppUsage { get; set; } = new();

    /// <summary>File activity in the folders the customer policy names (never the whole disk by default). Metadata only.</summary>
    public sealed class FilesConfig
    {
        public bool Enabled { get; set; } = false;
        /// <summary>Absolute folders to watch (local, removable or UNC). Empty = nothing is watched.</summary>
        public List<string> Paths { get; set; } = new();
        /// <summary>full | folder | hash - how much of a path is sent (the file name is hashed unless "full").</summary>
        public string PathMode { get; set; } = "full";
        public List<string> Exclude { get; set; } = new() { "*.tmp", "~$*", "*.crdownload", "*.part", "Thumbs.db", "desktop.ini", "*.lnk" };
        /// <summary>Several writes of one save become one "modified" event within this many seconds.</summary>
        public int DebounceSeconds { get; set; } = 5;
        public int MaxIndexEntries { get; set; } = 50000;
        public const int MaxRoots = 20;

        /// <summary>The configured folders that are valid: absolute, no control characters, no drive-wide root, de-duplicated, at most <see cref="MaxRoots"/>.</summary>
        public List<string> EffectiveRoots() => Paths.Where(p => !string.IsNullOrWhiteSpace(p) && p.Trim().Length > 3 && !p.Any(char.IsControl) && System.IO.Path.IsPathRooted(p.Trim()))
            .Select(p => p.Trim().TrimEnd('\\', '/')).Where(p => p.Length > 2).Distinct(StringComparer.OrdinalIgnoreCase).Take(MaxRoots).ToList();
    }

    /// <summary>Foreground application time of the signed-in user. Needs the per-session helper; the window title is NOT sent unless the policy says so.</summary>
    public sealed class AppUsageConfig
    {
        public bool Enabled { get; set; } = false;
        /// <summary>none (default: application name only) | hash | full</summary>
        public string TitleMode { get; set; } = "none";
        public int SampleSeconds { get; set; } = 5;
        /// <summary>No keyboard/mouse input for this long = idle: the time is not counted as active use.</summary>
        public int IdleThresholdSeconds { get; set; } = 120;
        public int MaxIntervalSeconds { get; set; } = 300;
    }

    public sealed class PrintConfig
    {
        public bool Enabled { get; set; } = false;
        /// <summary>hash (default) | full | extension | none - what is sent of the DOCUMENT NAME (a title can itself be sensitive). hash = a stable token: the same document is recognisable, never readable.</summary>
        public string DocumentName { get; set; } = "hash";
        /// <summary>The Windows print-service log is off by default. When true the Collector (LocalSystem) switches that one log channel on, once, so no manual set-up is needed.</summary>
        public bool AutoEnableLog { get; set; } = true;
        /// <summary>First start: how far back to read (hours); afterwards the stored position is used.</summary>
        public int BackfillHours { get; set; } = 1;
    }

    public sealed class UsbConfig
    {
        public bool Enabled { get; set; } = false;
        /// <summary>Report file creations/changes on removable drives (names, sizes, extensions - never content).</summary>
        public bool FileEvents { get; set; } = true;
        /// <summary>monitor is the only mode this Collector implements: nothing is ever blocked. Anything else in a policy is ignored.</summary>
        public string Mode { get; set; } = "monitor";
    }

    public int EffectivePollSeconds => Math.Clamp(PollSeconds, 10, 3600);
    public int EffectiveMaxBatch => Math.Clamp(MaxBatch, 1, 100);
    public int EffectiveMaxPerPoll => Math.Clamp(MaxPerPoll, 1, 1000);
}

/// <summary>One DLP event on the wire (matches POST /api/v1/collector/dlp-events).</summary>
public sealed record DlpEvent(string Uid, string Type, DateTime OccurredUtc, string? Host, IReadOnlyDictionary<string, object?> Data)
{
    public object ToWire() => new
    {
        uid = Uid, type = Type, occurred_at = OccurredUtc.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ"), host = Host,
        data = Data.Where(kv => kv.Value is not null).ToDictionary(kv => kv.Key, kv => kv.Value),
    };

    /// <summary>A stable id made of the facts that identify the event: the same event re-read after a restart gets the SAME id, so the server never stores it twice.</summary>
    public static string MakeUid(string prefix, params object?[] parts)
    {
        string raw = string.Join("|", parts.Select(p => p?.ToString() ?? ""));
        return prefix + "-" + Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(raw)))[..40].ToLowerInvariant();
    }
}

public static class DlpPrivacy
{
    /// <summary>Applies the configured privacy mode to a document / file name. Returns null for "none".</summary>
    public static string? Name(string? name, string mode, int max = 400)
    {
        if (string.IsNullOrWhiteSpace(name)) return null;
        string clean = new string(name.Where(c => !char.IsControl(c)).ToArray()).Trim();
        if (clean.Length == 0) return null;
        string ext = ExtensionOf(clean);
        switch ((mode ?? "full").ToLowerInvariant())
        {
            case "none": return null;
            case "extension": return "*" + ext;                                                         // "*.docx" (or "*" when there is none)
            case "hash":
                string h = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(clean.ToLowerInvariant())))[..16].ToLowerInvariant();
                return "sha256:" + h + ext;                                                               // the same document always gets the same token: counting/correlation without disclosure
            default: return clean.Length > max ? clean[..max] : clean;
        }
    }

    private static string ExtensionOf(string name)
    {
        int dot = name.LastIndexOf('.');
        if (dot < 0 || name.Length - dot > 12) return "";
        string e = name[dot..];
        return e.Any(c => !(char.IsLetterOrDigit(c) || c == '.')) ? "" : e.ToLowerInvariant();
    }
}
