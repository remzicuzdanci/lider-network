#Requires -Version 5.1
<#
.SYNOPSIS
    Builds the ONE package for the isolated test VM: scripts, the TEST-signed MSIs (as ready pilot bundles), the PUBLIC test certificates and vmtest-config.json. Runs on the build PC.

.DESCRIPTION
    Contains NO private key: only public certificates (test root, test signer, test server certificate) and the TEST-signed installers. vmtest-config.json carries the control token of the
    isolated test server - a throw-away secret of the test environment (not a production credential). The package is aborted if key material is found in it.
    Output: <OutDir>\LiderITONECollector-vmtest-suite-<stamp>.zip  (+ SHA-256)

.EXAMPLE
    .\New-VmTestPackage.ps1 -PkiDir $env:USERPROFILE\LiderVmTestPki -ControlToken <token> -OutDir C:\out
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$PkiDir,
    [Parameter(Mandatory)][string]$ControlToken,
    [Parameter(Mandatory)][string]$OutDir,
    [int]$HeartbeatSeconds = 60,
    [string]$BaselineMsiTemplate,
    [string]$ProductionSignerSha1 = '83739ABFDBD3B8654141FE1F2BF1A131F99BA71F'
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot; $collector = Split-Path (Split-Path $here -Parent) -Parent; $tools = Join-Path $collector 'tools'
$pins = Get-Content (Join-Path $PkiDir 'test-pins.json') -Raw | ConvertFrom-Json
if ($pins.signer_sha1 -ieq $ProductionSignerSha1) { throw 'refusing: this PKI carries the production signer pin' }
$dist = Join-Path $collector 'dist\testpki'
$ok = Join-Path $dist 'signed\LiderITONECollector-1.4.0-testpki-signed.msi'
$bad = Join-Path $dist 'signed-fault\LiderITONECollector-1.4.0-testpki-signed.msi'
if (-not $BaselineMsiTemplate) { $BaselineMsiTemplate = Join-Path $collector 'dist\LiderITONECollector-1.3.0.msi' }
foreach ($f in $ok, $bad, $BaselineMsiTemplate) { if (-not (Test-Path $f)) { throw "missing: $f (run Build-TestPkiMsi.ps1 first)" } }

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$stage = Join-Path $OutDir "vmtest-suite-$stamp"; New-Item -ItemType Directory -Force $stage, (Join-Path $stage 'tools'), (Join-Path $stage 'pki'), (Join-Path $stage 'bundles') | Out-Null
$tmp = Join-Path $OutDir "tmp-bundles-$stamp"; New-Item -ItemType Directory -Force $tmp | Out-Null

foreach ($f in 'Run-VmTestSuite.ps1', 'VmTestLib.ps1') { Copy-Item (Join-Path $here $f) $stage }
foreach ($f in 'Pilot-Upgrade.ps1', 'Run-PilotUpgrade.ps1', 'Set-CollectorHttps.ps1', 'Check-SigningTrust.ps1') { Copy-Item (Join-Path $tools $f) (Join-Path $stage 'tools') }
foreach ($f in 'test-root-ca.pem', 'test-update-signing-cert.pem', 'server.crt') { Copy-Item (Join-Path $PkiDir "public\$f") (Join-Path $stage 'pki') }     # PUBLIC parts only (server.key is deliberately NOT copied)

# the two ready bundles (the normal and the deliberately failing 1.4.0), pinned to the TEST signer and TEST root
$bb = Join-Path $tools 'Build-PilotBundle.ps1'; $root = Join-Path $PkiDir 'public\test-root-ca.pem'
& $bb -Version 1.4.0 -From 1.3.0 -SignedMsi $ok -PreviousMsi $BaselineMsiTemplate -OutDir (Join-Path $tmp 'a') -SignerSha1 $pins.signer_sha1 -RootSha256 $pins.root_sha256 -RootPem $root -AllowUnsignedPrevious 2>&1 | Out-Null
& $bb -Version 1.4.0 -From 1.3.0 -SignedMsi $bad -PreviousMsi $BaselineMsiTemplate -OutDir (Join-Path $tmp 'b') -SignerSha1 $pins.signer_sha1 -RootSha256 $pins.root_sha256 -RootPem $root -AllowUnsignedPrevious 2>&1 | Out-Null
Copy-Item (Join-Path $tmp 'a\pilot-bundle-1.4.0') (Join-Path $stage 'bundles\upgrade') -Recurse
Copy-Item (Join-Path $tmp 'b\pilot-bundle-1.4.0') (Join-Path $stage 'bundles\fault') -Recurse
foreach ($b in 'upgrade', 'fault') {   # the bundles must not carry the production scripts' stale copies: the suite copies the (identical) tools in at run time
    foreach ($f in 'Pilot-Upgrade.ps1', 'Run-PilotUpgrade.ps1', 'Set-CollectorHttps.ps1', 'Check-SigningTrust.ps1', 'SHA256SUMS.txt') { Remove-Item (Join-Path $stage "bundles\$b\$f") -ErrorAction SilentlyContinue }
}
Remove-Item $tmp -Recurse -Force

