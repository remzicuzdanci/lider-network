using System.Net.Security;
using System.Security.Cryptography.X509Certificates;
using LiderCollector.Core;
using Xunit;

namespace LiderCollector.Tests;

/// <summary>The TLS rule the Collector applies when collector.json names a private CA: trusted only through THAT root, revocation checked, and never for the wrong server name.</summary>
public sealed class CustomCaValidatorTests : IDisposable
{
    private readonly string _dir = Path.Combine(Path.GetTempPath(), "ca-val-" + Guid.NewGuid().ToString("N"));
    public CustomCaValidatorTests() => Directory.CreateDirectory(_dir);
    public void Dispose() { try { Directory.Delete(_dir, true); } catch { } }

    private static bool Run(Func<HttpRequestMessage, X509Certificate2?, X509Chain?, SslPolicyErrors, bool> v, X509Certificate2? cert, SslPolicyErrors e)
        => v(new HttpRequestMessage(), cert, new X509Chain(), e);

    [Fact] public void A_certificate_chaining_to_the_configured_root_with_a_valid_crl_is_accepted()
    {
        using var pki = new TestPki(Path.Combine(_dir, "a"), TestPki.Crl.Valid);
        var v = ApiClient.BuildCustomCaValidator(pki.Root);
        Assert.True(Run(v, pki.Leaf, SslPolicyErrors.RemoteCertificateChainErrors));          // what the platform reports for an unknown private root
    }

    [Fact] public void A_name_mismatch_is_refused_even_when_the_chain_is_good()
    {
        using var pki = new TestPki(Path.Combine(_dir, "b"), TestPki.Crl.Valid);
        var v = ApiClient.BuildCustomCaValidator(pki.Root);
        Assert.False(Run(v, pki.Leaf, SslPolicyErrors.RemoteCertificateChainErrors | SslPolicyErrors.RemoteCertificateNameMismatch));
        Assert.False(Run(v, pki.Leaf, SslPolicyErrors.RemoteCertificateNameMismatch));
        Assert.False(Run(v, pki.Leaf, SslPolicyErrors.RemoteCertificateNotAvailable));
    }

    [Fact] public void A_certificate_from_another_root_is_refused()
    {
        using var mine = new TestPki(Path.Combine(_dir, "c"), TestPki.Crl.Valid);
        using var other = new TestPki(Path.Combine(_dir, "d"), TestPki.Crl.Valid);
        Assert.False(Run(ApiClient.BuildCustomCaValidator(other.Root), mine.Leaf, SslPolicyErrors.RemoteCertificateChainErrors));
    }

    [Fact] public void A_revoked_server_certificate_is_refused()
    {
        using var pki = new TestPki(Path.Combine(_dir, "e"), TestPki.Crl.Revoked);
        Assert.False(Run(ApiClient.BuildCustomCaValidator(pki.Root), pki.Leaf, SslPolicyErrors.RemoteCertificateChainErrors));
    }

    [Fact] public void No_certificate_is_refused() => Assert.False(ApiClient.BuildCustomCaValidator(new TestPki(Path.Combine(_dir, "f"), TestPki.Crl.Valid).Root)(new HttpRequestMessage(), null, new X509Chain(), SslPolicyErrors.None));
}
