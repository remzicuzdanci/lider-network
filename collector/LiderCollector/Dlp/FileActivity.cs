using System.Collections.Concurrent;
using System.Security.Principal;

namespace LiderCollector.Dlp;

/// <summary>What happened to a file, as the operating system reported it (before any privacy rule is applied).</summary>
public enum RawFileKind { Created, Changed, Deleted, Renamed, Overflow }

public sealed record RawFileEvent(RawFileKind Kind, string Path, string? OldPath, DateTime AtUtc, string Root);

/// <summary>A file seen under a watched folder (name, size, last write - never the content).</summary>
public sealed record FileStamp(long Size, DateTime LastWriteUtc);

/// <summary>
/// Everything <see cref="FileActivitySource"/> needs from the machine. Faked in tests; the Windows implementation is <see cref="WindowsFileEnvironment"/>.
/// FileSystemWatcher alone is NOT trusted: it loses events when its buffer overflows, so a rescan of the folder is the second line of defence (see Overflow).
/// </summary>
public interface IFileEnvironment
{
    /// <summary>Makes exactly these roots watched (idempotent: new ones are started, removed ones are stopped).</summary>
    void Watch(IReadOnlyCollection<string> roots);
    IReadOnlyList<RawFileEvent> Drain(int max);
    /// <summary>Every file under the root (bounded). Used for the starting index and for the rescan after a lost-events marker.</summary>
    IReadOnlyDictionary<string, FileStamp> Scan(string root, int max);
    FileStamp? Stat(string path);
    string? Owner(string path);
    string? SessionUser();
    /// <summary>local | network | removable</summary>
    string RootKind(string path);
}

/// <summary>Files known under the watched folders. Lets a deleted file keep its last-known size and lets a USB copy be traced back to a probable source (same name and size).</summary>
public sealed class FileIndex
{
    private readonly ConcurrentDictionary<string, (FileStamp Stamp, DateTime SeenUtc)> _files = new(StringComparer.OrdinalIgnoreCase);
    private readonly int _max;
    public FileIndex(int max = 50000) { _max = Math.Max(100, max); }
    public int Count => _files.Count;

    public void Set(string path, FileStamp stamp, DateTime seenUtc)
    {
        if (_files.Count >= _max && !_files.ContainsKey(path)) return;   // bounded: a huge folder never grows memory without limit
        _files[path] = (stamp, seenUtc);
    }
    public FileStamp? Get(string path) => _files.TryGetValue(path, out var v) ? v.Stamp : null;
    public bool Remove(string path) => _files.TryRemove(path, out _);
    public IEnumerable<string> Under(string root) => _files.Keys.Where(k => k.StartsWith(root.TrimEnd('\\') + "\\", StringComparison.OrdinalIgnoreCase)).ToList();

    /// <summary>The most recently seen file with this name and size elsewhere (a probable origin of a copy). Never claims certainty: the caller labels it "name_size".</summary>
    public string? FindCopy(string name, long size, string excludePathPrefix, DateTime notOlderThanUtc)
    {
        if (size <= 0) return null;   // an empty file matches everything: no evidence
        string? best = null; DateTime bestSeen = DateTime.MinValue;
        foreach (var (path, v) in _files)
        {
            if (v.Stamp.Size != size || v.SeenUtc < notOlderThanUtc || v.SeenUtc <= bestSeen) continue;
            if (path.StartsWith(excludePathPrefix, StringComparison.OrdinalIgnoreCase)) continue;
            if (!string.Equals(System.IO.Path.GetFileName(path), name, StringComparison.OrdinalIgnoreCase)) continue;
            best = path; bestSeen = v.SeenUtc;
        }
        return best;
    }
}

/// <summary>
/// File create / change / delete / rename / move in the folders the customer policy names. Metadata only (never the content, also not of deleted files).
/// What is and is not known, honestly: user = the file's owner (created/changed/renamed) or the user signed in at the time, labelled in <c>user_source</c>; the PROCESS that touched the file
/// is not available to a file watcher and is never invented; a lost-events marker triggers a rescan so a buffer overflow cannot silently hide changes; very short-lived files are kept
/// because every raw event is queued, not sampled.
/// </summary>
public sealed class FileActivitySource : IDlpSource
{
    private readonly IFileEnvironment _env; private readonly FileIndex _index; private readonly Func<DateTime> _now; private readonly string? _host;
    private readonly Dictionary<string, DateTime> _lastChanged = new(StringComparer.OrdinalIgnoreCase);
    private readonly HashSet<string> _indexed = new(StringComparer.OrdinalIgnoreCase);
    private long _seq;

