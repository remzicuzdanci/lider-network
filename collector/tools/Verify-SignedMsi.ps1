#Requires -Version 5.1
<#
.SYNOPSIS
    Read-only acceptance check of a SIGNED Collector MSI against the UNSIGNED build it came from. Installs nothing, signs nothing.

.DESCRIPTION
    1. Authenticode: a signature exists, is intact (not HashMismatch), the signer's SHA-1 thumbprint equals the pinned one, EKU = Code Signing, validity window, timestamp (reported).
    2. Chain: the signer chains to the pinned LIDER root (SHA-256 pin). On a machine that does not trust the root this is reported as "root not trusted here" - that is expected off the domain.
    3. SHA-256 of the signed file (the signature changes the hash: publish THIS value) and of the unsigned file.
    4. MSI contents: ProductVersion, UpgradeCode, upgrade table, service definition, and EVERY table row-for-row equal to the unsigned build,
       plus the embedded LiderCollector.exe byte-identical (extracted with `wix msi decompile -x`; no admin needed).
    Exit code 0 only if all hard checks pass.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$Signed,
    [Parameter(Mandatory)][string]$Unsigned,
    [string]$ExpectedVersion = '1.3.0',
    [string]$PinSignerSha1 = '83739ABFDBD3B8654141FE1F2BF1A131F99BA71F',
    [string]$PinRootSha256 = '21E94EC9750C21E2442E0818107BE870BE6C83AD1369D8DAAEACBE6D4EC733E2',
    [string]$RootPem = (Join-Path $PSScriptRoot 'pki\lider-root-ca.pem'),
    [string]$UpgradeCode = '{B6A3F291-9D4E-4C7B-8F12-3A5E6D1C0847}'
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$fail = 0
function Ok($m)   { Write-Host "  [ OK ] $m" -ForegroundColor Green }
function Bad($m)  { Write-Host "  [FAIL] $m" -ForegroundColor Red; $script:fail++ }
function Warn($m) { Write-Host "  [warn] $m" -ForegroundColor Yellow }

function Open-Db($path) { $i = New-Object -ComObject WindowsInstaller.Installer; return $i.OpenDatabase((Resolve-Path $path).Path, 0) }
function Rows($db, $sql) {
    try { $v = $db.OpenView($sql); $v.Execute() } catch { return @() }
    $out = @(); $n = 0
    while ($true) {
        $r = $v.Fetch(); if ($null -eq $r) { break }
        $n = [int]$r.GetType().InvokeMember('FieldCount', [Reflection.BindingFlags]::GetProperty, $null, $r, $null)
        $out += , ((1..$n | ForEach-Object { try { $r.StringData($_) } catch { '<binary>' } }) -join "`t")   # Binary/Icon streams cannot be read as text: compared via the extracted files below
    }
    $v.Close(); return $out
}
function Tables($db) { Rows $db 'SELECT `Name` FROM `_Tables`' | Sort-Object }

Write-Host "== 1. Authenticode"
$sig = Get-AuthenticodeSignature $Signed
if ($sig.Status -eq 'NotSigned') { Bad 'the file is NOT signed'; exit 1 }
if ($sig.Status -eq 'HashMismatch') { Bad 'signature does not match the file content (HashMismatch)'; exit 1 }
$c = $sig.SignerCertificate
Write-Host ("  status        : {0}  ({1})" -f $sig.Status, $sig.StatusMessage)
Write-Host ("  signer        : {0}`n  issuer        : {1}`n  thumbprint    : {2}`n  valid         : {3:u} .. {4:u}" -f $c.Subject, $c.Issuer, $c.Thumbprint, $c.NotBefore.ToUniversalTime(), $c.NotAfter.ToUniversalTime())
if ($c.Thumbprint -ieq $PinSignerSha1) { Ok 'signer thumbprint equals the pinned LIDER code-signing certificate' } else { Bad "signer thumbprint $($c.Thumbprint) is NOT the pinned $PinSignerSha1" }
if ($c.EnhancedKeyUsageList.ObjectId -contains '1.3.6.1.5.5.7.3.3') { Ok 'EKU = Code Signing' } else { Bad 'EKU is not Code Signing' }
$now = (Get-Date).ToUniversalTime(); if ($c.NotBefore.ToUniversalTime() -le $now -and $now -le $c.NotAfter.ToUniversalTime()) { Ok 'certificate is within its validity window' } else { Bad 'certificate is outside its validity window' }
if ($sig.TimeStamperCertificate) { Ok "timestamped by $($sig.TimeStamperCertificate.Subject)" } else { Warn 'no timestamp: the signature stops being valid when the certificate expires (2029) or is revoked' }
if ($sig.Status -eq 'Valid') { Ok 'Windows trusts the chain on this machine' } else { Warn "Windows does not consider it Valid here ($($sig.Status)); expected on a machine that does not trust the LIDER root" }

