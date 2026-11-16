#Requires -Version 5.1
# Tests for Set-CollectorHttps.ps1 with a faked service/MSI (real temp files). Run: powershell -NoProfile -ExecutionPolicy Bypass -File .\Test-SetCollectorHttps.ps1
$ErrorActionPreference = 'Stop'
$tools = Split-Path $PSScriptRoot -Parent
$pass = 0; $fail = 0
function Check([string]$n, $c) { if ($c) { $script:pass++; Write-Host "  ok   $n" } else { $script:fail++; Write-Host "  FAIL $n" -ForegroundColor Red } }

$root = Join-Path ([IO.Path]::GetTempPath()) ("https-test-" + [guid]::NewGuid().ToString('N').Substring(0, 8)); New-Item -ItemType Directory $root | Out-Null
$Data = Join-Path $root 'LiderCollector'; $BackupRoot = Join-Path $root 'bk'
$RealRoot = Join-Path $tools 'pki\lider-root-ca.pem'; $Leaf = Join-Path $tools 'pki\lider-codesign-public.pem'
$RealPin = (Get-FileHash $RealRoot -Algorithm SHA256).Hash
. (Join-Path $tools 'Set-CollectorHttps.ps1') -LibraryOnly -RootPem $RealRoot -RootSha256 $RealPin -WaitMinutes 1
$StopTimeoutSec = 1; $StartTimeoutSec = 3

$F = @{}
function Start-Sleep { param([int]$Seconds, [int]$Milliseconds) }
function Get-SvcStatus { if ($F.svc) { $F.svc } else { 'Missing' } }
function Get-SvcPid { if ($F.svc -eq 'Running') { 77 } else { 0 } }
function Get-Process { param($Id, $ErrorAction) $null }
function Stop-Service { param($Name, $ErrorAction) $F.calls += 'stop'; if ($F.stopWorks) { $F.svc = 'Stopped' } }
function Start-Service { param($Name, $ErrorAction) $F.calls += 'start'; $F.svc = 'Running' }
function Installed { [pscustomobject]@{ ProductCode = '{X}'; Version = $F.ver; LocalPackage = 'x' } }
function Test-HttpsPort { param($Url) $F.port }
function Get-AcceptedInventorySince { param($LogDir, $Since) [pscustomobject]@{ InventorySent = $F.inventory; Problems = 0 } }
$realCopy = ${function:Copy-FileShared}
function Copy-FileShared { param($Src, $Dst) if ($F.copyBoom -and $Dst -like '*lider-root-ca.pem') { throw 'disk full' }; & $realCopy $Src $Dst }

function New-World([hashtable]$o = @{}) {
    if (Test-Path $script:Data) { Remove-Item $script:Data -Recurse -Force }
    New-Item -ItemType Directory -Force (Join-Path $script:Data 'logs') | Out-Null
    $script:cfgText = '{"server_url":"http://192.168.20.61","allow_http":true,"collector_id":4,"enrolled_bios_uuid":"B-1","heartbeat_interval_seconds":300,"delta_sync_enabled":true}'
    $script:cfgText | Set-Content (Join-Path $script:Data 'collector.json') -NoNewline
    [IO.File]::WriteAllBytes((Join-Path $script:Data 'secure.dat'), [byte[]](1..40))
    [IO.File]::WriteAllBytes((Join-Path $script:Data 'queue.db'), [byte[]](1..200))
    $script:F = @{ svc = 'Running'; ver = '1.4.0'; stopWorks = $true; port = $true; inventory = $true; calls = @(); copyBoom = $false }
    foreach ($k in $o.Keys) { $script:F[$k] = $o[$k] }
    $script:WhatIfPreference = $false; $script:ServerUrl = 'https://192.168.20.61'; $script:RootPem = $script:RealRoot; $script:RootSha256 = $script:RealPin
    $script:sec = (Get-Sha256Shared (Join-Path $script:Data 'secure.dat')); $script:q = (Get-Sha256Shared (Join-Path $script:Data 'queue.db'))
}
function Run { $r = @(Invoke-HttpsSwitch 3>$null); [int]$r[-1] }
function Cfg { Get-Content (Join-Path $Data 'collector.json') -Raw | ConvertFrom-Json }
function Untouched { ((Get-Content (Join-Path $Data 'collector.json') -Raw) -eq $cfgText) -and -not (Test-Path (Join-Path $Data 'lider-root-ca.pem')) }

