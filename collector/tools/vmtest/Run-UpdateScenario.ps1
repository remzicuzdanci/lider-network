#Requires -Version 5.1
<#
.SYNOPSIS
    Observer + fault injector for the Collector self-update on a REAL Windows service. Run elevated on a TEST VM that already has the signed baseline Collector installed
    and enrolled, while a signed higher version is published to ONLY that computer. It never installs anything itself and never signs or alters packages.

.DESCRIPTION
    It records, once a second, the service state, the version, the update worker process and the new lines of update-audit.log into a timeline CSV, applies the chosen fault at the chosen
    phase, waits for update-result.json to be reported, and then checks the result against what that scenario must produce.
    Scenarios (see README.md):  Happy | UnhealthyNewVersion | RollbackCannotReinstall | CrlUnreachable | InstallerBusy | WorkerSurvivesServiceStop
    A scenario FAILS the run (exit 1) if the identity files changed, the service is not running at the end, or the expected final status/version is not reached.

.EXAMPLE
    .\Run-UpdateScenario.ps1 -Scenario Happy -BaselineVersion 1.3.0 -TargetVersion 1.4.0 -ServerIp 192.168.20.61
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateSet('Happy', 'UnhealthyNewVersion', 'RollbackCannotReinstall', 'CrlUnreachable', 'InstallerBusy', 'WorkerSurvivesServiceStop')][string]$Scenario,
    [Parameter(Mandatory)][string]$BaselineVersion,
    [Parameter(Mandatory)][string]$TargetVersion,
    [Parameter(Mandatory)][string]$ServerIp,
    [int]$TimeoutMinutes = 25,
    [string]$OutDir = (Join-Path (Get-Location) ("scenario-$Scenario-" + (Get-Date -Format 'yyyyMMdd-HHmmss')))
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole('Administrators')) { throw 'run elevated' }
$Svc = 'LiderITONECollector'; $Data = Join-Path $env:ProgramData 'LiderCollector'
$Audit = Join-Path $Data 'update-audit.log'; $Result = Join-Path $Data 'update-result.json'; $Rule = 'LIDER-VMTEST-block-server'
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$Timeline = Join-Path $OutDir 'timeline.csv'; $Findings = New-Object System.Collections.Generic.List[string]; $Failed = $false
function Note($m) { Write-Host "[scenario] $m"; $Findings.Add($m) }
function Fail($m) { $script:Failed = $true; Note "FAIL: $m" }
function Ver { try { $o = (Get-CimInstance Win32_Service -Filter "Name='$Svc'").PathName; $e = if ($o.StartsWith('"')) { $o.Split('"')[1] } else { $o.Split(' ')[0] }; (Get-Item $e).VersionInfo.FileVersion } catch { '?' } }
function Hashes { 'collector.json', 'secure.dat' | ForEach-Object { $p = Join-Path $Data $_; "$_=" + $(if (Test-Path $p) { (Get-FileHash $p -Algorithm SHA256).Hash } else { 'MISSING' }) } }
function SvcState { $s = Get-Service $Svc -ErrorAction SilentlyContinue; if ($s) { [string]$s.Status } else { 'missing' } }
function Worker { @(Get-Process -Name 'LiderCollectorUpdate' -ErrorAction SilentlyContinue).Count -gt 0 }
function Block { if (-not (Get-NetFirewallRule -DisplayName $Rule -ErrorAction SilentlyContinue)) { New-NetFirewallRule -DisplayName $Rule -Direction Outbound -Action Block -RemoteAddress $ServerIp -Protocol TCP | Out-Null }; Note 'fault: outbound traffic to the server is BLOCKED (VM firewall rule)' }
function Unblock { Get-NetFirewallRule -DisplayName $Rule -ErrorAction SilentlyContinue | Remove-NetFirewallRule }

# ── pre-flight ────────────────────────────────────────────────────────────────
$before = Hashes
if ((Ver) -notlike "$BaselineVersion*") { throw "installed version is $(Ver), expected the baseline $BaselineVersion" }
if ((SvcState) -ne 'Running') { throw 'the service must be running before the scenario' }
if (Test-Path $Result) { throw 'update-result.json already exists: let the service report it first' }
Note "baseline $(Ver); identity: $($before -join ' | ')"
if ($Scenario -eq 'CrlUnreachable') { Block }                       # the CRL lives on the same server: the preflight must postpone the update
if ($Scenario -eq 'InstallerBusy') { $mutex = New-Object System.Threading.Mutex($false, 'Global\_MSIExecute'); if (-not $mutex.WaitOne(0)) { throw 'Windows Installer is already busy' }; Note 'fault: Global\_MSIExecute is held (an install appears to be running)' }

