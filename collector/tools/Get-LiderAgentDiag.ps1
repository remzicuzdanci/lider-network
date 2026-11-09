#Requires -Version 5.1
<#
.SYNOPSIS
    READ-ONLY diagnostic for the Lider IT ONE agent on a Windows machine. Changes nothing, sends nothing.
    Writes a text report to the Desktop (secrets are masked: API keys / enrollment tokens are never printed).

    Run in an elevated PowerShell:
        powershell -NoProfile -ExecutionPolicy Bypass -File .\Get-LiderAgentDiag.ps1
#>
$ErrorActionPreference = 'Continue'
$out = Join-Path ([Environment]::GetFolderPath('Desktop')) ("LiderAgentDiag_{0}_{1}.txt" -f $env:COMPUTERNAME, (Get-Date -Format 'yyyyMMdd_HHmmss'))
$sb = New-Object System.Text.StringBuilder
function W($t) { [void]$sb.AppendLine([string]$t) }
function Section($t) { W ''; W ('=' * 8 + ' ' + $t) }
function Mask($s) { ($s -replace 'ldt_[0-9a-f]{16,}', 'ldt_<masked>') -replace '(?i)("?(api_key|enrollment_token|enroll_token|token)"?\s*[:=]\s*")[^"]+', '$1<masked>' }

Section 'Machine'
W "Computer: $env:COMPUTERNAME   Time: $(Get-Date -Format o)   Admin: $(([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole('Administrators'))"
W ("OS: " + (Get-CimInstance Win32_OperatingSystem).Caption + " " + (Get-CimInstance Win32_OperatingSystem).BuildNumber)

Section 'Windows service(s) named like Lider*'
$svcs = Get-CimInstance Win32_Service | Where-Object { $_.Name -like '*Lider*' -or $_.DisplayName -like '*Lider*' -or $_.PathName -like '*LiderCollector*' }
if (-not $svcs) { W 'NO Lider service is registered.' }
foreach ($s in $svcs) {
    W ("Name={0}  State={1}  StartMode={2}  Account={3}  ProcessId={4}" -f $s.Name, $s.State, $s.StartMode, $s.StartName, $s.ProcessId)
    W ("ImagePath={0}" -f $s.PathName)
    $exe = ($s.PathName -replace '^"([^"]+)".*$', '$1')
    if (Test-Path $exe) { $fi = Get-Item $exe; W ("  exe: {0} bytes, FileVersion={1}, ProductVersion={2}, Modified={3}" -f $fi.Length, $fi.VersionInfo.FileVersion, $fi.VersionInfo.ProductVersion, $fi.LastWriteTime) } else { W "  exe NOT FOUND at that path" }
}

Section 'Every LiderCollector.exe on the disk (Program Files / ProgramData)'
foreach ($root in @($env:ProgramFiles, ${env:ProgramFiles(x86)}, $env:ProgramData)) {
    if ($root -and (Test-Path $root)) {
        Get-ChildItem $root -Recurse -Filter 'LiderCollector*.exe' -ErrorAction SilentlyContinue | ForEach-Object {
            W ("{0}  {1} bytes  FileVersion={2}  {3}" -f $_.FullName, $_.Length, $_.VersionInfo.FileVersion, $_.LastWriteTime)
        }
    }
}

Section 'Running processes'
Get-Process | Where-Object { $_.ProcessName -like 'LiderCollector*' } | ForEach-Object { W ("{0} pid={1} start={2} path={3}" -f $_.ProcessName, $_.Id, $_.StartTime, $_.Path) }

Section 'Windows Installer products (UpgradeCode B6A3F291-9D4E-4C7B-8F12-3A5E6D1C0847, and any named Lider)'
try {
    $wi = New-Object -ComObject WindowsInstaller.Installer
    foreach ($code in $wi.RelatedProducts('{B6A3F291-9D4E-4C7B-8F12-3A5E6D1C0847}')) {
        W ("Related product {0}  version={1}  name={2}  location={3}" -f $code, $wi.ProductInfo($code, 'VersionString'), $wi.ProductInfo($code, 'ProductName'), $wi.ProductInfo($code, 'InstallLocation'))
    }
    foreach ($code in $wi.Products) {
        $n = $wi.ProductInfo($code, 'ProductName')
        if ($n -like '*Lider*') { W ("Installed: {0}  {1}  version={2}" -f $code, $n, $wi.ProductInfo($code, 'VersionString')) }
    }
} catch { W "Installer API error: $($_.Exception.Message)" }
$uninst = Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*', 'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*' -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -like '*Lider*' }
foreach ($u in $uninst) { W ("Uninstall entry: {0} {1} ({2}) {3}" -f $u.DisplayName, $u.DisplayVersion, $u.PSChildName, $u.InstallLocation) }

