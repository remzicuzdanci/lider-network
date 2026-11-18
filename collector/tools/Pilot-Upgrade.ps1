#Requires -Version 5.1
<#
.SYNOPSIS
    Controlled in-place upgrade (and rollback) of ONE Lider IT ONE Collector machine. Run elevated, on that machine only.

.DESCRIPTION
    Upgrade  1. record the service state, the installed version and the identity (collector_id, server_url, BIOS UUID, secure.dat hash)
             2. stop the Collector service in a controlled way and VERIFY it is really stopped (status Stopped AND its process gone)
             3. back up %ProgramData%\LiderCollector with queue.db and its WAL/SHM/journal files copied TOGETHER from the stopped service (so the SQLite queue is consistent),
                every copy verified by SHA-256 against its source; a failed or mismatching backup aborts before anything is installed
             4. install the MSI (msiexec /qn, verbose log)
             5. start the service again (retried) and verify: installed version, service Running, identity unchanged
             6. if the install or the checks fail: roll back automatically (uninstall the new MSI, reinstall the saved previous MSI), start the service, verify again
             7. whatever happens, if the service was running before it is running again at the end (a safety net in a finally block); the SQLite queue is never deleted, reset or overwritten
    Other modes:  Backup (steps 1-3 only)   Verify   Rollback (uninstall current + reinstall the saved/given older MSI)
    Exit codes:   0 = done and healthy   1 = failed, old state restored or rollback attempted (see messages)   2 = backup phase failed, NOTHING was installed, service restored
    -WhatIf prints every action and changes nothing. Nothing here talks to the LIDER server; the service does that itself.
    Rollback keeps the queue and the identity files exactly as they are now (they are not overwritten from the backup); -RestoreState additionally restores collector.json/secure.dat
    from the newest backup if they were damaged.

.EXAMPLE
    .\Pilot-Upgrade.ps1 -Mode Upgrade -Msi C:\Pilot\LiderITONECollector-1.3.0-signed.msi -ExpectedSha256 d9545bd5...  -WhatIf
    .\Pilot-Upgrade.ps1 -Mode Rollback          # uses the previous-<version>.msi saved by Backup/Upgrade
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [ValidateSet('Backup', 'Upgrade', 'Verify', 'Rollback', '')][string]$Mode = '',
    [string]$Msi,
    [string]$ExpectedSha256,
    [switch]$RestoreState,
    [switch]$NoAutoRollback,
    [string]$BackupRoot = 'C:\ProgramData\LiderCollector-pilot-backup',
    [int]$StopTimeoutSec = 90,
    [int]$StartTimeoutSec = 90,
    [int]$HealthWaitSec = 10,
    [switch]$LibraryOnly          # unit tests: define the functions and stop
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$UpgradeCode = '{B6A3F291-9D4E-4C7B-8F12-3A5E6D1C0847}'
$Service = 'LiderITONECollector'
if (-not (Get-Variable Data -ErrorAction SilentlyContinue)) { $Data = Join-Path $env:ProgramData 'LiderCollector' }
$QueueFiles = @('queue.db', 'queue.db-wal', 'queue.db-shm', 'queue.db-journal')
if (-not (Get-Variable QueueFreeWaitSec -ErrorAction SilentlyContinue)) { $QueueFreeWaitSec = 20 }

function Info($m) { Write-Host "[pilot] $m" }
function Warn($m) { Write-Warning $m }
function Do-It([string]$what) { if ($WhatIfPreference) { Write-Host "What if: $what"; return $false }; return $true }

