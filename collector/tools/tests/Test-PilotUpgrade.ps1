#Requires -Version 5.1
# Tests for Pilot-Upgrade.ps1: the service, Windows Installer and msiexec are replaced by a small stateful fake; the files (queue.db, WAL, SHM, ...) are real temp files.
# Run:  powershell -NoProfile -ExecutionPolicy Bypass -File .\Test-PilotUpgrade.ps1
$ErrorActionPreference = 'Stop'
$tools = Split-Path $PSScriptRoot -Parent
$pass = 0; $fail = 0
function Check([string]$name, $cond) { if ($cond) { $script:pass++; Write-Host "  ok   $name" } else { $script:fail++; Write-Host "  FAIL $name" -ForegroundColor Red } }

$root = Join-Path ([IO.Path]::GetTempPath()) ("pilot-upgrade-test-" + [guid]::NewGuid().ToString('N').Substring(0, 8))
New-Item -ItemType Directory -Path $root | Out-Null
$Data = Join-Path $root 'ProgramData-LiderCollector'
$BackupRoot = Join-Path $root 'backup'
$StopTimeoutSec = 1; $StartTimeoutSec = 3; $HealthWaitSec = 0; $QueueFreeWaitSec = 1
. (Join-Path $tools 'Pilot-Upgrade.ps1') -LibraryOnly -BackupRoot $BackupRoot -StopTimeoutSec 1 -StartTimeoutSec 3 -HealthWaitSec 0

# ── fake world ────────────────────────────────────────────────────────────────────────────────────
$F = @{}
$real_CopyShared = ${function:Copy-FileShared}
function Start-Sleep { param([int]$Seconds, [int]$Milliseconds) }
function icacls { }
function Test-Msi { param($Path) }
function Get-SvcStatus { if ($F.svc) { $F.svc } else { 'Missing' } }
function Get-SvcPid { if ($F.svc -eq 'Running') { 4242 } else { 0 } }
function Get-Process { param($Id, $ErrorAction) $null }
function Get-CimInstance { param($ClassName, $Filter, $ErrorAction) [pscustomobject]@{ StartMode = 'Auto'; ProcessId = 0 } }
function Stop-Service { param($Name, $ErrorAction) $F.calls += 'stop'; if ($F.stopWorks) { $F.svc = 'Stopped' } }
function Start-Service { param($Name, $ErrorAction) $F.calls += 'start'; if ($F.startFail -gt 0) { $F.startFail--; throw 'cannot start' }; $F.svc = 'Running' }
function Installed { if ($F.ver) { [pscustomobject]@{ ProductCode = "{PC-$($F.ver)}"; Version = $F.ver; LocalPackage = $F.pkg } } else { $null } }
function Copy-FileShared { param($Src, $Dst)
    & $real_CopyShared $Src $Dst
    $leaf = Split-Path $Src -Leaf
    if ($leaf -eq 'queue.db') { $F.svcAtQueueCopy = $F.svc }
    if ($F.corrupt -and $leaf -eq $F.corrupt) { [IO.File]::AppendAllText($Dst, 'x') }
}
function Invoke-Msiexec { param([string[]]$MsiArgs)
    if ($F.msiBoom) { throw 'msiexec exploded' }
    if ($MsiArgs[0] -eq '/x') { $F.calls += 'msi:uninstall'; $F.ver = $null; $F.svc = 'Missing'; return 0 }
    $leaf = Split-Path ($MsiArgs[1].Trim('"')) -Leaf; $F.calls += "msi:install:$leaf"
    $isNew = $leaf -like 'new-*'
    if ($isNew -and $F.failNew) { if (-not $F.selfRollback) { $F.ver = $null; $F.svc = 'Missing' }; return 1603 }
    $F.ver = $F.msiVer[$leaf]; $F.pkg = $MsiArgs[1].Trim('"')
    $F.svc = $(if ($F.installLeavesStopped) { 'Stopped' } else { 'Running' })
    if ($isNew -and $F.mutateIdentity) { $j = Get-Content (Join-Path $Data 'collector.json') -Raw | ConvertFrom-Json; $j.collector_id = 'CHANGED'; $j | ConvertTo-Json | Set-Content (Join-Path $Data 'collector.json') }
    return 0
}

