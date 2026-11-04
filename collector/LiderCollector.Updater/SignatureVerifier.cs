using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;

namespace LiderCollector.Updater;

/// <summary>
/// Cryptographic verification of downloaded update packages.
///
/// Three-layer verification:
///   1. SHA-256 of the archive bytes is computed independently and compared
///      with the manifest's sha256_hash field.  We NEVER trust the hash from
///      the manifest JSON alone — we always recompute it ourselves.
///   2. RSA-PKCS#1v15 signature (over the combined context string
///      "{version}:{channel}:{sha256_hash}") must verify against the trusted
///      signing certificate.  Binding version and channel prevents downgrade
///      and cross-channel replay attacks.
///   3. The signing certificate file is validated against an optional build-time
///      SHA-256 pin.  If set, any cert that does not match the pin is rejected
///      regardless of thumbprint.
///
/// Certificate trust:
///   The updater looks for the signing certificate in:
///     a) ProgramData\LiderNetwork\LiderCollector\update-signing-cert.cer
///     b) LocalMachine\My store (by thumbprint from manifest)
///   Source (a) is preferred.  The thumbprint from the manifest must match.
///   An optional build-time pin (CertFileSha256Pin) adds a second layer of
///   protection so that replacing the cert file does not automatically gain trust.
///
/// Private key:
///   The private signing key MUST NEVER be distributed to any agent.
///   Only the public certificate is deployed to ProgramData.
///   Signing happens exclusively on the administrative server.
///
/// Signed payload format (server must use the same format when signing):
///   signedPayload = UTF-8("{version}:{channel}:{sha256_hash_lowercase_hex}")
///   e.g. "1.2.0:stable:abc123..."
/// </summary>
internal static class SignatureVerifier
{
    private const string CertFileName = "update-signing-cert.cer";

    /// <summary>
    /// Optional build-time SHA-256 (lowercase hex, 64 chars) of the signing
    /// certificate's DER-encoded bytes.  When non-empty, the cert file loaded
    /// from ProgramData must hash to this exact value.
    ///
    /// Set during MSI build to pin the specific cert the organisation uses.
    /// Leave empty string to skip cert-file pinning (thumbprint check still applies).
    ///
    /// Example (replace with real value):
    ///   internal const string CertFileSha256Pin = "e3b0c44298fc1c149afb...";
    /// </summary>
    internal const string CertFileSha256Pin = ""; // Set during MSI build

