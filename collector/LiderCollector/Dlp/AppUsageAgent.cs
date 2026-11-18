using System.ComponentModel;
using System.Diagnostics;
using System.IO.Pipes;
using System.Runtime.InteropServices;
using System.Security.AccessControl;
using System.Security.Principal;
using System.Text;
using System.Text.Json;

namespace LiderCollector.Dlp;

/// <summary>
/// What the user's desktop looks like right now. A Windows SERVICE runs in session 0 and cannot see any user's desktop, so this runs inside the user's session (see <see cref="AppUsageAgent"/>).
/// Reads only: the foreground window's process name (and, only if the policy asks, its title), the time since the last input, and whether the input desktop is available (it is not while locked).
/// Never keystrokes, never screen content, never window contents.
/// </summary>
public static class ForegroundSampler
{
    [StructLayout(LayoutKind.Sequential)] private struct LASTINPUTINFO { public uint cbSize; public uint dwTime; }
    [DllImport("user32.dll")] private static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] private static extern int GetWindowText(IntPtr hWnd, StringBuilder sb, int max);
    [DllImport("user32.dll")] private static extern bool GetLastInputInfo(ref LASTINPUTINFO info);
    [DllImport("user32.dll", SetLastError = true)] private static extern IntPtr OpenInputDesktop(uint flags, bool inherit, uint access);
    [DllImport("user32.dll")] private static extern bool CloseDesktop(IntPtr h);
    [DllImport("kernel32.dll", SetLastError = true)] private static extern IntPtr OpenProcess(uint access, bool inherit, uint pid);
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)] private static extern bool QueryFullProcessImageName(IntPtr h, uint flags, StringBuilder sb, ref int size);
    [DllImport("kernel32.dll")] private static extern bool CloseHandle(IntPtr h);
    private const uint PROCESS_QUERY_LIMITED_INFORMATION = 0x1000, DESKTOP_SWITCHDESKTOP = 0x0100;

    public static int IdleSeconds()
    {
        var i = new LASTINPUTINFO { cbSize = (uint)Marshal.SizeOf<LASTINPUTINFO>() };
        if (!GetLastInputInfo(ref i)) return 0;
        uint idleMs = unchecked((uint)Environment.TickCount - i.dwTime);
        return (int)Math.Min(idleMs / 1000, int.MaxValue);
    }

    /// <summary>false while the workstation is locked / the secure desktop is up (the input desktop cannot be opened).</summary>
    public static bool InputDesktopAvailable()
    {
        var h = OpenInputDesktop(0, false, DESKTOP_SWITCHDESKTOP);
        if (h == IntPtr.Zero) return false; CloseDesktop(h); return true;
    }

    public static (string? Process, string? Title) Foreground()
    {
        var w = GetForegroundWindow(); if (w == IntPtr.Zero) return (null, null);
        GetWindowThreadProcessId(w, out uint pid); string? name = null;
        var h = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid);
        if (h != IntPtr.Zero)
        {
            try { var sb = new StringBuilder(520); int n = sb.Capacity; if (QueryFullProcessImageName(h, 0, sb, ref n)) name = Path.GetFileName(sb.ToString(0, n)); } finally { CloseHandle(h); }
        }
        var t = new StringBuilder(256); GetWindowText(w, t, t.Capacity);
        return (name, t.Length == 0 ? null : t.ToString());
    }

    public static AppSample Take(int sessionId, string? user)
    {
        bool locked = !InputDesktopAvailable(); var (p, t) = locked ? ((string?)null, (string?)null) : Foreground();
        if (IsLockScreenProcess(p)) locked = true;   // Windows 10/11 draw the lock screen as LockApp.exe on the normal input desktop: the input desktop is still available, so the process name decides
        return new AppSample(DateTime.UtcNow, sessionId, user, locked ? null : p, t, IdleSeconds(), locked);
    }

    /// <summary>The sign-in / lock screen processes (LogonUI.exe, LockApp.exe): a user looking at them is not using an application.</summary>
    public static bool IsLockScreenProcess(string? process) =>
        string.Equals(process, "LogonUI.exe", StringComparison.OrdinalIgnoreCase) || string.Equals(process, "LockApp.exe", StringComparison.OrdinalIgnoreCase);
}

