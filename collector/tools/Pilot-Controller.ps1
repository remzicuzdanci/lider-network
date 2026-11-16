#Requires -Version 5.1
<#
.SYNOPSIS
    ITMANAGAMENT pilot controller (1.1.1 -> 1.4.0 over http; no HTTPS). Runs INSIDE the single-file launcher. Nothing happens to the Collector until the approval code is typed.
    Never restarts the computer; never touches the domain, GPO, ESET, other applications, the certificate store, or the Collector's identity (collector_id, secure.dat, collector.json keys, queue).

    Phases:  0 guards (right machine, right state)  ->  1 read-only pre-flight  ->  2 approval gate  ->  3 verified backup + upgrade + automatic rollback on failure (Run-PilotUpgrade)
             ->  4 final check + report (file + clipboard). NO HTTPS switch in this pilot.
#>
[CmdletBinding()]
param([Parameter(Mandatory)][string]$PackageDir, [Parameter(Mandatory)][string]$CodeSha256, [string]$WorkRoot = (Join-Path $env:ProgramData 'LiderCollector-pilot'))
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$Expect = @{ Computer = 'ITMANAGAMENT'; CollectorId = 14; From = '1.1.'; To = '1.4.0'; Server = '192.168.20.61'; Service = 'LiderITONECollector' }
$Data = Join-Path $env:ProgramData 'LiderCollector'
$Bundle = Join-Path $PackageDir 'bundle'
New-Item -ItemType Directory -Force $WorkRoot | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'; $report = Join-Path $WorkRoot "pilot-report-$stamp.txt"
$log = New-Object System.Collections.Generic.List[string]
function W([string]$t, [string]$c = 'Gray') { $log.Add($t); Write-Host $t -ForegroundColor $c }
function Stop-Here([string]$why, [int]$code = 2) { W "`nSTOPPED: $why" 'Red'; W 'Nothing was changed on this computer.' 'Yellow'; Finish $code }
function Finish([int]$code) {
    [IO.File]::WriteAllLines($report, $log.ToArray(), (New-Object Text.UTF8Encoding($false)))
    try { Get-Content -Raw -LiteralPath $report | Set-Clipboard; Write-Host "`nReport saved: $report  (and copied to the clipboard - paste it into the chat)" -ForegroundColor Cyan } catch { Write-Host "`nReport saved: $report" -ForegroundColor Cyan }
    exit $code
}
function Cfg { try { Get-Content (Join-Path $Data 'collector.json') -Raw | ConvertFrom-Json } catch { $null } }
function Installed { $i = New-Object -ComObject WindowsInstaller.Installer; foreach ($p in $i.RelatedProducts('{B6A3F291-9D4E-4C7B-8F12-3A5E6D1C0847}')) { return [pscustomobject]@{ Code = $p; Version = [string]$i.ProductInfo($p, 'VersionString') } }; $null }
function Sha256Hex([string]$s) { ([BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes($s))) -replace '-', '').ToLower() }
function Child([string]$File, [string[]]$ArgList, [string]$Dir, [string]$Out) {
    $p = Start-Process powershell.exe -ArgumentList (@('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$File`"") + $ArgList) -WorkingDirectory $Dir -Wait -PassThru -NoNewWindow -RedirectStandardOutput $Out -RedirectStandardError "$Out.err"
    $p.ExitCode
}
function Show-Tail([string]$f, [int]$n = 60) { if (Test-Path $f) { Get-Content $f -Tail $n | ForEach-Object { W "    $_" } } }

W "LIDER Collector pilot: $($Expect.From)x -> $($Expect.To) on $($env:COMPUTERNAME)   $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" 'Cyan'

# ── 0 guards ─────────────────────────────────────────────────────────────
W "`n== 0. Is this the right computer in the right state?" 'Cyan'
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole('Administrators')) { Stop-Here 'not running as administrator' }
if ($env:COMPUTERNAME -ne $Expect.Computer) { Stop-Here "this package is for $($Expect.Computer) only; this computer is $($env:COMPUTERNAME)" }
$cfg = Cfg; $inst = Installed
if (-not $inst -or $inst.Version -notlike "$($Expect.From)*") { Stop-Here "installed Collector is '$($inst.Version)', expected $($Expect.From)x" }
if (-not $cfg -or [int]$cfg.collector_id -ne $Expect.CollectorId) { Stop-Here "collector_id is '$($cfg.collector_id)', expected $($Expect.CollectorId)" }
if ([string]$cfg.server_url -notlike "*$($Expect.Server)*") { Stop-Here "the Collector talks to '$($cfg.server_url)', expected $($Expect.Server)" }
$svc = Get-Service $Expect.Service -ErrorAction SilentlyContinue; if (-not $svc -or $svc.Status -ne 'Running') { Stop-Here 'the Collector service is not running' }
W "  ok  $($env:COMPUTERNAME), Collector $($inst.Version), collector_id $($cfg.collector_id), server $($cfg.server_url), service Running" 'Green'
$idBefore = [pscustomobject]@{ id = $cfg.collector_id; bios = [bool]$cfg.enrolled_bios_uuid; secure = (Get-FileHash (Join-Path $Data 'secure.dat') -Algorithm SHA256).Hash }

# ── 1 pre-flight (read only) ─────────────────────────────────────────────
W "`n== 1. Read-only pre-flight" 'Cyan'
$pf = Join-Path $WorkRoot "preflight-$stamp.txt"
$rc = Child (Join-Path $PackageDir 'Get-PilotPreflight.ps1') @('-ReportDir', "`"$WorkRoot`"") $PackageDir $pf
Get-Content $pf | Where-Object { $_ -match '\[(WARN|BLOCK)\]|RESULT:' } | ForEach-Object { W $_ }
if ($rc -eq 2) { Stop-Here 'the pre-flight found a blocking item (see above)' }
$pending = @(Get-Content $pf | Where-Object { $_ -match 'reboot is pending' }).Count -gt 0
if ($pending) {
    W "`n  A Windows restart is pending on this computer. This pilot does NOT restart it and does not depend on it." 'Yellow'
    W '  Best: restart it yourself when convenient, then run this file again. Or type CONTINUE to go on without restarting.' 'Yellow'
    if ((Read-Host '  Type CONTINUE to proceed (anything else stops, nothing changed)') -cne 'CONTINUE') { Stop-Here 'stopped by the operator: restart the computer first, then run again' 0 }
}

# ── 2 approval gate ──────────────────────────────────────────────────────
W "`n== 2. Approval" 'Cyan'
W '  If you continue: the Collector service is stopped for about 1-3 minutes, a VERIFIED backup of its data (collector.json, secure.dat, queue.db + WAL/SHM) is taken,'
W "  the signed $($Expect.To) MSI is installed over $($inst.Version) (identity and data stay), the service is started and checked (collector_id $($Expect.CollectorId), heartbeat, inventory)."
W '  If anything fails, the saved version is reinstalled automatically. No restart, no GPO/ESET/domain change, no other application is touched.'
$ok = $false
for ($i = 1; $i -le 3 -and -not $ok; $i++) { $c = Read-Host '  Enter the approval code to start the upgrade (just press Enter to stop without any change)'; if (-not $c) { break }; if ((Sha256Hex $c.Trim()) -eq $CodeSha256) { $ok = $true } else { W '  wrong code' 'Yellow' } }
if (-not $ok) { Stop-Here 'no valid approval code: nothing was changed' 0 }

# ── 3 backup + upgrade ───────────────────────────────────────────────────
W "`n== 3. Verified backup, upgrade, automatic rollback on failure" 'Cyan'
$ulog = Join-Path $WorkRoot "upgrade-$stamp.log"
$t0 = Get-Date
$rc = Child (Join-Path $Bundle 'Run-PilotUpgrade.ps1') @('-Yes', '-AutoRollback') $Bundle $ulog
Show-Tail $ulog 70
W "  Run-PilotUpgrade exit code: $rc" $(if ($rc -eq 0) { 'Green' } else { 'Red' })
$inst2 = Installed
if ($rc -ne 0) {
    W "`nThe upgrade did NOT pass. Installed version now: $(if ($inst2) { $inst2.Version } else { 'none' }); service: $((Get-Service $Expect.Service -ErrorAction SilentlyContinue).Status). Rollback to the saved version was attempted automatically (see lines above)." 'Red'
    W "Backup folder: C:\ProgramData\LiderCollector-pilot-backup   Do not delete it. Send this report." 'Yellow'
    Finish 2
}

# ── 4 final check ────────────────────────────────────────────────────────
W "`n== 4. Final check (the connection stays on plain http: this pilot does NOT switch to HTTPS)" 'Cyan'
$cfg2 = Cfg; $svc2 = Get-Service $Expect.Service -ErrorAction SilentlyContinue; $inst3 = Installed; $v3 = if ($inst3) { [string]$inst3.Version } else { '' }; $id3 = if ($cfg2 -and $cfg2.PSObject.Properties['collector_id']) { [int]$cfg2.collector_id } else { -1 }; $bios3 = [bool]($cfg2 -and $cfg2.PSObject.Properties['enrolled_bios_uuid'] -and $cfg2.enrolled_bios_uuid); $url3 = if ($cfg2 -and $cfg2.PSObject.Properties['server_url']) { [string]$cfg2.server_url } else { '' }
$allOk = $true
function Chk([string]$m, [bool]$ok) { if ($ok) { W "  [ OK ] $m" 'Green' } else { $script:allOk = $false; W "  [FAIL] $m" 'Red' } }
Chk "installed version is $($Expect.To)" ($v3 -like "$($Expect.To)*")
Chk 'service running' ($svc2 -and $svc2.Status -eq 'Running')
Chk "collector_id is still $($Expect.CollectorId)" ($id3 -eq $Expect.CollectorId)
Chk 'device identity (BIOS UUID) still recorded' $bios3
Chk 'secure.dat (protected API key) byte-identical' ((Get-FileHash (Join-Path $Data 'secure.dat') -Algorithm SHA256).Hash -eq $idBefore.secure)
W "  server address now: $url3"
Chk "server address unchanged ($($cfg.server_url))" ($url3 -eq [string]$cfg.server_url)
$inv = 0; $miss = 0; foreach ($f in @(Get-ChildItem (Join-Path $Data 'logs') -Filter 'collector-*.log' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime | Select-Object -Last 2)) { $fs = New-Object IO.FileStream($f.FullName, 'Open', 'Read', 'ReadWrite'); $sr = New-Object IO.StreamReader($fs); try { while (-not $sr.EndOfStream) { $l = $sr.ReadLine(); if ($l -match '^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})' -and [datetime]::ParseExact($Matches[1], 'yyyy-MM-dd HH:mm:ss', $null) -ge $t0) { if ($l -match 'Inventory sync sent') { $inv++ }; if ($l -match 'Heartbeat missed') { $miss++ } } } } finally { $sr.Dispose() } }
Chk "inventory accepted by the server since the upgrade started ($inv time(s))" ($inv -gt 0)
Chk "no missed heartbeat since the upgrade started ($miss)" ($miss -eq 0)
W "`nThe server side (one record for collector #14, heartbeat, inventory, software list) is compared with the pre-upgrade baseline by the assistant; send this report." 'Cyan'
W "RESULT: $(if ($allOk) { 'PASS' } else { 'FAIL - see [FAIL] lines' })" $(if ($allOk) { 'Green' } else { 'Red' })
Finish $(if ($allOk) { 0 } else { 2 })
