using System.Text.Json;
using LiderCollector.Modules;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace LiderCollector.Tests;

/// <summary>Opt-in: runs the real WMI collection on THIS machine (read-only) and writes a masked summary. Set LIDER_LIVE_WMI=&lt;output file&gt; to run it.</summary>
public sealed class LiveSystemCollectionTests
{
    [Fact]
    public async Task Collects_this_machine_and_reports_which_requested_fields_are_present()
    {
        var outFile = Environment.GetEnvironmentVariable("LIDER_LIVE_WMI");
        if (string.IsNullOrEmpty(outFile)) return;               // opt-in only

        var module = new SystemInfoModule(NullLogger<SystemInfoModule>.Instance);
        var obj = await module.RunAsync(CancellationToken.None);
        using var doc = JsonDocument.Parse(JsonSerializer.Serialize(obj));
        var r = doc.RootElement;
        string Get(string k) => r.TryGetProperty(k, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString()! : "";
        int Count(string k) => r.TryGetProperty(k, out var v) && v.ValueKind == JsonValueKind.Array ? v.GetArrayLength() : 0;
        string Mask(string s) => s.Length == 0 ? "(missing)" : s.Length <= 4 ? "****" : s[..2] + new string('*', Math.Min(8, s.Length - 4)) + s[^2..];
        var bb = r.TryGetProperty("baseboard", out var b) && b.ValueKind == JsonValueKind.Object ? b : (JsonElement?)null;
        string BB(string k) => bb is { } e && e.TryGetProperty(k, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString()! : "";
        var lines = new[]
        {
            $"hostname           : {Get("hostname")}",
            $"domain             : {Get("domain")}",
            $"logged_on_user     : {(Get("logged_on_user").Length > 0 ? Get("logged_on_user") : "(none logged on)")}",
            $"manufacturer/model : {Get("manufacturer")} / {Get("model")}",
            $"baseboard          : {BB("manufacturer")} / {BB("product")} / serial {Mask(BB("serial"))}",
            $"bios               : {Get("bios_manufacturer")} {Get("bios_version")} / serial {Mask(Get("bios_serial"))}",
            $"os                 : {Get("os_name")} {Get("os_version")} build {Get("os_build")} {Get("os_arch")}",
            $"processors         : {Count("processors")} -> {(r.GetProperty("processors").GetArrayLength() > 0 ? r.GetProperty("processors")[0].GetProperty("name").GetString() : "")}",
            $"ram                : {(r.TryGetProperty("ram_gb", out var ram) ? ram.ToString() : "?")} GB, slots {Count("ram_slots")}",
            $"disks/partitions/volumes : {Count("disks")}/{Count("partitions")}/{Count("volumes")}",
            $"module status      : {module.LastReport?.Status}  sources: {string.Join(", ", (module.LastReport?.Sources ?? new()).Select(kv => kv.Key + "=" + (kv.Value.Length > 24 ? kv.Value[..24] : kv.Value)))}",
        };
        File.WriteAllLines(outFile, lines);
        Assert.False(string.IsNullOrEmpty(Get("hostname")));
    }

    /// <summary>Opt-in: LIDER_LIVE_PAYLOAD=&lt;file&gt; writes the real system+network+software modules of THIS machine as the inventory "modules" object
    /// (exactly what the service would POST), so the server side can be tested with genuine Collector output in an isolated environment.</summary>
    [Fact]
    public async Task Dumps_the_real_inventory_modules_of_this_machine()
    {
        var outFile = Environment.GetEnvironmentVariable("LIDER_LIVE_PAYLOAD");
        if (string.IsNullOrEmpty(outFile)) return;
        var sys = await new SystemInfoModule(NullLogger<SystemInfoModule>.Instance).RunAsync(CancellationToken.None);
        var net = await new NetworkModule(NullLogger<NetworkModule>.Instance).RunAsync(CancellationToken.None);
        var sw  = await new SoftwareModule(NullLogger<SoftwareModule>.Instance).RunAsync(CancellationToken.None);
        File.WriteAllText(outFile, JsonSerializer.Serialize(new { agent_version = "1.3.0", modules = new { system = sys, network = net, software = sw } }));
        Assert.NotNull(sys);
    }
}
