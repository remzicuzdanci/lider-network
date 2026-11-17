using System.Collections.Concurrent;
using System.IO;
using System.Management;
using System.Security.Cryptography;
using System.Text;

namespace LiderCollector.Dlp;

/// <summary>A removable volume as seen at one moment. The serial number is never kept in clear: only a salted-by-machine hash that is stable for the same stick (to count / recognise it).</summary>
public sealed record UsbVolume(string Drive, string? Label, string? FileSystem, long SizeBytes, string? Vendor, string? Product, string? SerialHash, string? Vid = null, string? Pid = null, string? Bus = null);

/// <summary>A file seen on a removable volume (name and size only - the content is never opened).</summary>
public sealed record UsbFile(string Drive, string Name, long SizeBytes, string Action, DateTime AtUtc, string? FullPath = null);

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
    private readonly IUsbEnvironment _env; private readonly Func<DateTime> _now; private readonly FileIndex? _index; private readonly Func<string?> _user;
    private List<UsbVolume>? _last; private long _seq;
    /// <param name="index">files known under the folders the policy watches: lets a file that appears on a USB drive be traced to a PROBABLE origin (same name and size)</param>
    /// <param name="user">who is signed in at the moment of the event (Terminal Services session, console or remote); never guessed</param>
    public UsbSource(IUsbEnvironment env, Func<DateTime>? now = null, string? host = null, FileIndex? index = null, Func<string?>? user = null) { _env = env; _now = now ?? (() => DateTime.UtcNow); _host = host; _index = index; _user = user ?? (() => null); }
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
                string? who = Clean(_user()); if (who is not null) { data["user"] = who; data["user_source"] = "session"; }
                string type = "usb_file_event";
                if (_index is not null && f.Action is "created" or "renamed" && f.SizeBytes > 0)
                {
                    // a file that appears on the drive: is there a file with the same name and size in a watched folder that was seen recently? Then this is a PROBABLE copy - never certain, and labelled so.
                    string? src = _index.FindCopy(f.Name, f.SizeBytes, f.Drive + "\\", f.AtUtc.AddHours(-24));
                    if (src is not null) { type = "file_copied_to_usb"; data["source_path"] = FileActivitySource.Shape(src, cfg.Files.PathMode, folderOnly: false); data["confidence"] = "name_size"; if (f.FullPath is not null) data["path"] = FileActivitySource.Shape(f.FullPath, cfg.Files.PathMode, folderOnly: false); }
                }
                string uid = DlpEvent.MakeUid(type == "usb_file_event" ? "usbf" : "usbx", _host, f.Drive, f.Name, f.Action, f.AtUtc.Ticks, f.SizeBytes);
                res.Add((NextSeq(f.AtUtc), new DlpEvent(uid, type, f.AtUtc, _host, data)));   // created / renamed / deleted ON a removable drive; whether the file came from this computer is not knowable here, so it is never called a copy
            }
        return res.Where(r => r.Item1 > afterPosition).OrderBy(r => r.Item1).Take(max).ToList();
    }

    private long NextSeq(DateTime at) { _seq = Math.Max(_seq + 1, Math.Max(at.Ticks, _now().Ticks)); return _seq; }

    public IEnumerable<DlpEvent> Diff(List<UsbVolume> prev, List<UsbVolume> cur)
    {
        var now = _now();
        foreach (var v in cur.Where(c => prev.All(p => p.Drive != c.Drive || p.SerialHash != c.SerialHash || p.Label != c.Label)))
            yield return new DlpEvent(DlpEvent.MakeUid("usbc", _host, v.Drive, v.SerialHash, v.Label, v.SizeBytes, now.Ticks), "usb_connected", now, _host, WithUser(Describe(v, true)));
        foreach (var v in prev.Where(p => cur.All(c => c.Drive != p.Drive || c.SerialHash != p.SerialHash || c.Label != p.Label)))
            yield return new DlpEvent(DlpEvent.MakeUid("usbd", _host, v.Drive, v.SerialHash, v.Label, now.Ticks), "usb_disconnected", now, _host, WithUser(Describe(v, false)));
    }

    private static Dictionary<string, object?> Describe(UsbVolume v, bool full)
    {
        var d = new Dictionary<string, object?> { ["drive"] = v.Drive, ["label"] = v.Label, ["vendor"] = v.Vendor, ["product"] = v.Product, ["serial_hash"] = v.SerialHash, ["vid"] = v.Vid, ["pid"] = v.Pid, ["bus"] = v.Bus };
        if (full) { d["fs"] = v.FileSystem; d["size_bytes"] = v.SizeBytes; }
        return d;
    }

    private Dictionary<string, object?> WithUser(Dictionary<string, object?> d) { string? u = Clean(_user()); if (u is not null) { d["user"] = u; d["user_source"] = "session"; } return d; }
    private static string? Clean(string? s) { if (string.IsNullOrWhiteSpace(s)) return null; s = new string(s.Where(c => !char.IsControl(c)).ToArray()).Trim(); return s.Length == 0 ? null : s.Length > 190 ? s[..190] : s; }

    private static string Ext(string n) { int i = n.LastIndexOf('.'); return i >= 0 && n.Length - i <= 12 ? n[(i + 1)..].ToLowerInvariant() : ""; }
}

