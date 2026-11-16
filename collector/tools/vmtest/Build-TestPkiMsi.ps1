#Requires -Version 5.1
<#
.SYNOPSIS
    Builds, signs and checks the TEST-PKI Collector MSIs for the isolated VM tests. Uses ONLY the throw-away test PKI made by New-TestPki.ps1 - never the production certificate, key or CA.

.DESCRIPTION
    For every -Version:
      1. build-msi.ps1 -TestPkiDir  -> dist\testpki\LiderITONECollector-<v>-testpki.msi  (pins/embedded certificates/server allow-list from the test PKI)
      2. build assertions on the published exe: the TEST signer pin and the allow-listed hosts are inside, the PRODUCTION signer/root pins are NOT
      3. Authenticode-signs a copy with the TEST code-signing certificate (PFX; password from private\pfx-password.txt) -> dist\testpki\signed\LiderITONECollector-<v>-testpki-signed.msi
      4. writes the manifest signature  "<version>:<channel>:<sha256>"  (RSA PKCS#1 v1.5 / SHA-256, TEST key) -> ...-<v>.<channel>.sig
      5. verifies the signature object (signer = test pin) and prints SHA-256 values
    The test private key is read only here, on the build PC, and never copied anywhere.

.EXAMPLE
    .\Build-TestPkiMsi.ps1 -PkiDir $env:USERPROFILE\LiderVmTestPki -Version 1.4.0,1.4.1
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$PkiDir,
    [Parameter(Mandatory)][string[]]$Version,
    [string[]]$Channel = @('pilot'),
    [string]$ProductionSignerSha1 = '83739ABFDBD3B8654141FE1F2BF1A131F99BA71F',
    [string]$ProductionRootSha256 = '21E94EC9750C21E2442E0818107BE870BE6C83AD1369D8DAAEACBE6D4EC733E2',
    [switch]$SkipBuild,
    # build the deliberately FAILING installer variant (fails after the files are in place; Windows Installer must roll back). Output: dist\testpki\signed-fault
    [switch]$FaultInstall
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$collector = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$pins = Get-Content (Join-Path $PkiDir 'test-pins.json') -Raw | ConvertFrom-Json
if ($pins.signer_sha1 -ieq $ProductionSignerSha1 -or $pins.root_sha256 -ieq $ProductionRootSha256) { throw 'this PKI carries a PRODUCTION pin - refusing' }

function Has-Text([byte[]]$b, [string]$s) {
    foreach ($pat in [Text.Encoding]::Unicode.GetBytes($s), [Text.Encoding]::ASCII.GetBytes($s)) {
        $i = 0
        while (($i = [Array]::IndexOf($b, $pat[0], $i)) -ge 0 -and $i -le $b.Length - $pat.Length) {
            $ok = $true; for ($k = 1; $k -lt $pat.Length; $k++) { if ($b[$i + $k] -ne $pat[$k]) { $ok = $false; break } }
            if ($ok) { return $true }; $i++
        }
    }
    $false
}
function Load-SignerCert {
    $pw = (Get-Content (Join-Path $PkiDir 'private\pfx-password.txt') -Raw).Trim()
    $c = New-Object Security.Cryptography.X509Certificates.X509Certificate2 ((Join-Path $PkiDir 'private\codesign.pfx'), $pw, 'Exportable')
    if ($c.Thumbprint -ine $pins.signer_sha1) { throw 'the PFX is not the pinned test signer' }
    $c
}
function Sha256([string]$p) { (Get-FileHash $p -Algorithm SHA256).Hash.ToLower() }

$outSigned = Join-Path $collector ($(if ($FaultInstall) { 'dist\testpki\signed-fault' } else { 'dist\testpki\signed' })); New-Item -ItemType Directory -Force $outSigned | Out-Null
$cert = Load-SignerCert
$report = @()
foreach ($v in $Version) {
    if ($v -notmatch '^\d+\.\d+\.\d+$') { throw "bad version $v" }
    if (-not $SkipBuild) { & (Join-Path $collector 'build-msi.ps1') -Version $v -TestPkiDir (Join-Path $PkiDir 'build') -FaultInstall:$FaultInstall | Out-Host }
    $sfx = if ($FaultInstall) { '-fault' } else { '' }
    $msi = Join-Path $collector "dist\testpki\LiderITONECollector-$v-testpki$sfx.msi"
    $exe = Join-Path $collector "dist\testpki\publish-$v\LiderCollector.exe"
    if (-not (Test-Path $msi) -or -not (Test-Path $exe)) { throw "build output for $v missing" }

    $b = [IO.File]::ReadAllBytes($exe)
    if (-not (Has-Text $b $pins.signer_sha1)) { throw "assertion: the test signer pin is not inside $exe" }
    if (-not (Has-Text $b $pins.root_sha256)) { throw "assertion: the test root pin is not inside $exe" }
    if (-not (Has-Text $b ($pins.server_names -join ';'))) { throw "assertion: the server allow-list is not inside $exe" }
    if (Has-Text $b $ProductionSignerSha1) { throw "assertion: the PRODUCTION signer pin is inside $exe" }
    if (Has-Text $b $ProductionRootSha256) { throw "assertion: the PRODUCTION root pin is inside $exe" }

    $signed = Join-Path $outSigned "LiderITONECollector-$v-testpki-signed.msi"
    Copy-Item $msi $signed -Force
    $r = Set-AuthenticodeSignature -FilePath $signed -Certificate $cert -HashAlgorithm SHA256   # no timestamp: the test CA has no TSA; 'UnknownError' = untrusted root on this PC, expected
    $s = Get-AuthenticodeSignature $signed
    if (-not $s.SignerCertificate -or $s.SignerCertificate.Thumbprint -ine $pins.signer_sha1) { throw "signing failed for ${v}: $($r.StatusMessage)" }
    if ($s.Status -eq 'HashMismatch') { throw 'signature does not match the file' }
    $sha = Sha256 $signed
    foreach ($ch in $Channel) {
        $payload = [Text.Encoding]::UTF8.GetBytes("${v}:${ch}:${sha}")
        $rsa = [Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPrivateKey($cert)
        $sig = $rsa.SignData($payload, [Security.Cryptography.HashAlgorithmName]::SHA256, [Security.Cryptography.RSASignaturePadding]::Pkcs1)
        $pub = [Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPublicKey($cert)
        if (-not $pub.VerifyData($payload, $sig, [Security.Cryptography.HashAlgorithmName]::SHA256, [Security.Cryptography.RSASignaturePadding]::Pkcs1)) { throw 'self-check of the manifest signature failed' }
        [IO.File]::WriteAllText((Join-Path $outSigned "LiderITONECollector-$v-testpki.$ch.sig"), [Convert]::ToBase64String($sig))
    }
    $report += [pscustomobject]@{ Version = $v; UnsignedSha256 = (Sha256 $msi); SignedSha256 = $sha; Signer = $s.SignerCertificate.Thumbprint; File = $signed }
}
$report | Format-List | Out-String | Write-Host
Write-Host "TEST-PKI MSIs signed with the TEST certificate only: $outSigned" -ForegroundColor Green