/// <summary>The wire form of one sample between the helper and the service (one JSON line). The USER and SESSION are not trusted from the line: the service takes them from the pipe client's identity.</summary>
public sealed record AppSampleWire(string T, string? P, string? W, int I, bool L);

/// <summary>Service side: a named pipe the per-session helpers connect to. The user and session of every sample come from the connecting process (impersonation), never from what it claims.</summary>
public sealed class AppUsagePipeServer : IDisposable
{
    public const string PipeName = "LiderCollector.AppUsage";
    [DllImport("kernel32.dll", SetLastError = true)] private static extern bool GetNamedPipeClientSessionId(IntPtr pipe, out uint sessionId);
    private readonly AppSampleBuffer _buf; private readonly CancellationTokenSource _cts = new(); private Task? _loop; private readonly Func<string?> _titleMode;

    public AppUsagePipeServer(AppSampleBuffer buf, Func<string?>? titleMode = null) { _buf = buf; _titleMode = titleMode ?? (() => "none"); }

    /// <summary>Last problem seen (diagnostics only; never contains sample data).</summary>
    public string? LastError { get; private set; }

    public void Start() { _loop ??= Task.Run(() => LoopAsync(_cts.Token)); }

    private static NamedPipeServerStream Create()
    {
        var ps = new PipeSecurity();
        ps.AddAccessRule(new PipeAccessRule(new SecurityIdentifier(WellKnownSidType.LocalSystemSid, null), PipeAccessRights.FullControl, AccessControlType.Allow));
        ps.AddAccessRule(new PipeAccessRule(new SecurityIdentifier(WellKnownSidType.BuiltinAdministratorsSid, null), PipeAccessRights.FullControl, AccessControlType.Allow));
        ps.AddAccessRule(new PipeAccessRule(new SecurityIdentifier(WellKnownSidType.AuthenticatedUserSid, null), PipeAccessRights.WriteData | PipeAccessRights.ReadAttributes | PipeAccessRights.Synchronize, AccessControlType.Allow));   // users may only write samples: no read, no new instance
        return NamedPipeServerStreamAcl.Create(PipeName, PipeDirection.In, 16, PipeTransmissionMode.Byte, PipeOptions.Asynchronous, 4096, 4096, ps);
    }

    private async Task LoopAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            NamedPipeServerStream? s = null;
            try
            {
                s = Create(); await s.WaitForConnectionAsync(ct);
                var conn = s; _ = Task.Run(() => HandleAsync(conn, ct), ct); s = null;
            }
            catch (OperationCanceledException) { s?.Dispose(); return; }
            catch (Exception ex) { LastError = "accept: " + ex.GetType().Name + ": " + ex.Message; s?.Dispose(); try { await Task.Delay(1000, ct); } catch { return; } }
        }
    }

    private async Task HandleAsync(NamedPipeServerStream s, CancellationToken ct)
    {
        using (s)
        {
            try
            {
                string? user = null; int session = -1;
                if (GetNamedPipeClientSessionId(s.SafePipeHandle.DangerousGetHandle(), out uint sid)) session = (int)sid;
                using var reader = new StreamReader(s, Encoding.UTF8);
                int lines = 0;
                string? line;
                while (!ct.IsCancellationRequested && (line = await reader.ReadLineAsync(ct)) is not null && lines++ < 10000)
                {
                    if (line.Length > 2000) continue;
                    if (user is null) { try { s.RunAsClient(() => { user = WindowsIdentity.GetCurrent().Name; }); } catch { return; } }
                    var w = JsonSerializer.Deserialize<AppSampleWire>(line); if (w is null) continue;
                    _buf.Add(Parse(w, session, user));
                }
            }
            catch (Exception ex) { LastError = "client: " + ex.GetType().Name + ": " + ex.Message; /* a misbehaving client only loses its own connection */ }
        }
    }

    internal static AppSample Parse(AppSampleWire w, int session, string? user)
    {
        DateTime at = DateTime.TryParse(w.T, null, System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal, out var t) ? t : DateTime.UtcNow;
        // a client clock far from ours is not believed
        if (Math.Abs((at - DateTime.UtcNow).TotalMinutes) > 5) at = DateTime.UtcNow;
        string? proc = w.P is { Length: > 0 } ? new string(w.P.Where(c => !char.IsControl(c)).ToArray()) : null; if (proc is { Length: > 150 }) proc = proc[..150];
        string? title = w.W is { Length: > 0 } ? new string(w.W.Where(c => !char.IsControl(c)).ToArray()) : null; if (title is { Length: > 300 }) title = title[..300];
        return new AppSample(at, session, user, proc, title, Math.Clamp(w.I, 0, 86400 * 7), w.L);
    }

    public void Dispose() { _cts.Cancel(); }
}