    public FileActivitySource(IFileEnvironment env, FileIndex index, Func<DateTime>? now = null, string? host = null)
    { _env = env; _index = index; _now = now ?? (() => DateTime.UtcNow); _host = host; }

    public string Name => "files";
    public bool IsEnabled(DlpConfig cfg) => cfg.Files.Enabled;

    public bool Prepare(DlpConfig cfg, out string? problem)
    {
        var roots = cfg.Files.EffectiveRoots();
        if (roots.Count == 0) { problem = "no folder is configured for file monitoring (policy files.paths is empty)"; return false; }
        problem = null; return true;
    }

    public IReadOnlyList<(long Position, DlpEvent Event)> ReadNew(long afterPosition, int max, DlpConfig cfg)
    {
        var roots = cfg.Files.EffectiveRoots();
        _env.Watch(roots);
        foreach (var r in roots) if (_indexed.Add(r)) IndexRoot(r, cfg);   // starting index, once per root (bounded)

        var res = new List<(long, DlpEvent)>();
        foreach (var raw in PairMoves(_env.Drain(Math.Max(max * 2, 100))))
        {
            if (res.Count >= max) { break; }
            if (raw.Kind == RawFileKind.Overflow) { Rescan(raw, cfg, res, max); continue; }
            if (Ignored(raw.Path, cfg)) continue;
            var e = Map(raw, cfg); if (e is not null) res.Add((NextSeq(e.OccurredUtc), e));
        }
        return res.Where(r => r.Item1 > afterPosition).OrderBy(r => r.Item1).Take(max).ToList();
    }

    /// <summary>
    /// Windows reports a move to ANOTHER folder as "deleted here" + "created there": two unrelated-looking events. A delete and a create of the same file name within two seconds, in different
    /// folders, are reported as ONE move (the old path is kept). Anything that does not pair stays a delete and a create.
    /// </summary>
    internal static List<RawFileEvent> PairMoves(IReadOnlyList<RawFileEvent> raw)
    {
        var dropped = new HashSet<int>(); var moves = new Dictionary<int, RawFileEvent>();
        for (int i = 0; i < raw.Count; i++)
        {
            if (raw[i].Kind != RawFileKind.Deleted || dropped.Contains(i)) continue;
            string name = System.IO.Path.GetFileName(raw[i].Path); if (string.IsNullOrEmpty(System.IO.Path.GetExtension(name))) continue;
            for (int j = 0; j < raw.Count; j++)
            {
                if (j == i || dropped.Contains(j) || raw[j].Kind != RawFileKind.Created) continue;
                if (!string.Equals(System.IO.Path.GetFileName(raw[j].Path), name, StringComparison.OrdinalIgnoreCase)) continue;
                if (string.Equals(System.IO.Path.GetDirectoryName(raw[j].Path), System.IO.Path.GetDirectoryName(raw[i].Path), StringComparison.OrdinalIgnoreCase)) continue;
                if (Math.Abs((raw[j].AtUtc - raw[i].AtUtc).TotalSeconds) > 2) continue;
                dropped.Add(i); dropped.Add(j); moves[Math.Min(i, j)] = new RawFileEvent(RawFileKind.Renamed, raw[j].Path, raw[i].Path, raw[j].AtUtc, raw[j].Root); break;
            }
        }
        var res = new List<RawFileEvent>();
        for (int k = 0; k < raw.Count; k++) { if (moves.TryGetValue(k, out var m)) res.Add(m); if (!dropped.Contains(k)) res.Add(raw[k]); }
        return res;
    }

    private void IndexRoot(string root, DlpConfig cfg)
    {
        try { foreach (var (p, st) in _env.Scan(root, cfg.Files.MaxIndexEntries)) if (!Ignored(p, cfg)) _index.Set(p, st, _now()); } catch { /* an unreadable folder is reported by the watcher, not here */ }
    }