'time,service,version,worker_alive,audit_line' | Set-Content $Timeline
$seen = 0; $start = Get-Date; $workerAliveWhileServiceStopped = $false; $injected = $false; $stoppedSeen = $false
while (((Get-Date) - $start).TotalMinutes -lt $TimeoutMinutes) {
    $st = SvcState; $w = Worker; $new = @(); if (Test-Path $Audit) { $all = @(Get-Content $Audit); if ($all.Count -gt $seen) { $new = $all[$seen..($all.Count - 1)]; $seen = $all.Count } }
    foreach ($l in ($new | Where-Object { $_ })) { Add-Content $Timeline ('{0:HH:mm:ss},{1},{2},{3},"{4}"' -f (Get-Date), $st, (Ver), $w, ($l -replace '"', "'")) }
    if (-not $new) { Add-Content $Timeline ('{0:HH:mm:ss},{1},{2},{3},' -f (Get-Date), $st, (Ver), $w) }
    if ($st -eq 'Stopped') { $stoppedSeen = $true; if ($w) { $workerAliveWhileServiceStopped = $true } }
    $joined = ($new -join "`n")
    # fault injection at a phase boundary
    if (-not $injected -and $joined -match '"phase":"install","status":"ok"') {
        if ($Scenario -eq 'UnhealthyNewVersion') { Block; $injected = $true }                          # the new version can never get a heartbeat accepted -> must roll back
        if ($Scenario -eq 'RollbackCannotReinstall') { Block; Get-ChildItem (Join-Path $Data 'updates') -Recurse -Filter 'previous-*.msi' | Remove-Item -Force; Note 'fault: the saved previous MSI was deleted'; $injected = $true }
    }
    if ((Test-Path $Result) -or ($Scenario -in 'CrlUnreachable', 'InstallerBusy' -and ((Get-Date) - $start).TotalMinutes -ge 4)) { break }
    Start-Sleep -Seconds 1
}
Unblock; if ($Scenario -eq 'InstallerBusy' -and $mutex) { $mutex.ReleaseMutex() }

# ── judge ───────────────────────────────────────────────────────────────────────
$res = if (Test-Path $Result) { Get-Content $Result -Raw | ConvertFrom-Json } else { $null }
$after = Hashes
if (($before -join '|') -ne ($after -join '|')) { Fail "identity files changed: before [$($before -join ' ')] after [$($after -join ' ')]" } else { Note 'identity files (collector.json, secure.dat) are byte-identical' }
if ((SvcState) -ne 'Running') { Fail "service is $(SvcState) at the end" } else { Note 'service is running at the end' }
switch ($Scenario) {
    'Happy' { if (-not $res -or $res.status -ne 'success') { Fail "expected success, got $($res.status): $($res.error)" }; if ((Ver) -notlike "$TargetVersion*") { Fail "version is $(Ver), expected $TargetVersion" } }
    'WorkerSurvivesServiceStop' { if (-not $res -or $res.status -ne 'success') { Fail "expected success, got $($res.status)" }; if (-not $stoppedSeen) { Fail 'the service was never seen stopped, nothing to prove' } elseif (-not $workerAliveWhileServiceStopped) { Fail 'the update worker was NOT alive while the service was stopped' } else { Note 'the update worker stayed alive while Windows Installer stopped the service' } }
    'UnhealthyNewVersion' { if (-not $res -or $res.status -ne 'rolled_back') { Fail "expected rolled_back, got $($res.status): $($res.error)" }; if ((Ver) -notlike "$BaselineVersion*") { Fail "version is $(Ver), expected the baseline $BaselineVersion after rollback" } }
    'RollbackCannotReinstall' { if (-not $res -or $res.status -ne 'rollback_failed') { Fail "expected rollback_failed, got $($res.status)" } else { Note "needs a person, as designed: $($res.error)" } }
    'CrlUnreachable' { if ($res -and $res.status -eq 'success') { Fail 'the update was installed although the CRL was unreachable' } elseif ((Ver) -notlike "$BaselineVersion*") { Fail "version changed to $(Ver) although the CRL was unreachable" } else { Note 'update postponed, baseline untouched (see update-last-attempt.json / service log)' } }
    'InstallerBusy' { if ($res -and $res.status -eq 'success') { Fail 'installed while Windows Installer was busy' } elseif ((Ver) -notlike "$BaselineVersion*") { Fail 'version changed while Windows Installer was busy' } else { Note 'no install was attempted while the installer was busy' } }
}
Copy-Item $Audit (Join-Path $OutDir 'update-audit.log') -ErrorAction SilentlyContinue
if ($res) { $res | ConvertTo-Json | Set-Content (Join-Path $OutDir 'update-result.json') }
$Findings | Set-Content (Join-Path $OutDir 'findings.txt')
Write-Host "`nFiles: $OutDir  (timeline.csv, update-audit.log, update-result.json, findings.txt)"
if ($Failed) { Write-Host 'SCENARIO FAILED' -ForegroundColor Red; exit 1 } else { Write-Host 'SCENARIO PASSED' -ForegroundColor Green }
