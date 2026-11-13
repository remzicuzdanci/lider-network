using System.Text.Json;
using LiderCollector.Modules;
using Xunit;

namespace LiderCollector.Tests;

/// <summary>The server (WindowsInventoryProcessor) reads system.baseboard{manufacturer,product,serial} and system.logged_on_user. The names are a contract.</summary>
public sealed class SystemPayloadBaseboardTests
{
    [Fact]
    public void Payload_carries_baseboard_and_logged_on_user_under_the_names_the_server_reads()
    {
        var p = new SystemInfoModule.SystemPayload
        {
            Hostname = "PC-01",
            LoggedOnUser = @"UCI\ayse.kaya",
            BaseBoard = new SystemInfoModule.BaseBoardInfo { Manufacturer = "Dell Inc.", Product = "0XYZ12", Serial = "/ABC123/" },
        };
        using var doc = JsonDocument.Parse(JsonSerializer.Serialize(p));
        var root = doc.RootElement;
        Assert.Equal(@"UCI\ayse.kaya", root.GetProperty("logged_on_user").GetString());
        var bb = root.GetProperty("baseboard");
        Assert.Equal("Dell Inc.", bb.GetProperty("manufacturer").GetString());
        Assert.Equal("0XYZ12", bb.GetProperty("product").GetString());
        Assert.Equal("/ABC123/", bb.GetProperty("serial").GetString());
    }

    [Fact]
    public void Missing_baseboard_serialises_as_null_so_the_server_keeps_what_it_has()
    {
        using var doc = JsonDocument.Parse(JsonSerializer.Serialize(new SystemInfoModule.SystemPayload { Hostname = "PC-01" }));
        Assert.Equal(JsonValueKind.Null, doc.RootElement.GetProperty("baseboard").ValueKind);
        Assert.Equal(JsonValueKind.Null, doc.RootElement.GetProperty("logged_on_user").ValueKind);
    }

    [Theory]
    [InlineData("To be filled by O.E.M.")]
    [InlineData("Default string")]
    [InlineData("None")]
    public void Oem_placeholder_serials_are_dropped(string junk) => Assert.Null(SystemInfoModule.NormalizeSerial(junk));
}