/// <summary>Parsing of Windows device ids (pure, tested).</summary>
public static class UsbIds
{
    /// <summary>"USB\VID_0781&amp;PID_5581\4C53..." gives ("0781", "5581"), upper-case; anything else gives (null, null).</summary>
    public static (string? Vid, string? Pid) FromPnp(string? pnp)
    {
        var m = System.Text.RegularExpressions.Regex.Match(pnp ?? "", @"VID_([0-9A-Fa-f]{4})&PID_([0-9A-Fa-f]{4})", System.Text.RegularExpressions.RegexOptions.IgnoreCase | System.Text.RegularExpressions.RegexOptions.CultureInvariant);
        return m.Success ? (m.Groups[1].Value.ToUpperInvariant(), m.Groups[2].Value.ToUpperInvariant()) : (null, null);
    }

    /// <summary>"USBSTOR\DISK&amp;VEN_SANDISK&amp;PROD_ULTRA&amp;REV_1.00\4C530001230613&amp;0" gives "4C530001230613" (the serial without the "&amp;0" instance suffix).</summary>
    public static string? SerialFromDiskPnp(string? pnp)
    {
        if (string.IsNullOrEmpty(pnp)) return null; int i = pnp.LastIndexOf('\\'); if (i < 0 || i == pnp.Length - 1) return null;
        string t = pnp[(i + 1)..]; int amp = t.LastIndexOf('&'); if (amp > 0 && t[(amp + 1)..].All(char.IsDigit)) t = t[..amp];
        return t.Length >= 4 ? t : null;
    }
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
                if ((d.DriveType != DriveType.Removable && d.DriveType != DriveType.Fixed) || !d.IsReady) continue;
                string letter = d.Name.TrimEnd('\\');
                var w = Wmi(letter);
                // an external USB hard disk or SSD reports itself as a FIXED drive: it is a removable device all the same, so it counts when the disk behind it sits on the USB bus
                if (d.DriveType == DriveType.Fixed && !w.IsUsb) continue;
                list.Add(new UsbVolume(letter, string.IsNullOrWhiteSpace(d.VolumeLabel) ? null : d.VolumeLabel, d.DriveFormat, d.TotalSize, w.Vendor, w.Product, w.Serial is null ? null : HashSerial(w.Serial), w.Vid, w.Pid, w.IsUsb ? (d.DriveType == DriveType.Removable ? "usb_removable" : "usb_disk") : "removable"));
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
            try { var fi = new FileInfo(full); if (!fi.Exists || (fi.Attributes & FileAttributes.Directory) != 0) return; _files.Enqueue(new UsbFile(letter, fi.Name, fi.Length, action, DateTime.UtcNow, full)); } catch { }
        }
        w.Created += (_, e) => Add("created", e.FullPath); w.Renamed += (_, e) => Add("renamed", e.FullPath);
        w.Deleted += (_, e) => { if (_files.Count <= 5000) _files.Enqueue(new UsbFile(letter, Path.GetFileName(e.FullPath), 0, "deleted", DateTime.UtcNow)); };   // the file is gone: name only (a deleted folder also arrives here - its name has no extension)
        w.EnableRaisingEvents = true; _watchers[letter] = w;
    }

    private sealed record WmiDisk(string? Vendor, string? Product, string? Serial, bool IsUsb, string? Vid, string? Pid);

    private WmiDisk Wmi(string letter)
    {
        try
        {
            using var parts = new ManagementObjectSearcher($"ASSOCIATORS OF {{Win32_LogicalDisk.DeviceID='{letter}'}} WHERE AssocClass = Win32_LogicalDiskToPartition");
            foreach (ManagementObject part in parts.Get())
            {
                using var disks = new ManagementObjectSearcher($"ASSOCIATORS OF {{Win32_DiskPartition.DeviceID='{part["DeviceID"]}'}} WHERE AssocClass = Win32_DiskDriveToDiskPartition");
                foreach (ManagementObject disk in disks.Get())
                {
                    string? model = disk["Model"]?.ToString(), mf = disk["Manufacturer"]?.ToString(), sn = disk["SerialNumber"]?.ToString(), pnp = disk["PNPDeviceID"]?.ToString(), itf = disk["InterfaceType"]?.ToString();
                    bool usb = string.Equals(itf, "USB", StringComparison.OrdinalIgnoreCase) || (pnp?.StartsWith("USBSTOR", StringComparison.OrdinalIgnoreCase) ?? false);
                    var (vid, pid) = usb ? FindVidPid(UsbIds.SerialFromDiskPnp(pnp)) : (null, null);
                    return new WmiDisk(mf, model, string.IsNullOrWhiteSpace(sn) ? pnp : sn, usb, vid, pid);
                }
            }
        }
        catch { }
        return new WmiDisk(null, null, null, false, null, null);
    }

    /// <summary>The USB device node (USB\VID_xxxx&amp;PID_xxxx\serial) that carries the same serial as the disk: gives the vendor and product id. Best effort; absent when Windows does not expose it.</summary>
    private static (string? Vid, string? Pid) FindVidPid(string? serial)
    {
        if (string.IsNullOrEmpty(serial)) return (null, null);
        try
        {
            using var s = new ManagementObjectSearcher("SELECT DeviceID FROM Win32_PnPEntity WHERE DeviceID LIKE 'USB\\\\VID_%'");
            foreach (ManagementObject o in s.Get()) { string? id = o["DeviceID"]?.ToString(); if (id is not null && id.Contains(serial, StringComparison.OrdinalIgnoreCase)) return UsbIds.FromPnp(id); }
        }
        catch { }
        return (null, null);
    }

    private string HashSerial(string serial) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(_salt + "|" + serial.Trim())))[..24].ToLowerInvariant();

    public void Dispose() { foreach (var w in _watchers.Values) w.Dispose(); _watchers.Clear(); }
}
