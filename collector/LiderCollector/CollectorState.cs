using System.IO;
using System.Security.AccessControl;
using System.Security.Principal;
using System.Text.Json;

namespace LiderCollector;

/// <summary>
/// Persists small agent state between collection cycles.
///
/// Storage path: %ProgramData%\LiderCollector\collector-state.json
/// Directory ACL (set on first creation): SYSTEM + Administrators — FullControl only.
/// Other accounts (including network service, users) have no access.
///
/// Cursor semantics (TD-2):
///   EventLogCursors stores the last CONFIRMED RecordId — i.e. the highest RecordId
///   whose corresponding events reached the server or the offline queue.
///   The state is NOT saved from inside EventLogModule; CollectorWorker saves it
///   after each successful inventory send or successful queue enqueue.
///   This ensures events are never permanently skipped on a crash before delivery,
///   but may be re-collected once (at-least-once; server deduplicates by RecordId).
/// </summary>
public sealed class CollectorState
{
    private static readonly JsonSerializerOptions _opts = new() { WriteIndented = true };
    private readonly string _path;

    /// <summary>Highest confirmed EventLog RecordId per log name ("System", "Application", …).</summary>
    public Dictionary<string, long> EventLogCursors { get; set; } = new();

    // Required by System.Text.Json deserialization; Save() is a no-op when path is empty.
    public CollectorState() { _path = string.Empty; }

    private CollectorState(string path) => _path = path;

    public static CollectorState Load()
    {
        string dataDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
            "LiderCollector");

        EnsureSecureDirectory(dataDir);

        var path  = Path.Combine(dataDir, "collector-state.json");
        var state = new CollectorState(path);

        try
        {
            if (File.Exists(path))
            {
                var json   = File.ReadAllText(path);
                var loaded = JsonSerializer.Deserialize<CollectorState>(json);
                if (loaded != null) state.EventLogCursors = loaded.EventLogCursors;
            }
        }
        catch { /* corrupt state — start fresh; next Save() will overwrite */ }

        return state;
    }

    public void Save()
    {
        try { File.WriteAllText(_path, JsonSerializer.Serialize(this, _opts)); }
        catch { /* non-fatal — next cycle starts fresh */ }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static void EnsureSecureDirectory(string dir)
    {
        if (Directory.Exists(dir)) return;
        try
        {
            Directory.CreateDirectory(dir);

            // Restrict to SYSTEM + Administrators only (remove inherited Everyone ACEs)
            var sec = new DirectorySecurity();
            sec.SetAccessRuleProtection(isProtected: true, preserveInheritance: false);

            var system = new SecurityIdentifier(WellKnownSidType.LocalSystemSid, null);
            var admins = new SecurityIdentifier(WellKnownSidType.BuiltinAdministratorsSid, null);

            sec.AddAccessRule(new FileSystemAccessRule(
                system, FileSystemRights.FullControl,
                InheritanceFlags.ContainerInherit | InheritanceFlags.ObjectInherit,
                PropagationFlags.None, AccessControlType.Allow));
            sec.AddAccessRule(new FileSystemAccessRule(
                admins, FileSystemRights.FullControl,
                InheritanceFlags.ContainerInherit | InheritanceFlags.ObjectInherit,
                PropagationFlags.None, AccessControlType.Allow));

            new DirectoryInfo(dir).SetAccessControl(sec);
        }
        catch { /* non-fatal — may lack elevation; directory still usable */ }
    }
}
