#Requires -Version 5.1
<#
.SYNOPSIS
    Signs a COPY of the unsigned Collector MSI with the existing LIDER code-signing certificate. Run on the machine that holds that certificate's private key.

.DESCRIPTION
    - The private key is never read, shown or exported: only signtool.exe uses it, through the Windows key store.
    - The original (unsigned) MSI is not modified. The signed copy goes to -OutDir.
    - It checks the input hash, finds the certificate by the pinned thumbprint, checks EKU/validity/private key presence, signs, verifies, and prints the NEW SHA-256
      (a signature changes the file: this is the value to publish and to pin).
    -ListOnly   shows the code-signing certificates that this account can see (subject, thumbprint, whether a private key is present) and stops.

.EXAMPLE
    .\Sign-CollectorMsi.ps1 -ListOnly
    .\Sign-CollectorMsi.ps1 -Msi C:\Pilot\LiderITONECollector-1.3.0.msi -OutDir C:\Pilot\signed
    .\Sign-CollectorMsi.ps1 -Msi ... -OutDir ... -TimestampUrl http://timestamp.digicert.com     # only if this network may reach a public timestamp service
#>
[CmdletBinding()]
param(
    [string]$Msi,
    [string]$OutDir = (Join-Path (Get-Location) 'signed'),
    [string]$Thumbprint = '83739ABFDBD3B8654141FE1F2BF1A131F99BA71F',
    [string]$ExpectedUnsignedSha256 = '2bc5ba10ff874f77e86409cc1f010609a9dc569e6ee16bfae5f9dad2ff6ca41e',
    [string]$TimestampUrl,
    [string]$SignTool,
    [switch]$ListOnly
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-Candidates {
    foreach ($store in 'Cert:\CurrentUser\My', 'Cert:\LocalMachine\My') {
        Get-ChildItem $store -ErrorAction SilentlyContinue | Where-Object { $_.EnhancedKeyUsageList.ObjectId -contains '1.3.6.1.5.5.7.3.3' } |
            ForEach-Object { [pscustomobject]@{ Store = $store; Subject = $_.Subject; Thumbprint = $_.Thumbprint; PrivateKey = $_.HasPrivateKey; NotAfter = $_.NotAfter.ToString('yyyy-MM-dd') } }
    }
}
if ($ListOnly) {
    $c = @(Get-Candidates)
    if ($c.Count -eq 0) { Write-Host 'No code-signing certificate is visible to this account. Run this on the machine where the LIDER signing certificate was created (certreq -new / -accept).' -ForegroundColor Yellow }
    else { $c | Format-Table -AutoSize | Out-String -Width 200 | Write-Host }
    return
}

if (-not $Msi -or -not (Test-Path $Msi)) { throw '-Msi must point to the unsigned LiderITONECollector-1.3.0.msi' }
$h = (Get-FileHash $Msi -Algorithm SHA256).Hash.ToLower()
if ($h -ne $ExpectedUnsignedSha256.ToLower()) { throw "Input SHA-256 is $h, expected $ExpectedUnsignedSha256. Use the file you were given; do not sign anything else." }
if ((Get-AuthenticodeSignature $Msi).Status -ne 'NotSigned') { throw 'The input is already signed. Start from the unsigned file.' }

$cert = Get-Candidates | Where-Object { $_.Thumbprint -ieq $Thumbprint } | Select-Object -First 1
if (-not $cert) { throw "Certificate $Thumbprint not found in this account's stores. Run -ListOnly to see what is available." }
if (-not $cert.PrivateKey) { throw 'The certificate is present but has no private key on this machine; it cannot sign here.' }
Write-Host ("certificate : {0}  ({1})  valid until {2}  private key: present (not read)" -f $cert.Subject, $cert.Store, $cert.NotAfter)

if (-not $SignTool) {
    $SignTool = (Get-Command signtool.exe -ErrorAction SilentlyContinue).Source
    if (-not $SignTool) { $SignTool = Get-ChildItem "${env:ProgramFiles(x86)}\Windows Kits\10\bin" -Recurse -Filter signtool.exe -ErrorAction SilentlyContinue | Where-Object FullName -match '\\x64\\' | Sort-Object FullName | Select-Object -Last 1 -ExpandProperty FullName }
}
if (-not $SignTool) { throw 'signtool.exe not found. Install the Windows SDK ("Windows SDK Signing Tools for Desktop Apps") or pass -SignTool.' }
Write-Host "signtool    : $SignTool"

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$out = Join-Path $OutDir ((Split-Path $Msi -Leaf) -replace '\.msi$', '-signed.msi')
Copy-Item $Msi $out -Force
$args = @('sign', '/fd', 'SHA256', '/sha1', $cert.Thumbprint, '/d', 'LIDER IT ONE Collector')
if ($cert.Store -like '*LocalMachine*') { $args += '/sm' }
if ($TimestampUrl) { $args += @('/tr', $TimestampUrl, '/td', 'SHA256') } else { Write-Warning 'No -TimestampUrl: the signature will not outlive the certificate (valid until 2029) and cannot be proven to predate a revocation.' }
$args += $out
& $SignTool @args
if ($LASTEXITCODE -ne 0) { Remove-Item $out -Force -ErrorAction SilentlyContinue; throw "signtool sign failed ($LASTEXITCODE); nothing was produced." }

& $SignTool verify /pa /v $out | Select-String 'Successfully|Issued to|Issued by|SHA1 hash|Timestamp' | ForEach-Object { Write-Host "  $($_.Line.Trim())" }
$sig = Get-AuthenticodeSignature $out
"{0}`n  status  : {1}`n  signer  : {2}`n  SHA-256 : {3}" -f $out, $sig.Status, $sig.SignerCertificate.Thumbprint, (Get-FileHash $out -Algorithm SHA256).Hash | Write-Host -ForegroundColor Green
Write-Host "`nSend back: the signed file ($out) and the SHA-256 above. Do not send the private key or any certificate export."