Write-Host '== parse'; $e = $null; [void][Management.Automation.Language.Parser]::ParseFile((Join-Path $tools 'Set-CollectorHttps.ps1'), [ref]$null, [ref]$e); Check 'no syntax errors' ($e.Count -eq 0)

Write-Host '== happy path'
New-World; $rc = Run; $c = Cfg
Check 'exit 0' ($rc -eq 0)
Check 'server_url is https and custom_ca_cert_path points at the copied root' ($c.server_url -eq 'https://192.168.20.61' -and $c.custom_ca_cert_path -eq (Join-Path $Data 'lider-root-ca.pem'))
Check 'the copied root is byte-identical to the pinned root' ((Get-Sha256Shared (Join-Path $Data 'lider-root-ca.pem')) -eq $RealPin.ToLower())
Check 'every other key is preserved' ($c.collector_id -eq 4 -and $c.enrolled_bios_uuid -eq 'B-1' -and $c.heartbeat_interval_seconds -eq 300 -and $c.delta_sync_enabled -eq $true -and $c.allow_http -eq $true)
Check 'service running; secure.dat and queue.db untouched' ($F.svc -eq 'Running' -and (Get-Sha256Shared (Join-Path $Data 'secure.dat')) -eq $sec -and (Get-Sha256Shared (Join-Path $Data 'queue.db')) -eq $q)
Check 'a backup of the old collector.json exists' (@(Get-ChildItem $Data -Filter 'collector.json.before-https-*').Count -eq 1)
Check 'the service was stopped before the file was changed' (($F.calls -join ',') -match '^stop,start')

Write-Host '== refusals change nothing'
New-World @{ ver = '1.3.0' }; Check '1.3.0 is refused (cannot verify a private CA)' ((Run) -eq 2 -and (Untouched) -and $F.calls.Count -eq 0)
New-World; $RootSha256 = ('0' * 64); Check 'a root that is not the pinned one is refused' ((Run) -eq 2 -and (Untouched))
New-World; $RootPem = $Leaf; $RootSha256 = (Get-FileHash $Leaf -Algorithm SHA256).Hash; Check 'a file that is not a CA certificate is refused' ((Run) -eq 2 -and (Untouched))
New-World; $ServerUrl = 'http://192.168.20.61'; Check 'an http address is refused' ((Run) -eq 2 -and (Untouched))
New-World @{ port = $false }; Check 'an unreachable HTTPS port is refused before anything is stopped' ((Run) -eq 2 -and (Untouched) -and $F.calls.Count -eq 0)
New-World @{ stopWorks = $false }; Check 'a service that will not stop: nothing changed, service still running' ((Run) -eq 2 -and (Untouched) -and $F.svc -eq 'Running')

Write-Host '== failure: the old settings come back'
New-World @{ inventory = $false }; $rc = Run
Check 'no accepted inventory -> exit 1' ($rc -eq 1)
Check 'collector.json is byte-identical to the original again' ((Get-Content (Join-Path $Data 'collector.json') -Raw) -eq $cfgText)
Check 'the service is running again' ($F.svc -eq 'Running')
Check 'secure.dat and queue.db untouched' ((Get-Sha256Shared (Join-Path $Data 'secure.dat')) -eq $sec -and (Get-Sha256Shared (Join-Path $Data 'queue.db')) -eq $q)
New-World @{ copyBoom = $true }; $threw = $false; try { Invoke-HttpsSwitch 3>$null | Out-Null } catch { $threw = $true }
Check 'an unexpected error propagates, the config is restored and the service runs' ($threw -and (Get-Content (Join-Path $Data 'collector.json') -Raw) -eq $cfgText -and $F.svc -eq 'Running')

Write-Host '== -WhatIf'
New-World; $WhatIfPreference = $true; $rc = Run; $WhatIfPreference = $false
Check 'exit 0, nothing stopped, nothing written' ($rc -eq 0 -and $F.calls.Count -eq 0 -and (Untouched))

Remove-Item $root -Recurse -Force -ErrorAction SilentlyContinue
Write-Host ''; Write-Host ("{0} passed, {1} failed" -f $pass, $fail); exit $(if ($fail) { 1 } else { 0 })
