using LiderCollector.Update;
using Xunit;

namespace LiderCollector.Tests;

public class TestBuildPolicyTests
{
    private const string Allowed = "192.168.20.61;vmtest.uci.local";

    [Theory]
    [InlineData("http://192.168.20.61:18080", true)]
    [InlineData("https://192.168.20.61:18443/", true)]
    [InlineData("https://VMTEST.uci.local:18443", true)]
    [InlineData("https://liderone.uci.local", false)]            // the production name
    [InlineData("http://192.168.20.62:18080", false)]
    [InlineData("https://192.168.20.61.evil.example", false)]    // look-alike
    [InlineData("https://evil.example/192.168.20.61", false)]
    [InlineData("ftp://192.168.20.61", false)]
    [InlineData("", false)]
    [InlineData(null, false)]
    [InlineData("not a url", false)]
    public void Only_the_test_hosts_are_allowed(string? url, bool expected) => Assert.Equal(expected, TestBuildPolicy.IsServerAllowed(url, Allowed));

    [Fact] public void An_empty_allow_list_refuses_everything() => Assert.False(TestBuildPolicy.IsServerAllowed("http://192.168.20.61", ""));

    [Fact] public void The_production_build_is_not_a_test_build_and_allows_every_server_check() { Assert.False(TestBuild.Is); Assert.True(TestBuild.ServerAllowed("https://liderone.uci.local")); }
}
