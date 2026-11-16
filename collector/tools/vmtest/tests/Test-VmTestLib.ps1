#Requires -Version 5.1
# Tests of the pure helpers in VmTestLib.ps1 on the build PC (no service, no VM). Needs the test PKI at -PkiDir for the CRL tests.
param([string]$PkiDir = (Join-Path $env:USERPROFILE 'LiderVmTestPki'))
$ErrorActionPreference = 'Stop'
$here = Split-Path $PSScriptRoot -Parent
$pass = 0; $fail = 0
function T([string]$n, $c) { if ($c) { $script:pass++; Write-Host "  ok   $n" } else { $script:fail++; Write-Host "  FAIL $n" -ForegroundColor Red } }
. (Join-Path $here 'VmTestLib.ps1')
function Get-ExeVersion { '1.4.1.0' }

Write-Host '== stage / next scenario'
T 'no collector = S0' ((Get-VmStage '' '') -eq 'S0')
T '1.3.0 = S1' ((Get-VmStage '1.3.0' 'http://x') -eq 'S1')
T '1.4.0 over http = S1b' ((Get-VmStage '1.4.0' 'http://x') -eq 'S1b')
T '1.4.0 over https = S2' ((Get-VmStage '1.4.0' 'https://x:18443') -eq 'S2')
T '2.0.0 = Unknown' ((Get-VmStage '2.0.0' '') -eq 'Unknown')
$cat = @([pscustomobject]@{ Name = 'A'; Stage = 'S2' }, [pscustomobject]@{ Name = 'B'; Stage = 'S2' }, [pscustomobject]@{ Name = 'C'; Stage = 'S1' })
T 'first pending of the stage' ((Get-NextScenario 'S2' $cat @('A')).Name -eq 'B')
T 'nothing pending -> null' ($null -eq (Get-NextScenario 'S2' $cat @('A', 'B')))
T 'other stage ignored' ((Get-NextScenario 'S1' $cat @()).Name -eq 'C')
T 'status match' ((Test-ResultStatusMatches 'rolled_back' @('rolled_back', 'failed')) -and -not (Test-ResultStatusMatches 'success' @('failed')))

Write-Host '== queue markers (real SQLite via winsqlite3)'
$db = Join-Path ([IO.Path]::GetTempPath()) ("q-" + [guid]::NewGuid().ToString('N').Substring(0, 6) + '.db')
try {
    [void][WSqlite]::Run($db, 'PRAGMA journal_mode=WAL; CREATE TABLE queue (id INTEGER PRIMARY KEY AUTOINCREMENT, endpoint TEXT NOT NULL, payload TEXT NOT NULL, created INTEGER NOT NULL DEFAULT (strftime(''%s'',''now'')), attempts INTEGER NOT NULL DEFAULT 0); INSERT INTO queue (endpoint,payload) VALUES (''events'',''{}'')', 6)
    $m = Add-QueueMarkers $db 5
    $r = Test-QueueMarkers $db $m
    T 'markers intact -> ok' ($r.Ok -and $r.Detail -match '5 markers')
    [void][WSqlite]::Run($db, "DELETE FROM vmtest_marker WHERE n = 3", 2)
    T 'a lost marker is detected' (-not (Test-QueueMarkers $db $m).Ok)
    $m2 = Add-QueueMarkers $db 2
    Remove-Item $db, "$db-wal", "$db-shm" -ErrorAction SilentlyContinue
    T 'a deleted / recreated queue.db is detected' (-not (Test-QueueMarkers $db $m2).Ok)
    [void][WSqlite]::Run($db, 'CREATE TABLE queue (id INTEGER PRIMARY KEY)', 6)
    T 'a fresh empty queue.db has no markers' (-not (Test-QueueMarkers $db $m2).Ok)
} finally { Remove-Item $db, "$db-wal", "$db-shm" -ErrorAction SilentlyContinue }

