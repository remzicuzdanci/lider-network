#Requires -Version 5.1
<#
.SYNOPSIS
    READ-ONLY report for the pilot computer (MIKRO-PC): does it trust the LIDER signing chain, can it reach the CRL, which Collector is installed.
    Changes nothing. Prints no key material and no tokens.

.EXAMPLE
    .\Check-SigningTrust.ps1                                   # on MIKRO-PC, elevated or not
    .\Check-SigningTrust.ps1 -Msi C:\Pilot\LiderITONECollector-1.3.0-signed.msi
#>
[CmdletBinding()]
param(
    [string]$Msi,
    [string]$ServerIp = '192.168.20.61',
    [string]$ServerName = 'liderone.uci.local',
    [string]$RootSha256 = '21E94EC9750C21E2442E0818107BE870BE6C83AD1369D8DAAEACBE6D4EC733E2',
    [string]$SignerSha1 = '83739ABFDBD3B8654141FE1F2BF1A131F99BA71F'
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'
function Line($k, $v) { Write-Host ("{0,-44} {1}" -f $k, $v) }
$sha = [System.Security.Cryptography.SHA256]::Create()
function Sha256Of($c) { ([System.BitConverter]::ToString($sha.ComputeHash($c.RawData)) -replace '-', '') }

Write-Host "== computer"
$cs = Get-CimInstance Win32_ComputerSystem
Line 'name / domain' "$($cs.Name) / $($cs.Domain)  (PartOfDomain=$($cs.PartOfDomain))"
Line 'time (UTC) - must be correct for any cert check' ((Get-Date).ToUniversalTime().ToString('u'))
Line 'OS' ((Get-CimInstance Win32_OperatingSystem).Caption)

Write-Host "`n== is the LIDER root trusted here?"
$rootHit = @()
foreach ($s in 'Cert:\LocalMachine\Root', 'Cert:\CurrentUser\Root') { $rootHit += Get-ChildItem $s | Where-Object { (Sha256Of $_) -ieq $RootSha256 } | ForEach-Object { "$s" } }
Line 'pinned LIDER root (SHA-256 21E94EC9...)' $(if ($rootHit) { 'TRUSTED in ' + ($rootHit -join ', ') } else { 'NOT trusted (expected on a workgroup computer until it is imported)' })
$others = @(Get-ChildItem Cert:\LocalMachine\Root | Where-Object { $_.Subject -match 'LIDER' -and (Sha256Of $_) -ine $RootSha256 })
if ($others) { Line 'OTHER LIDER roots present (old)' (($others | ForEach-Object { $_.Subject + ' ' + $_.Thumbprint }) -join '; ') }
$tp = @(Get-ChildItem Cert:\LocalMachine\TrustedPublisher -ErrorAction SilentlyContinue | Where-Object { $_.Thumbprint -ieq $SignerSha1 })
Line 'signer in Trusted Publishers' $(if ($tp) { 'yes' } else { 'no (only affects the "unknown publisher" prompt of an interactive install; not needed for SYSTEM / msiexec /qn)' })

Write-Host "`n== can it reach the revocation list (CDP http://$ServerName/pki/lider-ca.crl)?"
try { $r = [System.Net.Dns]::GetHostAddresses($ServerName) | ForEach-Object { $_.IPAddressToString }; Line "DNS $ServerName" ($r -join ', ') } catch { Line "DNS $ServerName" 'does NOT resolve here (then the CRL cannot be fetched by name)' }
try {
    $req = [System.Net.WebRequest]::Create("http://$ServerIp/pki/lider-ca.crl"); $req.Host = $ServerName; $req.Timeout = 8000
    $resp = $req.GetResponse(); $len = $resp.ContentLength; $resp.Close(); Line 'CRL via IP + Host header' "HTTP 200, $len bytes"
} catch { Line 'CRL via IP + Host header' "FAILED: $($_.Exception.Message)" }

Write-Host "`n== Collector on this computer"
$svc = Get-CimInstance Win32_Service -Filter "Name='LiderITONECollector'" -ErrorAction SilentlyContinue
if ($svc) { Line 'service' "$($svc.State), start mode $($svc.StartMode), account $($svc.StartName)"; Line 'binary' $svc.PathName }
else { Line 'service' 'not installed' }
$inst = New-Object -ComObject WindowsInstaller.Installer
$ver = $null; foreach ($pc in $inst.RelatedProducts('{B6A3F291-9D4E-4C7B-8F12-3A5E6D1C0847}')) { $ver = $inst.ProductInfo($pc, 'VersionString') }
Line 'installed MSI version' $(if ($ver) { $ver } else { 'none' })
$cfg = Join-Path $env:ProgramData 'LiderCollector\collector.json'
if (Test-Path $cfg) { try { $j = Get-Content $cfg -Raw | ConvertFrom-Json; Line 'server_url (from collector.json)' $j.server_url; Line 'allow_http' $(if ($null -ne $j.PSObject.Properties['allow_http']) { $j.allow_http } else { '(not set)' }) } catch { Line 'collector.json' 'unreadable (run elevated)' } }
foreach ($f in 'collector.json', 'secure.dat', 'queue.db') { $p = Join-Path $env:ProgramData "LiderCollector\$f"; Line "state file $f" $(if (Test-Path $p) { "present, $((Get-Item $p).Length) bytes" } else { 'MISSING' }) }
Write-Host "  (the Collector talks to http://$ServerIp today; HTTPS trust matters only after the switch to https)"

if ($Msi) {
    Write-Host "`n== the MSI: $Msi"
    $sig = Get-AuthenticodeSignature $Msi
    Line 'Authenticode status' "$($sig.Status) - $($sig.StatusMessage)"
    if ($sig.SignerCertificate) { Line 'signer' "$($sig.SignerCertificate.Subject) [$($sig.SignerCertificate.Thumbprint)]"; Line 'equals the pinned signer' $(if ($sig.SignerCertificate.Thumbprint -ieq $SignerSha1) { 'yes' } else { 'NO' }) }
    Line 'SHA-256' (Get-FileHash $Msi -Algorithm SHA256).Hash
}
