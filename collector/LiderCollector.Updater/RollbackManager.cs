namespace LiderCollector.Updater;

/// <summary>
/// Creates and restores a point-in-time backup of the collector install directory.
/// The backup is kept in %ProgramData%\LiderNetwork\LiderCollector\update-backup\
/// and deleted after a successful update.
///
/// Preservation guarantee: ProgramData files (config.json, dpapi_api_key.bin,
/// offline queue, EventLog cursor, etc.) are NEVER in the install directory, so
/// they are unaffected by backup/restore operations.
/// </summary>
internal sealed class RollbackManager
{
    private readonly string _installPath;
    private readonly string _backupPath;

    public RollbackManager(string installPath, string dataPath, string correlationId)
    {
        _installPath = installPath;
        _backupPath  = Path.Combine(dataPath, "update-backup", correlationId);
    }

    public bool HasBackup => Directory.Exists(_backupPath);

    /// <summary>Copies the install directory to the backup location.</summary>
    public void CreateBackup()
    {
        Directory.CreateDirectory(_backupPath);
        CopyDirectory(_installPath, _backupPath, overwrite: true);
    }

    /// <summary>Restores the backup over the install directory.</summary>
    public void Restore()
    {
        if (!HasBackup)
            throw new InvalidOperationException("No backup to restore from.");

        CopyDirectory(_backupPath, _installPath, overwrite: true);
    }

    /// <summary>Removes the backup once the update succeeded.</summary>
    public void DeleteBackup()
    {
        if (Directory.Exists(_backupPath))
        {
            try { Directory.Delete(_backupPath, recursive: true); }
            catch { /* non-fatal: stale backup gets cleaned up next run */ }
        }
    }

    private static void CopyDirectory(string source, string dest, bool overwrite)
    {
        Directory.CreateDirectory(dest);

        foreach (string filePath in Directory.GetFiles(source, "*", SearchOption.AllDirectories))
        {
            string relative = Path.GetRelativePath(source, filePath);
            string destFile = Path.Combine(dest, relative);

            Directory.CreateDirectory(Path.GetDirectoryName(destFile)!);
            File.Copy(filePath, destFile, overwrite);
        }
    }
}