Write-Host '== independent CRL evaluation (test PKI)'
if (Test-Path (Join-Path $PkiDir 'test-pins.json')) {
    $root = Join-Path $PkiDir 'public\test-root-ca.pem'; $sign = Join-Path $PkiDir 'public\test-update-signing-cert.pem'; $tls = Join-Path $PkiDir 'public\server.crt'
    function Crl($n) { [IO.File]::ReadAllBytes((Join-Path $PkiDir "public\crl\$n.crl")) }
    T 'valid CRL: signer Good' ((Test-CrlFile (Crl 'valid') $root $sign).State -eq 'Good')
    T 'valid CRL: server cert Good' ((Test-CrlFile (Crl 'valid') $root $tls).State -eq 'Good')
    T 'revoked-codesign: signer Revoked' ((Test-CrlFile (Crl 'revoked-codesign') $root $sign).State -eq 'Revoked')
    T 'revoked-codesign: server cert still Good' ((Test-CrlFile (Crl 'revoked-codesign') $root $tls).State -eq 'Good')
    T 'revoked-tls: server cert Revoked' ((Test-CrlFile (Crl 'revoked-tls') $root $tls).State -eq 'Revoked')
    T 'expired CRL: Expired' ((Test-CrlFile (Crl 'expired') $root $sign).State -eq 'Expired')
    T 'a CRL cut short is Invalid' ((Test-CrlFile ((Crl 'valid')[0..40]) $root $sign).State -eq 'Invalid')
    $tampered = (Crl 'valid'); $tampered[$tampered.Length - 5] = $tampered[$tampered.Length - 5] -bxor 0xFF
    T 'a tampered CRL fails the signature' ((Test-CrlFile $tampered $root $sign).State -in 'BadSignature', 'Invalid')
    T 'the test root does not validate a CRL claimed for another issuer (signature)' ((Test-CrlFile (Crl 'valid') $sign $sign).State -eq 'BadSignature')
    T 'validity window honours a future "now"' ((Test-CrlFile (Crl 'valid') $root $sign ((Get-Date).ToUniversalTime().AddDays(40))).State -eq 'Expired')
} else { Write-Host '  (skipped: no test PKI at ' $PkiDir ')' }


Write-Host '== suite structure'
$suite = Join-Path $here 'Run-VmTestSuite.ps1'
$ast = [Management.Automation.Language.Parser]::ParseFile($suite, [ref]$null, [ref]$null)
$fns = @($ast.FindAll({ param($n) $n -is [Management.Automation.Language.FunctionDefinitionAst] }, $true) | ForEach-Object { $_.Name })
$src = Get-Content $suite -Raw
$cat = [regex]::Matches($src, "Name = '(\w+)';\s*Stage = '(\w+)';\s+Run = \{ (Run-\w+) \}")
T 'the catalog has 18 scenarios' ($cat.Count -eq 18)
T 'scenario names are unique' (@($cat | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique).Count -eq $cat.Count)
T 'every scenario function exists' (@($cat | Where-Object { $fns -notcontains $_.Groups[3].Value }).Count -eq 0)
T 'stages are S0 / S1 / S1b / S2' (@($cat | Where-Object { $_.Groups[2].Value -notin 'S0', 'S1', 'S1b', 'S2' }).Count -eq 0)
T 'every stage that scenarios start from is reachable (S0 -> S1 -> S1b -> S2)' ((@('S0', 'S1', 'S1b', 'S2') | Where-Object { $st = $_; @($cat | Where-Object { $_.Groups[2].Value -eq $st }).Count -gt 0 }).Count -eq 4)
T 'no production host or port is referenced by the VM scripts' (-not (Select-String -Path $suite, (Join-Path $here 'VmTestLib.ps1') -Pattern 'liderone\.uci\.local|:8081|vmtest\.lidernetwork' -Quiet))
T 'the suite never touches the Windows certificate store (no Import-Certificate / certutil -addstore)' (-not (Select-String -Path $suite, (Join-Path $here 'VmTestLib.ps1') -Pattern 'Import-Certificate|-addstore|Import-PfxCertificate' -Quiet))
T 'every fault injection is undone in the finally block (firewall, installer mutex)' ($src -match 'finally \{ try \{ Unblock-Server \} catch \{ \}; Release-MsiMutex \}')
Write-Host ("`n{0} passed, {1} failed" -f $pass, $fail); exit $(if ($fail) { 1 } else { 0 })
