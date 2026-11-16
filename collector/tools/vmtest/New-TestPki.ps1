#Requires -Version 5.1
<#
.SYNOPSIS
    Creates the THROW-AWAY test PKI for the isolated VM tests: a test root CA, a test server (TLS) certificate, a test code-signing certificate and four pre-built CRLs.
    Completely independent of the LIDER production CA: new keys, other names ("LIDER VMTEST ... NOT PRODUCTION"), nothing is read from or written to the production PKI.

.DESCRIPTION
    Run it on the BUILD PC. Keys stay in -Dir\private (current user only). Only the PUBLIC part (-Dir\public) is ever copied to the test server or into a package.
    Refuses a -Dir that is inside a git work tree, that sits in a folder that looks like the production key vault, or that already holds a PKI (unless -Force).

    -Dir\public:   test-root-ca.pem, server.crt, server.key (the TLS key goes to the TEST server only), crl\*.crl (DER)
    -Dir\build:    TestBuildPins.g.cs, test-root-ca.pem, test-update-signing-cert.pem  (inputs of the test-pinned Collector build)
    -Dir\private:  root.key, codesign.key, codesign.pfx (+ password file)  - NEVER leave the build PC
    -Dir\test-pins.json: pins, host names, ports, CRL url

    CRLs (all signed by the test root, DER), served by the test gateway as /pki/vmtest-ca.crl:
      valid.crl            current, empty, valid 30 days
      revoked-codesign.crl lists the code-signing certificate
      revoked-tls.crl      lists the server certificate
      expired.crl          thisUpdate/nextUpdate in the past

.EXAMPLE
    .\New-TestPki.ps1 -Dir $env:USERPROFILE\LiderVmTestPki -ServerNames 192.168.20.61,vmtest.uci.local