    private DlpEvent? Map(RawFileEvent raw, DlpConfig cfg)
    {
        string path = raw.Path; var kind = _env.RootKind(path);
        switch (raw.Kind)
        {
            case RawFileKind.Created:
            {
                var st = _env.Stat(path);
                if (st is null && string.IsNullOrEmpty(System.IO.Path.GetExtension(path))) return null;   // a folder (or a nameless file that is already gone): not a file event
                _index.Set(path, st ?? new FileStamp(0, raw.AtUtc), raw.AtUtc);
                return Make("file_created", raw.AtUtc, path, null, st?.Size, _env.Owner(path), kind, cfg, "fsw");
            }
            case RawFileKind.Changed:
            {
                if (_lastChanged.TryGetValue(path, out var last) && (raw.AtUtc - last).TotalSeconds < Math.Max(1, cfg.Files.DebounceSeconds)) return null;   // a save is several writes: one event
                _lastChanged[path] = raw.AtUtc; if (_lastChanged.Count > 20000) _lastChanged.Clear();
                var st = _env.Stat(path); var known = _index.Get(path);
                if (st is null && known is null) return null;            // a folder's own change, or a file we never saw: nothing reliable to report
                if (st is not null) _index.Set(path, st, raw.AtUtc);      // (a file that is gone by now is still reported: the history stays complete, size = last known)
                return Make("file_modified", raw.AtUtc, path, null, st?.Size ?? known?.Size, st is null ? null : _env.Owner(path), kind, cfg, "fsw");
            }
            case RawFileKind.Deleted:
            {
                var known = _index.Get(path); _index.Remove(path);
                if (known is null && string.IsNullOrEmpty(System.IO.Path.GetExtension(path))) return null;   // most likely a folder
                return Make("file_deleted", raw.AtUtc, path, null, known?.Size, null, kind, cfg, "fsw");   // the owner of a deleted file cannot be read: the session user is used
            }
            case RawFileKind.Renamed:
            {
                string old = raw.OldPath ?? ""; var known = old.Length > 0 ? _index.Get(old) : null; if (old.Length > 0) _index.Remove(old);
                var st = _env.Stat(path); _index.Set(path, st ?? known ?? new FileStamp(0, raw.AtUtc), raw.AtUtc);
                bool moved = old.Length > 0 && !string.Equals(System.IO.Path.GetDirectoryName(old), System.IO.Path.GetDirectoryName(path), StringComparison.OrdinalIgnoreCase);
                return Make(moved ? "file_moved" : "file_renamed", raw.AtUtc, path, old, st?.Size ?? known?.Size, _env.Owner(path), kind, cfg, "fsw");
            }
        }
        return null;
    }

    /// <summary>The watcher said it lost events: compare the folder with what is known and report the difference (marked as found by a rescan), then say that a gap existed.</summary>
    private void Rescan(RawFileEvent marker, DlpConfig cfg, List<(long, DlpEvent)> res, int max)
    {
        var now = _now(); int created = 0, modified = 0, deleted = 0;
        IReadOnlyDictionary<string, FileStamp> disk;
        try { disk = _env.Scan(marker.Root, cfg.Files.MaxIndexEntries); } catch { disk = new Dictionary<string, FileStamp>(); }
        foreach (var (p, st) in disk)
        {
            if (res.Count >= max) break; if (Ignored(p, cfg)) continue;
            var known = _index.Get(p);
            if (known is null) { created++; _index.Set(p, st, now); res.Add(Add("file_created", now, p, null, st.Size, cfg, "rescan")); }
            else if (known.Size != st.Size || known.LastWriteUtc != st.LastWriteUtc) { modified++; _index.Set(p, st, now); res.Add(Add("file_modified", now, p, null, st.Size, cfg, "rescan")); }
        }
        foreach (var p in _index.Under(marker.Root))
        {
            if (res.Count >= max) break; if (disk.ContainsKey(p)) continue;
            deleted++; var known = _index.Get(p); _index.Remove(p); res.Add(Add("file_deleted", now, p, null, known?.Size, cfg, "rescan"));
        }
        var gap = new DlpEvent(DlpEvent.MakeUid("filegap", _host, marker.Root, marker.AtUtc.Ticks), "file_activity_gap", marker.AtUtc, _host,
            new Dictionary<string, object?> { ["root_kind"] = _env.RootKind(marker.Root), ["created"] = (long)created, ["modified"] = (long)modified, ["deleted"] = (long)deleted, ["source"] = "fsw_overflow",
                ["path"] = Shape(marker.Root, cfg.Files.PathMode, folderOnly: true) });
        res.Add((NextSeq(marker.AtUtc), gap));
    }

