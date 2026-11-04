using LiderCollector.Updater;
using System.IO.Compression;
using System.Security.Cryptography;
using System.Text.Json;

namespace LiderCollector.Tests;

/// <summary>
/// Unit tests for LiderCollector.Updater components.
/// All tests run without network or Windows service access.
/// </summary>
public class UpdaterTests
{
    // ── UpdateTrigger deserialization ─────────────────────────────────────────

    [Fact]
    public void UpdateTrigger_Deserializes_From_Json()
    {
        string json = """{"requested_at":"2026-11-04T10:00:00Z","target_version":"1.2.0"}""";
        var trigger = JsonSerializer.Deserialize<UpdateTrigger>(json, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        });
        Assert.NotNull(trigger);
        Assert.Equal("1.2.0", trigger.TargetVersion);
        Assert.Equal("2026-11-04T10:00:00Z", trigger.RequestedAt);
    }

    [Fact]
    public void UpdateTrigger_Empty_TargetVersion_Is_Empty_String()
    {
        string json = """{"requested_at":"2026-11-04T10:00:00Z"}""";
        var trigger = JsonSerializer.Deserialize<UpdateTrigger>(json, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        });
        Assert.NotNull(trigger);
        Assert.Equal(string.Empty, trigger.TargetVersion);
    }

    // ── ManifestResponse deserialization ──────────────────────────────────────

    [Fact]
    public void ManifestResponse_Deserializes_Full_Fields()
    {
        string json = """
        {
            "update_available": true,
            "version": "2.0.0",
            "channel": "stable",
            "download_url": "https://cdn.example.com/pkg.zip",
            "sha256_hash": "abc123",
            "signature_base64": "c2lnbmF0dXJl",
            "signing_cert_thumbprint": "AA11BB22",
            "min_from_version": "1.0.0",
            "release_notes": "Bug fixes"
        }
        """;
        var resp = JsonSerializer.Deserialize<ManifestResponse>(json, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        });
        Assert.NotNull(resp);
        Assert.True(resp.UpdateAvailable);
        Assert.Equal("2.0.0", resp.Version);
        Assert.Equal("stable", resp.Channel);
        Assert.Equal("abc123", resp.Sha256Hash);
        Assert.Equal("c2lnbmF0dXJl", resp.SignatureBase64);
        Assert.Equal("AA11BB22", resp.SigningCertThumbprint);
        Assert.Equal("1.0.0", resp.MinFromVersion);
    }

    // ── SignatureVerifier ─────────────────────────────────────────────────────

    [Fact]
    public void SignatureVerifier_RejectsWhenSha256Mismatches()
    {
        byte[] data           = "hello world"u8.ToArray();
        string wrongHash      = new string('0', 64); // wrong hash
        string dummySig       = Convert.ToBase64String(new byte[256]);
        string tempDataPath   = Path.GetTempPath();

        var (ok, reason) = SignatureVerifier.Verify(data, wrongHash, dummySig, null, tempDataPath);

        Assert.False(ok);
        Assert.NotNull(reason);
        Assert.Contains("SHA-256 mismatch", reason);
    }

    [Fact]
    public void SignatureVerifier_RejectsWhenCertNotFoundButHashMatches()
    {
        byte[] data         = "test payload"u8.ToArray();
        string correctHash  = Convert.ToHexString(SHA256.HashData(data)).ToLowerInvariant();
        string dummySig     = Convert.ToBase64String(new byte[256]);
        string emptyDir     = Path.Combine(Path.GetTempPath(), "updater-test-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(emptyDir);
        try
        {
            var (ok, reason) = SignatureVerifier.Verify(data, correctHash, dummySig, "DEADBEEF", emptyDir);
            Assert.False(ok);
            Assert.Contains("certificate", reason, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            Directory.Delete(emptyDir, recursive: true);
        }
    }

    [Fact]
    public void SignatureVerifier_WithRsaKeyPair_Verifies_Correctly()
    {
        // Generate a test RSA key pair in-memory and sign a payload
        byte[]  data        = "real payload content"u8.ToArray();
        byte[]  hash        = SHA256.HashData(data);
        string  hashHex     = Convert.ToHexString(hash).ToLowerInvariant();
        byte[]  hashBytes   = System.Text.Encoding.UTF8.GetBytes(hashHex);

        using var rsa = RSA.Create(2048);

        // Build a self-signed certificate from the RSA key
        var req  = new System.Security.Cryptography.X509Certificates.CertificateRequest(
            "CN=TestSigning", rsa, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
        var cert = req.CreateSelfSigned(DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddYears(1));

        byte[] signature   = rsa.SignData(hashBytes, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
        string sigBase64   = Convert.ToBase64String(signature);

        string tempDir = Path.Combine(Path.GetTempPath(), "updater-test-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(tempDir);
        try
        {
            // Write the cert to the data dir
            File.WriteAllBytes(Path.Combine(tempDir, "update-signing-cert.cer"), cert.Export(
                System.Security.Cryptography.X509Certificates.X509ContentType.Cert));

            var (ok, reason) = SignatureVerifier.Verify(data, hashHex, sigBase64, cert.Thumbprint, tempDir);
            Assert.True(ok, $"Expected OK but got: {reason}");
        }
        finally
        {
            Directory.Delete(tempDir, recursive: true);
        }
    }

    [Fact]
    public void SignatureVerifier_RejectsInvalidSignature()
    {
        byte[] data     = "real payload"u8.ToArray();
        string hashHex  = Convert.ToHexString(SHA256.HashData(data)).ToLowerInvariant();

        using var rsa  = RSA.Create(2048);
        var req        = new System.Security.Cryptography.X509Certificates.CertificateRequest(
            "CN=TestSigning2", rsa, HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);
        var cert       = req.CreateSelfSigned(DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddYears(1));

        // Sign the WRONG data to produce an invalid signature
        byte[] sig = rsa.SignData("wrong"u8.ToArray(), HashAlgorithmName.SHA256, RSASignaturePadding.Pkcs1);

        string tempDir = Path.Combine(Path.GetTempPath(), "updater-test-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(tempDir);
        try
        {
            File.WriteAllBytes(Path.Combine(tempDir, "update-signing-cert.cer"), cert.Export(
                System.Security.Cryptography.X509Certificates.X509ContentType.Cert));

            var (ok, reason) = SignatureVerifier.Verify(data, hashHex, Convert.ToBase64String(sig),
                cert.Thumbprint, tempDir);
            Assert.False(ok);
            Assert.Contains("invalid", reason, StringComparison.OrdinalIgnoreCase);
        }
        finally
        {
            Directory.Delete(tempDir, recursive: true);
        }
    }

    // ── RollbackManager ───────────────────────────────────────────────────────

    [Fact]
    public void RollbackManager_CreateBackup_CopiesFiles()
    {
        string install = Path.Combine(Path.GetTempPath(), "rb-install-" + Guid.NewGuid().ToString("N"));
        string data    = Path.Combine(Path.GetTempPath(), "rb-data-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(install);
        Directory.CreateDirectory(data);
        File.WriteAllText(Path.Combine(install, "LiderCollector.exe"), "binary-v1.0");

        try
        {
            var rb = new RollbackManager(install, data, "test-corr");
            rb.CreateBackup();
            Assert.True(rb.HasBackup);

            // Backup must have the same file
            string backupDir = Path.Combine(data, "update-backup", "test-corr");
            Assert.True(File.Exists(Path.Combine(backupDir, "LiderCollector.exe")));
        }
        finally
        {
            Directory.Delete(install, recursive: true);
            Directory.Delete(data,    recursive: true);
        }
    }

    [Fact]
    public void RollbackManager_Restore_OverwritesInstall()
    {
        string install = Path.Combine(Path.GetTempPath(), "rb2-install-" + Guid.NewGuid().ToString("N"));
        string data    = Path.Combine(Path.GetTempPath(), "rb2-data-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(install);
        Directory.CreateDirectory(data);
        File.WriteAllText(Path.Combine(install, "LiderCollector.exe"), "binary-v1.0");

        try
        {
            var rb = new RollbackManager(install, data, "corr2");
            rb.CreateBackup();

            // Simulate a failed update that overwrote the binary
            File.WriteAllText(Path.Combine(install, "LiderCollector.exe"), "binary-v2.0-broken");

            rb.Restore();

            string restored = File.ReadAllText(Path.Combine(install, "LiderCollector.exe"));
            Assert.Equal("binary-v1.0", restored);
        }
        finally
        {
            Directory.Delete(install, recursive: true);
            Directory.Delete(data,    recursive: true);
        }
    }

    [Fact]
    public void RollbackManager_DeleteBackup_RemovesDirectory()
    {
        string install = Path.Combine(Path.GetTempPath(), "rb3-install-" + Guid.NewGuid().ToString("N"));
        string data    = Path.Combine(Path.GetTempPath(), "rb3-data-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(install);
        Directory.CreateDirectory(data);
        File.WriteAllText(Path.Combine(install, "file.dll"), "content");

        try
        {
            var rb = new RollbackManager(install, data, "corr3");
            rb.CreateBackup();
            Assert.True(rb.HasBackup);
            rb.DeleteBackup();
            Assert.False(rb.HasBackup);
        }
        finally
        {
            Directory.Delete(install, recursive: true);
            Directory.Delete(data,    recursive: true);
        }
    }

    // ── UpdateAuditLogger ─────────────────────────────────────────────────────

    [Fact]
    public void UpdateAuditLogger_WritesJsonLines()
    {
        string tempDir = Path.Combine(Path.GetTempPath(), "audit-test-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(tempDir);
        try
        {
            var logger = new UpdateAuditLogger(tempDir, "corr-audit");
            logger.Log("download", "started", "url=https://example.com/pkg.zip");
            logger.Log("verify", "passed");
            logger.Log("complete", "success", "updated_to=2.0.0");

            string[] lines = File.ReadAllLines(Path.Combine(tempDir, "update-audit.log"));
            Assert.Equal(3, lines.Length);

            // Each line must be valid JSON
            foreach (string line in lines)
            {
                using var doc = JsonDocument.Parse(line);
                Assert.Equal("corr-audit", doc.RootElement.GetProperty("correlation_id").GetString());
            }
        }
        finally
        {
            Directory.Delete(tempDir, recursive: true);
        }
    }

    [Fact]
    public void UpdateAuditLogger_NeverThrows_On_Write_Failure()
    {
        // Pass a path that is not writable (root on Windows)
        var logger = new UpdateAuditLogger("Z:\\nonexistent\\path", "corr-nothrow");
        // Should not throw
        logger.Log("test", "ok", "this will silently fail");
    }
}
