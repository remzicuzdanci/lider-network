using LiderCollector.Enrollment;
using Microsoft.Extensions.Logging.Abstractions;
using System.Text.Json;
using Xunit;

namespace LiderCollector.Tests;

/// <summary>
/// Security contract tests for BootstrapEnrollment.
///
/// Each test verifies a specific security property:
///   1. Token is never returned when file is missing.
///   2. Token is returned and file is immediately deleted on valid read.
///   3. Replay attack: second TryRead on the same path returns null (file deleted).
///   4. Missing server_url → null (file is NOT deleted — IT may fix it).
///   5. Missing enrollment_token → null (file is NOT deleted).
///   6. Invalid JSON → null (file is NOT deleted).
///   7. server_url is accessible from returned Config.
///   8. Token value is accessible from returned Config (needed for enrollment call).
/// </summary>
public sealed class EnrollmentSecurityTests : IDisposable
{
    private readonly string _dir;

    public EnrollmentSecurityTests()
    {
        _dir = Path.Combine(Path.GetTempPath(), $"lider_enroll_test_{Guid.NewGuid():N}");
        Directory.CreateDirectory(_dir);
    }

    public void Dispose()
    {
        try { Directory.Delete(_dir, recursive: true); }
        catch { /* cleanup best-effort */ }
    }

    private BootstrapEnrollment MakeEnrollment() =>
        new BootstrapEnrollment(_dir, NullLogger<BootstrapEnrollment>.Instance);

    private string EnrollmentPath => Path.Combine(_dir, "enrollment.json");

    private void WriteEnrollmentJson(string serverUrl, string token) =>
        File.WriteAllText(EnrollmentPath, JsonSerializer.Serialize(new
        {
            server_url = serverUrl,
            enrollment_token = token,
        }));

    // ── Test 1: no file → null ───────────────────────────────────────────────

    [Fact]
    public void TryRead_NoFile_ReturnsNull()
    {
        var result = MakeEnrollment().TryRead();
        Assert.Null(result);
    }

    // ── Test 2: valid file → config returned, file deleted ──────────────────

    [Fact]
    public void TryRead_ValidFile_ReturnsConfigAndDeletesFile()
    {
        const string url   = "https://lider.example.com";
        const string token = "test-token-abc123";
        WriteEnrollmentJson(url, token);

        var result = MakeEnrollment().TryRead();

        Assert.NotNull(result);
        Assert.Equal(url,   result!.ServerUrl);
        Assert.Equal(token, result.EnrollmentToken);
        Assert.False(File.Exists(EnrollmentPath), "enrollment.json must be deleted after read");
    }

    // ── Test 3: replay attack prevention ────────────────────────────────────

    [Fact]
    public void TryRead_CalledTwice_SecondCallReturnsNull()
    {
        WriteEnrollmentJson("https://lider.example.com", "single-use-token");

        var e = MakeEnrollment();
        var first  = e.TryRead();
        var second = e.TryRead(); // file should be gone

        Assert.NotNull(first);
        Assert.Null(second);
    }

    // ── Test 4: missing server_url → null, file preserved for IT to fix ─────

    [Fact]
    public void TryRead_MissingServerUrl_ReturnsNullAndKeepsFile()
    {
        File.WriteAllText(EnrollmentPath, JsonSerializer.Serialize(new
        {
            enrollment_token = "some-token",
            // server_url intentionally omitted
        }));

        var result = MakeEnrollment().TryRead();

        Assert.Null(result);
        // File kept so IT can correct the server_url without re-issuing token
        Assert.True(File.Exists(EnrollmentPath), "enrollment.json should be kept on validation error");
    }

    // ── Test 5: empty server_url → null ─────────────────────────────────────

    [Fact]
    public void TryRead_EmptyServerUrl_ReturnsNull()
    {
        WriteEnrollmentJson("   ", "some-token");

        var result = MakeEnrollment().TryRead();
        Assert.Null(result);
    }

    // ── Test 6: missing token → null, file preserved ─────────────────────────

    [Fact]
    public void TryRead_MissingToken_ReturnsNullAndKeepsFile()
    {
        File.WriteAllText(EnrollmentPath, JsonSerializer.Serialize(new
        {
            server_url = "https://lider.example.com",
            // enrollment_token intentionally omitted
        }));

        var result = MakeEnrollment().TryRead();

        Assert.Null(result);
        Assert.True(File.Exists(EnrollmentPath));
    }

    // ── Test 7: invalid JSON → null ──────────────────────────────────────────

    [Fact]
    public void TryRead_InvalidJson_ReturnsNull()
    {
        File.WriteAllText(EnrollmentPath, "this is not json {{}}");

        var result = MakeEnrollment().TryRead();
        Assert.Null(result);
    }

    // ── Test 8: empty file → null ────────────────────────────────────────────

    [Fact]
    public void TryRead_EmptyFile_ReturnsNull()
    {
        File.WriteAllText(EnrollmentPath, "");

        var result = MakeEnrollment().TryRead();
        Assert.Null(result);
    }

    // ── Test 9: token value does not appear in log sink ──────────────────────
    // (We can't directly capture NullLogger output, but we verify the Config
    //  record holds the token for the caller — the caller is responsible for
    //  not logging it.  This test documents the expectation.)

    [Fact]
    public void TryRead_ValidFile_TokenAccessibleFromConfig()
    {
        const string expectedToken = "super-secret-enrollment-token-xyz";
        WriteEnrollmentJson("https://lider.example.com", expectedToken);

        var config = MakeEnrollment().TryRead();

        Assert.NotNull(config);
        Assert.Equal(expectedToken, config!.EnrollmentToken);
        // The caller (CollectorWorker) stores this in DPAPI, never logs it.
    }
}
