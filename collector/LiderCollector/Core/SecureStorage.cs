using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Text.Json;

namespace LiderCollector.Core;

/// <summary>
/// Wraps Windows DPAPI (ProtectedData) for storing sensitive values like API keys.
/// Data is encrypted at machine scope (DataProtectionScope.LocalMachine) so that a Windows
/// Service running as SYSTEM can read a secret enrolled by an administrator account.
/// The storage file lives alongside the exe; file-system ACLs on the install folder
/// provide the additional access restriction.
/// </summary>
public sealed class SecureStorage
{
    private readonly string _storePath;
    private readonly Dictionary<string, string> _cache = new();
    private readonly object _lock = new();

    // DPAPI entropy — adds per-application isolation on top of per-user isolation.
    private static readonly byte[] _entropy =
        Encoding.UTF8.GetBytes("LiderITONE.Collector.v1");

    public SecureStorage(CollectorConfig config)
    {
        _ = config; // DI-resolved; path comes from runtime base dir for service reliability
        _storePath = Path.Combine(AppContext.BaseDirectory, "secure.dat");
        Load();
    }

    /// <summary>
    /// Store (or overwrite) a named secret.  Persisted encrypted to disk immediately.
    /// </summary>
    public void Set(string key, string value)
    {
        lock (_lock)
        {
            _cache[key] = value;
            Persist();
        }
    }

    /// <summary>Returns the secret, or null if not present.</summary>
    public string? Get(string key)
    {
        lock (_lock)
        {
            return _cache.TryGetValue(key, out string? v) ? v : null;
        }
    }

    public bool Has(string key)
    {
        lock (_lock) { return _cache.ContainsKey(key); }
    }

    public void Delete(string key)
    {
        lock (_lock)
        {
            if (_cache.Remove(key))
                Persist();
        }
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    private void Load()
    {
        if (!File.Exists(_storePath)) return;
        try
        {
            byte[] encrypted = File.ReadAllBytes(_storePath);
            byte[] plain = ProtectedData.Unprotect(encrypted, _entropy,
                DataProtectionScope.LocalMachine);
            var dict = JsonSerializer.Deserialize<Dictionary<string, string>>(plain);
            if (dict != null)
                foreach (var kv in dict)
                    _cache[kv.Key] = kv.Value;
        }
        catch
        {
            // Corrupt/unreadable — start fresh. Service will re-enroll.
        }
    }

    private void Persist()
    {
        byte[] plain = JsonSerializer.SerializeToUtf8Bytes(_cache);
        byte[] encrypted = ProtectedData.Protect(plain, _entropy,
            DataProtectionScope.LocalMachine);

        string tmpPath = _storePath + ".tmp";
        File.WriteAllBytes(tmpPath, encrypted);
        File.Move(tmpPath, _storePath, overwrite: true);
    }
}
