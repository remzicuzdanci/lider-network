#Requires -Version 5.1
<#
.SYNOPSIS
    Controlled in-place upgrade (and rollback) of ONE Lider IT ONE Collector machine. Run elevated, on that machine only.

.DESCRIPTION
    Modes
      Backup    copy %ProgramData%\LiderCollector (collector.json, secure.dat, queue.db, logs) and record the installed version/service state
      Upgrade   Backup, then install the (unstamped) MSI with msiexec /qn and a verbose log, then Verify
      Verify    installed version, service state/start type, process, newest log lines, state files still present
      Rollback  stop the service, uninstall the current product (by UpgradeCode), install the given older MSI, restore nothing unless -RestoreState, then Verify

    Why Rollback is "uninstall + install": the MSI blocks downgrades (MajorUpgrade, WIX_DOWNGRADE_DETECTED), so an older MSI cannot be installed over a newer one.
    %ProgramData%\LiderCollector is not removed by an uninstall, so enrolment/identity (collector.json, secure.dat) survives both directions.
    -WhatIf prints every action and changes nothing. Nothing here talks to the LIDER server; the service does that itself after it starts.

.EXAMPLE
    .\Pilot-Upgrade.ps1 -Mode Upgrade -Msi C:\Pilot\LiderITONECollector-1.3.0.msi -ExpectedSha256 2bc5ba10...  -WhatIf
    .\Pilot-Upgrade.ps1 -Mode Rollback -Msi C:\Pilot\LiderITONECollector-1.2.0.msi -ExpectedSha256 <hash of the 1.2.0 file>
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [Parameter(Mandatory)][ValidateSet('Backup', 'Upgrade', 'Verify', 'Rollback')][string]$Mode,
    [string]$Msi,
    [string]$ExpectedSha256,
    [switch]$RestoreState,
    [string]$BackupRoot = 'C:\ProgramData\LiderCollector-pilot-backup'
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$UpgradeCode = '{B6A3F291-9D4E-4C7B-8F12-3A5E6D1C0847}'
$Service = 'LiderITONECollector'
$Data = Join-Path $env:ProgramData 'LiderCollector'

