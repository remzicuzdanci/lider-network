using System.Text.Json.Serialization;

namespace LiderCollector.Updater;

/// <summary>
/// Deserialized from update-trigger.json written by the main CollectorWorker.
/// </summary>
internal sealed class UpdateTrigger
{
    [JsonPropertyName("requested_at")]    public string RequestedAt    { get; set; } = string.Empty;
    [JsonPropertyName("target_version")]  public string TargetVersion  { get; set; } = string.Empty;
}
