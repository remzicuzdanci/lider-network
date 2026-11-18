#Requires -Version 5.1
# Tests for the application-usage helper handling of Pilot-Upgrade.ps1 (Stop-UserHelpers): the helper ("LiderCollector.exe --user-agent <servicePid>") runs in the user's session, exits by
# itself shortly after the service is gone, and would otherwise keep LiderCollector.exe locked for the installer.
#   Part 1: the decision logic against fakes.  Part 2: REAL processes - a copy of powershell.exe named LiderCollector.exe is started with "--user-agent" in its command line, its file is
#   really locked, and the real function must release it. A process named LiderCollector.exe WITHOUT "--user-agent" (the service itself) must never be touched.
# Run:  powershell -NoProfile -ExecutionPolicy Bypass -File .\Test-PilotUpgradeHelper.ps1      (changes nothing outside %TEMP%)
$ErrorActionPreference = 'Stop'
$tools = Split-Path $PSScriptRoot -Parent
$pass = 0; $fail = 0
function Check([string]$name, $cond) { if ($cond) { $script:pass++; Write-Host "  ok   $name" } else { $script:fail++; Write-Host "  FAIL $name" -ForegroundColor Red } }
. (Join-Path $tools 'Pilot-Upgrade.ps1') -LibraryOnly

Write-Host '== part 1: decision logic (fakes)'
$script:calls = New-Object System.Collections.ArrayList; $script:polls = 0; $script:helpers = @(); $script:exitAfterPolls = -1
function Start-Sleep { param([int]$Seconds, [int]$Milliseconds) $script:polls++ }
function Get-CimInstance { param($ClassName, $Filter, $ErrorAction)
    if ($script:exitAfterPolls -ge 0 -and $script:polls -ge $script:exitAfterPolls) { return @() }
    return $script:helpers }
function Stop-Process { param($Id, [switch]$Force, $ErrorAction) [void]$script:calls.Add("kill:$Id") }
function Info($m) { }
function Warn($m) { }
$user = [pscustomobject]@{ ProcessId = 111; Name = 'LiderCollector.exe'; CommandLine = '"C:\Program Files\Lider\LiderCollector.exe" --user-agent 4242 5' }
$svc  = [pscustomobject]@{ ProcessId = 222; Name = 'LiderCollector.exe'; CommandLine = '"C:\Program Files\Lider\LiderCollector.exe"' }
$odd  = [pscustomobject]@{ ProcessId = 333; Name = 'LiderCollector.exe' }   # no CommandLine property at all (access denied): must not throw

$script:helpers = @(); $script:calls.Clear(); $script:polls = 0; Stop-UserHelpers 5
Check 'no helper: nothing is ended and nothing waits' ($script:calls.Count -eq 0 -and $script:polls -eq 0)

$script:helpers = @($user); $script:exitAfterPolls = 3; $script:calls.Clear(); $script:polls = 0; Stop-UserHelpers 20
Check 'a helper that exits by itself is waited for and NOT killed' ($script:calls.Count -eq 0 -and $script:polls -ge 3)

$script:helpers = @($user); $script:exitAfterPolls = -1; $script:calls.Clear(); $script:polls = 0
# the clock does not advance with the faked sleep, so a short wait is used
Stop-UserHelpers 1
Check 'a helper that stays is ended (only that process)' ($script:calls.Count -eq 1 -and $script:calls[0] -eq 'kill:111')

$script:helpers = @($user, $svc, $odd); $script:calls.Clear(); Stop-UserHelpers 1
Check 'the service process (no --user-agent) and a process without readable command line are never ended' (($script:calls -join ',') -eq 'kill:111')