    private (long, DlpEvent) Add(string type, DateTime at, string path, string? old, long? size, DlpConfig cfg, string source)
    { var e = Make(type, at, path, old, size, null, _env.RootKind(path), cfg, source)!; return (NextSeq(at), e); }

    private DlpEvent? Make(string type, DateTime at, string path, string? oldPath, long? size, string? owner, string rootKind, DlpConfig cfg, string source)
    {
        string mode = cfg.Files.PathMode; string name = System.IO.Path.GetFileName(path);
        string? user = Clean(owner), userSource = null;
        if (user is not null && !IsSystemAccount(user)) userSource = "file_owner";
        else { user = Clean(_env.SessionUser()); userSource = user is null ? null : "session"; }
        var d = new Dictionary<string, object?>
        {
            ["name"] = DlpPrivacy.Name(name, mode == "full" ? "full" : "hash", 260), ["extension"] = Ext(name), ["path"] = Shape(path, mode, folderOnly: false),
            ["size_bytes"] = size, ["user"] = user, ["user_source"] = userSource, ["root_kind"] = rootKind, ["source"] = source,
        };
        if (oldPath is { Length: > 0 }) { d["old_path"] = Shape(oldPath, mode, folderOnly: false); d["old_name"] = DlpPrivacy.Name(System.IO.Path.GetFileName(oldPath), mode == "full" ? "full" : "hash", 260); }
        string uid = DlpEvent.MakeUid("file", _host, type, path, oldPath, at.Ticks, size);
        return new DlpEvent(uid, type, at, _host, d);
    }

    /// <summary>full = the whole path; folder = the folder only (the file name is hashed); hash = nothing readable (a stable token). Never the content.</summary>
    public static string? Shape(string path, string mode, bool folderOnly)
    {
        if (string.IsNullOrWhiteSpace(path)) return null;
        string clean = new string(path.Where(c => !char.IsControl(c)).ToArray());
        string dir = folderOnly ? clean : (System.IO.Path.GetDirectoryName(clean) ?? "");
        return mode switch
        {
            "hash" => "sha256:" + Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(clean.ToLowerInvariant())))[..16].ToLowerInvariant(),
            "folder" => dir.Length > 400 ? dir[..400] : dir,
            _ => clean.Length > 400 ? clean[..400] : clean,
        };
    }

    private static bool IsSystemAccount(string u) => u.StartsWith("NT AUTHORITY", StringComparison.OrdinalIgnoreCase) || u.StartsWith("BUILTIN\\", StringComparison.OrdinalIgnoreCase) || u.Equals("SYSTEM", StringComparison.OrdinalIgnoreCase) || u.StartsWith("NT SERVICE", StringComparison.OrdinalIgnoreCase);
    private static string? Clean(string? s) { if (string.IsNullOrWhiteSpace(s)) return null; s = new string(s.Where(c => !char.IsControl(c)).ToArray()).Trim(); return s.Length == 0 ? null : s.Length > 190 ? s[..190] : s; }
    private static string Ext(string n) { int i = n.LastIndexOf('.'); return i >= 0 && n.Length - i <= 12 ? n[(i + 1)..].ToLowerInvariant() : ""; }

    private bool Ignored(string path, DlpConfig cfg)
    {
        string n = System.IO.Path.GetFileName(path);
        foreach (var pat in cfg.Files.Exclude) if (Glob(n, pat)) return true;
        return false;
    }

    internal static bool Glob(string name, string pattern)
    {
        var rx = "^" + System.Text.RegularExpressions.Regex.Escape(pattern).Replace("\\*", ".*").Replace("\\?", ".") + "$";
        return System.Text.RegularExpressions.Regex.IsMatch(name, rx, System.Text.RegularExpressions.RegexOptions.IgnoreCase);
    }

    private long NextSeq(DateTime at) { _seq = Math.Max(_seq + 1, Math.Max(at.Ticks, _now().Ticks)); return _seq; }
}

