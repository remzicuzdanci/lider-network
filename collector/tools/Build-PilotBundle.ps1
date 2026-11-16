#Requires -Version 5.1
<#
.SYNOPSIS
    Assembles the one-time manual upgrade bundle (flat ZIP) for ONE pilot computer from an already SIGNED MSI. Runs on the build PC; signs nothing, publishes nothing, touches no private key.

.DESCRIPTION
    Refuses an MSI that is unsigned, signed by another certificate than the pinned one, or whose ProductVersion is not -Version. Includes the previous signed MSI (the rollback source),
    Pilot-Upgrade.ps1, Run-PilotUpgrade.ps1, Set-CollectorHttps.ps1, Check-SigningTrust.ps1, the public LIDER root, a generated runbook, pilot-pin.json and SHA256SUMS.txt.
    The ZIP is then published through the panel with:  php artisan collector:publish-release <zip> --release-version=<v> --kind=bundle --audience=platform   (needs approval)

.EXAMPLE
    .\Build-PilotBundle.ps1 -Version 1.4.0 -From 1.3.0 -SignedMsi .\dist\LiderITONECollector-1.4.0-signed.msi -PreviousMsi .\dist\LiderITONECollector-1.3.0-signed.msi -OutDir C:\out
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$Version,
    [Parameter(Mandatory)][string]$From,
    [Parameter(Mandatory)][string]$SignedMsi,
    [Parameter(Mandatory)][string]$PreviousMsi,
    [Parameter(Mandatory)][string]$OutDir,
    [string]$SignerSha1 = '83739ABFDBD3B8654141FE1F2BF1A131F99BA71F',
    [string]$RootSha256 = '21E94EC9750C21E2442E0818107BE870BE6C83AD1369D8DAAEACBE6D4EC733E2'
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$tools = $PSScriptRoot
function Sha256($p) { $fs = New-Object IO.FileStream($p, 'Open', 'Read', ([IO.FileShare]'ReadWrite,Delete')); try { ([BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash($fs)) -replace '-', '').ToLower() } finally { $fs.Dispose() } }
function MsiProp([string]$path, [string]$prop) {
    $i = New-Object -ComObject WindowsInstaller.Installer; $db = $i.GetType().InvokeMember('OpenDatabase', 'InvokeMethod', $null, $i, @($path, 0))
    $v = $db.GetType().InvokeMember('OpenView', 'InvokeMethod', $null, $db, @("SELECT Value FROM Property WHERE Property='$prop'")); $v.GetType().InvokeMember('Execute', 'InvokeMethod', $null, $v, $null)
    $r = $v.GetType().InvokeMember('Fetch', 'InvokeMethod', $null, $v, $null); if ($r) { $r.GetType().InvokeMember('StringData', 'GetProperty', $null, $r, 1) }
}
function Assert-SignedBy([string]$msi, [string]$label) {
    $s = Get-AuthenticodeSignature $msi
    if (-not $s.SignerCertificate) { throw "$label is NOT signed: $msi" }
    if ($s.SignerCertificate.Thumbprint -ne $SignerSha1) { throw "$label is signed by $($s.SignerCertificate.Thumbprint), not by the pinned certificate $SignerSha1" }
}

Assert-SignedBy $SignedMsi 'the new MSI'; Assert-SignedBy $PreviousMsi 'the previous MSI'
if ((MsiProp $SignedMsi 'ProductVersion') -ne $Version) { throw "the new MSI has ProductVersion $(MsiProp $SignedMsi 'ProductVersion'), expected $Version" }
if ((MsiProp $PreviousMsi 'ProductVersion') -notlike "$From*") { throw "the previous MSI has ProductVersion $(MsiProp $PreviousMsi 'ProductVersion'), expected $From" }