# integrated: Stop-CollectorService ends the helper once the service is stopped, on both paths (stopping now / already stopped)
$script:svcState = 'Running'; $script:helpers = @($user); $script:calls.Clear()
function Get-SvcStatus { $script:svcState }
function Get-SvcPid { 0 }
function Stop-Service { param($Name, $ErrorAction) $script:svcState = 'Stopped' }
function Get-Process { param($Id, $ErrorAction) $null }
$ok = Stop-CollectorService 5
Check 'Stop-CollectorService: stopped service and the helper is ended afterwards' ($ok -eq $true -and ($script:calls -join ',') -eq 'kill:111')
$script:calls.Clear(); $ok = Stop-CollectorService 5
Check 'Stop-CollectorService: an already stopped service still clears a lingering helper' ($ok -eq $true -and ($script:calls -join ',') -eq 'kill:111')

# restore the real commands for part 2
Remove-Item Function:\Start-Sleep, Function:\Get-CimInstance, Function:\Stop-Process, Function:\Get-SvcStatus, Function:\Get-SvcPid, Function:\Stop-Service, Function:\Get-Process, Function:\Info, Function:\Warn
function Info($m) { Write-Host "       [pilot] $m" }
function Warn($m) { Write-Host "       [warn]  $m" }

Write-Host '== part 2: real processes and a real file lock'
$dir = Join-Path ([IO.Path]::GetTempPath()) ('lider-helper-test-' + [guid]::NewGuid().ToString('N').Substring(0, 8)); New-Item -ItemType Directory $dir | Out-Null
$exe = Join-Path $dir 'LiderCollector.exe'; Copy-Item "$env:WINDIR\System32\WindowsPowerShell\v1.0\powershell.exe" $exe
function Start-Fake([string]$extra, [int]$seconds) { Start-Process -FilePath $exe -ArgumentList @('-NoProfile', '-Command', "Start-Sleep $seconds # $extra") -PassThru -WindowStyle Hidden }
function Test-Locked([string]$path) { try { $fs = [IO.File]::Open($path, 'Open', 'ReadWrite', 'None'); $fs.Dispose(); $false } catch { $true } }
$procs = @()
try {
    $helper = Start-Fake '--user-agent 4242 5' 120; $procs += $helper
    $service = Start-Fake 'service' 120; $procs += $service
    Start-Sleep -Milliseconds 1500
    Check 'the helper (copy of the exe) really holds the file: it cannot be replaced like the installer would' (Test-Locked $exe)
    $before = @(Get-CimInstance Win32_Process -Filter "Name='LiderCollector.exe'" | Where-Object { $_.CommandLine -match '--user-agent' -and $_.ExecutablePath -eq $exe })
    Check 'the real process list shows the helper by its command line' ($before.Count -eq 1 -and $before[0].ProcessId -eq $helper.Id)
    Stop-UserHelpers 2
    Start-Sleep -Milliseconds 500
    Check 'the real helper was ended after the wait' ($null -eq (Get-Process -Id $helper.Id -ErrorAction SilentlyContinue))
    Check 'the service-like process (no --user-agent) is untouched' ($null -ne (Get-Process -Id $service.Id -ErrorAction SilentlyContinue))
    Stop-Process -Id $service.Id -Force; Start-Sleep -Milliseconds 800
    $replaced = $false; try { Copy-Item "$env:WINDIR\System32\WindowsPowerShell\v1.0\powershell.exe" $exe -Force; $replaced = $true } catch { }
    Check 'with both processes gone the exe file can be replaced (what the installer needs)' $replaced

    # a helper that exits by itself while we wait is not killed (it simply disappears)
    $h2 = Start-Fake '--user-agent 4242 5' 3; $procs += $h2; Start-Sleep -Milliseconds 800
    $t0 = Get-Date; Stop-UserHelpers 30; $elapsed = ((Get-Date) - $t0).TotalSeconds
    Check 'a helper that exits on its own ends the wait early (well before the 30 s limit)' ($elapsed -lt 15 -and $null -eq (Get-Process -Id $h2.Id -ErrorAction SilentlyContinue))
}
finally {
    foreach ($p in $procs) { try { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue } catch { } }
    Start-Sleep -Milliseconds 500; Remove-Item $dir -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host ("`n{0} passed, {1} failed" -f $pass, $fail)
if ($fail) { exit 1 }
