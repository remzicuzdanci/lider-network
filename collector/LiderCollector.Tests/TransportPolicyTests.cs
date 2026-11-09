using LiderCollector.Core;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace LiderCollector.Tests;

public sealed class TransportPolicyTests : IDisposable
{
    private readonly string _dir = Path.Combine(Path.GetTempPath(), "lider-tp-" + Guid.NewGuid().ToString("N"));
    private static readonly DateTime Now = new(2026, 11, 9, 18, 0, 0, DateTimeKind.Utc);
    private const string Bios = "1B0B4D56-FE84-2A32-03C9-B2220404CBA4";

    public TransportPolicyTests() => Directory.CreateDirectory(_dir);
    public void Dispose() { try { Directory.Delete(_dir, true); } catch { } }

    // ── URL rules ───────────────────────────────────────────────────────────
    [Theory]
    [InlineData("http://192.168.20.61", true)]
    [InlineData("http://10.1.2.3:8080", true)]
    [InlineData("http://172.16.0.1", true)]
    [InlineData("http://172.31.255.254", true)]
    [InlineData("http://127.0.0.1", true)]
    [InlineData("http://localhost", true)]
    [InlineData("http://lider-test", true)]
    [InlineData("http://panel.lan", true)]
    [InlineData("http://[::1]", true)]
    [InlineData("http://172.32.0.1", false)]
    [InlineData("http://8.8.8.8", false)]
    [InlineData("http://203.0.113.10", false)]
    [InlineData("http://panel.example.com", false)]
    [InlineData("http://evil.local.example.com", false)]
    [InlineData("not a url", false)]
    public void IsPrivateHost_only_accepts_private_or_internal_names(string url, bool expected) =>
        Assert.Equal(expected, TransportPolicy.IsPrivateHost(url));

    [Fact]
    public void Https_is_always_allowed_even_for_public_hosts()
    {
        Assert.True(TransportPolicy.IsAllowed("https://panel.example.com", false, out _));
        Assert.True(TransportPolicy.IsAllowed("https://8.8.8.8", false, out _));
    }

    [Fact]
    public void Http_without_allow_flag_is_refused_even_on_a_private_host()
    {
        Assert.False(TransportPolicy.IsAllowed("http://192.168.20.61", false, out var why));
        Assert.Contains("AllowHttp=false", why);
    }

    [Fact]
    public void Http_with_allow_flag_is_refused_for_a_public_host()
    {
        Assert.False(TransportPolicy.IsAllowed("http://panel.example.com", true, out var why));
        Assert.Contains("private", why);
        Assert.False(TransportPolicy.IsAllowed("http://203.0.113.10", true, out _));
    }

    [Fact]
    public void Http_with_allow_flag_is_allowed_for_a_private_test_server() =>
        Assert.True(TransportPolicy.IsAllowed("http://192.168.20.61", true, out _));

    [Fact]
    public void Empty_url_is_not_refused_yet_fresh_install() =>
        Assert.True(TransportPolicy.IsAllowed("", false, out _));

    // ── Upgrade policy ──────────────────────────────────────────────────────
    private CollectorConfig Cfg(string url = "http://192.168.20.61", int id = 4, bool allow = false, string? bios = Bios)
    {
        var path = Path.Combine(_dir, "collector.json");
        var c = CollectorConfig.Load(path);
        c.ServerUrl = url; c.CollectorId = id; c.AllowHttp = allow; c.EnrolledBiosUuid = bios;
        c.Save();
        return c;
    }

    private void Policy(string url = "http://192.168.20.61", int id = 4, string env = "test", DateTime? issued = null, bool allow = true) =>
        File.WriteAllText(Path.Combine(_dir, TransportPolicy.PolicyFileName),
            "{\"server_url\":\"" + url + "\",\"collector_id\":" + id + ",\"allow_http\":" + (allow ? "true" : "false") +
            ",\"environment\":\"" + env + "\",\"issued_at\":\"" + (issued ?? Now.AddMinutes(-1)).ToString("yyyy-MM-ddTHH:mm:ssZ") + "\"}");

    private TransportPolicy.UpgradeResult Apply(CollectorConfig c, bool hasKey = true, string? bios = Bios) =>
        TransportPolicy.TryApplyUpgradePolicy(_dir, c, hasKey, () => bios, NullLogger.Instance, Now);