$name = "pilot-bundle-$Version"; $work = Join-Path $OutDir $name
if (Test-Path $work) { Remove-Item $work -Recurse -Force }
New-Item -ItemType Directory -Force $work | Out-Null
$newName = "LiderITONECollector-$Version-signed.msi"; $prevName = "LiderITONECollector-$From-signed-template.msi"
Copy-Item $SignedMsi (Join-Path $work $newName); Copy-Item $PreviousMsi (Join-Path $work $prevName)
foreach ($f in 'Pilot-Upgrade.ps1', 'Run-PilotUpgrade.ps1', 'Set-CollectorHttps.ps1', 'Check-SigningTrust.ps1') { Copy-Item (Join-Path $tools $f) $work }
Copy-Item (Join-Path $tools 'pki\lider-root-ca.pem') $work
$rc = New-Object Security.Cryptography.X509Certificates.X509Certificate2 (Join-Path $work 'lider-root-ca.pem')
if (([BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash($rc.RawData)) -replace '-', '').ToUpper() -ne $RootSha256.ToUpper()) { throw 'tools\pki\lider-root-ca.pem is not the pinned LIDER root' }

[ordered]@{ MsiName = $newName; MsiSha256 = (Sha256 (Join-Path $work $newName)); FromVersion = $From; ToVersion = $Version; SignerSha1 = $SignerSha1; RootSha256 = $RootSha256 } | ConvertTo-Json | Set-Content (Join-Path $work 'pilot-pin.json') -Encoding UTF8

@"
# MIKRO-PC pilot: Collector $From -> $Version (signed MSI, one time, manual)

Run on the pilot computer, as an administrator. Nothing is opened remotely. Do not touch other computers or GPOs.

## 1. Upgrade (one command)
Extract the ZIP to an empty folder (e.g. C:\Pilot), open an ELEVATED PowerShell in it and run:

    powershell -NoProfile -ExecutionPolicy Bypass -File .\Run-PilotUpgrade.ps1 -PreflightOnly     # checks only
    powershell -NoProfile -ExecutionPolicy Bypass -File .\Run-PilotUpgrade.ps1

It verifies the bundle (SHA256SUMS.txt) and the MSI (SHA-256, Authenticode signer pin, chain to the pinned LIDER root), records the identity, stops the service and verifies it stopped,
backs up %ProgramData%\LiderCollector including queue.db with its WAL/SHM, installs, starts, verifies version/service/identity/inventory and rolls back automatically on any failure.
Exit codes of Pilot-Upgrade.ps1: 0 ok, 1 failed (rollback tried), 2 backup failed (nothing installed). Report: upgrade-report-<time>.txt.

## 2. HTTPS (also one time, only after step 1 passed)
    powershell -NoProfile -ExecutionPolicy Bypass -File .\Set-CollectorHttps.ps1 -WhatIf
    powershell -NoProfile -ExecutionPolicy Bypass -File .\Set-CollectorHttps.ps1
Needs $Version or newer. Pins the LIDER root, switches server_url to https://192.168.20.61, waits for an accepted inventory and reverts by itself otherwise. Nothing is added to the Windows certificate store.

## 3. Afterwards
Send upgrade-report-*.txt. The server side is compared with the pre-upgrade baseline. Automatic updates are only possible from $Version on and only over HTTPS.

SHA-256 of the MSI: $((Sha256 (Join-Path $work $newName)))
"@ | Set-Content (Join-Path $work 'PILOT-RUNBOOK.md') -Encoding UTF8

$sums = Get-ChildItem $work -File | Where-Object Name -ne 'SHA256SUMS.txt' | Sort-Object Name | ForEach-Object { '{0}  {1}' -f (Sha256 $_.FullName), $_.Name }
[IO.File]::WriteAllLines((Join-Path $work 'SHA256SUMS.txt'), $sums, (New-Object Text.UTF8Encoding($false)))

Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
$zip = Join-Path $OutDir "LiderITONECollector-$name.zip"; if (Test-Path $zip) { Remove-Item $zip }
$za = [IO.Compression.ZipFile]::Open($zip, 'Create')
try { foreach ($f in Get-ChildItem $work -File) { $in = New-Object IO.FileStream($f.FullName, 'Open', 'Read', ([IO.FileShare]'ReadWrite,Delete')); $o = $za.CreateEntry($f.Name, 'Optimal').Open(); $in.CopyTo($o); $o.Dispose(); $in.Dispose() } } finally { $za.Dispose() }
if (Select-String -Path "$work\*" -Pattern 'BEGIN (RSA |EC |ENCRYPTED )?PRIVATE KEY' -ErrorAction SilentlyContinue) { Remove-Item $zip; throw 'private key text found in the bundle - aborted' }
"BUNDLE: $zip"; "SHA256: $(Sha256 $zip)"; "files : $((Get-ChildItem $work -File).Count)"
