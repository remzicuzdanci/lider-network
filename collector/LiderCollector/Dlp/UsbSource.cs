using System.Collections.Concurrent;
using System.IO;
using System.Management;
using System.Security.Cryptography;
using System.Text;

namespace LiderCollector.Dlp;

/// <summary>A removable volume as seen at one moment. The serial number is never kept in clear: only a salted-by-machine hash that is stable for the same stick (to count / recognise it).</summary>
public sealed record UsbVolume(string Drive, string? Label, string? FileSystem, long SizeBytes, string? Vendor, string? Product, string? SerialHash);

/// <summary>A file seen on a removable volume (name and size only - the content is never opened).</summary>
public sealed record UsbFile(string Drive, string Name, long SizeBytes, string Action, DateTime AtUtc);

/// <summary>What <see cref="UsbSource"/> needs from the machine (faked in tests, Windows implementation below).</summary>
public interface IUsbEnvironment
{
    IReadOnlyList<UsbVolume> Snapshot();
    IReadOnlyList<UsbFile> DrainFileEvents(int max);
}

/// <summary>
/// USB plug / unplug and file activity on removable drives. Plug/unplug = the difference between two snapshots of the removable volumes (the first snapshot is only the baseline: sticks
/// that are already in are not "connected" events). File events come from the environment (FileSystemWatcher on each removable root); they are named, sized and typed, never read.
/// The position of an event is a clock-based, ever-increasing number, so a restart can never make new events look old.
/// </summary>
public sealed class UsbSource : IDlpSource
{
    private readonly IUsbEnvironment _env; private readonly Func<DateTime> _now;
    private List<UsbVolume>? _last; private long _seq;
    public UsbSource(IUsbEnvironment env, Func<DateTime>? now = null, string? host = null) { _env = env; _now = now ?? (() => DateTime.UtcNow); _host = host; }
    private readonly string? _host;

    public string Name => "usb";
    public bool IsEnabled(DlpConfig cfg) => cfg.Usb.Enabled;
    public bool Prepare(DlpConfig cfg, out string? problem) { problem = null; return true; }

    public IReadOnlyList<(long Position, DlpEvent Event)> ReadNew(long afterPosition, int max, DlpConfig cfg)
    {
        var res = new List<(long, DlpEvent)>();
        var cur = _env.Snapshot().ToList();
        if (_last is null) { _last = cur; }   // baseline: what is already plugged in is not an event
        else
        {
            foreach (var e in Diff(_last, cur)) { res.Add((NextSeq(e.OccurredUtc), e)); }
            _last = cur;
        }
        if (cfg.Usb.FileEvents)
            foreach (var f in _env.DrainFileEvents(max))
            {
                var data = new Dictionary<string, object?> { ["drive"] = f.Drive, ["name"] = DlpPrivacy.Name(f.Name, "full", 260), ["extension"] = Ext(f.Name), ["size_bytes"] = Math.Max(0, f.SizeBytes), ["action"] = f.Action };
                if (cfg.Print.DocumentName is "extension" or "hash" or "none") data["name"] = DlpPrivacy.Name(f.Name, cfg.Print.DocumentName, 260);   // the same privacy mode as the print document name
                string uid = DlpEvent.MakeUid("usbf", _host, f.Drive, f.Name, f.Action, f.AtUtc.Ticks, f.SizeBytes);
                res.Add((NextSeq(f.AtUtc), new DlpEvent(uid, "file_copied_to_usb", f.AtUtc, _host, data)));
            }
        return res.Where(r => r.Item1 > afterPosition).OrderBy(r => r.Item1).Take(max).ToList();
    }

    private long NextSeq(DateTime at) { _seq = Math.Max(_seq + 1, Math.Max(at.Ticks, _now().Ticks)); return _seq; }

    public IEnumerable<DlpEvent> Diff(List<UsbVolume> prev, List<UsbVolume> cur)
    {
        var now = _now();
        foreach (var v in cur.Where(c => prev.All(p => p.Drive != c.Drive || p.SerialHash != c.SerialHash || p.Label != c.Label)))
            yield return new DlpEvent(DlpEvent.MakeUid("usbc", _host, v.Drive, v.SerialHash, v.Label, v.SizeBytes, now.Ticks), "usb_connected", now, _host, Describe(v, true));
        foreach (var v in prev.Where(p => cur.All(c => c.Drive != p.Drive || c.SerialHash != p.SerialHash || c.Label != p.Label)))
            yield return new DlpEvent(DlpEvent.MakeUid("usbd", _host, v.Drive, v.SerialHash, v.Label, now.Ticks), "usb_disconnected", now, _host, Describe(v, false));
    }