/// <summary>User-session side ("LiderCollector.exe --user-agent"): samples every few seconds and writes one line per sample to the service pipe. Exits when the service is gone.</summary>
public static class AppUsageAgent
{
    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)] private static extern Microsoft.Win32.SafeHandles.SafePipeHandle CreateFile(string name, uint access, uint share, IntPtr sa, uint disposition, uint flags, IntPtr template);

    /// <summary>Opens the service pipe asking ONLY for the right to write data (the pipe grants users nothing else: no read, no new instance).</summary>
    /// <summary>Last connection problem (diagnostics only).</summary>
    public static string? LastError { get; private set; }

    private static NamedPipeClientStream ConnectWriteOnly()
    {
        const uint FILE_WRITE_DATA = 0x2, SYNCHRONIZE = 0x100000, OPEN_EXISTING = 3;
        var h = CreateFile(@"\\.\pipe\" + AppUsagePipeServer.PipeName, FILE_WRITE_DATA | SYNCHRONIZE, 0, IntPtr.Zero, OPEN_EXISTING, 0, IntPtr.Zero);
        if (h.IsInvalid) throw new Win32Exception(Marshal.GetLastWin32Error());
        return new NamedPipeClientStream(PipeDirection.Out, false, true, h);
    }

    public static async Task<int> RunAsync(int sampleSeconds, int servicePid, CancellationToken ct, TextWriter? stdout = null)
    {
        int session = Process.GetCurrentProcess().SessionId; sampleSeconds = Math.Clamp(sampleSeconds, 2, 60);
        NamedPipeClientStream? pipe = null; StreamWriter? w = null;
        while (!ct.IsCancellationRequested)
        {
            if (servicePid > 0) { try { Process.GetProcessById(servicePid); } catch { return 0; } }
            var s = ForegroundSampler.Take(session, null);
            if (stdout is not null) await stdout.WriteLineAsync(JsonSerializer.Serialize(new { s.AtUtc, s.Process, s.IdleSeconds, s.Locked }));
            try
            {
                if (pipe is null || !pipe.IsConnected) { pipe?.Dispose(); pipe = ConnectWriteOnly(); w = new StreamWriter(pipe, new UTF8Encoding(false)) { AutoFlush = true }; }
                await w!.WriteLineAsync(JsonSerializer.Serialize(new AppSampleWire(s.AtUtc.ToString("O"), s.Process, s.Title, s.IdleSeconds, s.Locked)));
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex) { LastError = ex.GetType().Name + ": " + ex.Message; try { pipe?.Dispose(); } catch { } pipe = null; }   // the service restarts: reconnect on the next sample
            try { await Task.Delay(TimeSpan.FromSeconds(sampleSeconds), ct); } catch { break; }
        }
        pipe?.Dispose(); return 0;
    }
}

/// <summary>Decides which sessions need a helper and which helpers are no longer wanted. Pure (tested); the Windows launch itself is <see cref="SessionAgentLauncher"/>.</summary>
public static class AgentPlan
{
    public static (List<int> Start, List<int> Stop) Decide(bool enabled, IReadOnlyList<SessionDesc> sessions, IReadOnlyCollection<int> running)
    {
        var wanted = enabled ? sessions.Where(s => s.IsActive && !string.IsNullOrEmpty(s.User) && s.Id > 0).Select(s => s.Id).ToHashSet() : new HashSet<int>();   // session 0 is the service itself
        return (wanted.Where(id => !running.Contains(id)).ToList(), running.Where(id => !wanted.Contains(id)).ToList());
    }
}