# Collector 1.4.4 (pilot candidate: 1.4.3 queue health + reliable Windows Update last-scan date). The TEST-signed MSI, its manifest and signature go in as a separate folder; the existing scenarios still use 1.4.0 / 1.4.1 / 1.4.2.
$qv = '1.4.4'; $qSigned = Join-Path $dist "signed\LiderITONECollector-$qv-testpki-signed.msi"
if (Test-Path $qSigned) {
    $qd = Join-Path $stage "pilot-$qv"; New-Item -ItemType Directory -Force $qd | Out-Null
    Copy-Item $qSigned $qd; Copy-Item (Join-Path $dist "LiderITONECollector-$qv-testpki.manifest.json") $qd
    Get-ChildItem (Join-Path $dist 'signed') -Filter "LiderITONECollector-$qv-testpki.*.sig" | ForEach-Object { Copy-Item $_.FullName $qd }
    Copy-Item (Join-Path $collector 'PILOT-1.4.4.md') (Join-Path $qd 'README-PILOT-1.4.4.md') -ErrorAction SilentlyContinue
}

[ordered]@{
    ServerIp = $pins.server_names[0]; HttpPort = $pins.http_port; HttpsPort = $pins.https_port; ControlToken = $ControlToken; HeartbeatSeconds = $HeartbeatSeconds
    Pins = [ordered]@{ SignerSha1 = $pins.signer_sha1; RootSha256 = $pins.root_sha256 }
    Versions = [ordered]@{ Baseline = '1.3.0'; Target = '1.4.0'; Update = '1.4.1'; FaultUpdate = '1.4.2'; Pilot = '1.4.4' }
    Kind = 'LIDER VMTEST - throw-away test PKI and test server; NOT production'
} | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $stage 'vmtest-config.json') -Encoding UTF8
Copy-Item (Join-Path $here 'README-VM.md') (Join-Path $stage 'README-VM.md') -ErrorAction SilentlyContinue

# the bundles' SHA256SUMS.txt is rebuilt by the suite's own copy step? No: Run-PilotUpgrade verifies SHA256SUMS.txt of ITS folder, so recreate it with the scripts present as at run time.
foreach ($b in 'upgrade', 'fault') {
    $d = Join-Path $stage "bundles\$b"
    foreach ($f in 'Pilot-Upgrade.ps1', 'Run-PilotUpgrade.ps1', 'Set-CollectorHttps.ps1', 'Check-SigningTrust.ps1') { Copy-Item (Join-Path $stage "tools\$f") $d }
    $sums = Get-ChildItem $d -File | Where-Object Name -ne 'SHA256SUMS.txt' | Sort-Object Name | ForEach-Object { '{0}  {1}' -f (Get-FileHash $_.FullName -Algorithm SHA256).Hash.ToLower(), $_.Name }
    [IO.File]::WriteAllLines((Join-Path $d 'SHA256SUMS.txt'), $sums, (New-Object Text.UTF8Encoding($false)))
    foreach ($f in 'Pilot-Upgrade.ps1', 'Run-PilotUpgrade.ps1', 'Set-CollectorHttps.ps1', 'Check-SigningTrust.ps1') { Remove-Item (Join-Path $d $f) }
}
# NOTE: the suite copies the four scripts into its working copy of the bundle; SHA256SUMS.txt then matches because the files are byte-identical to the ones hashed above.

# no key material may leave the build PC
$bad2 = @(Get-ChildItem $stage -Recurse -File | Where-Object { $_.Extension -in '.key', '.pfx', '.p12' -or $_.Name -match 'private|password' })
if ($bad2) { throw "key material found in the package: $($bad2.FullName -join ', ')" }
$hit = Get-ChildItem $stage -Recurse -File | Where-Object { $_.Extension -notin '.msi' } | Select-String -Pattern 'BEGIN (RSA |EC |ENCRYPTED )?PRIVATE KEY' -ErrorAction SilentlyContinue
if ($hit) { throw 'private key text found in the package - aborted' }
$prodHit = Get-ChildItem $stage -Recurse -File -Include *.json, *.ps1, *.md | Select-String -SimpleMatch $ProductionSignerSha1 | Where-Object { $_.Path -notmatch 'Check-SigningTrust|Run-PilotUpgrade|Pilot-Upgrade|Set-CollectorHttps|Build-' }
if ($prodHit) { throw "the production signer pin appears in $($prodHit[0].Path)" }

$sums = Get-ChildItem $stage -Recurse -File | Sort-Object FullName | ForEach-Object { '{0}  {1}' -f (Get-FileHash $_.FullName -Algorithm SHA256).Hash.ToLower(), $_.FullName.Substring($stage.Length + 1) }
[IO.File]::WriteAllLines((Join-Path $stage 'PACKAGE-SHA256SUMS.txt'), $sums, (New-Object Text.UTF8Encoding($false)))
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = Join-Path $OutDir "LiderITONECollector-vmtest-suite-$stamp.zip"
[IO.Compression.ZipFile]::CreateFromDirectory($stage, $zip, 'Optimal', $false)
"PACKAGE: $zip"; "SHA256 : $((Get-FileHash $zip -Algorithm SHA256).Hash.ToLower())"; "files  : $((Get-ChildItem $stage -Recurse -File).Count)  size: {0:N1} MB" -f ((Get-Item $zip).Length / 1MB)
Write-Host 'Contains: scripts, TEST-signed MSIs, PUBLIC test certificates, vmtest-config.json (test control token). No private key.' -ForegroundColor Green