    /// <summary>
    /// Verify the archive's SHA-256 and RSA signature.
    /// Returns (true, null) on success; (false, reason) on failure.
    /// </summary>
    public static (bool Ok, string? Reason) Verify(
        byte[]  archiveBytes,
        string  expectedSha256Hex,
        string  signatureBase64,
        string? expectedThumbprint,
        string  dataPath,
        string  manifestVersion,
        string  manifestChannel)
    {
        // ── Step 1: SHA-256 integrity ─────────────────────────────────────────
        // We compute the hash INDEPENDENTLY of the manifest field.
        byte[] actualHash = SHA256.HashData(archiveBytes);
        string actualHex  = Convert.ToHexString(actualHash).ToLowerInvariant();

        if (!string.Equals(actualHex, expectedSha256Hex.ToLowerInvariant(), StringComparison.Ordinal))
            return (false, $"SHA-256 mismatch: expected {expectedSha256Hex}, got {actualHex}");

        // ── Step 2: RSA signature — binds version + channel + hash ────────────
        // The signed payload includes version and channel to prevent downgrade
        // and cross-channel replay attacks.  The server MUST sign the same string.
        byte[] signature   = Convert.FromBase64String(signatureBase64);
        string signedStr   = $"{manifestVersion}:{manifestChannel}:{actualHex}";
        byte[] signedBytes = System.Text.Encoding.UTF8.GetBytes(signedStr);

        X509Certificate2? cert = LoadSigningCert(dataPath, expectedThumbprint);
        if (cert == null)
            return (false, "Signing certificate not found or thumbprint/pin mismatch");

        using var rsa = cert.GetRSAPublicKey();
        if (rsa == null)
            return (false, "Signing certificate has no RSA public key");

        bool valid = rsa.VerifyData(signedBytes, signature, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
        if (!valid)
            return (false, $"RSA signature invalid for payload '{manifestVersion}:{manifestChannel}:{actualHex}'");

        // ── Step 3: Warn if cert file is world-writable ────────────────────────
        CheckCertFilePermissions(Path.Combine(dataPath, CertFileName));

        return (true, null);
    }

    private static X509Certificate2? LoadSigningCert(string dataPath, string? expectedThumbprint)
    {
        // ── Source (a): ProgramData cert file ─────────────────────────────────
        string certPath = Path.Combine(dataPath, CertFileName);
        if (File.Exists(certPath))
        {
            try
            {
                byte[] certBytes = File.ReadAllBytes(certPath);

                // Optional cert-file SHA-256 pin
                if (!string.IsNullOrEmpty(CertFileSha256Pin))
                {
                    string pinActual = Convert.ToHexString(SHA256.HashData(certBytes)).ToLowerInvariant();
                    if (!string.Equals(pinActual, CertFileSha256Pin, StringComparison.OrdinalIgnoreCase))
                        return null; // cert file has been replaced — reject
                }

                var cert = new X509Certificate2(certBytes);
                if (expectedThumbprint != null &&
                    !string.Equals(cert.Thumbprint, expectedThumbprint, StringComparison.OrdinalIgnoreCase))
                    return null; // thumbprint mismatch — cert file has wrong cert

                return cert;
            }
            catch { /* fall through to store lookup */ }
        }

        // ── Source (b): LocalMachine certificate store ─────────────────────────
        // CertFileSha256Pin cannot be enforced against the cert store,
        // so only use this path when no pin is configured.
        if (string.IsNullOrEmpty(CertFileSha256Pin) && expectedThumbprint != null)
        {
            using var store = new X509Store(StoreName.My, StoreLocation.LocalMachine);
            store.Open(OpenFlags.ReadOnly);
            var certs = store.Certificates.Find(
                X509FindType.FindByThumbprint, expectedThumbprint, validOnly: false);
            if (certs.Count > 0)
                return certs[0];
        }

        return null;
    }

    /// <summary>
    /// Logs a critical warning if the cert file is writable by non-administrative
    /// users.  Non-fatal — the update proceeds — but the warning must be investigated.
    /// Only runs on Windows; silently skipped otherwise.
    /// </summary>
    private static void CheckCertFilePermissions(string certPath)
    {
        if (!RuntimeInformation.IsOSPlatform(OSPlatform.Windows)) return;
        if (!File.Exists(certPath)) return;

        try
        {
            var acl = new System.Security.AccessControl.FileSecurity(
                certPath, System.Security.AccessControl.AccessControlSections.Access);
            var rules = acl.GetAccessRules(includeExplicit: true, includeInherited: true,
                targetType: typeof(System.Security.Principal.SecurityIdentifier));

            foreach (System.Security.AccessControl.FileSystemAccessRule rule in rules)
            {
                // SID S-1-1-0 = Everyone, S-1-5-11 = Authenticated Users
                var sid = rule.IdentityReference as System.Security.Principal.SecurityIdentifier;
                if (sid == null) continue;

                bool isEveryone = sid.IsWellKnown(System.Security.Principal.WellKnownSidType.WorldSid)
                               || sid.IsWellKnown(System.Security.Principal.WellKnownSidType.AuthenticatedUserSid);

                if (isEveryone &&
                    rule.AccessControlType == System.Security.AccessControl.AccessControlType.Allow &&
                    (rule.FileSystemRights & System.Security.AccessControl.FileSystemRights.Write) != 0)
                {
                    // This is a critical warning — log it via console; orchestrator writes to audit log
                    Console.Error.WriteLine(
                        $"[SECURITY WARNING] {certPath} is writable by non-administrative accounts. " +
                        "The MSI installer must set read-only ACL (Administrators+SYSTEM write, Everyone read).");
                }
            }
        }
        catch { /* ACL check is best-effort */ }
    }
}
