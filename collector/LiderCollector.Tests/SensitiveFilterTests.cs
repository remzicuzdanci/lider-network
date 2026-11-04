using LiderCollector;

namespace LiderCollector.Tests;

/// <summary>
/// Unit tests for SensitiveFilter — no OS dependencies.
/// Windows Server 2025 compat note: these tests run on any .NET 8 host (TD-5).
/// </summary>
public sealed class SensitiveFilterTests
{
    [Theory]
    [InlineData("User password=abc123", "[REDACTED]")]
    [InlineData("token refresh value", "[REDACTED]")]
    [InlineData("secret key found", "[REDACTED]")]
    [InlineData("credential store failed", "[REDACTED]")]
    [InlineData("failed to open connection", "failed to open connection")]
    [InlineData("Service stopped unexpectedly", "Service stopped unexpectedly")]
    [InlineData("", "")]
    [InlineData("disk key=xyz", "[REDACTED]")]
    [InlineData("apikey=12345", "[REDACTED]")]
    [InlineData("pwd=hunter2", "[REDACTED]")]
    [InlineData("passwd file missing", "[REDACTED]")]
    public void Mask_ReturnsExpected(string input, string expected)
        => Assert.Equal(expected, SensitiveFilter.Mask(input));

    [Fact]
    public void Mask_NullInput_ReturnsNull()
        => Assert.Null(SensitiveFilter.Mask(null));

    [Fact]
    public void Mask_CaseInsensitive_Password()
        => Assert.Equal("[REDACTED]", SensitiveFilter.Mask("PASSWORD=abc"));

    [Fact]
    public void Mask_CaseInsensitive_Token()
        => Assert.Equal("[REDACTED]", SensitiveFilter.Mask("TOKEN: Bearer xyz"));

    [Fact]
    public void IsSensitive_DetectsPassword()
        => Assert.True(SensitiveFilter.IsSensitive("reset password link"));

    [Fact]
    public void IsSensitive_CleaMessage_ReturnsFalse()
        => Assert.False(SensitiveFilter.IsSensitive("disk space low on C:"));

    [Fact]
    public void IsSensitive_Null_ReturnsFalse()
        => Assert.False(SensitiveFilter.IsSensitive(null));

    [Fact]
    public void Patterns_NotEmpty()
        => Assert.NotEmpty(SensitiveFilter.Patterns);
}
