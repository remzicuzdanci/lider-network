#Requires -Version 5.1
<#
.SYNOPSIS
    Packs Get-PilotPreflight.ps1 into ONE double-click file (.cmd): it checks the SHA-256 of the embedded script itself, runs it IN MEMORY (no script file is written, so the
    execution policy / Mark-of-the-Web do not get in the way and nothing is left behind) and writes the report next to the .cmd. Read-only; changes nothing on the machine.
#>
param([string]$Script = (Join-Path $PSScriptRoot 'Get-PilotPreflight.ps1'), [string]$Out = (Join-Path $PSScriptRoot 'ITMANAGAMENT-Preflight.cmd'))
$ErrorActionPreference = 'Stop'
$bytes = [IO.File]::ReadAllBytes($Script)
$sha = ([BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash($bytes)) -replace '-', '').ToLower()
$b64 = [Convert]::ToBase64String($bytes, 'InsertLineBreaks')
$boot = @'
$t=[IO.File]::ReadAllText('%~f0'); $mb='#PAYLOAD'+'-BEGIN'; $me='#PAYLOAD'+'-END'; $a=$t.IndexOf($mb); $e=$t.IndexOf($me); $nl=$t.IndexOf([char]10,$a); $h=$t.Substring($a,$nl-$a).Trim().Split(' ')[1]; $by=[Convert]::FromBase64String(($t.Substring($nl+1,$e-$nl-1) -replace '\s','')); $sha=([BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash($by)) -replace '-','').ToLower(); if($sha -ne $h){ Write-Host 'SHA-256 MISMATCH - the file is damaged; NOT running anything.' -ForegroundColor Red; exit 9 }; Write-Host ('Embedded script verified (SHA-256 '+$sha.Substring(0,16)+'...). Running read-only pre-flight.') -ForegroundColor Green; $sb=[ScriptBlock]::Create([Text.Encoding]::UTF8.GetString($by)); & $sb -ReportDir '%~dp0'
'@
$boot = ($boot -replace "`r?`n", ' ').Trim()
$clip = 'powershell -NoProfile -Command "try { $f = Get-ChildItem ''%~dp0pilot-preflight-*.txt'' | Sort-Object LastWriteTime | Select-Object -Last 1; if ($f) { Get-Content -Raw -LiteralPath $f.FullName | Set-Clipboard; Write-Host (''Report copied to the clipboard (and saved: '' + $f.Name + ''). Paste it into the chat.'') -ForegroundColor Cyan } } catch { }"'
$cmd = @"
@echo off
title LIDER Collector pilot pre-flight (read-only)
echo LIDER Collector pilot pre-flight - READ ONLY. Nothing is installed, changed or sent to the server.
echo The report is written next to this file.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$boot"
set RC=%ERRORLEVEL%
$clip
echo.
if "%RC%"=="0" echo VERDICT: OK
if "%RC%"=="1" echo VERDICT: WARNING (read the [WARN] lines)
if "%RC%"=="2" echo VERDICT: BLOCKED (read the [BLOCK] lines)
if "%RC%"=="9" echo VERDICT: NOT RUN (file damaged)
echo.
pause
exit /b %RC%
#PAYLOAD-BEGIN $sha
$b64
#PAYLOAD-END
"@
[IO.File]::WriteAllText($Out, ($cmd -replace "`r?`n", "`r`n"), (New-Object Text.ASCIIEncoding))
"launcher: $Out"; "launcher sha256: $((Get-FileHash $Out -Algorithm SHA256).Hash.ToLower())"; "embedded script sha256: $sha"; "size: $((Get-Item $Out).Length) bytes"