    private bool PersistedAllow() => CollectorConfig.Load(Path.Combine(_dir, "collector.json")).AllowHttp;
    private bool PolicyFileExists() => File.Exists(Path.Combine(_dir, TransportPolicy.PolicyFileName));

    [Fact]
    public void Upgrade_1_1_0_to_1_1_1_inherits_http_for_the_same_enrolled_test_server()
    {
        var c = Cfg(); Policy();
        var r = Apply(c);
        Assert.True(r.Applied, r.Reason);
        Assert.True(c.AllowHttp);
        Assert.True(PersistedAllow());              // survives a reboot
        Assert.False(PolicyFileExists());            // one-shot
        Assert.Equal(4, c.CollectorId);              // identity untouched
        Assert.Equal(Bios, c.EnrolledBiosUuid);
        Assert.True(TransportPolicy.IsAllowed(c.ServerUrl, c.AllowHttp, out _));
    }

    [Fact]
    public void No_policy_file_changes_nothing()
    {
        var c = Cfg();
        var r = Apply(c);
        Assert.False(r.FilePresent); Assert.False(r.Applied); Assert.False(c.AllowHttp);
    }

    [Theory]
    [InlineData("other-server")]
    [InlineData("other-collector")]
    [InlineData("production-env")]
    [InlineData("expired")]
    [InlineData("future")]
    [InlineData("not-enrolled")]
    [InlineData("no-api-key")]
    [InlineData("other-hardware")]
    [InlineData("unknown-hardware")]
    [InlineData("no-recorded-hardware")]
    [InlineData("public-host")]
    [InlineData("config-is-https")]
    [InlineData("policy-says-false")]
    public void Policy_is_refused_and_still_consumed_when_any_condition_fails(string scenario)
    {
        CollectorConfig c; bool hasKey = true; string? bios = Bios;
        switch (scenario)
        {
            case "other-server": c = Cfg(); Policy(url: "http://10.9.9.9"); break;
            case "other-collector": c = Cfg(); Policy(id: 99); break;
            case "production-env": c = Cfg(); Policy(env: "production"); break;
            case "expired": c = Cfg(); Policy(issued: Now.AddHours(-7)); break;
            case "future": c = Cfg(); Policy(issued: Now.AddHours(2)); break;
            case "not-enrolled": c = Cfg(id: 0); Policy(id: 0); break;
            case "no-api-key": c = Cfg(); Policy(); hasKey = false; break;
            case "other-hardware": c = Cfg(); Policy(); bios = "FFFFFFFF-0000-0000-0000-000000000000"; break;
            case "unknown-hardware": c = Cfg(); Policy(); bios = null; break;
            case "no-recorded-hardware": c = Cfg(bios: null); Policy(); break;
            case "public-host": c = Cfg(url: "http://203.0.113.10"); Policy(url: "http://203.0.113.10"); break;
            case "config-is-https": c = Cfg(url: "https://panel.example.com"); Policy(url: "https://panel.example.com"); break;
            case "policy-says-false": c = Cfg(); Policy(allow: false); break;
            default: throw new ArgumentException(scenario);
        }
        var r = Apply(c, hasKey, bios);
        Assert.True(r.FilePresent);
        Assert.False(r.Applied, scenario);
        Assert.False(c.AllowHttp, scenario);
        Assert.False(PersistedAllow(), scenario);
        Assert.False(PolicyFileExists());            // never left lying around for a later, different context
    }

    [Fact]
    public void Garbage_policy_file_is_ignored_and_removed()
    {
        var c = Cfg();
        File.WriteAllText(Path.Combine(_dir, TransportPolicy.PolicyFileName), "{not json");
        var r = Apply(c);
        Assert.False(r.Applied); Assert.False(c.AllowHttp); Assert.False(PolicyFileExists());
    }

    [Fact]
    public void Url_comparison_ignores_case_and_trailing_slash_but_not_host_or_port()
    {
        var c = Cfg(url: "http://192.168.20.61/"); Policy(url: "HTTP://192.168.20.61");
        Assert.True(Apply(c).Applied);
        var d = Cfg(url: "http://192.168.20.61:8080"); Policy(url: "http://192.168.20.61");
        Assert.False(Apply(d).Applied);
    }
}
