#Requires -Version 5.1
<#
.SYNOPSIS
    ONE command for the MIKRO-PC pilot: verify the bundle, verify the MSI (SHA-256 + Authenticode signer + chain to the pinned LIDER root), check the machine, back up the identity,
    upgrade Collector 1.2.0 -> 1.3.0 with Pilot-Upgrade.ps1, and prove afterwards that the service runs, the identity is unchanged and the Collector talks to the server.
    If something is wrong it offers (or, with -AutoRollback, performs) the rollback to the saved 1.2.0.

.DESCRIPTION
    Run in an ELEVATED PowerShell on MIKRO-PC itself. Nothing is opened remotely, no service/firewall/certificate is added, nothing is sent anywhere.
    The identity is never rewritten by this script: the Windows Installer upgrade leaves %ProgramData%\LiderCollector (collector.json, secure.dat, queue.db) alone, and the
    script compares before/after (collector_id, server_url, enrolled_bios_uuid from collector.json; the SHA-256 of secure.dat which holds the DPAPI-protected API key).
    A report is written next to the script (upgrade-report-<time>.txt). The report contains no secrets.

    Evidence of a working Collector after the upgrade (from the service log, since the upgrade started):
      "Lider IT ONE Collector v1.3.0 starting"   the new service came up
      "Inventory sync sent"                       the server accepted an inventory (heartbeat precedes it; a failing heartbeat logs "Heartbeat missed")
      NO "Agent is not enrolled" / "Enrolled successfully" line   the existing enrolment was kept (a re-enrolment would be a new identity)

.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File C:\Pilot\pilot-bundle-1.3.0\Run-PilotUpgrade.ps1
    ... -PreflightOnly      checks only (bundle, signature, machine); changes nothing
    ... -AutoRollback       rolls back without asking when the verdict is FAIL
    ... -Yes                skip the "type UPGRADE" confirmation