# ── files that another process (the service, SQLite) may hold open ───────────────────────────────
function Get-Sha256Shared([string]$Path) {
    $fs = New-Object System.IO.FileStream($Path, [IO.FileMode]::Open, [IO.FileAccess]::Read, ([IO.FileShare]'ReadWrite,Delete'))
    try { ([BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash($fs)) -replace '-', '').ToLower() } finally { $fs.Dispose() }
}
function Copy-FileShared([string]$Src, [string]$Dst) {
    New-Item -ItemType Directory -Force -Path (Split-Path $Dst) | Out-Null
    $in = New-Object System.IO.FileStream($Src, [IO.FileMode]::Open, [IO.FileAccess]::Read, ([IO.FileShare]'ReadWrite,Delete'))
    try { $out = [IO.File]::Create($Dst); try { $in.CopyTo($out) } finally { $out.Dispose() } } finally { $in.Dispose() }
}
function Test-FileFree([string]$Path) {
    try { $fs = New-Object System.IO.FileStream($Path, [IO.FileMode]::Open, [IO.FileAccess]::Read, [IO.FileShare]::None); $fs.Dispose(); return $true } catch { return $false }
}

# ── Windows Installer / service primitives (each one is a single, mockable step) ───────────────
function Installed {
    $inst = New-Object -ComObject WindowsInstaller.Installer
    foreach ($pc in $inst.RelatedProducts($UpgradeCode)) { return [pscustomobject]@{ ProductCode = $pc; Version = $inst.ProductInfo($pc, 'VersionString'); LocalPackage = $inst.ProductInfo($pc, 'LocalPackage') } }
    return $null
}
function Invoke-Msiexec([string[]]$MsiArgs) { $p = Start-Process msiexec.exe -ArgumentList $MsiArgs -Wait -PassThru; return [int]$p.ExitCode }
function Get-SvcStatus { $s = Get-Service $Service -ErrorAction SilentlyContinue; if ($s) { return [string]$s.Status } else { return 'Missing' } }
function Get-SvcPid { $w = Get-CimInstance Win32_Service -Filter "Name='$Service'" -ErrorAction SilentlyContinue; if ($w) { return [int]$w.ProcessId } else { return 0 } }

# The application-usage helper ("LiderCollector.exe --user-agent <servicePid>") runs in the user's session and exits by itself within a few seconds once the service is gone; until then it keeps
# LiderCollector.exe locked for the installer. Wait for it, then end any that is left (it only writes samples to the service pipe: nothing is lost that the service had not already queued).
function Stop-UserHelpers([int]$WaitSec = 20) {
    $find = { @(Get-CimInstance Win32_Process -Filter "Name='LiderCollector.exe'" -ErrorAction SilentlyContinue | Where-Object { $_.PSObject.Properties['CommandLine'] -and "$($_.CommandLine)" -match '--user-agent' }) }
    $until = (Get-Date).AddSeconds($WaitSec)
    while (@(& $find).Count -gt 0 -and (Get-Date) -lt $until) { Start-Sleep -Seconds 1 }
    foreach ($h in @(& $find)) {
        Info "ending the application-usage helper (pid $($h.ProcessId)) that still holds the Collector files"
        try { Stop-Process -Id $h.ProcessId -Force -ErrorAction Stop } catch { Warn "could not end the helper $($h.ProcessId): $($_.Exception.Message)" }
    }
}

function Stop-CollectorService([int]$TimeoutSec) {
    if ((Get-SvcStatus) -in 'Stopped', 'Missing') { Stop-UserHelpers; return $true }
    $pid0 = Get-SvcPid
    try { Stop-Service $Service -ErrorAction Stop } catch { Info "Stop-Service: $($_.Exception.Message)" }
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        if ((Get-SvcStatus) -eq 'Stopped' -and (-not $pid0 -or -not (Get-Process -Id $pid0 -ErrorAction SilentlyContinue))) { Stop-UserHelpers; return $true }
        Start-Sleep -Seconds 1
    }
    return $false
}
function Start-CollectorService([int]$TimeoutSec) {
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    for ($try = 1; $try -le 3; $try++) {
        if ((Get-SvcStatus) -eq 'Running') { return $true }
        try { Start-Service $Service -ErrorAction Stop } catch { Info "Start-Service (attempt $try): $($_.Exception.Message)" }
        $slice = (Get-Date).AddSeconds([math]::Max(1, [int]($TimeoutSec / 3)))
        while ((Get-Date) -lt $slice -and (Get-Date) -lt $deadline) { if ((Get-SvcStatus) -eq 'Running') { return $true }; Start-Sleep -Seconds 1 }
    }
    return ((Get-SvcStatus) -eq 'Running')
}

