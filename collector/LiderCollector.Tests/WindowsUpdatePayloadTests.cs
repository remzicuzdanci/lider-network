using LiderCollector.Modules;
using System.Text.Json;

namespace LiderCollector.Tests;

/// <summary>
/// Unit tests for WindowsUpdatePayload DTO semantics (TD-1).
/// No WMI/COM access — pure DTO and JSON serialization tests.
/// Windows Server 2025: test edilmedi — no test environment available (TD-5).
/// </summary>
public sealed class WindowsUpdatePayloadTests
{
    private static readonly JsonSerializerOptions _opts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
    };

    [Fact]
    public void PendingCount_IsNullByDefault()
    {
        var payload = new WindowsUpdateModule.WindowsUpdatePayload();
        Assert.Null(payload.PendingCount);
    }

    [Fact]
    public void PendingQueryStatus_IsNullByDefault()
    {
        var payload = new WindowsUpdateModule.WindowsUpdatePayload();
        Assert.Null(payload.PendingQueryStatus);
    }

    [Fact]
    public void Serialization_OmitsPendingCount_WhenNull()
    {
        var payload = new WindowsUpdateModule.WindowsUpdatePayload
        {
            PendingQueryStatus = "unavailable",
        };
        var json = JsonSerializer.Serialize(payload, _opts);
        Assert.DoesNotContain("pending_count", json);
    }

    [Fact]
    public void Serialization_IncludesPendingCount_WhenSet()
    {
        var payload = new WindowsUpdateModule.WindowsUpdatePayload
        {
            PendingQueryStatus = "ok",
            PendingCount       = 7,
        };
        var json = JsonSerializer.Serialize(payload, _opts);
        Assert.Contains("\"pending_count\":7", json);
    }

    [Fact]
    public void Serialization_OmitsPendingUpdates_WhenNull()
    {
        var payload = new WindowsUpdateModule.WindowsUpdatePayload
        {
            PendingQueryStatus = "error",
            // PendingUpdates left null
        };
        var json = JsonSerializer.Serialize(payload, _opts);
        Assert.DoesNotContain("pending_updates", json);
    }

    [Fact]
    public void Serialization_ZeroPendingCount_IsExplicit()
    {
        var payload = new WindowsUpdateModule.WindowsUpdatePayload
        {
            PendingQueryStatus = "ok",
            PendingCount       = 0,
        };
        var json = JsonSerializer.Serialize(payload, _opts);
        Assert.Contains("\"pending_count\":0", json);
    }

    [Fact]
    public void PendingQueryStatus_Unavailable_HasNullCount()
    {
        var payload = new WindowsUpdateModule.WindowsUpdatePayload
        {
            PendingQueryStatus = "unavailable",
        };
        // null means unknown — distinct from 0 (no updates)
        Assert.Null(payload.PendingCount);
    }

    [Fact]
    public void Serialization_RecordIdField_PresentInEventEntry()
    {
        // Verifies EventEntry DTO has record_id (TD-2) — shape test, no EventLog access
        var entry = new EventLogModule.EventEntry
        {
            LogName    = "System",
            Source     = "Service Control Manager",
            EventId    = 7036,
            RecordId   = 99999L,
            Level      = "error",
            Message    = "The service stopped.",
            OccurredAt = "2026-11-04T10:00:00.0000000Z",
        };
        var json = JsonSerializer.Serialize(entry, _opts);
        Assert.Contains("\"record_id\":99999", json);
        Assert.Contains("\"log_name\":\"System\"", json);
    }
}
