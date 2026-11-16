#Requires -Version 5.1
<#
.SYNOPSIS
    Builds the ONE-FILE ITMANAGAMENT pilot launcher (.cmd): embedded zip (signed 1.4.0 MSI, pilot scripts, controller), SHA-256 self-check, auto-elevation, approval gate.
    The approval code is generated here, only its SHA-256 goes into the file; the code itself is written to -CodeOut (outside the repository) and is handed to the operator only after the final approval.
#>
param(
    [Parameter(Mandatory)][string]$BundleDir,
    [Parameter(Mandatory)][string]$CodeOut,
    [string]$Out = (Join-Path $PSScriptRoot '..\dist\itmgmt-pilot\ITMANAGAMENT-Pilot-1.4.0.cmd')
)
$ErrorActionPreference = 'Stop'
$work = Join-Path ([IO.Path]::GetTempPath()) ("itpilot-" + [guid]::NewGuid().ToString('N').Substring(0, 8)); $pkg = Join-Path $work 'pkg'
New-Item -ItemType Directory -Force (Join-Path $pkg 'bundle') | Out-Null
foreach ($f in Get-ChildItem $BundleDir -File) { if ($f.Name -notlike '*signed-template*' -and $f.Name -ne 'SHA256SUMS.txt') { Copy-Item $f.FullName (Join-Path $pkg 'bundle') } }   # the cached 1.1.1 MSI of Windows Installer is the rollback source; the template is not needed
Copy-Item (Join-Path $PSScriptRoot 'Get-PilotPreflight.ps1') $pkg; Copy-Item (Join-Path $PSScriptRoot 'Pilot-Controller.ps1') $pkg
foreach ($f in 'Pilot-Upgrade.ps1', 'Run-PilotUpgrade.ps1', 'Set-CollectorHttps.ps1', 'Check-SigningTrust.ps1') { Copy-Item (Join-Path $PSScriptRoot $f) (Join-Path $pkg 'bundle') -Force }
$sums = Get-ChildItem (Join-Path $pkg 'bundle') -File | Where-Object Name -ne 'SHA256SUMS.txt' | Sort-Object Name | ForEach-Object { '{0}  {1}' -f (Get-FileHash $_.FullName -Algorithm SHA256).Hash.ToLower(), $_.Name }
[IO.File]::WriteAllLines((Join-Path $pkg 'bundle\SHA256SUMS.txt'), $sums, (New-Object Text.UTF8Encoding($false)))
if (Get-ChildItem $pkg -Recurse -File | Select-String -Pattern 'BEGIN (RSA |EC |ENCRYPTED )?PRIVATE KEY' -ErrorAction SilentlyContinue | Where-Object { $_.Path -notmatch '\.msi$' }) { throw 'private key text found' }
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = Join-Path $work 'pkg.zip'; [IO.Compression.ZipFile]::CreateFromDirectory($pkg, $zip, 'Optimal', $false)
$bytes = [IO.File]::ReadAllBytes($zip)
$sha = ([BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash($bytes)) -replace '-', '').ToLower()
$code = -join ((48..57) + (65..72) + (74..78) + (80..90) | Get-Random -Count 8 | ForEach-Object { [char]$_ })
$codeHash = ([BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes($code))) -replace '-', '').ToLower()
[IO.File]::WriteAllText($CodeOut, $code)
$b64 = [Convert]::ToBase64String($bytes)
$boot = @'
$t=[IO.File]::ReadAllText('%~f0'); $mb='#PAYLOAD'+'-BEGIN'; $me='#PAYLOAD'+'-END'; $a=$t.IndexOf($mb); $e=$t.LastIndexOf($me); $nl=$t.IndexOf([char]10,$a); $h=$t.Substring($a,$nl-$a).Trim().Split(' ')[1]; $by=[Convert]::FromBase64String($t.Substring($nl+1,$e-$nl-1).Trim()); $sha=([BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash($by)) -replace '-','').ToLower(); if($sha -ne $h){ Write-Host 'SHA-256 MISMATCH - the file is damaged; NOT running anything.' -ForegroundColor Red; exit 9 }; Write-Host ('Package verified (SHA-256 '+$sha.Substring(0,16)+'...).') -ForegroundColor Green; $d=Join-Path $env:ProgramData ('LiderCollector-pilot\pkg-'+$sha.Substring(0,8)); if(Test-Path $d){Remove-Item $d -Recurse -Force}; New-Item -ItemType Directory -Force $d | Out-Null; $z=Join-Path $d 'pkg.zip'; [IO.File]::WriteAllBytes($z,$by); Add-Type -AssemblyName System.IO.Compression.FileSystem; [IO.Compression.ZipFile]::ExtractToDirectory($z,$d); Remove-Item $z; & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $d 'Pilot-Controller.ps1') -PackageDir $d -CodeSha256 'CODEHASH'; exit $LASTEXITCODE
'@
$boot = ($boot -replace "`r?`n", ' ').Trim().Replace('CODEHASH', $codeHash)
$cmd = @"
@echo off
title LIDER Collector pilot - ITMANAGAMENT (1.1.1 to 1.4.0)
fltmc >nul 2>&1
if errorlevel 1 (
  echo Administrator rights are needed. Windows will ask for permission...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)
echo LIDER Collector pilot for ITMANAGAMENT. NOTHING changes until you type the approval code.
echo No restart, no GPO / ESET / domain change.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$boot"
set RC=%ERRORLEVEL%
echo.
if "%RC%"=="0" echo FINISHED: see the report above (it is also in the clipboard).
if not "%RC%"=="0" echo FINISHED WITH A STOP / PROBLEM (exit %RC%): see the report above (it is also in the clipboard).
echo.
pause
exit /b %RC%
#PAYLOAD-BEGIN $sha
"@
$tail = "`r`n#PAYLOAD-END`r`n"
New-Item -ItemType Directory -Force (Split-Path $Out) | Out-Null
$head = ($cmd -replace "`r?`n", "`r`n") + "`r`n"
[IO.File]::WriteAllText($Out, $head + $b64 + $tail, (New-Object Text.ASCIIEncoding))
Remove-Item $work -Recurse -Force
"launcher: $((Resolve-Path $Out).Path)"; "launcher sha256: $((Get-FileHash $Out -Algorithm SHA256).Hash.ToLower())"; "embedded zip sha256: $sha"; "size: {0:N1} MB" -f ((Get-Item $Out).Length / 1MB); "approval code written to: $CodeOut (NOT in the repository)"