function New-World([hashtable]$over = @{}) {
    if (Test-Path $script:Data) { Remove-Item $script:Data -Recurse -Force }
    if (Test-Path $script:BackupRoot) { Remove-Item $script:BackupRoot -Recurse -Force }
    New-Item -ItemType Directory -Force -Path (Join-Path $script:Data 'logs') | Out-Null
    '{"server_url":"http://x","collector_id":"abc-123","enrolled_bios_uuid":"BIOS-1"}' | Set-Content (Join-Path $script:Data 'collector.json')
    [IO.File]::WriteAllBytes((Join-Path $script:Data 'secure.dat'), [byte[]](1..64))
    [IO.File]::WriteAllBytes((Join-Path $script:Data 'queue.db'), ([byte[]](0..255) * 40))
    [IO.File]::WriteAllBytes((Join-Path $script:Data 'queue.db-wal'), ([byte[]](5..250) * 20))
    [IO.File]::WriteAllBytes((Join-Path $script:Data 'queue.db-shm'), ([byte[]](9..99) * 10))
    'x' | Set-Content (Join-Path $script:Data 'logs\collector-20261116.log')
    $old = Join-Path $script:root 'installed-1.2.0.msi'; $new = Join-Path $script:root 'new-1.3.0.msi'
    'old-msi-bytes' | Set-Content $old; 'new-msi-bytes' | Set-Content $new
    $script:F = @{ svc = 'Running'; ver = '1.2.0'; pkg = $old; calls = @(); stopWorks = $true; startFail = 0; failNew = $false; selfRollback = $false; installLeavesStopped = $false
        mutateIdentity = $false; corrupt = $null; msiBoom = $false; svcAtQueueCopy = $null; msiVer = @{ 'new-1.3.0.msi' = '1.3.0'; 'previous-1.2.0.msi' = '1.2.0' } }
    foreach ($k in $over.Keys) { $script:F[$k] = $over[$k] }
    $script:Msi = $new; $script:NoAutoRollback = $false; $script:WhatIfPreference = $false
    $script:before = @{}; foreach ($q in 'queue.db', 'queue.db-wal', 'queue.db-shm', 'collector.json', 'secure.dat') { $script:before[$q] = Get-Sha256Shared (Join-Path $script:Data $q) }
}
function Queue-Unchanged { foreach ($q in 'queue.db', 'queue.db-wal', 'queue.db-shm', 'secure.dat') { if ((Get-Sha256Shared (Join-Path $Data $q)) -ne $before[$q]) { return $false } }; return $true }
function Run-Upgrade { $r = @(Invoke-Upgrade 3>$null); return [int]$r[-1] }

Write-Host '== parse'
$errs = $null; [void][System.Management.Automation.Language.Parser]::ParseFile((Join-Path $tools 'Pilot-Upgrade.ps1'), [ref]$null, [ref]$errs)
Check 'Pilot-Upgrade.ps1 has no syntax errors' ($errs.Count -eq 0)

Write-Host '== regression: the original failure (a file held open by a writer)'
New-World
$w = New-Object IO.FileStream((Join-Path $Data 'queue.db'), [IO.FileMode]::Open, [IO.FileAccess]::ReadWrite, ([IO.FileShare]'ReadWrite,Delete'))
try {
    $threw = $false; try { Get-FileHash (Join-Path $Data 'queue.db') -Algorithm SHA256 | Out-Null } catch { $threw = $true }
    Check 'Get-FileHash fails on the held file (this was the bug)' $threw
    $h = $null; try { $h = Get-Sha256Shared (Join-Path $Data 'queue.db') } catch { }
    Check 'Get-Sha256Shared reads the same held file and returns the right hash' ($h -eq $before['queue.db'])
    $c = Join-Path $root 'copy.db'; $ok = $true; try { & $real_CopyShared (Join-Path $Data 'queue.db') $c } catch { $ok = $false }
    Check 'Copy-FileShared copies the held file byte-for-byte' ($ok -and (Get-Sha256Shared $c) -eq $before['queue.db'])
} finally { $w.Dispose() }

Write-Host '== happy path'
New-World
$rc = Run-Upgrade
Check 'exit 0' ($rc -eq 0)
Check 'new version installed' ($F.ver -eq '1.3.0')
Check 'service running at the end' ($F.svc -eq 'Running')
Check 'service was STOPPED when queue.db was copied' ($F.svcAtQueueCopy -eq 'Stopped')
Check 'order: stop before the MSI install' (($F.calls -join ',') -match '^stop,msi:install:new-1.3.0.msi')
$bk = Get-ChildItem $BackupRoot -Directory | Select-Object -First 1
foreach ($q in 'queue.db', 'queue.db-wal', 'queue.db-shm') { Check "backup holds $q identical to the source" ((Test-Path (Join-Path $bk.FullName "LiderCollector\$q")) -and (Get-Sha256Shared (Join-Path $bk.FullName "LiderCollector\$q")) -eq $before[$q]) }
Check 'backup holds the previous MSI for rollback' (Test-Path (Join-Path $bk.FullName 'previous-1.2.0.msi'))
Check 'queue and identity files untouched' (Queue-Unchanged)