    private static Dictionary<string, object?> Describe(UsbVolume v, bool full)
    {
        var d = new Dictionary<string, object?> { ["drive"] = v.Drive, ["label"] = v.Label, ["vendor"] = v.Vendor, ["product"] = v.Product, ["serial_hash"] = v.SerialHash };
        if (full) { d["fs"] = v.FileSystem; d["size_bytes"] = v.SizeBytes; }
        return d;
    }

    private static string Ext(string n) { int i = n.LastIndexOf('.'); return i >= 0 && n.Length - i <= 12 ? n[(i + 1)..].ToLowerInvariant() : ""; }
}

/// <summary>Windows implementation: DriveInfo for removable volumes, WMI for vendor/model/serial (best effort), FileSystemWatcher per removable root. Only names and sizes - files are never opened.</summary>
public sealed class WindowsUsbEnvironment : IUsbEnvironment, IDisposable
{
    private readonly bool _watchFiles; private readonly ConcurrentQueue<UsbFile> _files = new(); private readonly Dictionary<string, FileSystemWatcher> _watchers = new();
    private readonly string _salt;
    public WindowsUsbEnvironment(bool watchFiles) { _watchFiles = watchFiles; _salt = Environment.MachineName; }

    public IReadOnlyList<UsbVolume> Snapshot()
    {
        var list = new List<UsbVolume>(); var seen = new HashSet<string>();
        foreach (var d in DriveInfo.GetDrives())
        {
            try
            {
                if (d.DriveType != DriveType.Removable || !d.IsReady) continue;
                string letter = d.Name.TrimEnd('\\');
                var (vendor, product, serial) = Wmi(letter);
                list.Add(new UsbVolume(letter, string.IsNullOrWhiteSpace(d.VolumeLabel) ? null : d.VolumeLabel, d.DriveFormat, d.TotalSize, vendor, product, serial is null ? null : HashSerial(serial)));
                seen.Add(letter); if (_watchFiles) Watch(d.Name, letter);
            }
            catch { /* a stick pulled while we look at it: next poll */ }
        }
        foreach (var gone in _watchers.Keys.Where(k => !seen.Contains(k)).ToList()) { _watchers[gone].Dispose(); _watchers.Remove(gone); }
        return list;
    }

    public IReadOnlyList<UsbFile> DrainFileEvents(int max) { var r = new List<UsbFile>(); while (r.Count < max && _files.TryDequeue(out var f)) r.Add(f); return r; }

    private void Watch(string root, string letter)
    {
        if (_watchers.ContainsKey(letter)) return;
        var w = new FileSystemWatcher(root) { IncludeSubdirectories = true, NotifyFilter = NotifyFilters.FileName | NotifyFilters.Size | NotifyFilters.LastWrite, InternalBufferSize = 64 * 1024 };
        void Add(string action, string full)
        {
            if (_files.Count > 5000) return;                      // bounded: a flood of events never grows memory without limit
            try { var fi = new FileInfo(full); if (!fi.Exists || (fi.Attributes & FileAttributes.Directory) != 0) return; _files.Enqueue(new UsbFile(letter, fi.Name, fi.Length, action, DateTime.UtcNow)); } catch { }
        }
        w.Created += (_, e) => Add("created", e.FullPath); w.Renamed += (_, e) => Add("renamed", e.FullPath);
        w.EnableRaisingEvents = true; _watchers[letter] = w;
    }

    private (string? vendor, string? product, string? serial) Wmi(string letter)
    {
        try
        {
            using var parts = new ManagementObjectSearcher($"ASSOCIATORS OF {{Win32_LogicalDisk.DeviceID='{letter}'}} WHERE AssocClass = Win32_LogicalDiskToPartition");
            foreach (ManagementObject part in parts.Get())
            {
                using var disks = new ManagementObjectSearcher($"ASSOCIATORS OF {{Win32_DiskPartition.DeviceID='{part["DeviceID"]}'}} WHERE AssocClass = Win32_DiskDriveToDiskPartition");
                foreach (ManagementObject disk in disks.Get())
                {
                    string? model = disk["Model"]?.ToString(), mf = disk["Manufacturer"]?.ToString(), sn = disk["SerialNumber"]?.ToString();
                    return (mf, model, string.IsNullOrWhiteSpace(sn) ? disk["PNPDeviceID"]?.ToString() : sn);
                }
            }
        }
        catch { }
        return (null, null, null);
    }

    private string HashSerial(string serial) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(_salt + "|" + serial.Trim())))[..24].ToLowerInvariant();

    public void Dispose() { foreach (var w in _watchers.Values) w.Dispose(); _watchers.Clear(); }
}
