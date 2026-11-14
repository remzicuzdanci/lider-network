#Requires -Version 5.1
<#
.SYNOPSIS
    Produces the manifest signature for a signed Collector MSI. Run on the machine that holds the LIDER code-signing certificate (the same machine as Sign-CollectorMsi.ps1).

.DESCRIPTION
    Signs the text  "<version>:<channel>:<sha256 of the MSI>"  with the certificate's private key (RSA PKCS#1 v1.5, SHA-256) and writes the base64 result to a file.
    The private key is used through Windows (CNG); it is not read, exported or printed. The signature is verified with the certificate's public key before the
    file is written. The server and every Collector verify the same signature against the pinned public certificate.

.EXAMPLE
    .\Sign-UpdateManifest.ps1 -Msi C:\Pilot\signed\LiderITONECollector-1.4.0-signed.msi -Version 1.4.0 -Channel pilot -OutFile C:\Pilot\manifest-1.4.0.sig
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$Msi,
    [Parameter(Mandatory)][ValidatePattern('^\d+\.\d+\.\d+$')][string]$Version,
    [ValidateSet('stable', 'pilot', 'beta')][string]$Channel = 'stable',
    [string]$Thumbprint = '83739ABFDBD3B8654141FE1F2BF1A131F99BA71F',
    [Parameter(Mandatory)][string]$OutFile
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
if (-not (Test-Path $Msi)) { throw "MSI not found: $Msi" }
$sig = Get-AuthenticodeSignature $Msi
if ($sig.Status -eq 'NotSigned' -or $sig.Status -eq 'HashMismatch') { throw "The MSI must already be Authenticode-signed with the LIDER certificate (status: $($sig.Status))." }
if ($sig.SignerCertificate.Thumbprint -ine $Thumbprint) { throw "The MSI is signed by $($sig.SignerCertificate.Thumbprint), not by the pinned certificate $Thumbprint." }

$cert = @(Get-ChildItem Cert:\CurrentUser\My, Cert:\LocalMachine\My | Where-Object { $_.Thumbprint -ieq $Thumbprint -and $_.HasPrivateKey }) | Select-Object -First 1
if (-not $cert) { throw "Certificate $Thumbprint with a private key was not found on this machine. Run this where the signing certificate lives." }

$sha = (Get-FileHash $Msi -Algorithm SHA256).Hash.ToLowerInvariant()
$payload = "${Version}:${Channel}:${sha}"
$bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
$rsa = [System.Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPrivateKey($cert)
$signature = $rsa.SignData($bytes, [System.Security.Cryptography.HashAlgorithmName]::SHA256, [System.Security.Cryptography.RSASignaturePadding]::Pkcs1)
$pub = [System.Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPublicKey($cert)
if (-not $pub.VerifyData($bytes, $signature, [System.Security.Cryptography.HashAlgorithmName]::SHA256, [System.Security.Cryptography.RSASignaturePadding]::Pkcs1)) { throw 'self-check of the new signature failed' }

[System.IO.File]::WriteAllText($OutFile, [Convert]::ToBase64String($signature))
Write-Host "payload   : $payload"
Write-Host "signature : written to $OutFile ($($signature.Length) bytes, verified with the public key)"
Write-Host "Send back : the signed MSI and this .sig file. The server publishes with:  php artisan collector:publish-update <msi> --release-version=$Version --channel=$Channel --signature-file=<sig> [--targets=<collector ids>]"
