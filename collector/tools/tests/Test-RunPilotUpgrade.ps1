# Unit tests of the building blocks of Run-PilotUpgrade.ps1 (dot-sourced with -LibraryOnly). Uses synthetic folders; the real signed MSI only for the signature checks. Changes nothing outside %TEMP%.
param([string]$Bundle = (Join-Path $PSScriptRoot '..\..\pilot-bundle-1.3.0'))
Set-StrictMode -Version Latest; $ErrorActionPreference = 'Stop'
. (Join-Path $Bundle 'Run-PilotUpgrade.ps1') -LibraryOnly
$pass = 0; $fail = 0
function T($name, [scriptblock]$t) { try { if (& $t) { Write-Host "PASS  $name" -ForegroundColor Green; $script:pass++ } else { Write-Host "FAIL  $name" -ForegroundColor Red; $script:fail++ } } catch { Write-Host "FAIL  $name  ($($_.Exception.Message))" -ForegroundColor Red; $script:fail++ } }
$tmp = Join-Path $env:TEMP ('rpu-test-' + [guid]::NewGuid().ToString('N').Substring(0, 8)); New-Item -ItemType Directory $tmp | Out-Null
try {
    # ── bundle integrity ─────────────────────────────────────────────────────────────────────────
    T 'the real bundle passes the integrity check' { @(Test-BundleIntegrity $Bundle $Pin).Count -eq 0 }
    $b = Join-Path $tmp 'b'; New-Item -ItemType Directory $b | Out-Null
    Copy-Item (Join-Path $Bundle $Pin.MsiName) $b; Copy-Item (Join-Path $Bundle 'SHA256SUMS.txt') $b
    Get-ChildItem $Bundle -File | Where-Object { $_.Name -ne $Pin.MsiName -and $_.Length -lt 1MB } | Copy-Item -Destination $b
    Get-Content (Join-Path $Bundle 'SHA256SUMS.txt') | Where-Object { $_ -match 'template' } | ForEach-Object { }   # the 1.2.0 template is large; mimic it with a stub below
    $sumsLines = Get-Content (Join-Path $b 'SHA256SUMS.txt') | Where-Object { $_ -notmatch 'template' }; $sumsLines | Set-Content (Join-Path $b 'SHA256SUMS.txt') -Encoding ascii
    T 'a reduced copy of the bundle still passes' { @(Test-BundleIntegrity $b $Pin).Count -eq 0 }
    Add-Content (Join-Path $b 'PILOT-RUNBOOK.md') 'tampered'
    T 'a modified file is reported' { (@(Test-BundleIntegrity $b $Pin) -join ';') -match 'PILOT-RUNBOOK.md' }
    Remove-Item (Join-Path $b 'SHA256SUMS.txt'); T 'a missing SHA256SUMS.txt is reported' { (@(Test-BundleIntegrity $b $Pin) -join ';') -match 'SHA256SUMS' }
    $other = Join-Path $tmp 'o'; New-Item -ItemType Directory $other | Out-Null; [IO.File]::WriteAllBytes((Join-Path $other $Pin.MsiName), (New-Object byte[] 5000))
    (Get-FileHash (Join-Path $other $Pin.MsiName)).Hash.ToLower() + '  ' + $Pin.MsiName | Set-Content (Join-Path $other 'SHA256SUMS.txt') -Encoding ascii
    T 'an MSI that is consistent with SHA256SUMS but is NOT the expected build is refused (pin in the script)' { (@(Test-BundleIntegrity $other $Pin) -join ';') -match 'not the expected build' }

    # ── signature (real signed MSI) ──────────────────────────────────────────────────────────────
    $signed = Join-Path $Bundle $Pin.MsiName; $root = Join-Path $Bundle 'lider-root-ca.pem'
    $r = Test-MsiSignature $signed $root $Pin
    T 'the real signed MSI is accepted (pinned signer + chain to the pinned root)' { $r.Problems.Count -eq 0 -and ($r.Notes -join ' ') -match 'chains to the pinned LIDER root' }
    $tam = Join-Path $tmp 'tampered.msi'; Copy-Item $signed $tam
    $fs = [IO.File]::Open($tam, 'Open', 'ReadWrite'); $fs.Position = 4096; $x = $fs.ReadByte(); $fs.Position = 4096; $fs.WriteByte($x -bxor 0xFF); $fs.Close()
    T 'a one-byte change in the MSI is refused' { (Test-MsiSignature $tam $root $Pin).Problems.Count -gt 0 }
    $unsigned = 'C:\Users\Remzi CUZDANCI\Documents\ClaudE-RC\lider-network\collector\dist\LiderITONECollector-1.3.0.msi'
    if (Test-Path $unsigned) { T 'the unsigned MSI is refused' { (Test-MsiSignature $unsigned $root $Pin).Problems.Count -gt 0 } }
    T 'a wrong root file is refused' { $bad = Join-Path $tmp 'bad.pem'; $c = Get-Content $root -Raw; ($c -replace 'A', 'B') | Set-Content $bad; try { (Test-MsiSignature $signed $bad $Pin).Problems.Count -gt 0 } catch { $true } }
    $wrongPin = $Pin.Clone(); $wrongPin.SignerSha1 = ('A' * 40)
    T 'another pinned thumbprint makes the same file fail' { (Test-MsiSignature $signed $root $wrongPin).Problems.Count -gt 0 }

    # ── identity ─────────────────────────────────────────────────────────────────────────────────
    $d = Join-Path $tmp 'data'; New-Item -ItemType Directory $d | Out-Null
    '{"server_url":"http://192.168.20.61","allow_http":true,"collector_id":4,"enrolled_bios_uuid":"UUID-1"}' | Set-Content (Join-Path $d 'collector.json'); 'PROTECTED-BLOB' | Set-Content (Join-Path $d 'secure.dat')
    $s1 = Get-IdentitySnapshot $d
    T 'the identity snapshot reads the public fields' { $s1.collector_id -eq 4 -and $s1.server_url -eq 'http://192.168.20.61' -and $s1.secure_dat_present }
    '{"server_url":"http://192.168.20.61","allow_http":true,"collector_id":4,"enrolled_bios_uuid":"UUID-1","delta_sync_enabled":true,"full_sync_interval_seconds":72000}' | Set-Content (Join-Path $d 'collector.json')
    $s2 = Get-IdentitySnapshot $d
    T 'new default keys in collector.json are not an identity change' { @(Compare-Identity $s1 $s2).Count -eq 0 }
    T '...but collector.json itself did change (reported as info only)' { $s1.collector_json_sha256 -ne $s2.collector_json_sha256 }
    '{"server_url":"http://192.168.20.61","allow_http":true,"collector_id":0}' | Set-Content (Join-Path $d 'collector.json')
    T 'a lost enrolment (collector_id 0) is detected' { (@(Compare-Identity $s1 (Get-IdentitySnapshot $d)) -join ';') -match 'collector_id changed' }
    '{"server_url":"http://192.168.20.61","allow_http":true,"collector_id":4,"enrolled_bios_uuid":"UUID-1"}' | Set-Content (Join-Path $d 'collector.json'); 'OTHER-BLOB' | Set-Content (Join-Path $d 'secure.dat')
    T 'a rewritten secure.dat (API key store) is detected' { (@(Compare-Identity $s1 (Get-IdentitySnapshot $d)) -join ';') -match 'secure.dat changed' }
    Remove-Item (Join-Path $d 'secure.dat'); T 'a deleted secure.dat is detected' { (@(Compare-Identity $s1 (Get-IdentitySnapshot $d)) -join ';') -match 'is gone' }

    # ── log evidence ─────────────────────────────────────────────────────────────────────────────
    $ld = Join-Path $tmp 'logs'; New-Item -ItemType Directory $ld | Out-Null
    $since = [datetimeoffset]::Parse('2026-11-15 10:00:00 +03:00')
    @('2026-11-15 09:59:00.000 +03:00 [INF] Lider IT ONE Collector v1.2.0 starting...',
      '2026-11-15 09:59:30.000 +03:00 [WRN] Heartbeat missed. Consecutive misses: 1/3',
      '2026-11-15 10:01:05.100 +03:00 [INF] Lider IT ONE Collector v1.3.0 starting...',
      '2026-11-15 10:01:07.200 +03:00 [INF] CollectorWorker starting. Server=http://192.168.20.61',
      '2026-11-15 10:01:20.000 +03:00 [INF] Running inventory sync...',
      '2026-11-15 10:01:31.900 +03:00 [INF] Inventory sync sent (full, 7/7 modules, 1 request(s)).',
      '   at stack line that must be ignored') | Set-Content (Join-Path $ld 'collector-20261115.log')
    $e = Get-LogEvidence $ld $since
    $e13 = Get-LogEvidence $ld $since '1.3.0'
    T 'the new service start and the accepted inventory are found; older lines are ignored' { $e.Started -and $e.StartedVersion -eq '1.3.0' -and $e.InventorySent -and $e.HeartbeatMissed -eq 0 -and -not $e.ReEnrolled }
    T 'with -Version the evidence starts at the new version own start line' { $e13.Started -and $e13.InventorySent }
    $oldlog = Join-Path $tmp 'oldlogs'; New-Item -ItemType Directory $oldlog | Out-Null
    @('2026-11-15 10:00:10.000 +03:00 [INF] Lider IT ONE Collector v1.2.0 starting...', '2026-11-15 10:00:40.000 +03:00 [INF] Inventory sync sent (full, 7/7 modules, 1 request(s)).', '2026-11-15 10:01:00.000 +03:00 [WRN] Heartbeat missed. Consecutive misses: 1/3') | Set-Content (Join-Path $oldlog 'collector-20261115.log')
    T 'an inventory sent by the OLD service while the upgrade was being prepared is not evidence for the new one' { $o = Get-LogEvidence $oldlog $since '1.3.0'; -not $o.Started -and -not $o.InventorySent -and $o.HeartbeatMissed -eq 0 }
    Add-Content (Join-Path $ld 'collector-20261115.log') '2026-11-15 10:02:00.000 +03:00 [WRN] Heartbeat missed. Consecutive misses: 1/3'
    T 'a missed heartbeat after the upgrade is counted' { (Get-LogEvidence $ld $since).HeartbeatMissed -eq 1 }
    $rl = Join-Path $tmp 'rec'; New-Item -ItemType Directory -Force $rl | Out-Null; $tz = (Get-Date).ToString('zzz'); $ts = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss.fff'); Set-Content (Join-Path $rl 'collector-x.log') ("$ts $tz [INF] Lider IT ONE Collector v1.3.0 starting...`n$ts $tz [WRN] Heartbeat missed. Consecutive misses: 1/3`n$ts $tz [INF] Connectivity restored. Flushing offline queue (3 items).")
    T 'a restored connection after a miss is recognised' { $r = Get-LogEvidence $rl $since '1.3.0'; $r.HeartbeatMissed -eq 1 -and $r.Recovered }
    Add-Content (Join-Path $ld 'collector-20261115.log') '2026-11-15 10:02:10.000 +03:00 [INF] Agent is not enrolled — running enrollment.'
    T 'a re-enrolment attempt is flagged' { (Get-LogEvidence $ld $since).ReEnrolled }
    T 'a log that is being written (shared read) can be read' { $h = [IO.File]::Open((Join-Path $ld 'collector-20261115.log'), 'Open', 'Write', 'ReadWrite'); try { (Get-LogEvidence $ld $since).Started } finally { $h.Close() } }
    T 'an empty or missing log folder gives empty evidence' { $x = Get-LogEvidence (Join-Path $tmp 'nolog') $since; -not $x.Started -and -not $x.InventorySent }

    # ── the main script refuses to run unelevated (this shell is not elevated) ───────────────────────
    $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole('Administrators')
    if (-not $isAdmin) { T 'the main script refuses a non-elevated shell before doing anything' { try { & (Join-Path $Bundle 'Run-PilotUpgrade.ps1') -PreflightOnly 2>&1 | Out-Null; $false } catch { "$($_.Exception.Message)" -match 'ELEVATED' } } }
}
finally { Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue }
Write-Host "`n$pass passed, $fail failed"; if ($fail) { exit 1 }