/// <summary>Starts the helper in the active user session (this exe, "--user-agent"). Needs LocalSystem (WTSQueryUserToken); only the Windows service uses it.</summary>
public sealed class SessionAgentLauncher
{
    [DllImport("wtsapi32.dll", SetLastError = true)] private static extern bool WTSQueryUserToken(uint sessionId, out IntPtr token);
    [DllImport("userenv.dll", SetLastError = true)] private static extern bool CreateEnvironmentBlock(out IntPtr env, IntPtr token, bool inherit);
    [DllImport("userenv.dll")] private static extern bool DestroyEnvironmentBlock(IntPtr env);
    [DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    private static extern bool CreateProcessAsUser(IntPtr token, string? app, StringBuilder cmd, IntPtr pa, IntPtr ta, bool inherit, uint flags, IntPtr env, string? dir, ref STARTUPINFO si, out PROCESS_INFORMATION pi);
    [DllImport("kernel32.dll")] private static extern bool CloseHandle(IntPtr h);
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)] private struct STARTUPINFO { public int cb; public string? lpReserved, lpDesktop, lpTitle; public int dwX, dwY, dwXSize, dwYSize, dwXCountChars, dwYCountChars, dwFillAttribute, dwFlags; public short wShowWindow, cbReserved2; public IntPtr lpReserved2, hStdInput, hStdOutput, hStdError; }
    [StructLayout(LayoutKind.Sequential)] private struct PROCESS_INFORMATION { public IntPtr hProcess, hThread; public int dwProcessId, dwThreadId; }
    private const uint CREATE_NO_WINDOW = 0x08000000, CREATE_UNICODE_ENVIRONMENT = 0x00000400;

    private readonly Dictionary<int, int> _pids = new();   // session -> helper pid

    public void Reconcile(bool enabled, int sampleSeconds, Microsoft.Extensions.Logging.ILogger log)
    {
        foreach (var (sid, pid) in _pids.ToList()) { bool alive; try { alive = !Process.GetProcessById(pid).HasExited; } catch { alive = false; } if (!alive) _pids.Remove(sid); }
        var (start, stop) = AgentPlan.Decide(enabled, SessionInfo.Sessions(), _pids.Keys.ToList());
        foreach (var sid in stop) { try { Process.GetProcessById(_pids[sid]).Kill(); } catch { } _pids.Remove(sid); }
        foreach (var sid in start)
        {
            try { int pid = Launch(sid, sampleSeconds); _pids[sid] = pid; log.LogInformation("Application-usage helper started in session {Session} (pid {Pid}).", sid, pid); }
            catch (Exception ex) { log.LogWarning("Application-usage helper could not be started in session {Session}: {Msg}", sid, ex.Message); }
        }
    }

    public void StopAll() { foreach (var pid in _pids.Values) { try { Process.GetProcessById(pid).Kill(); } catch { } } _pids.Clear(); }

    private static int Launch(int sessionId, int sampleSeconds)
    {
        if (!WTSQueryUserToken((uint)sessionId, out var token)) throw new Win32Exception(Marshal.GetLastWin32Error());
        IntPtr env = IntPtr.Zero;
        try
        {
            CreateEnvironmentBlock(out env, token, false);
            var si = new STARTUPINFO { cb = Marshal.SizeOf<STARTUPINFO>(), lpDesktop = "winsta0\\default" };
            string exe = Environment.ProcessPath ?? throw new InvalidOperationException("no process path");
            var cmd = new StringBuilder($"\"{exe}\" --user-agent {Environment.ProcessId} {sampleSeconds}");
            if (!CreateProcessAsUser(token, null, cmd, IntPtr.Zero, IntPtr.Zero, false, CREATE_NO_WINDOW | CREATE_UNICODE_ENVIRONMENT, env, Path.GetDirectoryName(exe), ref si, out var pi)) throw new Win32Exception(Marshal.GetLastWin32Error());
            CloseHandle(pi.hThread); CloseHandle(pi.hProcess); return pi.dwProcessId;
        }
        finally { if (env != IntPtr.Zero) DestroyEnvironmentBlock(env); CloseHandle(token); }
    }
}