Write-Host '== backup phase failures: nothing installed, service restored'
New-World; $lock = New-Object IO.FileStream((Join-Path $Data 'queue.db'), [IO.FileMode]::Open, [IO.FileAccess]::Read, [IO.FileShare]::None)
try { $rc = Run-Upgrade } finally { $lock.Dispose() }
Check 'queue.db still locked after the stop -> exit 2' ($rc -eq 2)
Check '  no msiexec call' (-not (($F.calls -join ',') -match 'msi:'))
Check '  service Running again' ($F.svc -eq 'Running')
Check '  old version still installed' ($F.ver -eq '1.2.0')
New-World @{ stopWorks = $false }; $rc = Run-Upgrade
Check 'service that will not stop -> exit 2, nothing installed' ($rc -eq 2 -and -not (($F.calls -join ',') -match 'msi:') -and $F.ver -eq '1.2.0')
Check '  service still Running' ($F.svc -eq 'Running')
New-World @{ corrupt = 'queue.db-wal' }; $rc = Run-Upgrade
Check 'backup copy differs from source -> exit 2, nothing installed' ($rc -eq 2 -and -not (($F.calls -join ',') -match 'msi:') -and $F.ver -eq '1.2.0')
Check '  service restarted after the failed backup' ($F.svc -eq 'Running')
Check '  queue untouched' (Queue-Unchanged)

Write-Host '== install failures: old version and service come back'
New-World @{ failNew = $true; selfRollback = $true }; $rc = Run-Upgrade
Check 'msiexec fails, Windows Installer rolled itself back -> exit 1, old version, service Running' ($rc -eq 1 -and $F.ver -eq '1.2.0' -and $F.svc -eq 'Running')
New-World @{ failNew = $true; selfRollback = $false }; $rc = Run-Upgrade
Check 'msiexec fails and leaves nothing installed -> previous MSI reinstalled' ($rc -eq 1 -and $F.ver -eq '1.2.0' -and $F.svc -eq 'Running' -and (($F.calls -join ',') -match 'msi:install:previous-1.2.0.msi'))
Check '  queue untouched' (Queue-Unchanged)
New-World @{ installLeavesStopped = $true; startFail = 3 }; $rc = Run-Upgrade
Check 'new version cannot start -> automatic rollback to 1.2.0, service Running, exit 1' ($rc -eq 1 -and $F.ver -eq '1.2.0' -and $F.svc -eq 'Running' -and (($F.calls -join ',') -match 'msi:uninstall'))
New-World @{ mutateIdentity = $true }; $rc = Run-Upgrade
Check 'identity changed by the install -> automatic rollback, exit 1' ($rc -eq 1 -and $F.ver -eq '1.2.0' -and $F.svc -eq 'Running')
New-World @{ installLeavesStopped = $true; startFail = 3 }; $NoAutoRollback = $true; $rc = Run-Upgrade
Check '-NoAutoRollback: no uninstall, but the service is still not left stopped' ($rc -eq 1 -and -not (($F.calls -join ',') -match 'msi:uninstall') -and $F.svc -eq 'Running' -and $F.ver -eq '1.3.0')
$NoAutoRollback = $false

Write-Host '== unexpected exception: the finally block still starts the service'
New-World @{ msiBoom = $true }; $threw = $false; try { Invoke-Upgrade 3>$null | Out-Null } catch { $threw = $true }
Check 'exception propagated' $threw
Check 'service Running afterwards (it had been stopped for the backup)' ($F.svc -eq 'Running')
Check 'queue untouched' (Queue-Unchanged)

Write-Host '== -WhatIf changes nothing'
New-World; $WhatIfPreference = $true; $rc = Run-Upgrade; $WhatIfPreference = $false
Check 'exit 0' ($rc -eq 0)
Check 'no service stop/start, no msiexec' ($F.calls.Count -eq 0)
Check 'no backup folder created' (-not (Test-Path $BackupRoot) -or -not (Get-ChildItem $BackupRoot -ErrorAction SilentlyContinue))
Check 'still 1.2.0 and Running' ($F.ver -eq '1.2.0' -and $F.svc -eq 'Running')

Write-Host '== Rollback mode never overwrites the queue'
New-World; $prev = Join-Path $root 'previous-1.2.0.msi'; 'old' | Set-Content $prev; $F.ver = '1.3.0'; $F.msiVer['previous-1.2.0.msi'] = '1.2.0'
$ok = Invoke-Rollback $prev '1.2.0' 3>$null
Check 'rollback healthy, 1.2.0, Running' ([bool]$ok[-1] -and $F.ver -eq '1.2.0' -and $F.svc -eq 'Running')
Check 'queue.db/-wal/-shm and secure.dat byte-identical' (Queue-Unchanged)

Remove-Item $root -Recurse -Force -ErrorAction SilentlyContinue
Write-Host ''
Write-Host ("{0} passed, {1} failed" -f $pass, $fail)
exit $(if ($fail) { 1 } else { 0 })