# ── identity ───────────────────────────────────────────────────────────────────────────────────
function Get-Identity {
    $o = [ordered]@{ collector_id = $null; server_url = $null; enrolled_bios_uuid = $null; secure_dat_sha256 = $null }
    $cj = Join-Path $Data 'collector.json'; $sd = Join-Path $Data 'secure.dat'
    if (Test-Path $cj) { try { $j = Get-Content $cj -Raw | ConvertFrom-Json; foreach ($k in 'collector_id', 'server_url', 'enrolled_bios_uuid') { if ($j.PSObject.Properties[$k]) { $o[$k] = $j.$k } } } catch { } }
    if (Test-Path $sd) { $o.secure_dat_sha256 = Get-Sha256Shared $sd }
    return [pscustomobject]$o
}
function Compare-Identity($a, $b) {
    $d = @(); foreach ($k in 'collector_id', 'server_url', 'enrolled_bios_uuid', 'secure_dat_sha256') { if ("$($a.$k)" -ne "$($b.$k)") { $d += "$k changed" } }; return $d
}

# ── MSI ─────────────────────────────────────────────────────────────────────────────────────────
function Test-Msi([string]$Path) {
    if (-not $Path -or -not (Test-Path $Path)) { throw "-Msi is required and must exist" }
    $h = (Get-FileHash $Path -Algorithm SHA256).Hash.ToLower()
    if ($ExpectedSha256 -and $Path -eq $Msi -and $h -ne $ExpectedSha256.ToLower()) { throw "SHA-256 mismatch: $h" }
    if (-not $ExpectedSha256 -and $Path -eq $Msi) { Warn "no -ExpectedSha256 given: the file hash is $h (compare it with the one you were told)" }
    $sig = Get-AuthenticodeSignature $Path
    Info ("MSI: {0}  sha256={1}  authenticode={2}" -f (Split-Path $Path -Leaf), $h, $sig.Status)
}
function Install-Msi([string]$Path, [string]$Label) {
    Test-Msi $Path
    $log = Join-Path $env:TEMP ("lider-collector-{0}-{1}.log" -f $Label, (Get-Date -Format 'yyyyMMdd-HHmmss'))
    if (-not (Do-It "msiexec /i `"$Path`" /qn (log $log)")) { return 0 }
    $rc = Invoke-Msiexec @('/i', "`"$Path`"", '/qn', '/norestart', '/l*v', "`"$log`"")
    Info "msiexec exit code: $rc  (0 = ok, 3010 = ok/reboot pending)  log: $log"
    return $rc
}
function Uninstall-Product([string]$ProductCode) {
    if (-not (Do-It "msiexec /x $ProductCode /qn")) { return 0 }
    $rc = Invoke-Msiexec @('/x', $ProductCode, '/qn', '/norestart'); Info "uninstall exit code: $rc"; return $rc
}

# ── backup ──────────────────────────────────────────────────────────────────────────────────────
function Backup-State([bool]$ServiceStopped) {
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'; $dest = Join-Path $BackupRoot $stamp; $cur = Installed
    Info ("installed: {0}" -f $(if ($cur) { $cur.Version } else { 'none' }))
    if (-not (Do-It "back up $Data to $dest (queue.db with its WAL/SHM/journal together, each copy verified by SHA-256)")) { return $dest }
    if (-not $ServiceStopped) { Warn 'the service is running: queue.db is copied through a shared read and may not be consistent (use the Upgrade mode, which stops the service first)' }
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
    icacls $BackupRoot /inheritance:r /grant:r 'SYSTEM:(OI)(CI)F' 'Administrators:(OI)(CI)F' | Out-Null
    $dd = Join-Path $dest 'LiderCollector'; New-Item -ItemType Directory -Force -Path $dd | Out-Null
    $lines = @("version=$(if ($cur) { $cur.Version })", "productcode=$(if ($cur) { $cur.ProductCode })", "service_at_backup=$(Get-SvcStatus)", "service_stopped_for_backup=$ServiceStopped", 'files (hashes only, no content):')
    $root = (Resolve-Path $Data).Path.TrimEnd('\')
    # everything except the queue files first ...
    Get-ChildItem $Data -Recurse -File -Force | Where-Object { -not (($_.DirectoryName.TrimEnd('\') -eq $root) -and ($QueueFiles -contains $_.Name)) } | ForEach-Object {
        $rel = $_.FullName.Substring($root.Length).TrimStart('\'); Copy-FileShared $_.FullName (Join-Path $dd $rel)
    }
    # ... then the SQLite queue as ONE set (database + write-ahead log + shared memory + journal), each verified
    foreach ($q in $QueueFiles) {
        $src = Join-Path $Data $q; if (-not (Test-Path $src)) { continue }
        $dst = Join-Path $dd $q; Copy-FileShared $src $dst
        $a = Get-Sha256Shared $src; $b = Get-Sha256Shared $dst
        if ($a -ne $b) { throw "the backup copy of $q differs from its source (source $a, copy $b): aborting before anything is installed" }
        $lines += ('{0}  sha256={1}  bytes={2}  copy-verified' -f $q, $a, (Get-Item $dst).Length)
    }
    foreach ($f in 'collector.json', 'secure.dat') { $p = Join-Path $dd $f; $lines += $(if (Test-Path $p) { '{0}  sha256={1}  bytes={2}' -f $f, (Get-Sha256Shared $p), (Get-Item $p).Length } else { "$f  MISSING" }) }
    # the MSI that is installed right now (Windows Installer keeps a copy): this is what a rollback reinstalls
    if ($cur -and $cur.LocalPackage -and (Test-Path $cur.LocalPackage)) { Copy-Item $cur.LocalPackage (Join-Path $dest "previous-$($cur.Version).msi") -Force; Info "saved the installed MSI for rollback: previous-$($cur.Version).msi" }
    else { Warn 'the installed MSI could not be copied from the Windows Installer cache: a rollback will need -Msi <the old MSI>' }
    $lines | Set-Content (Join-Path $dest 'state.txt')
    $lines | Select-Object -Skip 5 | ForEach-Object { Info "  $_" }
    Info "state backed up to $dest (restricted to SYSTEM and Administrators)"
    return $dest
}

# ── verification ────────────────────────────────────────────────────────────────────────────────
function Verify-Collector([string]$ExpectVersion = '') {
    $cur = Installed; $st = Get-SvcStatus
    $wmi = Get-CimInstance Win32_Service -Filter "Name='$Service'" -ErrorAction SilentlyContinue
    Info ("installed version : {0}" -f $(if ($cur) { $cur.Version } else { 'NONE' }))
    Info ("service           : {0}  start mode: {1}" -f $st, $(if ($wmi) { $wmi.StartMode } else { '?' }))
    foreach ($f in 'collector.json', 'secure.dat', 'queue.db') { Info ("state file {0,-15}: {1}" -f $f, $(if (Test-Path (Join-Path $Data $f)) { 'present' } else { 'MISSING' })) }
    $log = Get-ChildItem (Join-Path $Data 'logs') -Filter '*.log' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime | Select-Object -Last 1
    if ($log) { Info "newest log: $($log.Name)"; try { Get-Content $log.FullName -Tail 6 -ErrorAction Stop | ForEach-Object { Write-Host "    $_" } } catch { } }
    $versionOk = (-not $ExpectVersion) -or ($cur -and "$($cur.Version)" -like "$ExpectVersion*")
    return [bool]($cur -and $st -eq 'Running' -and $versionOk)
}

# ── rollback ────────────────────────────────────────────────────────────────────────────────────
function Find-SavedMsi { $s = Get-ChildItem $BackupRoot -Recurse -Filter 'previous-*.msi' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime | Select-Object -Last 1; if ($s) { return $s.FullName } else { return $null } }
function Invoke-Rollback([string]$PrevMsi, [string]$ExpectVersion) {
    Info "ROLLBACK: reinstalling $PrevMsi"
    if (-not (Test-Path $PrevMsi)) { Warn "the saved MSI is missing: $PrevMsi"; return $false }
    if (-not (Stop-CollectorService $StopTimeoutSec)) { Warn 'the service did not stop; continuing with the uninstall (Windows Installer stops it too)' }
    $cur = Installed
    if ($cur) { $rc = Uninstall-Product $cur.ProductCode; if ($rc -notin 0, 3010) { Warn "uninstall failed ($rc)"; return $false } }
    $rc = Install-Msi $PrevMsi 'rollback'; if ($rc -notin 0, 3010) { Warn "reinstalling the previous MSI failed ($rc); the saved MSI is $PrevMsi"; return $false }
    if (-not (Start-CollectorService $StartTimeoutSec)) { Warn 'the service did not start after the rollback' }
    Start-Sleep -Seconds $HealthWaitSec
    return (Verify-Collector $ExpectVersion)
}

# ── the upgrade flow ────────────────────────────────────────────────────────────────────────────
function Invoke-Upgrade {
    $idBefore = Get-Identity; $ver0 = Installed; $st0 = Get-SvcStatus; $wasRunning = ($st0 -eq 'Running')
    Info ("before: version {0}, service {1}, collector_id {2}, secure.dat {3}" -f $(if ($ver0) { $ver0.Version } else { 'none' }), $st0, $idBefore.collector_id, $(if ($idBefore.secure_dat_sha256) { $idBefore.secure_dat_sha256.Substring(0, 16) + '...' } else { 'MISSING' }))
    if (-not $ver0) { Warn 'no Collector is installed from an MSI here'; return 2 }
    Test-Msi $Msi
    $exit = 1
    try {
        # A) stop + backup. Any failure here installs nothing and puts the service back.
        try {
            if ($wasRunning -and (Do-It 'stop the Collector service and verify it is stopped')) {
                if (-not (Stop-CollectorService $StopTimeoutSec)) { throw "the service did not stop within $StopTimeoutSec s" }
                Info 'service stopped (verified: status Stopped and its process is gone)'
            }
            if (-not $WhatIfPreference) {
                $until = (Get-Date).AddSeconds($QueueFreeWaitSec)
                foreach ($q in $QueueFiles) {
                    $p = Join-Path $Data $q; if (-not (Test-Path $p)) { continue }
                    while (-not (Test-FileFree $p)) { if ((Get-Date) -gt $until) { throw "$q is still locked by another process after the service stopped" }; Start-Sleep -Seconds 1 }
                }
            }
            $bk = Backup-State $wasRunning
        }
        catch {
            Warn "BACKUP PHASE FAILED: $($_.Exception.Message). Nothing was installed."
            if ($wasRunning -and -not $WhatIfPreference) { if (Start-CollectorService $StartTimeoutSec) { Info 'the service is running again (old version untouched)' } else { Warn 'the service could not be started again - start it manually' } }
            return 2
        }
        $prevMsi = Join-Path $bk "previous-$($ver0.Version).msi"

        # B) install
        $rc = Install-Msi $Msi 'upgrade'
        $installed = $rc -in 0, 3010
        if (-not $installed) {
            Warn "msiexec failed ($rc)."
            $now = Installed
            if ($now -and $now.Version -eq $ver0.Version) {
                Info 'Windows Installer rolled the failed install back by itself: the old version is in place'
                if ($wasRunning) { Start-CollectorService $StartTimeoutSec | Out-Null }
                return 1
            }
        }

        if ($WhatIfPreference) { Info 'What if: would now start the service, verify version/service/identity, and roll back automatically if anything is wrong'; return 0 }

        # C) start + verify (anything wrong => automatic rollback)
        $healthy = $false
        if ($installed) {
            if (-not (Start-CollectorService $StartTimeoutSec)) { Warn 'the service did not start after the install' }
            Start-Sleep -Seconds $HealthWaitSec
            $expect = ''; if ($Msi -and ([IO.Path]::GetFileNameWithoutExtension($Msi) -match '(\d+\.\d+\.\d+)')) { $expect = $Matches[1] }
            $verOk = Verify-Collector $expect
            $diff = @(Compare-Identity $idBefore (Get-Identity))
            if ($diff.Count) { Warn ('IDENTITY CHANGED: ' + ($diff -join '; ')) }
            $healthy = $verOk -and ($diff.Count -eq 0)
        }
        if ($healthy) { Info 'UPGRADE OK: service running, new version installed, identity unchanged'; return 0 }

        if ($NoAutoRollback) { Warn "NOT healthy and -NoAutoRollback was given: leaving it as is (the service is started if it was running before). Saved MSI: $prevMsi"; return 1 }
        $ok = Invoke-Rollback $prevMsi $ver0.Version
        $diff2 = @(Compare-Identity $idBefore (Get-Identity))
        if ($ok -and $diff2.Count -eq 0) { Info "ROLLBACK OK: version $($ver0.Version) is back, service running, identity unchanged" } else { Warn "ROLLBACK did not fully succeed (healthy=$ok, identity differences: $($diff2 -join ', ')). Saved MSI: $prevMsi" }
        return 1
    }
    finally {
        # safety net: a service that was running before must never be left stopped by this script
        if ($wasRunning -and -not $WhatIfPreference -and (Get-SvcStatus) -ne 'Running') {
            Warn 'safety net: the service was running before and is not running now - starting it'
            if (-not (Start-CollectorService $StartTimeoutSec)) { Warn 'THE SERVICE COULD NOT BE STARTED - start LiderITONECollector manually' }
        }
    }
}

if ($LibraryOnly) { return }
if (-not $Mode) { throw '-Mode is required (Backup, Upgrade, Verify or Rollback)' }

switch ($Mode) {
    'Backup' {
        $was = (Get-SvcStatus) -eq 'Running'; $stopped = $false
        try {
            if ($was -and (Do-It 'stop the service for a consistent backup')) { if (-not (Stop-CollectorService $StopTimeoutSec)) { throw 'the service did not stop' }; $stopped = $true }
            Backup-State $stopped | Out-Null
        } finally { if ($was -and -not $WhatIfPreference -and (Get-SvcStatus) -ne 'Running') { Start-CollectorService $StartTimeoutSec | Out-Null; Info 'service started again' } }
    }
    'Verify'  { if (-not (Verify-Collector)) { Warn 'NOT healthy'; exit 1 } }
    'Upgrade' { $r = @(Invoke-Upgrade); exit [int]$r[-1] }
    'Rollback' {
        $was = (Get-SvcStatus) -eq 'Running'
        try {
            if (-not $Msi) { $Msi = Find-SavedMsi; if (-not $Msi) { throw 'no -Msi given and no saved previous-*.msi found under the backup folder' }; Info "rolling back to the saved MSI: $Msi" }
            $ok = if (Do-It "roll back to $Msi") { Invoke-Rollback $Msi '' } else { $true }
            if ($RestoreState -and -not $WhatIfPreference) {
                $last = Get-ChildItem $BackupRoot -Directory -ErrorAction SilentlyContinue | Sort-Object Name | Select-Object -Last 1
                if ($last) {
                    Stop-CollectorService $StopTimeoutSec | Out-Null
                    foreach ($f in 'collector.json', 'secure.dat') { $b = Join-Path $last.FullName "LiderCollector\$f"; if (Test-Path $b) { Copy-FileShared $b (Join-Path $Data $f); Info "restored $f from $($last.Name)" } }
                    Start-CollectorService $StartTimeoutSec | Out-Null
                }
            }
            if (-not $ok) { Warn 'NOT healthy after the rollback'; exit 1 }
        } finally { if ($was -and -not $WhatIfPreference -and (Get-SvcStatus) -ne 'Running') { Warn 'safety net: starting the service'; Start-CollectorService $StartTimeoutSec | Out-Null } }
    }
}