#>
[CmdletBinding()]
param(
    [switch]$PreflightOnly,
    [switch]$AutoRollback,
    [switch]$Yes,
    [switch]$LibraryOnly,          # for the unit tests: define the functions and stop
    [int]$EvidenceMinutes = 6
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ── pins (public values) ─────────────────────────────────────────────────────────────────────────
$Pin = @{
    MsiName       = 'LiderITONECollector-1.3.0-signed.msi'
    MsiSha256     = 'd9545bd5dc5457a200a016450420fabe05a162da2024a42a59107b79ad2fea8d'
    FromVersion   = '1.2.0'
    ToVersion     = '1.3.0'
    SignerSha1    = '83739ABFDBD3B8654141FE1F2BF1A131F99BA71F'
    RootSha256    = '21E94EC9750C21E2442E0818107BE870BE6C83AD1369D8DAAEACBE6D4EC733E2'
    UpgradeScript = 'Pilot-Upgrade.ps1'
}
$Service = 'LiderITONECollector'
$Data = Join-Path $env:ProgramData 'LiderCollector'
$Here = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
$script:Report = New-Object System.Collections.Generic.List[string]
function Say($m, $c = 'Gray') { Write-Host $m -ForegroundColor $c; $script:Report.Add($m) }
function Pass($m) { Say "  [ OK ] $m" 'Green' }
function Warn($m) { Say "  [warn] $m" 'Yellow' }
function Fail($m) { Say "  [FAIL] $m" 'Red' }
# shared read: also works for files another process (the running service, SQLite) has open - Get-FileHash does not
function Sha256($p) {
    $fs = New-Object System.IO.FileStream($p, [IO.FileMode]::Open, [IO.FileAccess]::Read, ([IO.FileShare]'ReadWrite,Delete'))
    try { ([BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash($fs)) -replace '-', '').ToLower() } finally { $fs.Dispose() }
}

# ── building blocks (also exercised by Test-RunPilotUpgrade.ps1) ─────────────────────────────────
function Test-BundleIntegrity([string]$Dir, [hashtable]$P) {
    $problems = @()
    $sums = Join-Path $Dir 'SHA256SUMS.txt'
    if (-not (Test-Path $sums)) { return @('SHA256SUMS.txt is missing') }
    foreach ($line in Get-Content $sums) {
        if ($line -notmatch '^([0-9a-fA-F]{64})\s+(.+)$') { continue }
        $f = Join-Path $Dir $Matches[2].Trim()
        if (-not (Test-Path $f)) { $problems += "missing file: $($Matches[2])"; continue }
        if ((Sha256 $f) -ne $Matches[1].ToLower()) { $problems += "SHA-256 differs from SHA256SUMS.txt: $($Matches[2])" }
    }
    $msi = Join-Path $Dir $P.MsiName
    if (-not (Test-Path $msi)) { $problems += "missing $($P.MsiName)" } elseif ((Sha256 $msi) -ne $P.MsiSha256) { $problems += "the MSI is not the expected build (SHA-256 $((Sha256 $msi)))" }
    return $problems
}

function Test-MsiSignature([string]$Msi, [string]$RootPem, [hashtable]$P) {
    $problems = @(); $notes = @()
    $sig = Get-AuthenticodeSignature -LiteralPath $Msi
    if ($sig.Status -in 'NotSigned', 'HashMismatch', 'NotSupportedFileFormat', 'Incompatible') { return @{ Problems = @("Authenticode status $($sig.Status)"); Notes = @() } }
    $c = $sig.SignerCertificate
    if (-not $c) { return @{ Problems = @('no signer certificate'); Notes = @() } }
    if ($c.Thumbprint -ine $P.SignerSha1) { $problems += "signer thumbprint $($c.Thumbprint) is not the pinned $($P.SignerSha1)" } else { $notes += "signer thumbprint = pinned ($($c.Thumbprint))" }
    if (-not ($c.EnhancedKeyUsageList.ObjectId -contains '1.3.6.1.5.5.7.3.3')) { $problems += 'signer is not a code-signing certificate' }
    $now = (Get-Date).ToUniversalTime(); if ($now -lt $c.NotBefore.ToUniversalTime() -or $now -gt $c.NotAfter.ToUniversalTime()) { $problems += 'signer certificate is outside its validity period' }
    if (-not (Test-Path $RootPem)) { $problems += 'lider-root-ca.pem is missing from the bundle' }
    else {
        $root = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2 ((Resolve-Path $RootPem).Path)
        $rh = ([BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash($root.RawData)) -replace '-', '')
        if ($rh -ine $P.RootSha256) { $problems += "root file SHA-256 $rh is not the pinned root" }
        else {
            $ch = New-Object System.Security.Cryptography.X509Certificates.X509Chain; $ch.ChainPolicy.RevocationMode = 'NoCheck'; [void]$ch.ChainPolicy.ExtraStore.Add($root); [void]$ch.Build($c)
            $top = $ch.ChainElements[$ch.ChainElements.Count - 1].Certificate
            $other = @($ch.ChainStatus | Where-Object { $_.Status -ne 'UntrustedRoot' })
            if ($top.Thumbprint -ieq $root.Thumbprint -and $other.Count -eq 0) { $notes += 'signer chains to the pinned LIDER root (revocation list not consulted by this manual pilot)' } else { $problems += 'signer does not chain to the pinned LIDER root' }
        }
    }
    if ($sig.Status -eq 'Valid') { $notes += 'Windows trusts the chain on this computer' } else { $notes += "Windows status '$($sig.Status)': normal on a workgroup computer that does not trust the LIDER root" }
    return @{ Problems = $problems; Notes = $notes }
}

function Get-IdentitySnapshot([string]$DataDir) {
    $o = [ordered]@{ collector_id = $null; server_url = $null; allow_http = $null; enrolled_bios_uuid = $null; secure_dat_sha256 = $null; secure_dat_present = $false; collector_json_sha256 = $null }
    $cj = Join-Path $DataDir 'collector.json'; $sd = Join-Path $DataDir 'secure.dat'
    if (Test-Path $cj) {
        $o.collector_json_sha256 = Sha256 $cj
        try { $j = Get-Content $cj -Raw | ConvertFrom-Json; foreach ($k in 'collector_id', 'server_url', 'allow_http', 'enrolled_bios_uuid') { if ($j.PSObject.Properties[$k]) { $o[$k] = $j.$k } } } catch { }
    }
    if (Test-Path $sd) { $o.secure_dat_present = $true; $o.secure_dat_sha256 = Sha256 $sd }
    return [pscustomobject]$o
}

function Compare-Identity($Before, $After) {
    $diff = @()
    foreach ($k in 'collector_id', 'server_url', 'allow_http', 'enrolled_bios_uuid') { if ("$($Before.$k)" -ne "$($After.$k)") { $diff += "$k changed: '$($Before.$k)' -> '$($After.$k)'" } }
    if ($Before.secure_dat_present -and -not $After.secure_dat_present) { $diff += 'secure.dat (the protected API key) is gone' }
    elseif ($Before.secure_dat_sha256 -ne $After.secure_dat_sha256) { $diff += 'secure.dat changed (the API key store was rewritten)' }
    return $diff
}

function Get-LogEvidence([string]$LogDir, [datetimeoffset]$Since, [string]$Version = '') {
    # With -Version only lines AFTER the "Collector v<Version> starting" line count as evidence: the old service may still log while the upgrade is being prepared.
    $ev = [ordered]@{ Started = $false; StartedVersion = $null; InventorySent = $false; HeartbeatMissed = 0; ReEnrolled = $false; Lines = 0 }
    $armed = ($Version -eq '')
    $files = @(Get-ChildItem $LogDir -Filter 'collector-*.log' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime | Select-Object -Last 2)
    foreach ($f in $files) {
        $fs = New-Object System.IO.FileStream($f.FullName, 'Open', 'Read', 'ReadWrite'); $sr = New-Object System.IO.StreamReader($fs)
        try { while (-not $sr.EndOfStream) {
            $l = $sr.ReadLine()
            if ($l -notmatch '^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} [+-]\d{2}:\d{2}) \[\w+\] (.*)$') { continue }
            try { $t = [datetimeoffset]::ParseExact($Matches[1], 'yyyy-MM-dd HH:mm:ss.fff zzz', [Globalization.CultureInfo]::InvariantCulture) } catch { continue }
            if ($t -lt $Since) { continue }
            $ev.Lines++; $m = $Matches[2]
            if ($m -match 'Lider IT ONE Collector v(\S+) starting') {
                if ($Version -ne '' -and $Matches[1] -notlike "$Version*") { $armed = $false; continue }      # another version (the old one) started/stopped: not evidence
                $ev.Started = $true; $ev.StartedVersion = $Matches[1]; $armed = $true; continue
            }
            if (-not $armed) { continue }
            if ($m -match 'Inventory sync sent') { $ev.InventorySent = $true }
            if ($m -match 'Heartbeat missed') { $ev.HeartbeatMissed++ }
            if ($m -match 'Agent is not enrolled|Enrolled successfully|Enrollment attempt') { $ev.ReEnrolled = $true }
        } } finally { $sr.Dispose() }
    }
    return [pscustomobject]$ev
}

function Get-InstalledCollector {
    $inst = New-Object -ComObject WindowsInstaller.Installer
    foreach ($pc in $inst.RelatedProducts('{B6A3F291-9D4E-4C7B-8F12-3A5E6D1C0847}')) { return [pscustomobject]@{ ProductCode = $pc; Version = $inst.ProductInfo($pc, 'VersionString') } }
    return $null
}
function Get-ExeVersion { try { $p = (Get-CimInstance Win32_Service -Filter "Name='$Service'").PathName; $e = if ($p.StartsWith('"')) { $p.Split('"')[1] } else { $p.Split(' ')[0] }; (Get-Item $e).VersionInfo.FileVersion } catch { '?' } }

if ($LibraryOnly) { return }

# ── main ─────────────────────────────────────────────────────────────────────────────────────────
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole('Administrators')) { throw 'run this in an ELEVATED PowerShell (Run as administrator)' }
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'; $reportFile = Join-Path $Here "upgrade-report-$stamp.txt"
$exit = 0
try {
    Say "== LIDER Collector pilot: $($env:COMPUTERNAME)  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  (pilot $($Pin.FromVersion) -> $($Pin.ToVersion))" 'Cyan'

    Say "`n== 1. Bundle integrity"
    $bad = @(Test-BundleIntegrity $Here $Pin); if ($bad.Count) { $bad | ForEach-Object { Fail $_ }; throw 'the bundle is not intact: copy it again from the original' }
    Pass 'every file matches SHA256SUMS.txt'; Pass "MSI SHA-256 = $($Pin.MsiSha256)"
    $up = Join-Path $Here $Pin.UpgradeScript; Unblock-File $up -ErrorAction SilentlyContinue

    Say "`n== 2. MSI signature"
    $sg = Test-MsiSignature (Join-Path $Here $Pin.MsiName) (Join-Path $Here 'lider-root-ca.pem') $Pin
    $sg.Notes | ForEach-Object { Pass $_ }; if ($sg.Problems.Count) { $sg.Problems | ForEach-Object { Fail $_ }; throw 'the MSI signature is not acceptable' }

    Say "`n== 3. This computer"
    $inst = Get-InstalledCollector
    if (-not $inst) { throw 'no Lider IT ONE Collector is installed from an MSI here' }
    Say "  installed MSI version : $($inst.Version)   exe: $(Get-ExeVersion)"
    $already = $inst.Version -like "$($Pin.ToVersion)*"
    if (-not $already -and $inst.Version -notlike "$($Pin.FromVersion)*") { throw "this pilot upgrades $($Pin.FromVersion) only; found $($inst.Version)" }
    $svc = Get-Service $Service -ErrorAction SilentlyContinue; if (-not $svc) { throw 'service LiderITONECollector not found' }
    Say "  service               : $($svc.Status)"; if ($svc.Status -ne 'Running' -and -not $already) { Warn 'the service is not running before the upgrade; an unhealthy baseline makes the later verdict harder to read' }
    $before = Get-IdentitySnapshot $Data
    if (-not $before.collector_id -or [int]$before.collector_id -lt 1) { throw 'collector.json has no collector_id: this computer is not enrolled; stop' }
    if (-not $before.secure_dat_present) { throw 'secure.dat (the protected API key) is missing; stop' }
    Say ("  identity (public)     : collector_id={0}  server_url={1}  allow_http={2}  bios_uuid={3}" -f $before.collector_id, $before.server_url, $before.allow_http, $before.enrolled_bios_uuid)
    Say "  identity files        : secure.dat sha256 $($before.secure_dat_sha256.Substring(0,16))...  collector.json sha256 $($before.collector_json_sha256.Substring(0,16))..."
    $free = [math]::Round((Get-PSDrive -Name ($env:SystemDrive.TrimEnd(':'))).Free / 1GB, 1); if ($free -lt 1.5) { throw "only $free GB free on $env:SystemDrive; need 1.5 GB" } else { Pass "$free GB free on $env:SystemDrive" }
    if ($already) { Say "`nThe installed version is already $($Pin.ToVersion): only the verification below is run." 'Yellow' }
    if ($PreflightOnly) { Say "`nPreflight finished: nothing was changed." 'Green'; return }

    if (-not $already) {
        if (-not $Yes) { $a = Read-Host "`nType UPGRADE to install $($Pin.ToVersion) over $($inst.Version) on $env:COMPUTERNAME (anything else stops)"; if ($a -cne 'UPGRADE') { throw 'stopped by the operator; nothing was changed' } }
        Say "`n== 4. Backup + upgrade (Pilot-Upgrade.ps1 -Mode Upgrade)"
        $t0 = [datetimeoffset]::Now
        & $up -Mode Upgrade -Msi (Join-Path $Here $Pin.MsiName) -ExpectedSha256 $Pin.MsiSha256 *>&1 | ForEach-Object { Say "  $_" }
        $upRc = $LASTEXITCODE
        Say "  Pilot-Upgrade.ps1 exit code: $upRc  (0 = upgraded and healthy, 1 = failed - it tried an automatic rollback, 2 = backup failed - nothing was installed)"
        if ($upRc -eq 2) {
            $s = Get-Service $Service -ErrorAction SilentlyContinue; $iv = Get-InstalledCollector
            Say "`nVERDICT: NOT UPGRADED - the backup step failed, so nothing was installed. Installed: $($iv.Version); service: $($s.Status). Nothing is lost; read the lines above, fix the cause, run this script again." 'Yellow'
            if ($s -and $s.Status -ne 'Running') { Fail 'the service is NOT running - start it: Start-Service LiderITONECollector' } else { Pass 'old version untouched, service running' }
            exit 2
        }
    } else { $t0 = [datetimeoffset]::Now.AddMinutes(-30); $upRc = 0 }

    Say "`n== 5. Verification after the upgrade"
    $verdictOk = $true
    $now = Get-InstalledCollector; $svc2 = Get-Service $Service -ErrorAction SilentlyContinue
    if ($now -and $now.Version -like "$($Pin.ToVersion)*") { Pass "installed MSI version $($now.Version); exe $(Get-ExeVersion)" } else { Fail "installed version is $($now.Version)"; $verdictOk = $false }
    if ($svc2 -and $svc2.Status -eq 'Running') { Pass 'service LiderITONECollector is Running' } else { Fail "service state: $($svc2.Status)"; $verdictOk = $false }
    $after = Get-IdentitySnapshot $Data; $diff = @(Compare-Identity $before $after)
    if ($diff.Count) { $diff | ForEach-Object { Fail $_ }; $verdictOk = $false } else { Pass "identity unchanged: collector_id=$($after.collector_id), same server_url, same BIOS UUID, secure.dat byte-identical" }
    if ($before.collector_json_sha256 -ne $after.collector_json_sha256) { Warn 'collector.json was rewritten by the service (it adds new default keys); the identity fields above are what counts' }

    Say "  waiting up to $EvidenceMinutes min for the service log to show an accepted inventory ..."
    $deadline = (Get-Date).AddMinutes($EvidenceMinutes); $ev = $null
    do { Start-Sleep -Seconds 10; $ev = Get-LogEvidence (Join-Path $Data 'logs') $t0 $Pin.ToVersion; Write-Host -NoNewline '.' } while (-not ($ev.Started -and $ev.InventorySent) -and (Get-Date) -lt $deadline)
    Write-Host ''
    if ($ev.Started) { Pass "log: service started (v$($ev.StartedVersion))" } else { Fail 'log: no "Collector vX starting" line since the upgrade'; $verdictOk = $false }
    if ($ev.InventorySent) { Pass 'log: "Inventory sync sent" - the server accepted an inventory after the upgrade' } else { Fail 'log: no accepted inventory within the wait time'; $verdictOk = $false }
    if ($ev.HeartbeatMissed -gt 0) { Fail "log: $($ev.HeartbeatMissed) missed heartbeat(s) since the upgrade"; $verdictOk = $false } else { Pass 'log: no missed heartbeat since the upgrade' }
    if ($ev.ReEnrolled) { Fail 'log: the agent tried to (re-)enrol: the identity may have been lost'; $verdictOk = $false } else { Pass 'log: no enrolment attempt (the existing enrolment was used)' }

    if ($verdictOk) { Say "`nVERDICT: PASS - Collector $($Pin.ToVersion) is running with the unchanged identity. Tell the assistant: it now checks the server side (device, collector, inventory, motherboard, last user, duplicates)." 'Green' }
    else {
        Say "`nVERDICT: FAIL - see the red lines above." 'Red'; $exit = 2
        $cur = Get-InstalledCollector; $sv = Get-Service $Service -ErrorAction SilentlyContinue
        $alreadyBack = ($upRc -eq 1) -and $cur -and ($cur.Version -like "$($Pin.FromVersion)*") -and $sv -and ($sv.Status -eq 'Running')
        if ($alreadyBack) { Say "Pilot-Upgrade.ps1 already rolled back automatically: $($cur.Version) is installed and the service is running. No further rollback needed." 'Yellow' }
        $go = $AutoRollback -and -not $alreadyBack; if (-not $go -and -not $alreadyBack) { $a = Read-Host 'Roll back to the saved 1.2.0 now? Type ROLLBACK (anything else leaves things as they are)'; $go = ($a -ceq 'ROLLBACK') }
        if ($go) {
            Say "`n== ROLLBACK (Pilot-Upgrade.ps1 -Mode Rollback)"; $t1 = [datetimeoffset]::Now
            & $up -Mode Rollback *>&1 | ForEach-Object { Say "  $_" }
            Start-Sleep -Seconds 20
            $r = Get-InstalledCollector; $s3 = Get-Service $Service -ErrorAction SilentlyContinue; $a3 = Get-IdentitySnapshot $Data; $d3 = @(Compare-Identity $before $a3)
            if ($r -and $r.Version -like "$($Pin.FromVersion)*") { Pass "back on $($r.Version)" } else { Fail "version after rollback: $($r.Version)" }
            if ($s3 -and $s3.Status -eq 'Running') { Pass 'service Running' } else { Fail "service $($s3.Status)" }
            if ($d3.Count) { $d3 | ForEach-Object { Fail $_ } } else { Pass 'identity unchanged after the rollback' }
        } else { Say 'No rollback was performed. To do it later: .\Pilot-Upgrade.ps1 -Mode Rollback' 'Yellow' }
    }
}
catch { Say "`nSTOPPED: $($_.Exception.Message)" 'Red'; $exit = 1 }
finally {
    try { $script:Report | Set-Content -Path $reportFile -Encoding UTF8; Write-Host "`nReport: $reportFile  (no secrets in it; send it to the assistant)" } catch { }
}
exit $exit
