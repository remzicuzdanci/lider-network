using System.Reflection;

namespace LiderCollector.Core;

/// <summary>
/// Single source of truth for the running agent version. It comes from the assembly
/// (set by the build via -p:Version), never from collector.json, so an upgrade is
/// reported correctly even though the old config file is preserved.
/// </summary>
public static class AppVersion
{
    public static string Current { get; } = Resolve();

    private static string Resolve()
    {
        var asm = Assembly.GetEntryAssembly() ?? typeof(AppVersion).Assembly;
        var info = asm.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion;
        if (!string.IsNullOrWhiteSpace(info))
        {
            int plus = info.IndexOf('+');
            return plus > 0 ? info[..plus] : info;
        }
        var v = asm.GetName().Version;
        return v is null ? "0.0.0" : $"{v.Major}.{v.Minor}.{v.Build}";
    }
}
