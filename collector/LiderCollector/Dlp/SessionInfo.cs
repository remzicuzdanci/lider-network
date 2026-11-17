using System.Runtime.InteropServices;

namespace LiderCollector.Dlp;

/// <summary>A Windows terminal-services session (console or RDP).</summary>
public sealed record SessionDesc(int Id, int State, string? User, string? Station)
{
    public bool IsActive => State == 0;          // WTSActive
    public bool IsDisconnected => State == 4;    // WTSDisconnected
}

/// <summary>
/// Who is signed in, through the Terminal Services API (console AND remote-desktop sessions) - the correct source for "the user" (Win32_ComputerSystem.UserName only knows the physical
/// console). Read-only. Used for the user of file events and to find the sessions in which the application-usage helper must run.
/// </summary>
public static class SessionInfo
{
    [StructLayout(LayoutKind.Sequential)] private struct WTS_SESSION_INFO { public int SessionId; public IntPtr pWinStationName; public int State; }
    [DllImport("wtsapi32.dll", SetLastError = true)] private static extern bool WTSEnumerateSessions(IntPtr hServer, int reserved, int version, out IntPtr ppSessionInfo, out int count);
    [DllImport("wtsapi32.dll")] private static extern void WTSFreeMemory(IntPtr p);
    [DllImport("wtsapi32.dll", SetLastError = true)] private static extern bool WTSQuerySessionInformation(IntPtr hServer, int sessionId, int infoClass, out IntPtr buffer, out int bytes);
    private const int WTSUserName = 5, WTSDomainName = 7;

    public static IReadOnlyList<SessionDesc> Sessions()
    {
        var list = new List<SessionDesc>();
        try
        {
            if (!WTSEnumerateSessions(IntPtr.Zero, 0, 1, out var p, out int n)) return list;
            try
            {
                int size = Marshal.SizeOf<WTS_SESSION_INFO>();
                for (int i = 0; i < n; i++)
                {
                    var s = Marshal.PtrToStructure<WTS_SESSION_INFO>(IntPtr.Add(p, i * size));
                    string? user = Query(s.SessionId, WTSUserName), dom = Query(s.SessionId, WTSDomainName);
                    string? full = string.IsNullOrWhiteSpace(user) ? null : (string.IsNullOrWhiteSpace(dom) ? user : dom + "\\" + user);
                    list.Add(new SessionDesc(s.SessionId, s.State, full, Marshal.PtrToStringUni(s.pWinStationName)));
                }
            }
            finally { WTSFreeMemory(p); }
        }
        catch { /* never throws: no information is better than a failed collection cycle */ }
        return list;
    }

    private static string? Query(int session, int infoClass)
    {
        if (!WTSQuerySessionInformation(IntPtr.Zero, session, infoClass, out var buf, out _)) return null;
        try { return Marshal.PtrToStringUni(buf); } finally { WTSFreeMemory(buf); }
    }

    /// <summary>The user of the active session (console first, then a remote session); null when nobody is signed in.</summary>
    public static string? ActiveUser()
    {
        var s = Sessions().Where(x => x.IsActive && !string.IsNullOrEmpty(x.User)).OrderBy(x => x.Station?.StartsWith("Console", StringComparison.OrdinalIgnoreCase) == true ? 0 : 1).FirstOrDefault();
        return s?.User;
    }
}
