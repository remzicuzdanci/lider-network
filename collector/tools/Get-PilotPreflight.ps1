#Requires -Version 5.1
<#
.SYNOPSIS
    READ-ONLY pre-flight for a Collector upgrade pilot (1.1.1 -> 1.4.0) on ONE real machine (e.g. ITMANAGAMENT). Changes nothing on the machine and sends nothing to the server.

.DESCRIPTION
    What it does: reads system facts, the Collector service/MSI/data files (file names, sizes, times, header bytes; never file contents except a whitelist of non-secret collector.json keys),
    the tail of the Collector log (counted, not copied), opens a TCP connection to the server's ports 80/443, downloads the PUBLIC revocation list, and does a TLS handshake to port 443
    WITHOUT sending any request. It does NOT: stop/start anything, write to ProgramData, touch the queue database, install/uninstall, change the certificate store, registry, GPO or services.
    Secrets are never printed: secure.dat is only measured, API keys/tokens do not appear. The only file written is the report next to this script (or -ReportDir).

    Verdict lines:  [ OK ] fine   [WARN] needs a look   [BLOCK] do not start the pilot before this is resolved   [info] fact

.EXAMPLE
    powershell -NoProfile -ExecutionPolicy Bypass -File .\Get-PilotPreflight.ps1
#>
[CmdletBinding()]
param(
    [string]$ReportDir = $PSScriptRoot,
    [string]$ExpectedFrom = '1.1.',
    [string]$PinnedRootSha256 = '21E94EC9750C21E2442E0818107BE870BE6C83AD1369D8DAAEACBE6D4EC733E2'
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'
$Service = 'LiderITONECollector'; $UpgradeCode = '{B6A3F291-9D4E-4C7B-8F12-3A5E6D1C0847}'
$Data = Join-Path $env:ProgramData 'LiderCollector'
$lines = New-Object System.Collections.Generic.List[string]; $blocks = 0; $warns = 0
function W([string]$t) { $lines.Add($t); Write-Host $t }
function Sec([string]$t) { W ''; W ("== $t") }
function Ok([string]$m) { W "  [ OK ] $m" }
function Info([string]$m) { W "  [info] $m" }
function Warn([string]$m) { $script:warns++; W "  [WARN] $m" }
function Block([string]$m) { $script:blocks++; W "  [BLOCK] $m" }
function Safe([scriptblock]$b, $default = $null) { try { & $b } catch { $default } }
function Open-Shared([string]$p) { New-Object IO.FileStream($p, 'Open', 'Read', 'ReadWrite,Delete') }

W "LIDER Collector pilot PRE-FLIGHT (read-only)   $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')   computer: $env:COMPUTERNAME"

# ───────── machine ─────────
Sec 'Machine'
$os = Get-CimInstance Win32_OperatingSystem; $cs = Get-CimInstance Win32_ComputerSystem
Info "$($os.Caption) build $($os.BuildNumber), $($os.OSArchitecture); domain member: $($cs.PartOfDomain) ($($cs.Domain)); physical/virtual model: $($cs.Model)"
if (([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole('Administrators')) { Ok 'running as administrator' } else { Warn 'not elevated: some facts (service account, installer cache, tasks) may be incomplete; the pilot itself needs an elevated shell' }
if ($os.OSArchitecture -like '64*') { Ok '64-bit Windows' } else { Block '32-bit Windows: Collector 1.4.0 needs 64-bit' }
Info "PowerShell $($PSVersionTable.PSVersion)"
$lm = $ExecutionContext.SessionState.LanguageMode
if ($lm -eq 'FullLanguage') { Ok 'PowerShell language mode: FullLanguage' } else { Block "PowerShell language mode is $lm (AppLocker/WDAC): the pilot scripts cannot run here" }
$ep = Safe { Get-ExecutionPolicy -List | ForEach-Object { "$($_.Scope)=$($_.ExecutionPolicy)" } }
Info "execution policy: $($ep -join '; ')"
$mp = Safe { (Get-ExecutionPolicy -Scope MachinePolicy).ToString() } 'Undefined'; $up = Safe { (Get-ExecutionPolicy -Scope UserPolicy).ToString() } 'Undefined'
if ($mp -in 'AllSigned', 'RemoteSigned', 'Restricted' -or $up -in 'AllSigned', 'RemoteSigned', 'Restricted') { Warn "Group Policy sets the execution policy ($mp / $up): -ExecutionPolicy Bypass will be ignored; unsigned pilot scripts may not run. Do NOT change the GPO: decide how to run them (signed scripts or a one-off allowed path)." } else { Ok 'no Group Policy execution-policy restriction' }
$srp = Test-Path 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\SrpV2'; if ($srp) { Warn 'AppLocker rules are configured (SrpV2): running scripts/MSI from the pilot folder may be blocked' } else { Ok 'no AppLocker policy keys' }
$av = @(Safe { @(Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntiVirusProduct | ForEach-Object { $_.displayName }) } @())
if ($av.Count) { Info "security products: $($av -join ', ')" } else { Info 'security products: none reported (Security Center not available on servers)' }
$pend = @(); if (Test-Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Component Based Servicing\RebootPending') { $pend += 'CBS' }; if (Test-Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\WindowsUpdate\Auto Update\RebootRequired') { $pend += 'WindowsUpdate' }
if (Safe { (Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\Session Manager' -Name PendingFileRenameOperations -ErrorAction Stop).PendingFileRenameOperations }) { $pend += 'PendingFileRenameOperations' }
if ($pend) { Warn "a reboot is pending ($($pend -join ', ')): the pilot must not trigger or rely on a reboot; ask the owner to restart at a convenient time BEFORE the pilot" } else { Ok 'no pending reboot' }
$wi = Get-Service msiserver -ErrorAction SilentlyContinue; if ($wi) { Info "Windows Installer service: $($wi.Status) / $($wi.StartType)"; if ($wi.StartType -eq 'Disabled') { Block 'Windows Installer service is disabled' } }
$busy = $false; try { $m = [Threading.Mutex]::OpenExisting('Global\_MSIExecute'); $busy = $true; $m.Dispose() } catch { }
if ($busy) { Warn 'another Windows Installer operation is running right now' } else { Ok 'Windows Installer is idle' }
$drv = Get-PSDrive -Name ($env:SystemDrive.TrimEnd(':')); $freeGb = [math]::Round($drv.Free / 1GB, 1)
if ($freeGb -ge 3) { Ok "free space on $env:SystemDrive : $freeGb GB" } else { Block "only $freeGb GB free on $env:SystemDrive (need 3 GB)" }

# ───────── collector ─────────
Sec 'Installed Collector'
$svc = Get-CimInstance Win32_Service -Filter "Name='$Service'" -ErrorAction SilentlyContinue
$ver = $null; $cached = $null
if (-not $svc) { Block "service $Service is not registered: nothing to upgrade here" } else {
    Info "service state $($svc.State), start mode $($svc.StartMode), account $($svc.StartName), pid $($svc.ProcessId)"
    if ($svc.State -eq 'Running') { Ok 'service running' } else { Warn "service is $($svc.State)" }
    $exe = ($svc.PathName -replace '^"([^"]+)".*$', '$1'); if (Test-Path $exe) { $fi = Get-Item $exe; Info "executable $exe  FileVersion $($fi.VersionInfo.FileVersion)  $([math]::Round($fi.Length/1MB,1)) MB" }
}
try {
    $inst = New-Object -ComObject WindowsInstaller.Installer
    foreach ($pc in $inst.RelatedProducts($UpgradeCode)) {
        $ver = $inst.ProductInfo($pc, 'VersionString'); $cached = $inst.ProductInfo($pc, 'LocalPackage')
        Info "MSI product $pc  version $ver  per-machine"
    }
} catch { Warn "Windows Installer API: $($_.Exception.Message)" }
if (-not $ver) { Block 'the Collector is not installed from this MSI family (no related product): the MSI upgrade path does not apply' }
elseif ($ver -like "$ExpectedFrom*") { Ok "installed version $ver is the pilot's starting version" } else { Warn "installed version is $ver, the pilot expects $ExpectedFrom*" }
if ($cached) {
    if (Test-Path $cached) {
        $sz = [math]::Round((Get-Item $cached).Length / 1MB, 1)
        $pv = Safe { $db = $inst.OpenDatabase($cached, 0); $v = $db.OpenView("SELECT Value FROM Property WHERE Property='ProductVersion'"); $v.Execute(); $r = $v.Fetch(); $r.StringData(1) }
        if ($pv -like "$ExpectedFrom*" -or ($ver -and $pv -eq $ver)) { Ok "the installer's cached copy of the CURRENT MSI exists ($sz MB, ProductVersion $pv): this is the rollback source" } else { Warn "cached MSI ProductVersion is '$pv' (expected $ver)" }
    } else { Block "the cached MSI '$cached' is missing: a rollback to the installed version would have no source (a copy of the 1.1.1 installer must be provided first)" }
}

# ───────── data ─────────
Sec 'Identity, queue and logs (read only)'
if (-not (Test-Path $Data)) { Block "$Data does not exist" } else {
    $tot = 0; Get-ChildItem $Data -Recurse -File -Force -ErrorAction SilentlyContinue | ForEach-Object { $tot += $_.Length }
    Info ("data folder: {0:N1} MB in {1} files" -f ($tot / 1MB), @(Get-ChildItem $Data -Recurse -File -Force -ErrorAction SilentlyContinue).Count)
    foreach ($n in 'collector.json', 'secure.dat', 'queue.db', 'queue.db-wal', 'queue.db-shm', 'enrollment.json', 'transport-policy.json', 'service-fault.json') {
        $p = Join-Path $Data $n; if (Test-Path $p) { $f = Get-Item $p; Info ("{0,-22} {1,10:N0} bytes  modified {2:yyyy-MM-dd HH:mm:ss}" -f $n, $f.Length, $f.LastWriteTime) }
    }
    $cj = Join-Path $Data 'collector.json'; $cfg = $null
    if (Test-Path $cj) {
        try { $cfg = Get-Content $cj -Raw | ConvertFrom-Json } catch { Block 'collector.json is not valid JSON' }
        if ($cfg) {
            $known = 'server_url', 'allow_http', 'collector_id', 'enrolled_bios_uuid', 'custom_ca_cert_path', 'heartbeat_interval_seconds'
            foreach ($k in $known) { if ($cfg.PSObject.Properties[$k]) { $v = $cfg.$k; if ($k -eq 'enrolled_bios_uuid') { $v = if ($v) { '<present>' } else { '<empty>' } }; Info "collector.json  $k = $v" } }
            Info "collector.json  other keys (names only): $((($cfg.PSObject.Properties.Name | Where-Object { $_ -notin $known }) -join ', '))"
            if ($cfg.PSObject.Properties['collector_id'] -and $cfg.collector_id) { Ok 'enrolled (collector_id present)' } else { Block 'no collector_id: not enrolled' }
            if ($cfg.PSObject.Properties['enrolled_bios_uuid'] -and $cfg.enrolled_bios_uuid) { Ok 'device identity (BIOS UUID) is recorded' } else { Warn 'enrolled_bios_uuid is empty' }
            if ($cfg.PSObject.Properties['server_url']) {
                $su = [string]$cfg.server_url
                if ($su -like 'http://*') { Info 'talks to the server over plain http (allowed only for a private test server; HTTPS is the next step of the pilot)' } elseif ($su -like 'https://*') { Info 'already uses https' }
            }
        }
    }
    $sd = Join-Path $Data 'secure.dat'; if (Test-Path $sd) { Ok "secure.dat (protected API key) present, $((Get-Item $sd).Length) bytes - not read" } else { Block 'secure.dat is missing: the API key cannot be recovered' }
    $qd = Join-Path $Data 'queue.db'
    if (Test-Path $qd) {
        $hdr = New-Object byte[] 16; $fs = Open-Shared $qd; try { [void]$fs.Read($hdr, 0, 16) } finally { $fs.Dispose() }
        if ([Text.Encoding]::ASCII.GetString($hdr, 0, 15) -eq 'SQLite format 3') { Ok 'queue.db has a valid SQLite header (opened as a plain file; the database itself is not touched)' } else { Warn 'queue.db header is not SQLite' }
        $wal = Join-Path $Data 'queue.db-wal'; if (Test-Path $wal) { Info ("WAL file {0:N0} bytes: a consistent backup must copy queue.db, -wal and -shm TOGETHER (the pilot script does, with the service stopped)" -f (Get-Item $wal).Length) }
    } else { Warn 'queue.db does not exist yet (created at first start)' }
    # log evidence (counted, not copied)
    $logDir = Join-Path $Data 'logs'; $lastInv = $null; $missed = 0; $startVer = $null; $reenroll = 0; $cut = (Get-Date).AddHours(-24)
    foreach ($f in @(Get-ChildItem $logDir -Filter 'collector-*.log' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime | Select-Object -Last 2)) {
        $s = Open-Shared $f.FullName; $sr = New-Object IO.StreamReader($s)
        try { while (-not $sr.EndOfStream) { $l = $sr.ReadLine()
            if ($l -notmatch '^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})') { continue }; $t = [datetime]::ParseExact($Matches[1], 'yyyy-MM-dd HH:mm:ss', $null)
            if ($l -match 'Lider IT ONE Collector v(\S+) starting') { $startVer = $Matches[1] }
            if ($t -lt $cut) { continue }
            if ($l -match 'Inventory sync sent') { $lastInv = $t }; if ($l -match 'Heartbeat missed') { $missed++ }; if ($l -match 'Enrolled successfully|Agent is not enrolled') { $reenroll++ } } } finally { $sr.Dispose() }
    }
    if ($lastInv) { Ok "last 'Inventory sync sent' in the log: $lastInv" } else { Warn "no 'Inventory sync sent' in the last 24 h of the log" }
    if ($missed -eq 0) { Ok 'no missed heartbeats in the last 24 h' } else { Warn "$missed missed heartbeats in the last 24 h (the baseline for comparison after the pilot)" }
    if ($reenroll -gt 0) { Warn "$reenroll enrolment events in the last 24 h" }
    if ($startVer) { Info "last service start line: v$startVer" }
}

# ───────── server ─────────
Sec 'Server reachability (no application data is sent)'
$hostName = $null; if ($cfg -and $cfg.PSObject.Properties['server_url']) { $hostName = ([uri]$cfg.server_url).Host }
if (-not $hostName) { Warn 'server host unknown (collector.json not readable)' } else {
    Info "server host: $hostName"
    foreach ($port in 80, 443) {
        $t = New-Object Net.Sockets.TcpClient; $ar = $t.BeginConnect($hostName, $port, $null, $null); $okc = $ar.AsyncWaitHandle.WaitOne(5000) -and $t.Connected; $t.Close()
        if ($okc) { Ok "TCP $port reachable" } else { if ($port -eq 80) { Block 'TCP 80 not reachable (the Collector API / CRL)' } else { Warn 'TCP 443 not reachable from this machine: HTTPS cannot be enabled until it is opened (network, not GPO)' } }
    }
    try {
        $wc = New-Object Net.WebClient; $wc.Proxy = $null; $b = $wc.DownloadData("http://$hostName/pki/lider-ca.crl")
        $dh = $wc.ResponseHeaders['Date']; Ok "public CRL downloadable ($($b.Length) bytes)"
        if ($dh) { $sk = [math]::Abs(((Get-Date).ToUniversalTime() - ([datetime]::Parse($dh).ToUniversalTime())).TotalSeconds); if ($sk -lt 300) { Ok ("clock differs from the server by {0:N0} s" -f $sk) } else { Warn ("clock differs from the server by {0:N0} s: certificate and CRL validity depend on it" -f $sk) } }
    } catch { Warn "CRL download failed: $($_.Exception.Message)" }
    try {
        $tc = New-Object Net.Sockets.TcpClient; $tc.Connect($hostName, 443)
        $script:leaf = $null
        $cb = [Net.Security.RemoteCertificateValidationCallback] { param($s, $c, $ch, $e) $script:leaf = New-Object Security.Cryptography.X509Certificates.X509Certificate2 $c; $script:sslErr = [string]$e; $true }
        $ss = New-Object Net.Security.SslStream($tc.GetStream(), $false, $cb); $ss.AuthenticateAsClient($hostName); $ss.Dispose(); $tc.Close()
        $c = $script:leaf; $san = ($c.Extensions | Where-Object { $_.Oid.Value -eq '2.5.29.17' } | ForEach-Object { $_.Format($false) }) -join ''
        Info "server certificate: $($c.Subject); issuer $($c.Issuer); valid until $($c.NotAfter.ToString('yyyy-MM-dd')); names: $san"
        if ($san -match [regex]::Escape($hostName)) { Ok "the certificate names $hostName" } else { Warn "the certificate does not name $hostName" }
        if ($script:sslErr -eq 'None') { Ok 'Windows already trusts this certificate (the LIDER root is distributed here)' } else { Info "Windows trust status: $script:sslErr (expected; the Collector pins the LIDER root itself and nothing is added to the certificate store)" }
    } catch { Warn "TLS handshake to $hostName`:443 failed: $($_.Exception.Message)" }
}
$rootHit = Safe { @(Get-ChildItem Cert:\LocalMachine\Root | Where-Object { ([BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash($_.RawData)) -replace '-', '') -eq $PinnedRootSha256 }).Count } 0
Info "LIDER root in the Windows machine store: $(if ($rootHit) { 'yes (distributed by GPO or by hand)' } else { 'no' })"

# ───────── other ─────────
Sec 'Other'
$tasks = Safe { @(Get-ScheduledTask -ErrorAction Stop | Where-Object { $_.TaskName -like '*Lider*' } | ForEach-Object { $_.TaskName }) } @()
Info "scheduled tasks named Lider*: $(if ($tasks) { $tasks -join ', ' } else { 'none' })"
$pol = Test-Path 'HKLM:\SOFTWARE\Policies\LiderNetwork\LiderCollector'; Info "Collector Group Policy key present: $pol (read only; the GPO is not touched)"
$others = @(Get-ChildItem $env:ProgramFiles, ${env:ProgramFiles(x86)} -Recurse -Filter 'LiderCollector*.exe' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName)
Info "LiderCollector executables found: $(@($others).Count)"

# ───────── verdict ─────────
Sec 'Verdict'
if ($blocks -gt 0) { W "  RESULT: BLOCKED - $blocks blocking item(s), $warns warning(s). Do not start the pilot." } elseif ($warns -gt 0) { W "  RESULT: OK WITH WARNINGS - $warns item(s) to read, nothing blocking." } else { W '  RESULT: OK - nothing blocking, no warnings.' }
W '  Nothing was changed on this computer and nothing was sent to the server.'
$rep = Join-Path $ReportDir ("pilot-preflight-{0}-{1}.txt" -f $env:COMPUTERNAME, (Get-Date -Format 'yyyyMMdd-HHmmss'))
try { [IO.File]::WriteAllLines($rep, $lines.ToArray(), (New-Object Text.UTF8Encoding($false))); Write-Host "`nReport written: $rep" } catch { Write-Host "`n(could not write the report file: $($_.Exception.Message); the screen output is complete)" }
exit $(if ($blocks) { 2 } elseif ($warns) { 1 } else { 0 })