Section 'Data directory %ProgramData%\LiderCollector'
$dd = Join-Path $env:ProgramData 'LiderCollector'
if (Test-Path $dd) {
    Get-ChildItem $dd -Force | ForEach-Object { W ("{0,-28} {1,10} bytes  {2}" -f $_.Name, $_.Length, $_.LastWriteTime) }
    $cfg = Join-Path $dd 'collector.json'
    if (Test-Path $cfg) { W ''; W '--- collector.json (secrets masked)'; W (Mask (Get-Content $cfg -Raw)) }
    W ''; W ('enrollment.json present: ' + (Test-Path (Join-Path $dd 'enrollment.json')) + '   transport-policy.json present: ' + (Test-Path (Join-Path $dd 'transport-policy.json')))
    $ff = Join-Path $dd 'service-fault.json'
    if (Test-Path $ff) { W ''; W '--- service-fault.json (the agent stopped itself; reason below)'; W (Mask (Get-Content $ff -Raw)) } else { W 'service-fault.json: none' }
    $sl = Join-Path $dd 'setup.log'
    if (Test-Path $sl) { W ''; W '--- setup.log (last 40 lines)'; Get-Content $sl -Tail 40 | ForEach-Object { W (Mask $_) } }
    $logs = Get-ChildItem $dd -Recurse -Include *.log, *.txt -ErrorAction SilentlyContinue | Where-Object { $_.Name -ne 'setup.log' } | Sort-Object LastWriteTime -Descending | Select-Object -First 2
    foreach ($l in $logs) { W ''; W ("--- {0} (last 80 lines)" -f $l.FullName); Get-Content $l.FullName -Tail 80 -ErrorAction SilentlyContinue | ForEach-Object { W (Mask $_) } }
} else { W "$dd does not exist" }

Section 'Windows Installer events (Application log, last 24 h, source MsiInstaller)'
try {
    Get-WinEvent -FilterHashtable @{ LogName = 'Application'; ProviderName = 'MsiInstaller'; StartTime = (Get-Date).AddHours(-24) } -ErrorAction Stop |
        Select-Object -First 25 | ForEach-Object { W ("{0}  id={1}  {2}" -f $_.TimeCreated, $_.Id, (Mask (($_.Message -split "`r?`n")[0]))) }
} catch { W "none / $($_.Exception.Message)" }

Section 'Service Control Manager events for the Lider service (System log, last 24 h)'
try {
    Get-WinEvent -FilterHashtable @{ LogName = 'System'; ProviderName = 'Service Control Manager'; StartTime = (Get-Date).AddHours(-24) } -ErrorAction Stop |
        Where-Object { $_.Message -like '*Lider*' -or $_.Message -like '*LiderITONE*' } | Select-Object -First 20 |
        ForEach-Object { W ("{0}  id={1}  {2}" -f $_.TimeCreated, $_.Id, ($_.Message -split "`r?`n")[0]) }
} catch { W "none / $($_.Exception.Message)" }

Section 'Application crash / .NET runtime events mentioning LiderCollector (last 24 h)'
try {
    Get-WinEvent -FilterHashtable @{ LogName = 'Application'; StartTime = (Get-Date).AddHours(-24) } -ErrorAction Stop |
        Where-Object { $_.Message -like '*LiderCollector*' -and $_.ProviderName -ne 'MsiInstaller' } | Select-Object -First 10 |
        ForEach-Object { W ("{0}  {1} id={2}  {3}" -f $_.TimeCreated, $_.ProviderName, $_.Id, (($_.Message -split "`r?`n")[0..2] -join ' | ')) }
} catch { W "none" }

Section 'Reachability of the server from this machine'
try { $r = Invoke-WebRequest -Uri 'http://192.168.20.61/' -UseBasicParsing -TimeoutSec 8; W "GET http://192.168.20.61/ -> $($r.StatusCode)" } catch { W "GET http://192.168.20.61/ failed: $($_.Exception.Message)" }

[IO.File]::WriteAllText($out, $sb.ToString(), (New-Object Text.UTF8Encoding($true)))
Write-Host "Report written: $out" -ForegroundColor Green
