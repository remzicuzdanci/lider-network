using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text.Json.Serialization;

namespace LiderCollector.Update;

/// <summary>Written by the Collector service after it has downloaded a package; consumed by the Updater. No secret is stored in it.</summary>
internal sealed class UpdatePlan
{
    [JsonPropertyName("correlation_id")]          public string  CorrelationId { get; set; } = string.Empty;
    [JsonPropertyName("version")]                 public string  Version { get; set; } = string.Empty;
    [JsonPropertyName("channel")]                 public string  Channel { get; set; } = string.Empty;
    [JsonPropertyName("package_path")]            public string  PackagePath { get; set; } = string.Empty;
    [JsonPropertyName("sha256_hash")]             public string  Sha256Hash { get; set; } = string.Empty;
    [JsonPropertyName("size")]                    public long    Size { get; set; }
    [JsonPropertyName("signature_base64")]        public string  SignatureBase64 { get; set; } = string.Empty;
    [JsonPropertyName("signing_cert_thumbprint")] public string? SigningCertThumbprint { get; set; }
    [JsonPropertyName("min_from_version")]        public string? MinFromVersion { get; set; }
    [JsonPropertyName("created_at")]              public string  CreatedAt { get; set; } = string.Empty;
}

/// <summary>What the Updater leaves for the Collector service to report to the server after it restarts.</summary>
internal sealed class UpdateResult
{
    [JsonPropertyName("correlation_id")] public string  CorrelationId { get; set; } = string.Empty;
    /// <summary>success | failed (nothing changed or Windows Installer rolled itself back) | rolled_back (new version failed, old one restored) | rollback_failed (needs a person) | skipped</summary>
    [JsonPropertyName("status")]         public string  Status { get; set; } = string.Empty;
    [JsonPropertyName("from_version")]   public string? FromVersion { get; set; }
    [JsonPropertyName("to_version")]     public string? ToVersion { get; set; }
    [JsonPropertyName("error")]          public string? Error { get; set; }
    [JsonPropertyName("started_at")]     public string  StartedAt { get; set; } = string.Empty;
    [JsonPropertyName("finished_at")]    public string  FinishedAt { get; set; } = string.Empty;
}

/// <summary>Everything the verifier pins. These values come from the signed-in-the-MSI policy, NEVER from the server's manifest.</summary>
internal sealed record PackagePolicy(
    string PinnedSignerSha1,
    string UpgradeCode,
    string? PinnedRootSha256,
    string? RootPemPath,
    string ManifestCertDirectory,
    long MaxBytes = 400L * 1024 * 1024);      // there is deliberately NO switch that relaxes revocation checking

internal sealed record VerifyResult(bool Ok, string? Reason, IReadOnlyList<string> Notes)
{
    public static VerifyResult Fail(string reason, List<string> notes) => new(false, reason, notes);
}

/// <summary>
/// Decides whether a downloaded MSI may be installed. Every check must pass; nothing here changes the machine.
///  1 size/limit  2 SHA-256 equals the manifest  3 manifest signature (RSA over version:channel:sha256, pinned certificate)
///  4 Authenticode: intact (no BAD_DIGEST), signer thumbprint == the PINNED one, code-signing EKU, in validity; if Windows does not trust the root,
///    the signer must chain to the PINNED LIDER root  5 the MSI itself: ProductVersion == manifest version, UpgradeCode == this product.
/// </summary>
internal static class PackageVerifier
{
    public static VerifyResult Verify(string msiPath, UpdatePlan plan, PackagePolicy policy, IAuthenticode auth, IMsiReader msi, DateTime? nowUtc = null)
    {
        var notes = new List<string>();
        if (!File.Exists(msiPath)) return VerifyResult.Fail("package file is missing", notes);
        var len = new FileInfo(msiPath).Length;
        if (len <= 0 || len > policy.MaxBytes) return VerifyResult.Fail($"package size {len} is outside the allowed range", notes);
        if (plan.Size > 0 && plan.Size != len) return VerifyResult.Fail($"package size {len} differs from the manifest ({plan.Size})", notes);

        byte[] bytes = File.ReadAllBytes(msiPath);
        string actual = Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();
        if (!CryptographicOperations.FixedTimeEquals(System.Text.Encoding.ASCII.GetBytes(actual), System.Text.Encoding.ASCII.GetBytes((plan.Sha256Hash ?? "").ToLowerInvariant())))
            return VerifyResult.Fail("SHA-256 of the package does not match the manifest", notes);
        notes.Add("sha256 matches the manifest");

        // the manifest may only name the certificate we already pin
        if (!string.Equals(plan.SigningCertThumbprint, policy.PinnedSignerSha1, StringComparison.OrdinalIgnoreCase))
            return VerifyResult.Fail("the manifest names a signing certificate that is not the pinned one", notes);
        var (sigOk, sigReason) = SignatureVerifier.Verify(bytes, plan.Sha256Hash, plan.SignatureBase64, policy.PinnedSignerSha1, policy.ManifestCertDirectory, plan.Version, plan.Channel);
        if (!sigOk) return VerifyResult.Fail("manifest signature: " + sigReason, notes);
        notes.Add("manifest signature (version:channel:sha256) verified with the pinned certificate");

        AuthenticodeInfo info;
        try { info = auth.Inspect(msiPath); } catch (Exception ex) { return VerifyResult.Fail("Authenticode check could not run: " + ex.Message, notes); }
        if (info.Hr == WinTrustAuthenticode.TRUST_E_NOSIGNATURE || info.Signer is null) return VerifyResult.Fail("the MSI is not Authenticode-signed", notes);
        if (info.Hr == WinTrustAuthenticode.TRUST_E_BAD_DIGEST) return VerifyResult.Fail("the MSI was modified after it was signed (bad digest)", notes);
        bool trusted = info.Hr == 0, untrustedRoot = info.Hr == WinTrustAuthenticode.CERT_E_UNTRUSTEDROOT || info.Hr == WinTrustAuthenticode.CERT_E_CHAINING;
        if (!trusted && !untrustedRoot) return VerifyResult.Fail($"Authenticode verification failed (0x{info.Hr:X8})", notes);

        var s = info.Signer;
        if (!string.Equals(s.Thumbprint, policy.PinnedSignerSha1, StringComparison.OrdinalIgnoreCase)) return VerifyResult.Fail($"signed by {s.Thumbprint}, which is not the pinned certificate", notes);
        var now = nowUtc ?? DateTime.UtcNow;
        if (now < s.NotBefore.ToUniversalTime() || now > s.NotAfter.ToUniversalTime()) return VerifyResult.Fail("the signing certificate is outside its validity period", notes);
        bool codeSigning = s.Extensions.OfType<X509EnhancedKeyUsageExtension>().Any(e => e.EnhancedKeyUsages.Cast<System.Security.Cryptography.Oid>().Any(o => o.Value == "1.3.6.1.5.5.7.3.3"));
        if (!codeSigning) return VerifyResult.Fail("the signing certificate is not a code-signing certificate", notes);
        notes.Add("Authenticode intact, signer = pinned certificate");

        // ALWAYS, whether or not Windows trusts the root: WinVerifyTrust above ran without revocation checks, so the chain to the PINNED root and the
        // revocation status are decided here, fail-closed (an unreachable, stale or missing CRL stops the update).
        var chainFail = CheckPinnedChain(s, policy, notes);
        if (chainFail is not null) return VerifyResult.Fail(chainFail, notes);

        string? ver = msi.ReadProperty(msiPath, "ProductVersion"), uc = msi.ReadProperty(msiPath, "UpgradeCode");
        if (!string.Equals(ver, plan.Version, StringComparison.Ordinal)) return VerifyResult.Fail($"the MSI is version '{ver}', the manifest says '{plan.Version}'", notes);
        if (!string.Equals(uc, policy.UpgradeCode, StringComparison.OrdinalIgnoreCase)) return VerifyResult.Fail("the MSI belongs to a different product (UpgradeCode)", notes);
        notes.Add($"MSI ProductVersion {ver}, UpgradeCode matches");
        return new VerifyResult(true, null, notes);
    }

