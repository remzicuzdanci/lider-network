using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;

namespace LiderCollector.Updater;

/// <summary>
/// Cryptographic verification of downloaded update packages.
///
/// Two-step verification:
///   1. SHA-256 hash of the archive must match the manifest's sha256_hash
///   2. RSA-PKCS#1v15 signature (over the hex SHA-256) must verify against
///      the trusted signing certificate
///
/// Signing certificate trust:
///   The updater looks for the signing certificate in:
///     a) ProgramData\LiderNetwork\LiderCollector\update-signing-cert.cer
///     b) LocalMachine\My store (by thumbprint from manifest)
///   Both sources are acceptable; the thumbprint must match the manifest.
/// </summary>
internal static class SignatureVerifier
{
    private const string CertFileName = "update-signing-cert.cer";

    /// <summary>
    /// Verify the archive's SHA-256 and RSA signature.
    /// Returns (true, null) on success; (false, reason) on failure.
    /// </summary>
    public static (bool Ok, string? Reason) Verify(
        byte[]         archiveBytes,
        string         expectedSha256Hex,
        string         signatureBase64,
        string?        expectedThumbprint,
        string         dataPath)
    {
        // Step 1: SHA-256 integrity
        byte[] actualHash = SHA256.HashData(archiveBytes);
        string actualHex  = Convert.ToHexString(actualHash).ToLowerInvariant();

        if (!string.Equals(actualHex, expectedSha256Hex.ToLowerInvariant(), StringComparison.Ordinal))
            return (false, $"SHA-256 mismatch: expected {expectedSha256Hex}, got {actualHex}");

        // Step 2: RSA signature (signs the hex-encoded SHA-256)
        byte[] signature   = Convert.FromBase64String(signatureBase64);
        byte[] signedBytes = System.Text.Encoding.UTF8.GetBytes(actualHex);

        X509Certificate2? cert = LoadSigningCert(dataPath, expectedThumbprint);
        if (cert == null)
            return (false, "Signing certificate not found or thumbprint mismatch");

        using var rsa = cert.GetRSAPublicKey();
        if (rsa == null)
            return (false, "Signing certificate has no RSA public key");

        bool valid = rsa.VerifyData(signedBytes, signature, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
        if (!valid)
            return (false, "RSA signature invalid");

        return (true, null);
    }

    private static X509Certificate2? LoadSigningCert(string dataPath, string? expectedThumbprint)
    {
        // Try local file first
        string certPath = Path.Combine(dataPath, CertFileName);
        if (File.Exists(certPath))
        {
            try
            {
                var cert = new X509Certificate2(certPath);
                if (expectedThumbprint != null &&
                    !string.Equals(cert.Thumbprint, expectedThumbprint, StringComparison.OrdinalIgnoreCase))
                    return null; // thumbprint mismatch — reject

                return cert;
            }
            catch { }
        }

        // Fall back to LocalMachine store by thumbprint
        if (expectedThumbprint != null)
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
}
