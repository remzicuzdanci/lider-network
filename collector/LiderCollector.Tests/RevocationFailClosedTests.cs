using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using LiderCollector.Update;
using Xunit;

namespace LiderCollector.Tests;

/// <summary>
/// Revocation is part of the decision and cannot be switched off: a valid CRL lets the update through; a revoked signer, an unreachable CRL, an out-of-date CRL
/// and a signer without any CRL distribution point each STOP it. Real CryptoAPI chain building against a local CRL server (in-memory test PKI, unit tests only).
/// </summary>
public sealed class RevocationFailClosedTests : IDisposable
{
    private const string UC = "{B6A3F291-9D4E-4C7B-8F12-3A5E6D1C0847}";
    private readonly string _dir = Path.Combine(Path.GetTempPath(), "revoc-" + Guid.NewGuid().ToString("N"));
    private readonly List<IDisposable> _own = new();
    public RevocationFailClosedTests() => Directory.CreateDirectory(_dir);
    public void Dispose() { foreach (var o in _own) o.Dispose(); try { Directory.Delete(_dir, true); } catch { } }

    private sealed class Auth : IAuthenticode { public X509Certificate2 Signer = null!; public AuthenticodeInfo Inspect(string p) => new(0x800B010A, Signer); }
    private sealed class Msi : IMsiReader { public string? ReadProperty(string p, string n) => n == "ProductVersion" ? "1.4.0" : UC; }

    private (VerifyResult result, string? preflight) Run(TestPki.Crl mode, DateTimeOffset? notAfter = null)
    {
        var pki = new TestPki(Path.Combine(_dir, Guid.NewGuid().ToString("N")[..6]), mode, null, notAfter); _own.Add(pki);
        string certDir = Path.Combine(_dir, "c" + Guid.NewGuid().ToString("N")[..6]); Directory.CreateDirectory(certDir);
        File.WriteAllBytes(Path.Combine(certDir, "update-signing-cert.cer"), pki.Leaf.Export(X509ContentType.Cert));
        string pkg = Path.Combine(certDir, "p.msi"); File.WriteAllText(pkg, "1.4.0|" + UC + "|x");
        string sha = Convert.ToHexString(SHA256.HashData(File.ReadAllBytes(pkg))).ToLowerInvariant();
        string sig = Convert.ToBase64String(pki.LeafKey.SignData(Encoding.UTF8.GetBytes($"1.4.0:stable:{sha}"), HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1));
        var plan = new UpdatePlan { Version = "1.4.0", Channel = "stable", PackagePath = pkg, Sha256Hash = sha, Size = new FileInfo(pkg).Length, SignatureBase64 = sig, SigningCertThumbprint = pki.Leaf.Thumbprint };
        var policy = new PackagePolicy(pki.Leaf.Thumbprint, UC, pki.RootSha256, pki.RootPemPath, certDir);
        return (PackageVerifier.Verify(pkg, plan, policy, new Auth { Signer = pki.Leaf }, new Msi()), PackageVerifier.Preflight(policy));
    }

    [Fact]
    public void A_current_crl_that_does_not_list_the_signer_lets_the_update_through()
    {
        var (r, pre) = Run(TestPki.Crl.Valid);
        Assert.True(r.Ok, r.Reason); Assert.Null(pre); Assert.Contains(r.Notes, n => n.Contains("revocation status checked and clean"));
    }

    [Fact]
    public void A_revoked_signer_stops_the_update()
    {
        var (r, pre) = Run(TestPki.Crl.Revoked);
        Assert.False(r.Ok); Assert.Contains("REVOKED", r.Reason); Assert.Contains("REVOKED", pre);
    }

    [Fact]
    public void An_unreachable_crl_stops_the_update_instead_of_skipping_the_check()
    {
        var (r, pre) = Run(TestPki.Crl.Unreachable);
        Assert.False(r.Ok); Assert.Contains("CRL unreachable", r.Reason);
        Assert.NotNull(pre); Assert.Contains("CRL unreachable", pre);        // and the 70 MB download never starts
    }

    [Fact]
    public void An_out_of_date_crl_stops_the_update()
    {
        var (r, pre) = Run(TestPki.Crl.Expired);
        Assert.False(r.Ok); Assert.NotNull(pre);
    }

    [Fact]
    public void A_signer_without_a_crl_distribution_point_is_refused()
    {
        var (r, pre) = Run(TestPki.Crl.NoCdp);
        Assert.False(r.Ok); Assert.Contains("no CRL distribution point", r.Reason); Assert.NotNull(pre);
    }

    [Fact]
    public void There_is_no_policy_switch_that_relaxes_revocation_checking()
    {
        Assert.DoesNotContain(typeof(PackagePolicy).GetProperties(), p => p.Name.Contains("Revocation", StringComparison.OrdinalIgnoreCase));
        Assert.DoesNotContain(typeof(UpdatePolicy).GetMethods().SelectMany(m => m.GetParameters()), p => p.Name!.Contains("revocation", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void A_failed_version_is_not_retried_for_hours_but_a_new_version_is_tried_at_once()
    {
        string data = Path.Combine(_dir, "attempts"); Directory.CreateDirectory(data);
        Assert.False(UpdateAttempts.RecentlyFailed(data, "1.4.0"));
        UpdateAttempts.Record(data, "1.4.0", "failed", "x");
        Assert.True(UpdateAttempts.RecentlyFailed(data, "1.4.0"));
        Assert.False(UpdateAttempts.RecentlyFailed(data, "1.4.1"));
        Assert.False(UpdateAttempts.RecentlyFailed(data, "1.4.0", DateTime.UtcNow.AddHours(7)));
    }
}
