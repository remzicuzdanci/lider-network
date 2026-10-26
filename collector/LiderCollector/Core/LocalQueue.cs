using Microsoft.Data.Sqlite;
using System.Text.Json;

namespace LiderCollector.Core;

/// <summary>
/// SQLite-backed offline queue.  When the server is unreachable, payloads are persisted
/// here and replayed in FIFO order once connectivity is restored.
/// Thread-safe; all operations serialize through a single connection with WAL mode.
/// </summary>
public sealed class LocalQueue : IDisposable
{
    private readonly SqliteConnection _conn;
    private readonly object _lock = new();

    public LocalQueue(string dbPath)
    {
        _conn = new SqliteConnection($"Data Source={dbPath};Mode=ReadWriteCreate;");
        _conn.Open();
        Execute("PRAGMA journal_mode=WAL;");
        Execute("PRAGMA synchronous=NORMAL;");
        Execute("""
            CREATE TABLE IF NOT EXISTS queue (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                endpoint  TEXT    NOT NULL,
                payload   TEXT    NOT NULL,
                created   INTEGER NOT NULL DEFAULT (unixepoch()),
                attempts  INTEGER NOT NULL DEFAULT 0
            );
            """);
    }

    /// <summary>Enqueue a payload for later delivery to the given API endpoint path.</summary>
    public void Enqueue(string endpoint, object payload)
    {
        string json = JsonSerializer.Serialize(payload);
        lock (_lock)
        {
            var cmd = _conn.CreateCommand();
            cmd.CommandText = "INSERT INTO queue (endpoint, payload) VALUES ($ep, $pl);";
            cmd.Parameters.AddWithValue("$ep", endpoint);
            cmd.Parameters.AddWithValue("$pl", json);
            cmd.ExecuteNonQuery();
        }
    }

    /// <summary>
    /// Peek at the oldest pending items (up to <paramref name="count"/>).
    /// Returns id + endpoint + payload JSON; does NOT remove them.
    /// </summary>
    public IReadOnlyList<QueueItem> Peek(int count = 10)
    {
        lock (_lock)
        {
            var cmd = _conn.CreateCommand();
            cmd.CommandText = "SELECT id, endpoint, payload, attempts FROM queue ORDER BY id LIMIT $n;";
            cmd.Parameters.AddWithValue("$n", count);
            using var reader = cmd.ExecuteReader();
            var list = new List<QueueItem>();
            while (reader.Read())
                list.Add(new QueueItem(
                    reader.GetInt64(0),
                    reader.GetString(1),
                    reader.GetString(2),
                    reader.GetInt32(3)));
            return list;
        }
    }

    /// <summary>Remove a successfully delivered item by id.</summary>
    public void Acknowledge(long id)
    {
        lock (_lock)
        {
            var cmd = _conn.CreateCommand();
            cmd.CommandText = "DELETE FROM queue WHERE id = $id;";
            cmd.Parameters.AddWithValue("$id", id);
            cmd.ExecuteNonQuery();
        }
    }

    /// <summary>Increment the attempt counter so runaway retries can be detected.</summary>
    public void IncrementAttempts(long id)
    {
        lock (_lock)
        {
            var cmd = _conn.CreateCommand();
            cmd.CommandText = "UPDATE queue SET attempts = attempts + 1 WHERE id = $id;";
            cmd.Parameters.AddWithValue("$id", id);
            cmd.ExecuteNonQuery();
        }
    }

    /// <summary>Remove items that have failed too many times (poison messages).</summary>
    public void PurgeExceeded(int maxAttempts = 20)
    {
        lock (_lock)
        {
            var cmd = _conn.CreateCommand();
            cmd.CommandText = "DELETE FROM queue WHERE attempts >= $max;";
            cmd.Parameters.AddWithValue("$max", maxAttempts);
            cmd.ExecuteNonQuery();
        }
    }

    public long Count()
    {
        lock (_lock)
        {
            var cmd = _conn.CreateCommand();
            cmd.CommandText = "SELECT COUNT(*) FROM queue;";
            return (long)(cmd.ExecuteScalar() ?? 0L);
        }
    }

    private void Execute(string sql)
    {
        using var cmd = _conn.CreateCommand();
        cmd.CommandText = sql;
        cmd.ExecuteNonQuery();
    }

    public void Dispose() => _conn.Dispose();

    public record QueueItem(long Id, string Endpoint, string PayloadJson, int Attempts);
}
