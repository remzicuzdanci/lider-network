#Requires -Version 5.1
<#
.SYNOPSIS
    ONE command for the isolated Windows TEST VM: real-MSI upgrade, HTTPS + private test CA, CRL validity/revocation, updater kill, watchdog, reboot during update,
    failed install + rollback, identity and SQLite-queue preservation. Talks only to the TEST server (never to production) and trusts only the throw-away TEST PKI.

.DESCRIPTION
    Run in an ELEVATED PowerShell on the test VM (workgroup, no domain, no production data). It never opens remote access and installs nothing except the test Collector.
    The command is the same every time:

        powershell -NoProfile -ExecutionPolicy Bypass -File .\Run-VmTestSuite.ps1

    It looks at the VM, tells you which snapshot it is in (S0 clean / S1 baseline 1.3.0 / S1b 1.4.0 over http / S2 1.4.0 over https), runs the next scenario that has not passed yet
    (the result ledger is kept on the TEST SERVER, so a snapshot revert cannot erase it) and tells you which snapshot to restore before the next run.

    Other forms:   -List   (scenarios, ledger)       -Check   (pre-flight only, changes nothing)       -Scenario <name>   (one scenario)       -Yes   (no confirmation prompts)

    SNAPSHOTS (take them yourself in VMware, VM powered on or off):
      S0  clean Windows, Collector NOT installed                        -> taken BEFORE the first run
      S1  after scenario Baseline: Collector 1.3.0 installed + enrolled -> the suite tells you when
      S2  after scenario Https:    Collector 1.4.0 over https           -> the suite tells you when
    After every scenario that ends in a changed state the suite says "REVERT to snapshot Sx".
#>
[CmdletBinding()]
param(
    [string]$Scenario,
    [switch]$List,
    [switch]$Check,
    [switch]$Resume,
    [switch]$Yes
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
$Tools = Join-Path $Root 'tools'
$yesFlag = [bool]$Yes                                                  # the dot-sourced script has its own -Yes parameter and would overwrite ours
. (Join-Path $Tools 'Run-PilotUpgrade.ps1') -LibraryOnly        # Sha256, Get-IdentitySnapshot, Compare-Identity, Get-LogEvidence, Get-InstalledCollector, Get-ExeVersion
$Yes = $yesFlag
. (Join-Path $Root 'VmTestLib.ps1')                            # after it, so that OUR Say / Check win
Import-SuiteConfig (Join-Path $Root 'vmtest-config.json')
$script:Cfg | Add-Member -NotePropertyName Root -NotePropertyValue $Root -Force
New-Item -ItemType Directory -Force $script:Work, (Join-Path $script:Work 'state') | Out-Null
$StateFile = Join-Path $script:Work 'state\running.json'
$HB = [int]$script:Cfg.HeartbeatSeconds

# ───────────────────────────── small helpers ─────────────────────────────
function Get-StageNow {
    $inst = $null; try { $inst = Get-InstalledCollector } catch { }
    $v = if ($inst) { [string]$inst.Version } else { '' }
    Get-VmStage $v ([string](Get-ConfigValue 'server_url'))
}
function Get-Markers { $f = Join-Path $script:Work 'state\markers.json'; if (Test-Path $f) { Get-Content $f -Raw | ConvertFrom-Json } }
function Save-Markers($m) { $m | ConvertTo-Json | Set-Content (Join-Path $script:Work 'state\markers.json') -Encoding UTF8 }
function Get-QueueDb { Join-Path $script:Data 'queue.db' }
function Get-OurCollector {
    $s = Get-GwStatus; if (-not ($s -and $s.ok)) { return $null }
    $id = [string](Get-ConfigValue 'collector_id'); @($s.collectors | Where-Object { [string]$_.id -eq $id }) | Select-Object -First 1
}
function Get-HeartbeatMark { $c = Get-OurCollector; if ($c) { [string]$c.last_heartbeat_at } else { '' } }
function Wait-ServerHeartbeat([string]$Before, [int]$TimeoutSec) { Wait-Until { $n = Get-HeartbeatMark; $n -and $n -ne $Before } $TimeoutSec 5 }
function Get-ServerUpdateLogs { $s = Get-GwStatus; if ($s -and $s.ok) { @($s.update_logs) } else { @() } }
function Confirm-Snapshot([string]$Needed) {
    if ($Yes) { return }
    Write-Host "`nThis scenario CHANGES the VM. Is the VM at the snapshot '$Needed' (or a state equal to it)?" -ForegroundColor Yellow
    if ((Read-Host "Type YES to start") -cne 'YES') { throw 'cancelled' }
}
function Invoke-Child([string]$File, [string[]]$ArgList, [string]$WorkDir, [string]$LogFile) {
    $psi = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $File) + $ArgList
    $p = Start-Process powershell.exe -ArgumentList $psi -WorkingDirectory $WorkDir -Wait -PassThru -NoNewWindow -RedirectStandardOutput $LogFile -RedirectStandardError ($LogFile + '.err')
    return $p.ExitCode
}
function Copy-Bundle([string]$Name) {
    $dst = Join-Path $script:Work "bundle-$Name"; if (Test-Path $dst) { Remove-Item $dst -Recurse -Force }
    New-Item -ItemType Directory -Force $dst | Out-Null
    Copy-Item (Join-Path $Root "bundles\$Name\*") $dst -Recurse
    foreach ($f in 'Pilot-Upgrade.ps1', 'Run-PilotUpgrade.ps1', 'Set-CollectorHttps.ps1', 'Check-SigningTrust.ps1') { Copy-Item (Join-Path $Tools $f) $dst -Force }
    $dst
}
function Test-Identity($Before, [string]$Label = 'identity', [switch]$IgnoreServerUrl) {
    $after = Get-IdentitySnapshot $script:Data
    $d = @(Compare-Identity $Before $after | Where-Object { -not ($IgnoreServerUrl -and $_ -like 'server_url*') })
    Check "$Label (collector_id, server address, BIOS UUID, DPAPI key store) unchanged" ($d.Count -eq 0) ($d -join '; ')
}
function Test-Markers($Marker) { $r = Test-QueueMarkers (Get-QueueDb) $Marker; Check 'SQLite queue preserved (integrity ok, private markers still inside queue.db)' $r.Ok $r.Detail }
function Test-NoUpdaterLeft { Check 'no update worker process left, no stuck journal' ((-not (Test-UpdaterAlive)) -and ($null -eq (Read-Journal))) }
function Test-TaskGone { $null = & schtasks.exe /Query /TN LiderCollectorUpdateWatchdog 2>&1; $a = $LASTEXITCODE; $null = & schtasks.exe /Query /TN LiderCollectorUpdateWatchdogBoot 2>&1; $b = $LASTEXITCODE; Check 'recovery tasks disarmed after the update ended' (($a -ne 0) -and ($b -ne 0)) 'LiderCollectorUpdateWatchdog and ...Boot are not registered' }
function Show-Revert([string]$Snapshot, [string]$Why) { Say "`n>>> NEXT: revert the VM to snapshot $Snapshot ($Why), then run this command again." 'Cyan' }