#>
[CmdletBinding()]
param(
    [string]$Dir = (Join-Path $env:USERPROFILE 'LiderVmTestPki'),
    [Parameter(Mandatory)][string[]]$ServerNames,
    [int]$HttpPort = 18080,
    [int]$HttpsPort = 18443,
    [string]$OpenSsl,
    [switch]$Force
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if (-not $OpenSsl) {
    $OpenSsl = (Get-Command openssl.exe -ErrorAction SilentlyContinue).Source
    if (-not $OpenSsl) { foreach ($p in 'C:\Program Files\Git\usr\bin\openssl.exe', 'C:\Program Files\Git\mingw64\bin\openssl.exe') { if (Test-Path $p) { $OpenSsl = $p; break } } }
}
if (-not $OpenSsl -or -not (Test-Path $OpenSsl)) { throw 'openssl.exe not found (Git for Windows ships one). Pass -OpenSsl.' }

$Dir = [IO.Path]::GetFullPath($Dir)
if ($Dir -match '(?i)keyvault|lider-keyvault|\\LiderCA(\\|$)|/var/www') { throw "refusing: $Dir looks like a production key location" }
$probe = $Dir; while ($probe -and -not (Test-Path $probe)) { $probe = Split-Path $probe -Parent }
if ($probe) {
    $top = & git -C $probe rev-parse --show-toplevel 2>$null
    # a project repository must never contain test keys; a catch-all repository at the profile root is tolerated because the PKI folder ignores itself (.gitignore '*')
    if ($LASTEXITCODE -eq 0 -and $top -and ([IO.Path]::GetFullPath($top).TrimEnd('\') -ne [IO.Path]::GetFullPath($env:USERPROFILE).TrimEnd('\'))) { throw "refusing: $Dir is inside the git work tree $top - test keys must never be committed" }
}
if ((Test-Path (Join-Path $Dir 'test-pins.json')) -and -not $Force) { throw "a test PKI already exists in $Dir (use -Force to replace it; the old test certificates then stop working everywhere)" }

foreach ($n in $ServerNames) { if ($n -notmatch '^[A-Za-z0-9.\-]+$') { throw "bad server name '$n'" } }
$ipRx = '^\d{1,3}(\.\d{1,3}){3}$'
$san = ($ServerNames | ForEach-Object { if ($_ -match $ipRx) { "IP:$_" } else { "DNS:$_" } }) -join ','
$cdp = "http://$($ServerNames[0]):$HttpPort/pki/vmtest-ca.crl"

if (Test-Path $Dir) { Remove-Item $Dir -Recurse -Force }
foreach ($d in 'private', 'public\crl', 'build', 'ca') { New-Item -ItemType Directory -Force (Join-Path $Dir $d) | Out-Null }
'*' | Set-Content (Join-Path $Dir '.gitignore') -Encoding ascii
$ca = Join-Path $Dir 'ca'; $priv = Join-Path $Dir 'private'; $pub = Join-Path $Dir 'public'; $bld = Join-Path $Dir 'build'

function Ossl { $ErrorActionPreference = 'Continue'; $o = & $OpenSsl @args 2>&1 | Out-String; if ($LASTEXITCODE -ne 0) { throw "openssl $($args -join ' ') failed: $o" } }
function Unix($p) { $p -replace '\\', '/' }

# ---- one openssl config for everything (profiles are extension sections) ----
$cfg = Join-Path $ca 'openssl.cnf'
@"
[ca]
default_ca = CA_default
[CA_default]
dir = $(Unix $ca)
database = `$dir/index.txt
new_certs_dir = `$dir/newcerts
serial = `$dir/serial
crlnumber = `$dir/crlnumber
private_key = $(Unix $priv)/root.key
certificate = $(Unix $ca)/root.crt
default_md = sha256
default_days = 730
default_crl_days = 30
policy = policy_any
unique_subject = no
copy_extensions = none
[policy_any]
commonName = supplied
organizationName = optional
[req]
distinguished_name = dn
prompt = no
[dn]
CN = x
[v3_root]
basicConstraints = critical,CA:true,pathlen:0
keyUsage = critical,keyCertSign,cRLSign
subjectKeyIdentifier = hash
[v3_tls]
basicConstraints = critical,CA:false
keyUsage = critical,digitalSignature,keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = $san
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid
crlDistributionPoints = URI:$cdp
[v3_codesign]
basicConstraints = critical,CA:false
keyUsage = critical,digitalSignature
extendedKeyUsage = codeSigning
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid
crlDistributionPoints = URI:$cdp
"@ | Set-Content $cfg -Encoding ascii
New-Item -ItemType Directory -Force (Join-Path $ca 'newcerts') | Out-Null
'' | Set-Content (Join-Path $ca 'index.txt') -NoNewline -Encoding ascii; '1000' | Set-Content (Join-Path $ca 'serial') -Encoding ascii; '1000' | Set-Content (Join-Path $ca 'crlnumber') -Encoding ascii

function Subj($cn) { $f = Join-Path $ca ("req-" + [guid]::NewGuid().ToString('N').Substring(0, 6) + '.cnf'); (Get-Content $cfg -Raw) -replace '(?m)^CN = x$', "CN = $cn" | Set-Content $f -Encoding ascii; $f }

# ---- root ----
$rc = Subj 'LIDER VMTEST Root CA (NOT PRODUCTION)'
Ossl genrsa -out (Join-Path $priv 'root.key') 3072
Ossl req -new -x509 -key (Join-Path $priv 'root.key') -sha256 -days 1825 -config $rc -extensions v3_root -out (Join-Path $ca 'root.crt')

function Issue([string]$name, [string]$cn, [string]$ext, [int]$days, [string]$keyDir) {
    $key = Join-Path $keyDir "$name.key"; $csr = Join-Path $ca "$name.csr"; $crt = Join-Path $ca "$name.crt"
    Ossl genrsa -out $key 2048
    Ossl req -new -key $key -config (Subj $cn) -out $csr
    Ossl ca -batch -config $cfg -extensions $ext -days $days -in $csr -out $crt -notext
    $crt
}
$tls = Issue 'server' 'LIDER VMTEST Server (NOT PRODUCTION)' 'v3_tls' 730 $pub
$cs = Issue 'codesign' 'LIDER VMTEST Code Signing (NOT PRODUCTION)' 'v3_codesign' 730 $priv
$tlsSerial = (& $OpenSsl x509 -in $tls -noout -serial).Split('=')[1]; $csSerial = (& $OpenSsl x509 -in $cs -noout -serial).Split('=')[1]

# ---- CRLs: each one is generated from a COPY of the database so the live database never keeps a revocation ----
function NewCrl([string]$file, [string[]]$revoke, [string]$last, [string]$next) {
    $tmp = Join-Path $Dir ('crltmp-' + [guid]::NewGuid().ToString('N').Substring(0, 6)); Copy-Item $ca $tmp -Recurse
    $c2 = Join-Path $tmp 'openssl.cnf'; (Get-Content $c2 -Raw).Replace((Unix $ca), (Unix $tmp)) | Set-Content $c2 -Encoding ascii
    foreach ($crt in $revoke) { Ossl ca -config $c2 -revoke $crt -crl_reason keyCompromise }
    $a = @('ca', '-config', $c2, '-gencrl', '-out', "$file.pem")
    if ($last) { $a += @('-crl_lastupdate', $last, '-crl_nextupdate', $next) }
    Ossl @a
    Ossl crl -in "$file.pem" -outform DER -out $file; Remove-Item "$file.pem"
    Remove-Item $tmp -Recurse -Force
}
$crl = Join-Path $pub 'crl'
NewCrl (Join-Path $crl 'valid.crl') @() $null $null
NewCrl (Join-Path $crl 'revoked-codesign.crl') @($cs) $null $null
NewCrl (Join-Path $crl 'revoked-tls.crl') @($tls) $null $null
$fmt = 'yyyyMMddHHmmss'; NewCrl (Join-Path $crl 'expired.crl') @() ((Get-Date).ToUniversalTime().AddDays(-20).ToString($fmt) + 'Z') ((Get-Date).ToUniversalTime().AddDays(-6).ToString($fmt) + 'Z')

# ---- public / build / private artefacts ----
Copy-Item (Join-Path $ca 'root.crt') (Join-Path $pub 'test-root-ca.pem')
Copy-Item $tls (Join-Path $pub 'server.crt')
Copy-Item (Join-Path $ca 'root.crt') (Join-Path $bld 'test-root-ca.pem')
Copy-Item $cs (Join-Path $bld 'test-update-signing-cert.pem')
Copy-Item $cs (Join-Path $pub 'test-update-signing-cert.pem')
$pw = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 24 | ForEach-Object { [char]$_ })
Set-Content (Join-Path $priv 'pfx-password.txt') $pw -NoNewline -Encoding ascii
$env:LIDER_TESTPKI_PFX_PW = $pw; Ossl pkcs12 -export -inkey (Join-Path $priv 'codesign.key') -in $cs -certfile (Join-Path $ca 'root.crt') -out (Join-Path $priv 'codesign.pfx') -passout env:LIDER_TESTPKI_PFX_PW; Remove-Item Env:LIDER_TESTPKI_PFX_PW

function Sha256Der($pem) { $c = New-Object Security.Cryptography.X509Certificates.X509Certificate2 $pem; [BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash($c.RawData)).Replace('-', '') }
$signer = (New-Object Security.Cryptography.X509Certificates.X509Certificate2 $cs).Thumbprint
$rootSha = Sha256Der (Join-Path $pub 'test-root-ca.pem')
$hosts = ($ServerNames -join ';')
@"
// GENERATED by tools\vmtest\New-TestPki.ps1 - TEST PKI pins. Never committed, never part of the production build.
namespace LiderCollector.Update;
internal static class TestBuildPins
{
    public const string SignerSha1 = "$signer";
    public const string RootSha256 = "$rootSha";
    public const string AllowedHosts = "$hosts";
}
"@ | Set-Content (Join-Path $bld 'TestBuildPins.g.cs') -Encoding utf8

[ordered]@{
    kind = 'LIDER VMTEST throw-away PKI - NOT PRODUCTION'; created_utc = (Get-Date).ToUniversalTime().ToString('o')
    server_names = $ServerNames; http_port = $HttpPort; https_port = $HttpsPort; crl_url = $cdp
    signer_sha1 = $signer; root_sha256 = $rootSha; server_cert_serial = $tlsSerial; codesign_serial = $csSerial
} | ConvertTo-Json | Set-Content (Join-Path $Dir 'test-pins.json') -Encoding utf8

# the private folder is for the current user only
& icacls $priv /inheritance:r /grant:r "$($env:USERNAME):(OI)(CI)F" | Out-Null
Remove-Item (Join-Path $ca 'req-*.cnf') -ErrorAction SilentlyContinue

Write-Host "TEST PKI ready: $Dir" -ForegroundColor Green
Write-Host "  root   SHA-256 : $rootSha"; Write-Host "  signer SHA-1   : $signer"; Write-Host "  hosts          : $hosts"; Write-Host "  CRL url        : $cdp"
Write-Host '  private\ never leaves this PC; public\ goes to the TEST server; build\ feeds Build-TestPkiMsi.ps1'



