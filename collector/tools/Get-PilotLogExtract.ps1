param([string]$From = '2026-11-16 17:47:00', [string]$To = '2026-11-16 18:00:00', [string]$ReportDir = $PSScriptRoot)
# READ-ONLY: copies the Collector log lines of one time window (tokens/keys masked) to a report file and the clipboard. Changes nothing.
$ErrorActionPreference = 'Continue'
$Data = Join-Path $env:ProgramData 'LiderCollector'; $out = New-Object System.Collections.Generic.List[string]
$f0 = [datetime]::Parse($From); $f1 = [datetime]::Parse($To)
$out.Add("Collector log window $From .. $To on $env:COMPUTERNAME (read-only extract; tokens masked)")
foreach ($f in @(Get-ChildItem (Join-Path $Data 'logs') -Filter 'collector-*.log' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime | Select-Object -Last 3)) {
    $s = New-Object IO.FileStream($f.FullName, 'Open', 'Read', 'ReadWrite'); $sr = New-Object IO.StreamReader($s)
    try { while (-not $sr.EndOfStream) { $l = $sr.ReadLine(); if ($l -match '^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})') { $t = [datetime]::ParseExact($Matches[1], 'yyyy-MM-dd HH:mm:ss', $null); $inWin = ($t -ge $f0 -and $t -le $f1) } if ($inWin) { $out.Add(($l -replace 'ldt_[0-9a-f]{16,}', 'ldt_<masked>') -replace '(?i)("?(api_key|token)"?\s*[:=]\s*"?)[A-Za-z0-9+/=_\-]{12,}', '$1<masked>') } } } finally { $sr.Dispose() }
}
foreach ($n in 'update-last-attempt.json') { }
$out.Add("--- config keys (names/values that are not secret)"); try { $c = Get-Content (Join-Path $Data 'collector.json') -Raw | ConvertFrom-Json; foreach ($k in 'heartbeat_interval_seconds', 'inventory_sync_interval_seconds', 'performance_interval_seconds', 'event_log_interval_seconds', 'offline_threshold_missed_heartbeats', 'delta_sync_enabled', 'log_level') { if ($c.PSObject.Properties[$k]) { $out.Add("$k = $($c.$k)") } } } catch { }
$rep = Join-Path $ReportDir ("log-extract-$env:COMPUTERNAME-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt")
[IO.File]::WriteAllLines($rep, $out.ToArray(), (New-Object Text.UTF8Encoding($false)))
try { Get-Content -Raw -LiteralPath $rep | Set-Clipboard; Write-Host "Lines: $($out.Count). Saved: $rep  and copied to the clipboard - paste it into the chat." -ForegroundColor Cyan } catch { Write-Host "Lines: $($out.Count). Saved: $rep" -ForegroundColor Cyan }