    /// <summary>Chain to the pinned root + revocation. Used by the package check AND by the pre-download preflight (<see cref="Preflight"/>).</summary>
    internal static string? CheckPinnedChain(X509Certificate2 signer, PackagePolicy p, List<string> notes)
    {
        if (string.IsNullOrEmpty(p.RootPemPath) || string.IsNullOrEmpty(p.PinnedRootSha256) || !File.Exists(p.RootPemPath))
            return "no pinned root is configured on this computer";
        // without a CRL distribution point there is no way to know whether the certificate was revoked
        if (!signer.Extensions.Cast<X509Extension>().Any(e => e.Oid?.Value == "2.5.29.31")) return "the signing certificate has no CRL distribution point; revocation cannot be checked";
        X509Certificate2 root;
        try { root = new X509Certificate2(p.RootPemPath); } catch { return "the pinned root file is unreadable"; }
        if (!string.Equals(Convert.ToHexString(SHA256.HashData(root.RawData)), p.PinnedRootSha256, StringComparison.OrdinalIgnoreCase))
            return "the root file on this computer is not the pinned root (SHA-256 differs)";
        using var chain = new X509Chain();
        chain.ChainPolicy.TrustMode = X509ChainTrustMode.CustomRootTrust;
        chain.ChainPolicy.CustomTrustStore.Add(root);
        chain.ChainPolicy.RevocationMode = X509RevocationMode.Online;
        chain.ChainPolicy.RevocationFlag = X509RevocationFlag.ExcludeRoot;
        chain.ChainPolicy.UrlRetrievalTimeout = TimeSpan.FromSeconds(10);
        bool built = chain.Build(signer);
        var statuses = chain.ChainStatus.Select(c => c.Status).ToList();
        if (statuses.Contains(X509ChainStatusFlags.Revoked)) return "the signing certificate has been REVOKED";
        // revocation status unknown / CRL unreachable or out of date: the update STOPS (nothing is installed, nothing is skipped)
        if (statuses.Any(x => x is X509ChainStatusFlags.RevocationStatusUnknown or X509ChainStatusFlags.OfflineRevocation))
            return "update stopped: the revocation list could not be fetched or is not current (CRL unreachable); it is retried later";
        if (statuses.Count > 0) return "the signer does not chain to the pinned LIDER root: " + string.Join(",", statuses);
        if (!built) return "the certificate chain could not be built";
        notes.Add("signer chains to the pinned LIDER root; revocation status checked and clean");
        return null;
    }

    /// <summary>Run BEFORE the 70 MB download: if the pinned signer's revocation status cannot be established now, the update is postponed instead of downloaded.</summary>
    internal static string? Preflight(PackagePolicy p)
    {
        try
        {
            string cert = Path.Combine(p.ManifestCertDirectory, "update-signing-cert.cer");
            if (!File.Exists(cert)) return "the pinned signing certificate is missing";
            return CheckPinnedChain(new X509Certificate2(cert), p, new List<string>());
        }
        catch (Exception ex) { return "preflight failed: " + ex.Message; }
    }
}