/// <summary>Windows implementation: one FileSystemWatcher per root (large buffer, error → lost-events marker), a bounded queue, owner lookup through the file's ACL, file scans for the index/rescan.</summary>
public sealed class WindowsFileEnvironment : IFileEnvironment, IDisposable
{
    private readonly ConcurrentQueue<RawFileEvent> _q = new(); private readonly Dictionary<string, FileSystemWatcher> _w = new(StringComparer.OrdinalIgnoreCase);
    private const int MaxQueue = 20000; private int _dropped;
    private readonly Func<string?> _sessionUser;
    public WindowsFileEnvironment(Func<string?>? sessionUser = null) { _sessionUser = sessionUser ?? (() => SessionInfo.ActiveUser()); }

    public void Watch(IReadOnlyCollection<string> roots)
    {
        var want = new HashSet<string>(roots, StringComparer.OrdinalIgnoreCase);
        foreach (var gone in _w.Keys.Where(k => !want.Contains(k)).ToList()) { _w[gone].Dispose(); _w.Remove(gone); }
        foreach (var root in want)
        {
            if (_w.ContainsKey(root) || !Directory.Exists(root)) continue;
            try
            {
                var w = new FileSystemWatcher(root) { IncludeSubdirectories = true, NotifyFilter = NotifyFilters.FileName | NotifyFilters.DirectoryName | NotifyFilters.Size | NotifyFilters.LastWrite, InternalBufferSize = 64 * 1024 };
                string r = root;
                w.Created += (_, e) => Push(new RawFileEvent(RawFileKind.Created, e.FullPath, null, DateTime.UtcNow, r));
                w.Changed += (_, e) => Push(new RawFileEvent(RawFileKind.Changed, e.FullPath, null, DateTime.UtcNow, r));
                w.Deleted += (_, e) => Push(new RawFileEvent(RawFileKind.Deleted, e.FullPath, null, DateTime.UtcNow, r));
                w.Renamed += (_, e) => Push(new RawFileEvent(RawFileKind.Renamed, e.FullPath, e.OldFullPath, DateTime.UtcNow, r));
                w.Error += (_, _) => _q.Enqueue(new RawFileEvent(RawFileKind.Overflow, r, null, DateTime.UtcNow, r));   // events were lost: a rescan follows
                w.EnableRaisingEvents = true; _w[root] = w;
            }
            catch { /* unreadable root: reported as 'no folder' by the source */ }
        }
    }

    private void Push(RawFileEvent e)
    {
        if (_q.Count >= MaxQueue) { if (Interlocked.Increment(ref _dropped) == 1) _q.Enqueue(new RawFileEvent(RawFileKind.Overflow, e.Root, null, DateTime.UtcNow, e.Root)); return; }
        Interlocked.Exchange(ref _dropped, 0); _q.Enqueue(e);
    }

    public IReadOnlyList<RawFileEvent> Drain(int max) { var r = new List<RawFileEvent>(); while (r.Count < max && _q.TryDequeue(out var e)) r.Add(e); return r; }

    public IReadOnlyDictionary<string, FileStamp> Scan(string root, int max)
    {
        var d = new Dictionary<string, FileStamp>(StringComparer.OrdinalIgnoreCase);
        try
        {
            foreach (var f in new DirectoryInfo(root).EnumerateFiles("*", new EnumerationOptions { RecurseSubdirectories = true, IgnoreInaccessible = true, AttributesToSkip = FileAttributes.ReparsePoint }))
            { if (d.Count >= max) break; d[f.FullName] = new FileStamp(f.Length, f.LastWriteTimeUtc); }
        }
        catch { }
        return d;
    }

    public FileStamp? Stat(string path) { try { var f = new FileInfo(path); return f.Exists && (f.Attributes & FileAttributes.Directory) == 0 ? new FileStamp(f.Length, f.LastWriteTimeUtc) : null; } catch { return null; } }

    public string? Owner(string path)
    {
        try { return new FileInfo(path).GetAccessControl().GetOwner(typeof(NTAccount))?.Value; } catch { return null; }
    }

    public string? SessionUser() => _sessionUser();

    public string RootKind(string path)
    {
        try
        {
            if (path.StartsWith("\\\\")) return "network";
            var d = new DriveInfo(System.IO.Path.GetPathRoot(path)!);
            return d.DriveType switch { DriveType.Removable => "removable", DriveType.Network => "network", _ => "local" };
        }
        catch { return "local"; }
    }

    public void Dispose() { foreach (var w in _w.Values) w.Dispose(); _w.Clear(); }
}
