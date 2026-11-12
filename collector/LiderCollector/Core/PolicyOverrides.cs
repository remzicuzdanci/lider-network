using Microsoft.Win32;

namespace LiderCollector.Core;

/// <summary>
/// Group Policy values the agent honours. Deliberately narrow: ONLY the delta-sync switch is read from
/// HKLM\SOFTWARE\Policies\LiderNetwork\LiderCollector (the other ADMX settings are documented there but not consumed by 1.2.0/1.3.0 and are
/// not changed here). The value is applied at runtime and never written back to collector.json, so removing the policy restores the file's value.
/// </summary>
public static class PolicyOverrides
{
    public const string KeyPath = @"HKEY_LOCAL_MACHINE\SOFTWARE\Policies\LiderNetwork\LiderCollector";
    public const string DeltaSyncValue = "DeltaSyncEnabled";

    /// <summary>true/false when the policy is configured (REG_DWORD 1 or 0); null when absent or malformed (= not configured).</summary>
    public static bool? ReadDeltaSync(Func<string, string, object?>? read = null)
    {
        try
        {
            object? v = (read ?? ((k, n) => Registry.GetValue(k, n, null)))(KeyPath, DeltaSyncValue);
            return v switch { int i when i == 0 => false, int i when i == 1 => true, _ => null };
        }
        catch
        {
            return null;                              // unreadable registry never changes behaviour
        }
    }
}
