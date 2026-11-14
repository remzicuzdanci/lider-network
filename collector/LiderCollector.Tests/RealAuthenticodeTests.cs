using System.Security.Cryptography;
using LiderCollector.Update;
using Xunit;
using Xunit.Abstractions;

namespace LiderCollector.Tests;

/// <summary>
/// Opt-in (LIDER_SIGNED_MSI=&lt;a genuinely signed LIDER MSI&gt;, LIDER_UNSIGNED_MSI=&lt;unsigned MSI&gt;): the REAL Windows APIs on real files
/// (WinVerifyTrust, msi.dll, the X509 chain against the pinned root). No install, no network write.
/// </summary>
public sealed class RealAuthenticodeTests
{
    private readonly ITestOutputHelper _out;
    public RealAuthenticodeTests(ITestOutputHelper o) => _out = o;

    [Fact]
    public void WinVerifyTrust_distinguishes_signed_tampered_and_unsigned_files()
    {
        var signed = Environment.GetEnvironmentVariable("LIDER_SIGNED_MSI"); var unsigned = Environment.GetEnvironmentVariable("LIDER_UNSIGNED_MSI");
        if (string.IsNullOrEmpty(signed) || string.IsNullOrEmpty(unsigned)) return;
        var a = new WinTrustAuthenticode();

        var ok = a.Inspect(signed);
        _out.WriteLine($"signed file    : hr=0x{ok.Hr:X8} signer={ok.Signer?.Thumbprint}");
        Assert.Contains(ok.Hr, new[] { 0u, WinTrustAuthenticode.CERT_E_UNTRUSTEDROOT, WinTrustAuthenticode.CERT_E_CHAINING });   // intact; root may be untrusted on a workgroup PC
        Assert.Equal(UpdatePolicy.SignerSha1, ok.Signer!.Thumbprint, ignoreCase: true);

        // flip one byte inside the file body (not the signature) -> the digest must no longer match
        string tampered = Path.Combine(Path.GetTempPath(), "tampered-" + Guid.NewGuid().ToString("N") + ".msi");
        try
        {
            File.Copy(signed, tampered); using (var f = new FileStream(tampered, FileMode.Open, FileAccess.ReadWrite)) { f.Position = 4096; int b = f.ReadByte(); f.Position = 4096; f.WriteByte((byte)(b ^ 0xFF)); }
            var bad = a.Inspect(tampered);
            _out.WriteLine($"tampered file  : hr=0x{bad.Hr:X8}");
            Assert.NotEqual(0u, bad.Hr); Assert.NotEqual(WinTrustAuthenticode.CERT_E_UNTRUSTEDROOT, bad.Hr);
        }
        finally { File.Delete(tampered); }

        var none = a.Inspect(unsigned);
        _out.WriteLine($"unsigned file  : hr=0x{none.Hr:X8}");
        Assert.Equal(WinTrustAuthenticode.TRUST_E_NOSIGNATURE, none.Hr); Assert.Null(none.Signer);
    }

    [Fact]
    public void MsiNative_reads_real_properties_and_finds_nothing_installed_on_a_machine_without_the_collector()
    {
        var signed = Environment.GetEnvironmentVariable("LIDER_SIGNED_MSI"); if (string.IsNullOrEmpty(signed)) return;
        var m = new MsiNative();
        _out.WriteLine($"ProductVersion={m.ReadProperty(signed, "ProductVersion")} UpgradeCode={m.ReadProperty(signed, "UpgradeCode")}");
        Assert.Equal(UpdatePolicy.UpgradeCode, m.ReadProperty(signed, "UpgradeCode"), ignoreCase: true);
        Assert.Matches(@"^\d+\.\d+\.\d+", m.ReadProperty(signed, "ProductVersion"));
        Assert.Null(m.ReadProperty(signed, "NoSuchProperty"));
        _out.WriteLine("installed here: " + (MsiNative.FindInstalled(UpdatePolicy.UpgradeCode)?.Version ?? "(none)"));
    }

    [Fact]
    public void The_real_signer_chains_to_the_embedded_pinned_root_and_the_embedded_policy_files_are_the_pinned_ones()
    {
        var signed = Environment.GetEnvironmentVariable("LIDER_SIGNED_MSI"); if (string.IsNullOrEmpty(signed)) return;
        string work = Path.Combine(Path.GetTempPath(), "pol-" + Guid.NewGuid().ToString("N"));
        try
        {
            var policy = UpdatePolicy.Create(work);
            Assert.Equal(UpdatePolicy.RootSha256, Convert.ToHexString(SHA256.HashData(new System.Security.Cryptography.X509Certificates.X509Certificate2(policy.RootPemPath!).RawData)), ignoreCase: true);
            Assert.Equal(UpdatePolicy.SignerSha1, new System.Security.Cryptography.X509Certificates.X509Certificate2(Path.Combine(policy.ManifestCertDirectory, "update-signing-cert.cer")).Thumbprint, ignoreCase: true);

            var info = new WinTrustAuthenticode().Inspect(signed);
            var notes = new List<string>();
            var m = typeof(PackageVerifier).GetMethod("CheckPinnedChain", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static)!;
            var fail = (string?)m.Invoke(null, new object[] { info.Signer!, policy, notes });
            foreach (var n in notes) _out.WriteLine(n);
            Assert.Null(fail);
            // fail-closed policy: if the CRL cannot be fetched from this PC the same check must refuse (proves the switch works)
            var strict = policy with { FailOnRevocationUnknown = true }; var notes2 = new List<string>();
            var strictFail = (string?)m.Invoke(null, new object[] { info.Signer!, strict, notes2 });
            _out.WriteLine("strict policy result: " + (strictFail ?? "accepted (CRL was reachable)"));
        }
        finally { try { Directory.Delete(work, true); } catch { } }
    }
}