function Info($m) { Write-Host "[pilot] $m" }
function Installed {
    $inst = New-Object -ComObject WindowsInstaller.Installer
    foreach ($pc in $inst.RelatedProducts($UpgradeCode)) { return [pscustomobject]@{ ProductCode = $pc; Version = $inst.ProductInfo($pc, 'VersionString') } }
    return $null
}
function Test-Msi {
    if (-not $Msi -or -not (Test-Path $Msi)) { throw "-Msi is required and must exist" }
    $h = (Get-FileHash $Msi -Algorithm SHA256).Hash.ToLower()
    if ($ExpectedSha256 -and $h -ne $ExpectedSha256.ToLower()) { throw "SHA-256 mismatch: $h" }
    if (-not $ExpectedSha256) { Write-Warning "no -ExpectedSha256 given: the file hash is $h (compare it with the one you were told)" }
    $sig = Get-AuthenticodeSignature $Msi
    Info ("MSI: {0}  sha256={1}  authenticode={2}" -f (Split-Path $Msi -Leaf), $h, $sig.Status)
}
function Backup-State {
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $dest = Join-Path $BackupRoot $stamp
    $cur = Installed
    Info ("installed: {0}" -f $(if ($cur) { $cur.Version } else { 'none' }))
    if ($PSCmdlet.ShouldProcess($dest, "copy $Data (service is left running; queue.db is copied as is)")) {
        New-Item -ItemType Directory -Force -Path $dest | Out-Null
        icacls $BackupRoot /inheritance:r /grant:r 'SYSTEM:(OI)(CI)F' 'Administrators:(OI)(CI)F' | Out-Null
        Copy-Item $Data -Destination $dest -Recurse -Force
        $hashes = foreach ($f in 'collector.json', 'secure.dat', 'queue.db') { $p = Join-Path $Data $f; if (Test-Path $p) { '{0}  sha256={1}  bytes={2}' -f $f, (Get-FileHash $p -Algorithm SHA256).Hash, (Get-Item $p).Length } else { "$f  MISSING" } }
        (@("version=$($cur.Version)", "productcode=$($cur.ProductCode)", "service=$((Get-Service $Service -ErrorAction SilentlyContinue).Status)", 'identity files (hashes only, no content):') + $hashes) | Set-Content (Join-Path $dest 'state.txt')
        $hashes | ForEach-Object { Info "  $_" }
        Info "state backed up to $dest (restricted to SYSTEM and Administrators)"
    }
    return $dest
}
function Verify-Collector {
    $cur = Installed
    $svc = Get-Service $Service -ErrorAction SilentlyContinue
    $wmi = Get-CimInstance Win32_Service -Filter "Name='$Service'" -ErrorAction SilentlyContinue
    Info ("installed version : {0}" -f $(if ($cur) { $cur.Version } else { 'NONE' }))
    Info ("service           : {0}  start mode: {1}" -f $(if ($svc) { $svc.Status } else { 'missing' }), $(if ($wmi) { $wmi.StartMode } else { '?' }))
    foreach ($f in 'collector.json', 'secure.dat', 'queue.db') { Info ("state file {0,-15}: {1}" -f $f, $(if (Test-Path (Join-Path $Data $f)) { 'present' } else { 'MISSING' })) }
    $log = Get-ChildItem (Join-Path $Data 'logs') -Filter '*.log' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime | Select-Object -Last 1
    if ($log) { Info "newest log: $($log.Name)"; Get-Content $log.FullName -Tail 8 | ForEach-Object { Write-Host "    $_" } }
    return ($cur -and $svc -and $svc.Status -eq 'Running')
}
function Install-Msi($label) {
    Test-Msi
    $log = Join-Path $env:TEMP ("lider-collector-{0}-{1}.log" -f $label, (Get-Date -Format 'yyyyMMdd-HHmmss'))
    if ($PSCmdlet.ShouldProcess($Msi, "msiexec /i /qn (log $log)")) {
        $p = Start-Process msiexec.exe -ArgumentList @('/i', "`"$Msi`"", '/qn', '/norestart', '/l*v', "`"$log`"") -Wait -PassThru
        Info "msiexec exit code: $($p.ExitCode)  (0 = ok, 3010 = ok/reboot pending)  log: $log"
        if ($p.ExitCode -notin 0, 3010) { throw "msiexec failed ($($p.ExitCode)); see $log. Current state is unchanged or rolled back by Windows Installer; run -Mode Verify." }
    }
}

switch ($Mode) {
    'Backup'  { Backup-State | Out-Null }
    'Verify'  { if (-not (Verify-Collector)) { Write-Warning 'NOT healthy'; exit 1 } }
    'Upgrade' {
        $bk = Backup-State
        Install-Msi 'upgrade'
        Start-Sleep -Seconds 10
        if (-not $WhatIfPreference -and -not (Verify-Collector)) { Write-Warning "NOT healthy after the upgrade. Roll back with -Mode Rollback (older MSI). State backup: $bk"; exit 1 }
    }
    'Rollback' {
        $cur = Installed
        if ($cur -and $PSCmdlet.ShouldProcess("product $($cur.ProductCode) v$($cur.Version)", 'stop service and uninstall')) {
            Stop-Service $Service -ErrorAction SilentlyContinue
            $p = Start-Process msiexec.exe -ArgumentList @('/x', $cur.ProductCode, '/qn', '/norestart') -Wait -PassThru
            Info "uninstall exit code: $($p.ExitCode)"
            if ($p.ExitCode -notin 0, 3010) { throw "uninstall failed ($($p.ExitCode))" }
        }
        Install-Msi 'rollback'
        if ($RestoreState) {
            $last = Get-ChildItem $BackupRoot -Directory -ErrorAction SilentlyContinue | Sort-Object Name | Select-Object -Last 1
            if ($last -and $PSCmdlet.ShouldProcess($last.FullName, "restore state over $Data (only needed if the data directory was damaged)")) {
                Stop-Service $Service -ErrorAction SilentlyContinue
                Copy-Item (Join-Path $last.FullName 'LiderCollector\*') -Destination $Data -Recurse -Force
                Start-Service $Service
            }
        }
        Start-Sleep -Seconds 10
        if (-not $WhatIfPreference -and -not (Verify-Collector)) { Write-Warning 'NOT healthy after the rollback'; exit 1 }
    }
}