# ───────────────────────────── scenario: Baseline (S0 -> S1) ─────────────────────────────
function Run-Baseline {
    if ((Get-StageNow) -ne 'S0') { throw 'a Collector is already installed: revert to snapshot S0 (clean Windows) first' }
    $msi = Join-Path $script:Work 'baseline-1.3.0-stamped.msi'
    Say 'Downloading the 1.3.0 baseline installer (stamped with a fresh single-use enrolment token) from the TEST server ...'
    if (-not (Invoke-Gw GET 'baseline.msi' @{} $msi)) { throw 'the test server did not deliver the baseline installer (is the 1.3.0 template installed there?)' }
    $inst = Get-InstalledCollector; Check 'no Collector installed before' ($null -eq $inst)
    $rc = (Start-Process msiexec.exe -ArgumentList @('/i', "`"$msi`"", '/qn', '/l*v', "`"$(Join-Path $script:Work 'baseline-install.log')`"") -Wait -PassThru).ExitCode
    Check 'MSI 1.3.0 installed (exit 0 / 3010)' ($rc -in 0, 3010) "msiexec exit $rc"
    Check 'service running' (Wait-Until { (Get-SvcState) -eq 'Running' } 90 2)
    $enrolled = Wait-Until { [bool](Get-ConfigValue 'collector_id') } 240 5
    Check 'enrolled on the TEST server (collector_id written)' $enrolled
    $since = [datetimeoffset]::Now.AddMinutes(-10)
    Check 'inventory accepted by the test server' (Wait-Until { (Get-LogEvidence (Join-Path $script:Data 'logs') $since).InventorySent } 300 10)
    Check 'talks to the test server over http (baseline)' ([string](Get-ConfigValue 'server_url') -eq (Get-HttpBase))
    Set-ConfigValue 'heartbeat_interval_seconds' $HB
    Stop-Service $script:Svc -Force; [void](Wait-Until { (Get-SvcState) -eq 'Stopped' } 60 1)
    $m = Add-QueueMarkers (Get-QueueDb) 5; Save-Markers $m
    Say "queue markers written into queue.db ($($m.Count) rows in table vmtest_marker)"
    Start-Service $script:Svc; Check 'service running again' (Wait-Until { (Get-SvcState) -eq 'Running' } 60 1)
    $s = Get-GwStatus; $cols = @($s.collectors)
    Check 'the test server knows exactly ONE collector, version 1.3.x' (($cols.Count -eq 1) -and ([string]$cols[0].agent_version -like '1.3.*')) "collectors: $($cols.Count)"
    Show-Revert 'S1' 'TAKE it now: this is the baseline all upgrade scenarios start from'
}

# ───────────────────────────── manual upgrade scenarios (S1) ─────────────────────────────
function Invoke-ManualUpgrade([string]$BundleName, [string]$Tag, [switch]$BlockServer) {
    if ((Get-StageNow) -ne 'S1') { throw 'this scenario starts from snapshot S1 (Collector 1.3.0 enrolled)' }
    $marker = Get-Markers; if (-not $marker) { throw 'markers.json missing: the snapshot S1 was not taken after the Baseline scenario' }
    Test-Markers $marker
    $idBefore = Get-IdentitySnapshot $script:Data
    $b = Copy-Bundle $BundleName
    $log = Join-Path $script:Work "manual-$Tag.log"
    $pre = Invoke-Child (Join-Path $b 'Run-PilotUpgrade.ps1') @('-PreflightOnly') $b (Join-Path $script:Work "manual-$Tag-preflight.log")
    Check 'bundle pre-flight (SHA256SUMS, signer pin, chain to the TEST root) passes' ($pre -eq 0) "exit $pre"
    if ($BlockServer) { Block-Server }
    $rc = Invoke-Child (Join-Path $b 'Run-PilotUpgrade.ps1') @('-Yes', '-AutoRollback') $b $log
    if ($BlockServer) { Unblock-Server }
    $rep = @(Get-ChildItem $b -Filter 'upgrade-report-*.txt' | Sort-Object LastWriteTime | Select-Object -Last 1)
    $verdict = if ($rep) { (Select-String -Path $rep[0].FullName -Pattern 'VERDICT' | Select-Object -First 1).Line } else { '' }
    Say "Run-PilotUpgrade exit $rc; $verdict"
    return [pscustomobject]@{ Exit = $rc; Verdict = $verdict; IdBefore = $idBefore; Marker = $marker; Bundle = $b; Report = $(if ($rep) { $rep[0].FullName } else { '' }) }
}
function Run-ManualUpgrade {
    $r = Invoke-ManualUpgrade 'upgrade' 'happy'
    Check 'Run-PilotUpgrade verdict PASS (exit 0)' ($r.Exit -eq 0) $r.Verdict
    Check 'installed MSI is 1.4.0 and the service executable is 1.4.0' (((Get-InstalledCollector).Version -like '1.4.0*') -and ((Get-CollectorVersion) -like '1.4.0*'))
    Check 'service running (the real service was replaced by Windows Installer)' ((Get-SvcState) -eq 'Running')
    Test-Identity $r.IdBefore; Test-Markers $r.Marker
    Check 'the new build identifies itself as TEST-PKI (pinned to the test CA, test server only)' ((Get-LogText ([datetimeoffset]::Now.AddMinutes(-30)) | Where-Object { $_ -match 'TEST-PKI BUILD' }).Count -gt 0)
    Check 'no re-enrolment happened' (-not (Get-LogEvidence (Join-Path $script:Data 'logs') ([datetimeoffset]::Now.AddMinutes(-30)) '1.4.0').ReEnrolled)
    $cols = @((Get-GwStatus).collectors); Check 'the test server still knows ONE collector' ($cols.Count -eq 1) "collectors: $($cols.Count)"
    Show-Revert 'S1b' 'no snapshot needed: run the command again, the next scenario (Https) continues from this state; take S2 after it'
}
function Run-ManualInstallFails {
    $r = Invoke-ManualUpgrade 'fault' 'installfails'
    Check 'the failing installer is reported as a failed upgrade (exit != 0)' ($r.Exit -ne 0) $r.Verdict
    Check 'baseline 1.3.0 is still installed (Windows Installer rolled back / automatic rollback)' ((Get-InstalledCollector).Version -like '1.3.*')
    Check 'service running' (Wait-Until { (Get-SvcState) -eq 'Running' } 120 2)
    Test-Identity $r.IdBefore; Test-Markers $r.Marker
    Check 'no 1.4.0 files left behind' ((Get-CollectorVersion) -like '1.3.*') (Get-CollectorVersion)
    Show-Revert 'S1' 'the VM was left in a rolled-back state'
}
function Run-ManualUnhealthy {
    $r = Invoke-ManualUpgrade 'upgrade' 'unhealthy' -BlockServer
    Check 'the upgrade is judged FAILED (no accepted inventory can reach the server)' ($r.Exit -ne 0) $r.Verdict
    Check 'automatic rollback: 1.3.0 is installed again' (Wait-Until { (Get-InstalledCollector).Version -like '1.3.*' } 120 3) "installed: $((Get-InstalledCollector).Version)"
    Check 'service running again' (Wait-Until { (Get-SvcState) -eq 'Running' } 120 2)
    Test-Identity $r.IdBefore; Test-Markers $r.Marker
    Show-Revert 'S1' 'the VM was left in a rolled-back state'
}

# ───────────────────────────── Https (S1b -> S2) and TLS / CRL ─────────────────────────────
function Run-Https {
    if ((Get-StageNow) -ne 'S1b') { throw 'this scenario continues after ManualUpgrade (Collector 1.4.0 over http)' }
    $marker = Get-Markers; $idBefore = Get-IdentitySnapshot $script:Data
    $root = Join-Path $Root 'pki\test-root-ca.pem'; $sign = Join-Path $Root 'pki\test-update-signing-cert.pem'
    Set-GwCrl 'valid'
    $crlSign = Test-CrlFromServer $sign; Check 'the CRL a client downloads is valid and does not list the signer' ($crlSign.State -eq 'Good') $crlSign.Detail
    Check 'the TEST root is NOT in the Windows certificate store (nothing was added)' (-not (Get-ChildItem Cert:\LocalMachine\Root | Where-Object { $_.Thumbprint -eq (New-Object Security.Cryptography.X509Certificates.X509Certificate2 $root).Thumbprint }))
    $unpinned = $true; try { [void](Invoke-WebRequest -Uri ((Get-HttpsBase) + '/') -UseBasicParsing -TimeoutSec 15) ; $unpinned = $false } catch { }
    Check 'a client WITHOUT the pinned test root refuses the server certificate (normal Windows trust)' $unpinned
    $log = Join-Path $script:Work 'set-https.log'
    $rc = Invoke-Child (Join-Path $Tools 'Set-CollectorHttps.ps1') @('-ServerUrl', (Get-HttpsBase), '-RootPem', "`"$root`"", '-RootSha256', $script:Cfg.Pins.RootSha256, '-WaitMinutes', '6') $Tools $log
    Check 'Set-CollectorHttps switched the Collector (exit 0)' ($rc -eq 0) "exit $rc; see $log"
    Check 'server_url is https and custom_ca_cert_path points at the pinned test root' (([string](Get-ConfigValue 'server_url') -eq (Get-HttpsBase)) -and ([string](Get-ConfigValue 'custom_ca_cert_path') -like '*lider-root-ca.pem'))
    Check 'service running' ((Get-SvcState) -eq 'Running')
    $hb = Get-HeartbeatMark; Check 'a heartbeat over HTTPS (private test CA + CRL) reaches the test server' (Wait-ServerHeartbeat $hb ($HB * 3 + 60))
    Test-Identity $idBefore 'identity (the server address changed on purpose; collector_id, BIOS UUID and key store did not)' -IgnoreServerUrl
    Test-Markers $marker
    Show-Revert 'S2' 'TAKE it now: this is the state all update / TLS-CRL scenarios start from'
}
function Invoke-TlsCrl([string]$State, [string]$CertKind, [string]$ExpectCrl) {
    if ((Get-StageNow) -ne 'S2') { throw 'this scenario starts from snapshot S2 (Collector 1.4.0 over https)' }
    $cert = Join-Path $Root $(if ($CertKind -eq 'tls') { 'pki\server.crt' } else { 'pki\test-update-signing-cert.pem' })
    Set-GwCrl 'valid'; Restart-Collector
    $hb = Get-HeartbeatMark; Check 'baseline: heartbeat works with a valid CRL' (Wait-ServerHeartbeat $hb ($HB * 3 + 60))
    Set-GwCrl $State
    $c = Test-CrlFromServer $cert; Check "the CRL clients now download is '$ExpectCrl' (independent parser)" ($c.State -eq $ExpectCrl) $c.Detail
    $t0 = [datetimeoffset]::Now; Restart-Collector      # a new process = a new TLS handshake = the certificate chain and CRL are evaluated again
    $hb = Get-HeartbeatMark
    $moved = Wait-ServerHeartbeat $hb ($HB * 3 + 30)
    if ($CertKind -eq 'tls') {
        Check 'FAIL CLOSED: the Collector does not talk to a server whose certificate is revoked / whose CRL is not current' (-not $moved)
        Check 'the failure is visible in the Collector log' ((Get-LogText $t0 | Where-Object { $_ -match 'Heartbeat missed|SSL|certificate|revocation' }).Count -gt 0)
    } else {
        Check 'the transport itself is unaffected when only the SIGNER certificate is revoked (the server certificate is fine)' $moved
    }
    Set-GwCrl 'valid'; Restart-Collector
    $hb = Get-HeartbeatMark; Check 'recovery: with a valid CRL the Collector talks again on its own' (Wait-ServerHeartbeat $hb ($HB * 4 + 60))
    Test-NoUpdaterLeft
}
function Run-TlsRevoked { Invoke-TlsCrl 'revoked-tls' 'tls' 'Revoked' }
function Run-TlsExpired { Invoke-TlsCrl 'expired' 'tls' 'Expired' }
function Run-TlsUnreachable {
    if ((Get-StageNow) -ne 'S2') { throw 'this scenario starts from snapshot S2' }
    $cert = Join-Path $Root 'pki\server.crt'
    Set-GwCrl 'valid'; Restart-Collector; $hb = Get-HeartbeatMark; Check 'baseline: heartbeat works' (Wait-ServerHeartbeat $hb ($HB * 3 + 60))
    Set-GwCrl 'unreachable'
    $c = Test-CrlFromServer $cert; Check 'the CRL cannot be downloaded (outage simulated)' ($c.State -eq 'Unreachable') $c.Detail
    $t0 = [datetimeoffset]::Now; Restart-Collector; $hb = Get-HeartbeatMark
    Check 'FAIL CLOSED: with the CRL unreachable the Collector does not talk to the server' (-not (Wait-ServerHeartbeat $hb ($HB * 3 + 30)))
    Set-GwCrl 'valid'; Restart-Collector; $hb = Get-HeartbeatMark
    Check 'recovery: the CRL is back -> the Collector talks again' (Wait-ServerHeartbeat $hb ($HB * 4 + 60))
}

# ───────────────────────────── automatic update scenarios (S2) ─────────────────────────────
function Initialize-UpdateScenario([string]$Name) {
    if ((Get-StageNow) -ne 'S2') { throw 'this scenario starts from snapshot S2 (Collector 1.4.0 over https)' }
    if ((Get-CollectorVersion) -notlike '1.4.0*') { throw "installed version is $(Get-CollectorVersion), expected 1.4.0 (revert to S2)" }
    if (Read-Journal) { throw 'an update journal exists: revert to S2' }
    Set-GwCrl 'valid'; foreach ($v in '1.4.1', '1.4.2') { [void](Remove-GwUpdate $v) }
    Restart-Collector
    $marker = Get-Markers; Test-Markers $marker
    $hb = Get-HeartbeatMark; Check 'baseline: the Collector talks to the test server' (Wait-ServerHeartbeat $hb ($HB * 3 + 60))
    return [pscustomobject]@{ Name = $Name; T0 = (Get-Date).ToUniversalTime(); IdBefore = (Get-IdentitySnapshot $script:Data); Marker = $marker; Timeline = (Join-Path $script:Work "timeline-$Name.csv") }
}
function Watch-Update($Ctx, [hashtable]$Hooks, [int]$TimeoutMin = 25, [scriptblock]$StopWhen) {
    # polls once a second; each hook (name -> scriptblock) fires once when its trigger holds. Returns facts observed.
    'time,service,version,journal_phase,updater_alive,audit' | Set-Content $Ctx.Timeline
    $fired = @{}; $seen = 0; $workerWhileStopped = $false; $stoppedSeen = $false; $end = (Get-Date).AddMinutes($TimeoutMin); $quiet = 0
    $facts = [ordered]@{ ResultStatus = $null; ResultMessage = $null; WorkerWhileStopped = $false; StoppedSeen = $false; Fired = @{} }
    while ((Get-Date) -lt $end) {
        $st = Get-SvcState; $w = Test-UpdaterAlive; $j = Read-Journal; $ph = if ($j) { [string]$j.phase } else { '' }
        $aud = @(Get-AuditEntries $Ctx.T0.AddSeconds(-2)); $new = @(); if ($aud.Count -gt $seen) { $new = $aud[$seen..($aud.Count - 1)]; $seen = $aud.Count }
        $line = '{0:HH:mm:ss},{1},{2},{3},{4},"{5}"' -f (Get-Date), $st, (Get-CollectorVersion), $ph, $w, (($new | ForEach-Object { "$($_.phase):$($_.status)" }) -join ' ')
        Add-Content $Ctx.Timeline $line
        if ($st -eq 'Stopped') { $stoppedSeen = $true; if ($w) { $workerWhileStopped = $true } }
        foreach ($k in $Hooks.Keys) { if (-not $fired.ContainsKey($k)) { $ok = $false; try { $ok = [bool](& $Hooks[$k].When $ph $new $aud) } catch { }; if ($ok) { $fired[$k] = Get-Date; Say "[hook $k] fired at phase '$ph'" 'Yellow'; & $Hooks[$k].Do } } }
        $res = @($aud | Where-Object { $_.phase -eq 'result' } | Select-Object -Last 1)
        if ($res) { $facts.ResultStatus = [string]$res[0].status; $facts.ResultMessage = [string]$res[0].message }
        $done = if ($StopWhen) { [bool](& $StopWhen $facts $ph $st) } else { ($null -ne $facts.ResultStatus) -and (-not $ph) -and ($st -eq 'Running') }
        if ($done) { $quiet++ } else { $quiet = 0 }
        if ($quiet -ge 20) { break }
        Start-Sleep -Seconds 1
    }
    $facts.WorkerWhileStopped = $workerWhileStopped; $facts.StoppedSeen = $stoppedSeen; $facts.Fired = $fired.Keys
    return [pscustomobject]$facts
}
function Judge-Update($Ctx, $Facts, [string[]]$ResultIn, [string[]]$VersionIn, [string[]]$ServerStatusIn) {
    Check "update ended with result $($ResultIn -join '/')" (Test-ResultStatusMatches ([string]$Facts.ResultStatus) $ResultIn) "result=$($Facts.ResultStatus) $($Facts.ResultMessage)"
    $v = Get-CollectorVersion
    Check "installed version is one of $($VersionIn -join ', ')" (@($VersionIn | Where-Object { $v -like "$_*" }).Count -gt 0) "version=$v"
    Check 'service running at the end' (Wait-Until { (Get-SvcState) -eq 'Running' } 120 2)
    Test-Identity $Ctx.IdBefore; Test-Markers $Ctx.Marker; Test-NoUpdaterLeft
    if ($ServerStatusIn) {
        $script:lastSrv = ''
        [void](Wait-Until { $l = @(Get-ServerUpdateLogs | Where-Object { [string]$_.collector_id -eq [string](Get-ConfigValue 'collector_id') } | Select-Object -First 1); if ($l) { $script:lastSrv = [string]$l[0].status }; $script:lastSrv -in $ServerStatusIn } 300 10)
        $last = $script:lastSrv
        Check "the test server recorded the attempt as $($ServerStatusIn -join '/')" ($last -in $ServerStatusIn) "server status=$last"
    }
}
function Publish-Update([string]$Version, [switch]$NoRestart) { $r = Publish-GwUpdate $Version; Check "version $Version published on the test server (pilot channel, verified against the TEST certificate)" ([bool]($r -and $r.ok)) "$($r.artisan)$($r.error)"; if (-not $NoRestart) { Restart-Collector } }

function Run-UpdateHappy {
    $c = Initialize-UpdateScenario 'UpdateHappy'; Publish-Update '1.4.1'
    $f = Watch-Update $c @{}
    Judge-Update $c $f @('success') @('1.4.1') @('success')
    Check 'Windows Installer stopped the service while the update worker stayed alive' ($f.StoppedSeen -and $f.WorkerWhileStopped) "service stopped seen: $($f.StoppedSeen), worker alive meanwhile: $($f.WorkerWhileStopped)"
    Test-TaskGone
    Check 'the new version is the TEST-PKI build too' ((Get-LogText ([datetimeoffset]$c.T0) | Where-Object { $_ -match 'TEST-PKI BUILD' }).Count -gt 0)
    Show-Revert 'S2' 'the VM is now at 1.4.1'
}
function Run-UpdateKillUpdater {
    $c = Initialize-UpdateScenario 'UpdateKillUpdater'; Publish-Update '1.4.1'
    $script:killed = $false
    $hooks = @{
        kill = @{ When = { param($ph, $new, $aud) $ph -eq 'installing' }; Do = { [void](Stop-Updater); $script:killed = $true } }
        task = @{ When = { param($ph, $new, $aud) $script:killed -and [bool](Read-Journal) -and -not (Test-UpdaterAlive) }; Do = { Start-Sleep -Seconds 60; if (Read-Journal) { Say 'the journal is still open after 60 s: running the recovery scheduled task by hand (it would otherwise fire after 45 minutes)' 'Yellow'; & schtasks.exe /Run /TN LiderCollectorUpdateWatchdog 2>&1 | Out-Null } } }
    }
    $f = Watch-Update $c $hooks 30
    Check 'the updater was really killed mid-update' ($f.Fired -contains 'kill')
    $ents = @(Get-AuditEntries $c.T0.AddSeconds(-2)); $wd = @($ents | Where-Object { $_.phase -eq 'watchdog' })
    Check 'the watchdog (service start-up check or scheduled task) performed the recovery' ($wd.Count -gt 0) (($wd | ForEach-Object { $_.status }) -join ', ')
    Judge-Update $c $f @('success', 'rolled_back', 'failed') @('1.4.1', '1.4.0') @('success', 'rolled_back', 'failed')
    Say "outcome: result=$($f.ResultStatus), version=$(Get-CollectorVersion)  (either a completed update or a clean rollback is acceptable; a half-state is not)"
    Show-Revert 'S2' 'the VM was left in a recovered state'
}
function Invoke-RebootScenario([string]$Name, [string]$Phase) {
    $c = Initialize-UpdateScenario $Name; Publish-Update '1.4.1'
    $hooks = @{ reboot = @{ When = { param($ph, $new, $aud) $ph -eq $Phase }; Do = {
        @{ scenario = $Name; stage = 'S2'; t0 = $c.T0.ToString('o'); phase = $Phase; id = $c.IdBefore; marker = $c.Marker; timeline = $c.Timeline; rebootedAt = (Get-Date).ToUniversalTime().ToString('o') } | ConvertTo-Json -Depth 6 | Set-Content $StateFile -Encoding UTF8
        $act = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Resume -Yes"
        Register-ScheduledTask -TaskName 'LiderVmTestResume' -Action $act -Trigger (New-ScheduledTaskTrigger -AtStartup) -User 'SYSTEM' -RunLevel Highest -Force | Out-Null
        Say "REBOOTING THE VM NOW (journal phase '$Phase'). After the restart the result is written to $(Join-Path $script:Work 'LAST-RESULT.txt') automatically." 'Yellow'
        Restart-Computer -Force; Start-Sleep -Seconds 120 } } }
    [void](Watch-Update $c $hooks 20 { param($f, $ph, $st) $false })
    Check 'the update reached the journal phase and the VM was rebooted' $false "the update never reached phase '$Phase' within 20 minutes (or the reboot did not happen)"
}
function Run-UpdateRebootInstalling { Invoke-RebootScenario 'UpdateRebootInstalling' 'installing' }
function Run-UpdateRebootHealth { Invoke-RebootScenario 'UpdateRebootHealth' 'health' }
function Resume-AfterReboot {
    Unregister-ScheduledTask -TaskName 'LiderVmTestResume' -Confirm:$false -ErrorAction SilentlyContinue
    if (-not (Test-Path $StateFile)) { return }
    $s = Get-Content $StateFile -Raw | ConvertFrom-Json
    [void](Wait-Until { g = Get-GwStatus; [bool]($g -and $g.ok) } 300 5)
    Reset-Checks; $r = New-Result $s.scenario $s.stage; Say "Resuming '$($s.scenario)' after the reboot (it happened in journal phase '$($s.phase)')"
    $settled = Wait-Until { ((Get-SvcState) -eq 'Running') -and -not (Read-Journal) -and -not (Test-UpdaterAlive) } 1500 10
    Check 'after the reboot the Collector settled on its own (service running, no journal, no worker) within 25 minutes' $settled
    $ctx = [pscustomobject]@{ Name = $s.scenario; T0 = [datetime]::Parse($s.t0).ToUniversalTime(); IdBefore = $s.id; Marker = $s.marker; Timeline = $s.timeline }
    $res = @(Get-AuditEntries $ctx.T0.AddSeconds(-2) | Where-Object { $_.phase -eq 'result' } | Select-Object -Last 1)
    $facts = [pscustomobject]@{ ResultStatus = $(if ($res) { [string]$res[0].status } else { $null }); ResultMessage = $(if ($res) { [string]$res[0].message } else { '' }) }
    Judge-Update $ctx $facts @('success', 'rolled_back', 'failed') @('1.4.1', '1.4.0') @('success', 'rolled_back', 'failed')
    Say "outcome after the reboot: result=$($facts.ResultStatus), version=$(Get-CollectorVersion)"
    $r = Complete-Result $r; Remove-Item $StateFile -Force
    $txt = Join-Path $script:Work 'LAST-RESULT.txt'; ($script:Notes -join "`r`n") | Set-Content $txt -Encoding UTF8
    Say "revert to snapshot S2 before the next scenario"
}
function Run-UpdateUnhealthy {
    $c = Initialize-UpdateScenario 'UpdateUnhealthy'; Publish-Update '1.4.1'
    $hooks = @{ block = @{ When = { param($ph, $new, $aud) @($aud | Where-Object { $_.phase -eq 'install' -and $_.status -eq 'ok' }).Count -gt 0 }; Do = { Block-Server } } }
    $f = Watch-Update $c $hooks 25 { param($f, $ph, $st) ($null -ne $f.ResultStatus) -and (-not $ph) -and ($st -eq 'Running') }
    Unblock-Server
    Judge-Update $c $f @('rolled_back') @('1.4.0') @('rolled_back')
    Show-Revert 'S2' 'rolled-back state'
}
function Run-UpdateRollbackFails {
    $c = Initialize-UpdateScenario 'UpdateRollbackFails'; Publish-Update '1.4.1'
    $hooks = @{ fault = @{ When = { param($ph, $new, $aud) @($aud | Where-Object { $_.phase -eq 'install' -and $_.status -eq 'ok' }).Count -gt 0 }; Do = { Block-Server; [void](Remove-PreviousMsi) } } }
    $f = Watch-Update $c $hooks 30 { param($f, $ph, $st) ($null -ne $f.ResultStatus) -and ($f.ResultStatus -eq 'rollback_failed' -or ((-not $ph) -and $st -eq 'Running')) }
    Unblock-Server
    Check 'result rollback_failed (honest failure: a person is needed)' ($f.ResultStatus -eq 'rollback_failed') "result=$($f.ResultStatus) $($f.ResultMessage)"
    Check 'the message names what to do (saved MSI path)' ($f.ResultMessage -match 'msi|MSI|previous')
    Check 'identity files untouched even though the rollback failed' (@(Compare-Identity $c.IdBefore (Get-IdentitySnapshot $script:Data)).Count -eq 0)
    Test-Markers $c.Marker
    $l = @(Get-ServerUpdateLogs | Select-Object -First 1)
    Say "service state: $(Get-SvcState), version: $(Get-CollectorVersion) (reported honestly; this is a degraded state by design)"
    Show-Revert 'S2' 'the VM is deliberately left degraded'
}
function Run-UpdateFaultInstall {
    $c = Initialize-UpdateScenario 'UpdateFaultInstall'; Publish-Update '1.4.2'
    $f = Watch-Update $c @{} 20
    Judge-Update $c $f @('failed') @('1.4.0') @('failed')
    $att = @(Get-AuditEntries $c.T0.AddSeconds(-2) | Where-Object { $_.phase -eq 'verify' -and $_.status -eq 'ok' }).Count
    Start-Sleep -Seconds ($HB * 3)
    $att2 = @(Get-AuditEntries $c.T0.AddSeconds(-2) | Where-Object { $_.phase -eq 'snapshot' }).Count
    Check 'repeat protection: a failed update is not retried in a loop' ($att2 -le 1) "snapshot phases seen: $att2"
    Show-Revert 'S2' 'clean the failed-attempt state'
}
function Run-UpdateCrlRevokedSigner {
    $c = Initialize-UpdateScenario 'UpdateCrlRevokedSigner'
    Set-GwCrl 'revoked-codesign'; $r = Test-CrlFromServer (Join-Path $Root 'pki\test-update-signing-cert.pem'); Check 'the CRL now lists the code-signing certificate' ($r.State -eq 'Revoked') $r.Detail
    Publish-Update '1.4.1'
    $t0 = [datetimeoffset]::Now
    [void](Wait-Until { (Get-LogText $t0 | Where-Object { $_ -match 'postponed|REVOKED|revoked|Update 1\.4\.1' }).Count -gt 0 } ($HB * 4 + 60) 5)
    Start-Sleep -Seconds 30
    $log = Get-LogText $t0
    Check 'the update was refused / postponed because of the revocation' (@($log | Where-Object { $_ -match 'postponed|REVOKED|revoked' }).Count -gt 0) (($log | Where-Object { $_ -match 'postponed|REVOKED|revoked' } | Select-Object -First 1))
    Check 'nothing was installed: still 1.4.0, no updater started' (((Get-CollectorVersion) -like '1.4.0*') -and (@($log | Where-Object { $_ -match 'Updater started' }).Count -eq 0))
    Test-Identity $c.IdBefore; Test-Markers $c.Marker; Test-NoUpdaterLeft
    Set-GwCrl 'valid'
    Show-Revert 'S2' 'clean state for the next scenario'
}
function Run-UpdateCrlUnavailable {
    # TLS is fail-closed: with an expired / unreachable CRL the Collector cannot even reach the server, so an offered update is never seen - nothing is installed.
    $c = Initialize-UpdateScenario 'UpdateCrlUnavailable'
    foreach ($mode in 'expired', 'unreachable') {
        Set-GwCrl $mode; Restart-Collector; $t0 = [datetimeoffset]::Now
        Publish-Update '1.4.1' -NoRestart                      # the publication goes through the control channel; the Collector cannot reach the server
        Start-Sleep -Seconds ($HB * 2 + 30)
        $log = Get-LogText $t0
        Check "CRL $mode : no download, no updater start, still 1.4.0" ((@($log | Where-Object { $_ -match 'Updater started|downloaded' }).Count -eq 0) -and ((Get-CollectorVersion) -like '1.4.0*')) "version=$(Get-CollectorVersion)"
        [void](Remove-GwUpdate '1.4.1')
    }
    Set-GwCrl 'valid'
    Test-Identity $c.IdBefore; Test-Markers $c.Marker; Test-NoUpdaterLeft
    Show-Revert 'S2' 'clean state for the next scenario'
}function Run-UpdateInstallerBusy {
    $c = Initialize-UpdateScenario 'UpdateInstallerBusy'; Hold-MsiMutex; Publish-Update '1.4.1'
    $f = Watch-Update $c @{} 6 { param($f, $ph, $st) ($null -ne $f.ResultStatus) -and (-not $ph) }
    Release-MsiMutex
    Check 'no install while Windows Installer was busy (skipped)' (($f.ResultStatus -eq 'skipped') -or ((Get-CollectorVersion) -like '1.4.0*')) "result=$($f.ResultStatus); version=$(Get-CollectorVersion)"
    Test-Identity $c.IdBefore; Test-Markers $c.Marker
    Show-Revert 'S2' 'the update may complete once the installer is free'
}

# ───────────────────────────── catalog ─────────────────────────────
$Catalog = @(
    [pscustomobject]@{ Name = 'Baseline';              Stage = 'S0';  Run = { Run-Baseline };              Why = 'install 1.3.0 from the test server, enrol, queue markers' }
    [pscustomobject]@{ Name = 'ManualUpgrade';         Stage = 'S1';  Run = { Run-ManualUpgrade };         Why = 'real MSI service upgrade 1.3.0 -> 1.4.0 with pre-checks, identity + queue preserved' }
    [pscustomobject]@{ Name = 'ManualInstallFails';    Stage = 'S1';  Run = { Run-ManualInstallFails };    Why = 'MSI that fails after the files are in place: rollback, identity + queue preserved' }
    [pscustomobject]@{ Name = 'ManualUnhealthy';       Stage = 'S1';  Run = { Run-ManualUnhealthy };       Why = 'new version cannot reach the server: automatic rollback to 1.3.0' }
    [pscustomobject]@{ Name = 'Https';                 Stage = 'S1b'; Run = { Run-Https };                 Why = 'switch to HTTPS with the pinned private test CA, CRL checks' }
    [pscustomobject]@{ Name = 'TlsRevoked';            Stage = 'S2';  Run = { Run-TlsRevoked };            Why = 'revoked server certificate: Collector refuses (fail closed), recovers' }
    [pscustomobject]@{ Name = 'TlsExpiredCrl';         Stage = 'S2';  Run = { Run-TlsExpired };            Why = 'expired CRL: Collector refuses (fail closed), recovers' }
    [pscustomobject]@{ Name = 'TlsCrlUnreachable';     Stage = 'S2';  Run = { Run-TlsUnreachable };        Why = 'CRL outage: Collector refuses (fail closed), recovers' }
    [pscustomobject]@{ Name = 'UpdateHappy';           Stage = 'S2';  Run = { Run-UpdateHappy };           Why = 'automatic update 1.4.0 -> 1.4.1 on the real service; worker survives the service stop' }
    [pscustomobject]@{ Name = 'UpdateKillUpdater';     Stage = 'S2';  Run = { Run-UpdateKillUpdater };     Why = 'updater process killed mid-update: watchdog recovers' }
    [pscustomobject]@{ Name = 'UpdateRebootInstalling';Stage = 'S2';  Run = { Run-UpdateRebootInstalling };Why = 'Windows reboot while Windows Installer is installing' }
    [pscustomobject]@{ Name = 'UpdateRebootHealth';    Stage = 'S2';  Run = { Run-UpdateRebootHealth };    Why = 'Windows reboot during the post-install health window' }
    [pscustomobject]@{ Name = 'UpdateUnhealthy';       Stage = 'S2';  Run = { Run-UpdateUnhealthy };       Why = 'new version cannot check in: automatic rollback, reported to the server' }
    [pscustomobject]@{ Name = 'UpdateFaultInstall';    Stage = 'S2';  Run = { Run-UpdateFaultInstall };    Why = 'MSI fails during install: Windows Installer keeps 1.4.0; no retry loop' }
    [pscustomobject]@{ Name = 'UpdateRollbackFails';   Stage = 'S2';  Run = { Run-UpdateRollbackFails };   Why = 'rollback impossible: honest rollback_failed, identity untouched' }
    [pscustomobject]@{ Name = 'UpdateCrlRevokedSigner';Stage = 'S2';  Run = { Run-UpdateCrlRevokedSigner };Why = 'signer certificate revoked: update refused' }
    [pscustomobject]@{ Name = 'UpdateCrlUnavailable';  Stage = 'S2';  Run = { Run-UpdateCrlUnavailable };  Why = 'CRL expired / unreachable during an offered update: nothing installed' }
    [pscustomobject]@{ Name = 'UpdateInstallerBusy';   Stage = 'S2';  Run = { Run-UpdateInstallerBusy };   Why = 'Windows Installer busy: no install attempted' }
)
$ScenarioNeedsSnapshot = @{ Baseline = 'S0'; ManualUpgrade = 'S1'; ManualInstallFails = 'S1'; ManualUnhealthy = 'S1'; Https = 'S1b' }

# ───────────────────────────── main ─────────────────────────────
if ($Resume) { Resume-AfterReboot; return }

$problems = @(Test-VmSafety)
$skew = Test-TimeSkew
Write-Host "`nLIDER IT ONE - isolated VM test suite  (test server $($script:Cfg.ServerIp):$($script:Cfg.HttpPort)/$($script:Cfg.HttpsPort))" -ForegroundColor Cyan
if ($null -eq $skew) { $problems += "the test server does not answer on $(Get-HttpBase) (token, address, firewall?)" } elseif ($skew -gt 120) { $problems += ("the VM clock differs from the test server by {0:N0} s (certificate / CRL validity depends on it)" -f $skew) }
$stage = Get-StageNow
$ledger = @(Get-GwResults); $passed = @($ledger | Where-Object { $_.passed -eq $true } | ForEach-Object { $_.scenario } | Select-Object -Unique)
Write-Host ("VM state: {0}   computer: {1}   ledger on the test server: {2} passed of {3}" -f $stage, $env:COMPUTERNAME, $passed.Count, $Catalog.Count)
if ($problems.Count) { $problems | ForEach-Object { Write-Host "  [STOP] $_" -ForegroundColor Red }; if (-not $List) { exit 3 } }
if ($List -or $Check) {
    $Catalog | ForEach-Object { '  {0,-24} {1,-4} {2}  {3}' -f $_.Name, $_.Stage, $(if ($passed -contains $_.Name) { 'PASSED ' } else { 'pending' }), $_.Why } | Write-Host
    if ($Check) { Write-Host ($(if ($problems.Count) { "`nPre-flight: PROBLEMS above" } else { "`nPre-flight: OK - nothing was changed" })) -ForegroundColor $(if ($problems.Count) { 'Red' } else { 'Green' }) }
    exit $(if ($problems.Count) { 3 } else { 0 })
}

$sel = $null
if ($Scenario) { $sel = $Catalog | Where-Object { $_.Name -eq $Scenario } | Select-Object -First 1; if (-not $sel) { throw "unknown scenario '$Scenario' (use -List)" } }
else {
    $sel = Get-NextScenario $stage $Catalog $passed
    if (-not $sel) {
        $pending = @($Catalog | Where-Object { $passed -notcontains $_.Name })
        if ($pending.Count -eq 0) { Write-Host "`nALL $($Catalog.Count) SCENARIOS PASSED. Collect C:\LiderVmTest\results\*.json (also on the test server)." -ForegroundColor Green; exit 0 }
        $need = ($pending | Select-Object -First 1).Stage
        Write-Host "`nNothing pending for state $stage. Pending scenarios need state $need ($(($pending | Where-Object { $_.Stage -eq $need } | ForEach-Object { $_.Name }) -join ', '))." -ForegroundColor Yellow
        Write-Host "Revert the VM to the snapshot for $need and run the command again." -ForegroundColor Yellow; exit 0
    }
}
Write-Host "`n=== Scenario $($sel.Name)  [$($sel.Stage)]  $($sel.Why)" -ForegroundColor Cyan
if ($sel.Stage -ne $stage) { throw "scenario $($sel.Name) needs VM state $($sel.Stage) but the VM is in state $stage" }
Confirm-Snapshot $sel.Stage
Reset-Checks; $result = New-Result $sel.Name $sel.Stage
try { & $sel.Run } catch { Check "scenario ran to the end ($($_.Exception.Message))" $false }
finally { try { Unblock-Server } catch { }; Release-MsiMutex }
[void](Complete-Result $result)