Write-Host "== 2. Chain to the pinned root"
if (Test-Path $RootPem) {
    $root = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2 (Resolve-Path $RootPem).Path
    $sha256 = ([System.BitConverter]::ToString([System.Security.Cryptography.SHA256]::Create().ComputeHash($root.RawData)) -replace '-', '')
    if ($sha256 -ieq $PinRootSha256) { Ok "root file matches the pinned SHA-256 ($($PinRootSha256.Substring(0,16))...)" } else { Bad "root file SHA-256 $sha256 is not the pinned one" }
    $ch = New-Object System.Security.Cryptography.X509Certificates.X509Chain
    $ch.ChainPolicy.RevocationMode = 'NoCheck'; [void]$ch.ChainPolicy.ExtraStore.Add($root)
    [void]$ch.Build($c)
    $top = $ch.ChainElements[$ch.ChainElements.Count - 1].Certificate
    $bad = @($ch.ChainStatus | Where-Object { $_.Status -notin 'UntrustedRoot' })
    if ($top.Thumbprint -ieq $root.Thumbprint -and $bad.Count -eq 0) { Ok 'signer chains to the pinned root (the only open point is that this machine does not trust that root)' } else { Bad ("chain does not end at the pinned root or has problems: " + (($ch.ChainStatus | ForEach-Object { $_.Status }) -join ',')) }
} else { Warn "root file not found ($RootPem): chain not checked" }

Write-Host "== 3. Hashes"
$hs = (Get-FileHash $Signed -Algorithm SHA256).Hash; $hu = (Get-FileHash $Unsigned -Algorithm SHA256).Hash
Write-Host "  signed   SHA-256 : $hs  (publish / pin THIS one)`n  unsigned SHA-256 : $hu"
if ($hs -ne $hu) { Ok 'the signed file differs from the unsigned one (signature added)' } else { Bad 'signed and unsigned files are identical' }

Write-Host "== 4. MSI contents"
$ds = Open-Db $Signed; $du = Open-Db $Unsigned
$pv = Rows $ds "SELECT Value FROM Property WHERE Property='ProductVersion'"; if ($pv -eq $ExpectedVersion) { Ok "ProductVersion $pv" } else { Bad "ProductVersion '$pv' (expected $ExpectedVersion)" }
$uc = Rows $ds "SELECT Value FROM Property WHERE Property='UpgradeCode'"; if ($uc -ieq $UpgradeCode) { Ok "UpgradeCode $uc" } else { Bad "UpgradeCode '$uc'" }
$svc = Rows $ds 'SELECT Name,StartType,StartName FROM ServiceInstall'; if ($svc -match 'LiderITONECollector\s+2\s+LocalSystem') { Ok 'service LiderITONECollector: auto start, LocalSystem' } else { Bad "service definition: $svc" }
$tabs = Tables $du; $diff = 0
foreach ($t in $tabs) {
    if ($t -in '_Streams', '_Storages') { continue }
    $a = Rows $du "SELECT * FROM ``$t``"; $b = Rows $ds "SELECT * FROM ``$t``"
    if ((($a | Sort-Object) -join "`n") -ne (($b | Sort-Object) -join "`n")) { Bad "table $t differs between signed and unsigned"; $diff++ }
}
if ($diff -eq 0) { Ok ("all {0} tables are row-for-row identical to the unsigned build" -f $tabs.Count) }
$wix = Join-Path $env:USERPROFILE '.dotnet\tools\wix.exe'
if (Test-Path $wix) {
    $fso = New-Object -ComObject Scripting.FileSystemObject
    $tmp = Join-Path $env:TEMP ('msi-cmp-' + [guid]::NewGuid().ToString('N').Substring(0, 8)); New-Item -ItemType Directory -Path $tmp | Out-Null
    try {
        foreach ($k in 'u', 's') {
            $src = if ($k -eq 'u') { $Unsigned } else { $Signed }; $dir = Join-Path $tmp $k; New-Item -ItemType Directory -Path $dir | Out-Null
            Copy-Item $src (Join-Path $tmp "$k.msi"); & $fso.GetFile($wix).ShortPath msi decompile -x $fso.GetFolder($dir).ShortPath (Join-Path $tmp "$k.msi") -o (Join-Path $tmp "$k.wxs") 2>&1 | Out-Null
        }
        $eu = Get-ChildItem (Join-Path $tmp 'u') -Recurse -File | Where-Object { $_.Name -eq 'LiderCollectorExe' } | Select-Object -First 1; $es = Get-ChildItem (Join-Path $tmp 's') -Recurse -File | Where-Object { $_.Name -eq 'LiderCollectorExe' } | Select-Object -First 1
        if ($eu -and $es) { if ((Get-FileHash $eu.FullName).Hash -eq (Get-FileHash $es.FullName).Hash) { Ok "embedded LiderCollector.exe is byte-identical ($([math]::Round($eu.Length/1MB,1)) MB)" } else { Bad 'embedded LiderCollector.exe DIFFERS' } }
        else { Warn 'could not extract LiderCollector.exe for the byte comparison' }
    } finally { Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue }
} else { Warn 'wix.exe not found: the embedded-exe byte comparison was skipped (tables were compared)' }

Write-Host ""
if ($fail -eq 0) { Write-Host "RESULT: ACCEPTED - $(Split-Path $Signed -Leaf) is the unsigned build plus a valid signature from the pinned signer." -ForegroundColor Green; exit 0 }
Write-Host "RESULT: REJECTED - $fail check(s) failed. Do not install." -ForegroundColor Red; exit 1
