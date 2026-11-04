#Requires -Version 5.1
<#
.SYNOPSIS
    Builds the Lider IT ONE Collector MSI.

.DESCRIPTION
    1. Publishes the .NET 8 self-contained executable for win-x64.
    2. Runs the .NET unit tests.
    3. Builds the WiX v4 MSI (requires 'wix' CLI on PATH).

.PARAMETER Configuration
    Build configuration: Release (default) or Debug.

.PARAMETER SkipTests
    Skip unit tests (use only for rapid iteration; never for release builds).

.PARAMETER Version
    MSI product version, e.g. "1.0.0".  Defaults to "1.0.0".

.EXAMPLE
    .\build-msi.ps1
    .\build-msi.ps1 -Version "1.2.3"
    .\build-msi.ps1 -SkipTests
#>
param(
    [string]$Configuration = "Release",
    [switch]$SkipTests,
    [string]$Version = "1.0.0"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Root        = $PSScriptRoot
$CollectorDir = Join-Path $Root "LiderCollector"
$TestDir     = Join-Path $Root "LiderCollector.Tests"
$InstallerDir = Join-Path $Root "LiderCollector.Installer"
$PublishDir  = Join-Path $CollectorDir "bin\$Configuration\net8.0\win-x64\publish"
$OutputDir   = Join-Path $Root "dist"

function Write-Step { param([string]$Msg) Write-Host "`n==> $Msg" -ForegroundColor Cyan }
function Fail       { param([string]$Msg) Write-Error $Msg; exit 1 }

# ── 0. Prerequisites ──────────────────────────────────────────────────────────
Write-Step "Checking prerequisites"

if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
    Fail ".NET SDK not found. Install .NET 8 SDK from https://dotnet.microsoft.com/"
}
$dotnetVer = (dotnet --version)
Write-Host "  dotnet: $dotnetVer"

$wixAvailable = $null -ne (Get-Command wix -ErrorAction SilentlyContinue)
if (-not $wixAvailable) {
    Write-Warning "  'wix' CLI not found. MSI build will be skipped."
    Write-Warning "  Install WiX v4: dotnet tool install --global wix"
}

# ── 1. Build & publish ────────────────────────────────────────────────────────
Write-Step "Publishing LiderCollector ($Configuration / win-x64 / self-contained)"

dotnet publish "$CollectorDir\LiderCollector.csproj" `
    --configuration $Configuration `
    --runtime win-x64 `
    --self-contained true `
    -p:PublishSingleFile=true `
    -p:IncludeNativeLibrariesForSelfExtract=true `
    -p:Version=$Version `
    --output $PublishDir

if ($LASTEXITCODE -ne 0) { Fail "dotnet publish failed (exit $LASTEXITCODE)" }
Write-Host "  Published to: $PublishDir"

# ── 2. Unit tests ─────────────────────────────────────────────────────────────
if (-not $SkipTests) {
    Write-Step "Running unit tests"

    dotnet test "$TestDir\LiderCollector.Tests.csproj" `
        --configuration $Configuration `
        --logger "console;verbosity=normal" `
        --no-restore

    if ($LASTEXITCODE -ne 0) { Fail "Unit tests failed (exit $LASTEXITCODE)" }
    Write-Host "  All tests passed."
} else {
    Write-Warning "  Tests skipped (-SkipTests flag)."
}

# ── 3. MSI build ──────────────────────────────────────────────────────────────
if ($wixAvailable) {
    Write-Step "Building MSI (WiX v4)"

    New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

    wix build "$InstallerDir\LiderCollector.Installer.wixproj" `
        -d "CollectorPublishDir=$PublishDir\" `
        -d "Version=$Version" `
        -out "$OutputDir\LiderITONECollector-$Version.msi" `
        -arch x64

    if ($LASTEXITCODE -ne 0) { Fail "WiX MSI build failed (exit $LASTEXITCODE)" }

    Write-Host ""
    Write-Host "MSI ready: $OutputDir\LiderITONECollector-$Version.msi" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Warning "MSI build skipped (wix not on PATH)."
    Write-Warning "Published binaries are in: $PublishDir"
}

Write-Host ""
Write-Host "Build complete." -ForegroundColor Green
