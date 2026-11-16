#Requires -Version 5.1
# Building blocks of Run-VmTestSuite.ps1 (dot-sourced). Everything here is for the ISOLATED, snapshotted TEST VM only.
# Pure helpers (CRL parser, SQLite marker, decision logic) are unit-tested on the build PC by tests\Test-VmTestLib.ps1.

Set-StrictMode -Version Latest

$script:Work = 'C:\LiderVmTest'
$script:Svc = 'LiderITONECollector'
$script:Data = Join-Path $env:ProgramData 'LiderCollector'
$script:FwRule = 'LIDER-VMTEST-block-server'
$script:Checks = New-Object System.Collections.ArrayList
$script:Notes = New-Object System.Collections.ArrayList
$script:Cfg = $null
$script:MsiMutex = $null

# ───────────────────────────── output / checks ─────────────────────────────
function Say([string]$m, [string]$c = 'Gray') { Write-Host $m -ForegroundColor $c; [void]$script:Notes.Add(("{0:HH:mm:ss} {1}" -f (Get-Date), $m)) }
function Check([string]$name, [bool]$ok, [string]$detail = '') {
    [void]$script:Checks.Add([pscustomobject]@{ name = $name; ok = $ok; detail = $detail })
    if ($ok) { Say ("  [ OK ] $name" + $(if ($detail) { " - $detail" } else { '' })) 'Green' } else { Say ("  [FAIL] $name" + $(if ($detail) { " - $detail" } else { '' })) 'Red' }
}
function Reset-Checks { $script:Checks.Clear(); $script:Notes.Clear() }
function Wait-Until([scriptblock]$Test, [int]$TimeoutSec, [int]$PollSec = 2) {
    $end = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $end) { if (& $Test) { return $true }; Start-Sleep -Seconds $PollSec }
    return [bool](& $Test)
}

# ───────────────────────────── configuration / gateway ─────────────────────────────
function Import-SuiteConfig([string]$Path) {
    $script:Cfg = Get-Content $Path -Raw | ConvertFrom-Json
    if (-not $script:Cfg.ControlToken -or -not $script:Cfg.ServerIp) { throw 'vmtest-config.json is incomplete' }
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
}
function Get-HttpBase { "http://$($script:Cfg.ServerIp):$($script:Cfg.HttpPort)" }
function Get-HttpsBase { "https://$($script:Cfg.ServerIp):$($script:Cfg.HttpsPort)" }

function Invoke-Gw([string]$Method, [string]$Path, [hashtable]$Query = @{}, [string]$OutFile, [string]$Body, [int]$TimeoutSec = 300) {
    $qs = ($Query.GetEnumerator() | ForEach-Object { "$($_.Key)=$([uri]::EscapeDataString([string]$_.Value))" }) -join '&'
    $url = (Get-HttpBase) + '/__vmtest/' + $Path + $(if ($qs) { "?$qs" } else { '' })
    $h = @{ 'X-Vmtest-Token' = $script:Cfg.ControlToken }
    $p = @{ Uri = $url; Method = $Method; Headers = $h; UseBasicParsing = $true; TimeoutSec = $TimeoutSec }
    if ($OutFile) { $p.OutFile = $OutFile }
    if ($Body) { $p.Body = $Body; $p.ContentType = 'application/json' }
    try {
        $r = Invoke-WebRequest @p
        if ($OutFile) { return $true }
        return ($r.Content | ConvertFrom-Json)
    } catch {
        $resp = $_.Exception.Response
        if ($resp) { try { $sr = New-Object IO.StreamReader($resp.GetResponseStream()); $t = $sr.ReadToEnd(); try { return ($t | ConvertFrom-Json) } catch { return [pscustomobject]@{ ok = $false; error = $t } } } catch { } }
        return [pscustomobject]@{ ok = $false; error = $_.Exception.Message }
    }
}
function Get-GwStatus { Invoke-Gw GET 'status' }
function Set-GwCrl([string]$State) { $r = Invoke-Gw POST 'crl' @{ state = $State }; if (-not ($r -and $r.ok)) { throw "could not set the CRL state to ${State}: $($r.error)" }; Clear-CryptoUrlCache }
function Publish-GwUpdate([string]$Version) { Invoke-Gw POST 'publish' @{ version = $Version } }
function Remove-GwUpdate([string]$Version) { Invoke-Gw POST 'withdraw' @{ version = $Version } }
function Send-GwResult([string]$Name, $Obj) { Invoke-Gw POST 'result' @{ name = $Name } -Body ($Obj | ConvertTo-Json -Depth 8 -Compress) }
function Set-GwDlpPolicy([bool]$Enabled, [bool]$Print, [string]$Name = 'hash', [bool]$Usb = $false, [bool]$Files = $true) { Invoke-Gw POST 'dlp-policy' @{ enabled = [int]$Enabled; print = [int]$Print; name = $Name; usb = [int]$Usb; files = [int]$Files } }
 function Get-GwDlpEvents { Invoke-Gw GET 'dlp-events' }
 function Get-GwResults { $r = Invoke-Gw GET 'results'; if ($r -and $r.ok) { return @($r.results) }; return @() }

# ───────────────────────────── safety ─────────────────────────────
function Test-VmSafety {
    # Refuses to run on anything that does not look like an isolated test VM. Returns an array of problems (empty = fine).
    $p = @()
    if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole('Administrators')) { $p += 'run this in an ELEVATED PowerShell' }
    $cs = Get-CimInstance Win32_ComputerSystem
    if ($cs.PartOfDomain) { $p += "this computer is joined to the domain '$($cs.Domain)': the test VM must be a WORKGROUP computer (no GPO, no domain accounts)" }
    if ($env:COMPUTERNAME -match '(?i)MIKRO|ITMANAG|^DC\d|-DC-') { $p += "computer name '$($env:COMPUTERNAME)' looks like a production machine; refusing" }
    $cj = Join-Path $script:Data 'collector.json'
    if (Test-Path $cj) {
        try {
            $u = [uri](Get-Content $cj -Raw | ConvertFrom-Json).server_url
            if ($u -and $u.Host -ne $script:Cfg.ServerIp -and $u.Host -ne '') { $p += "the installed Collector talks to '$($u.Host)', not to the test server $($script:Cfg.ServerIp): this is not a clean test VM" }
            if ($u -and $u.Host -eq $script:Cfg.ServerIp -and $u.Port -notin @([int]$script:Cfg.HttpPort, [int]$script:Cfg.HttpsPort)) { $p += "the installed Collector uses port $($u.Port) of the test server's address - that is the PRODUCTION application, not the test gateway" }
        } catch { }
    }
    $free = (Get-PSDrive -Name ($env:SystemDrive.TrimEnd(':')) ).Free
    if ($free -lt 3GB) { $p += ("less than 3 GB free on {0}" -f $env:SystemDrive) }
    return $p
}
function Test-TimeSkew {
    $s = Get-GwStatus
    if (-not ($s -and $s.gateway_time_utc)) { return $null }
    $g = [datetime]::Parse($s.gateway_time_utc, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AssumeUniversal -bor [Globalization.DateTimeStyles]::AdjustToUniversal)
    return [math]::Abs(((Get-Date).ToUniversalTime() - $g).TotalSeconds)
}

# ───────────────────────────── Collector state ─────────────────────────────
function Get-SvcState { $s = Get-Service $script:Svc -ErrorAction SilentlyContinue; if ($s) { [string]$s.Status } else { 'missing' } }
function Get-CollectorVersion { try { $v = Get-ExeVersion; if ($v -and $v -ne '?') { return ($v -replace '\.0$', '') } } catch { }; '?' }
function Test-UpdaterAlive { @(Get-Process -Name 'LiderCollectorUpdate' -ErrorAction SilentlyContinue).Count -gt 0 }
function Read-Journal { $p = Join-Path $script:Data 'update-journal.json'; if (Test-Path $p) { try { Get-Content $p -Raw | ConvertFrom-Json } catch { [pscustomobject]@{ phase = 'unknown' } } } }
function Get-AuditEntries([datetime]$SinceUtc = [datetime]::MinValue) {
    $p = Join-Path $script:Data 'update-audit.log'
    if (-not (Test-Path $p)) { return @() }
    $fs = New-Object IO.FileStream($p, 'Open', 'Read', 'ReadWrite'); $sr = New-Object IO.StreamReader($fs); $out = @()
    try { while (-not $sr.EndOfStream) { $l = $sr.ReadLine(); if (-not $l) { continue }; try { $e = $l | ConvertFrom-Json; if ([datetime]::Parse($e.timestamp).ToUniversalTime() -ge $SinceUtc) { $out += $e } } catch { } } } finally { $sr.Dispose() }
    return $out
}
function Get-LogText([datetimeoffset]$Since) {
    # the collector service log, lines at or after $Since
    $dir = Join-Path $script:Data 'logs'; $o = New-Object System.Collections.Generic.List[string]
    foreach ($f in @(Get-ChildItem $dir -Filter 'collector-*.log' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime | Select-Object -Last 2)) {
        $fs = New-Object IO.FileStream($f.FullName, 'Open', 'Read', 'ReadWrite'); $sr = New-Object IO.StreamReader($fs)
        try { while (-not $sr.EndOfStream) { $l = $sr.ReadLine(); if ($l -match '^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} [+-]\d{2}:\d{2}) ') { try { if ([datetimeoffset]::ParseExact($Matches[1], 'yyyy-MM-dd HH:mm:ss.fff zzz', [Globalization.CultureInfo]::InvariantCulture) -ge $Since) { $o.Add($l) } } catch { } } } } finally { $sr.Dispose() }
    }
    return $o.ToArray()
}
function Get-ConfigValue([string]$Key) { try { (Get-Content (Join-Path $script:Data 'collector.json') -Raw | ConvertFrom-Json).$Key } catch { $null } }
function Set-ConfigValue([string]$Key, $Value) {
    $p = Join-Path $script:Data 'collector.json'; $j = Get-Content $p -Raw | ConvertFrom-Json
    if ($j.PSObject.Properties[$Key]) { $j.$Key = $Value } else { $j | Add-Member -NotePropertyName $Key -NotePropertyValue $Value }
    [IO.File]::WriteAllText($p, ($j | ConvertTo-Json -Depth 6), (New-Object Text.UTF8Encoding($false)))
}
function Restart-Collector { Restart-Service $script:Svc -Force -ErrorAction Stop; [void](Wait-Until { (Get-SvcState) -eq 'Running' } 60 1) }

# ───────────────────────────── SQLite (winsqlite3.dll ships with Windows 10/11): identity-neutral markers inside queue.db ─────────────────────────────
if (-not ('WSqlite' -as [type])) {
Add-Type -TypeDefinition @"
using System; using System.Runtime.InteropServices; using System.Text; using System.Collections.Generic;
public static class WSqlite {
  const string L = "winsqlite3.dll";
  [DllImport(L)] static extern int sqlite3_open_v2(byte[] file, out IntPtr db, int flags, IntPtr vfs);
  [DllImport(L)] static extern int sqlite3_close(IntPtr db);
  [DllImport(L)] static extern int sqlite3_busy_timeout(IntPtr db, int ms);
  [DllImport(L)] static extern int sqlite3_prepare_v2(IntPtr db, byte[] sql, int n, out IntPtr stmt, IntPtr tail);
  [DllImport(L)] static extern int sqlite3_step(IntPtr stmt);
  [DllImport(L)] static extern IntPtr sqlite3_column_text(IntPtr stmt, int i);
  [DllImport(L)] static extern int sqlite3_finalize(IntPtr stmt);
  [DllImport(L)] static extern IntPtr sqlite3_errmsg(IntPtr db);
  static byte[] Z(string s) { return Encoding.UTF8.GetBytes(s + "\0"); }
  static string S(IntPtr p) { if (p == IntPtr.Zero) return null; int n = 0; while (Marshal.ReadByte(p, n) != 0) n++; byte[] b = new byte[n]; Marshal.Copy(p, b, 0, n); return Encoding.UTF8.GetString(b); }
  // flags: 1 read only, 2 read/write, 6 read/write/create. Returns the first column of every row of the LAST statement; several statements separated by ';' are allowed (no ';' inside literals).
  public static string[] Run(string path, string sql, int flags) {
    IntPtr db; int rc = sqlite3_open_v2(Z(path), out db, flags, IntPtr.Zero);
    if (rc != 0) { string m = S(sqlite3_errmsg(db)); sqlite3_close(db); throw new Exception("open failed: " + m); }
    List<string> rows = new List<string>();
    try {
      sqlite3_busy_timeout(db, 20000);
      foreach (string one in sql.Split(new char[] { ';' }, StringSplitOptions.RemoveEmptyEntries)) {
        if (one.Trim().Length == 0) continue;
        IntPtr st; rc = sqlite3_prepare_v2(db, Z(one), -1, out st, IntPtr.Zero);
        if (rc != 0) throw new Exception("prepare failed: " + S(sqlite3_errmsg(db)) + " in: " + one);
        rows.Clear();
        try { while (true) { rc = sqlite3_step(st); if (rc == 100) { rows.Add(S(sqlite3_column_text(st, 0))); continue; } if (rc == 101) break; throw new Exception("step failed (" + rc + "): " + S(sqlite3_errmsg(db))); } }
        finally { sqlite3_finalize(st); }
      }
    } finally { sqlite3_close(db); }
    return rows.ToArray();
  }
}
"@
}
function Add-QueueMarkers([string]$QueueDb, [int]$Count = 5) {
    # A private table in the SAME file as the offline queue: the Collector never touches it, a recreated / reset / replaced queue.db loses it.
    $tok = [guid]::NewGuid().ToString('N')
    $sql = "CREATE TABLE IF NOT EXISTS vmtest_marker (token TEXT NOT NULL, n INTEGER NOT NULL, created TEXT)"
    [void][WSqlite]::Run($QueueDb, $sql, 2)
    for ($i = 1; $i -le $Count; $i++) { [void][WSqlite]::Run($QueueDb, "INSERT INTO vmtest_marker (token, n, created) VALUES ('$tok', $i, '$((Get-Date).ToUniversalTime().ToString('o'))')", 2) }
    return [pscustomobject]@{ Token = $tok; Count = $Count }
}
function Test-QueueMarkers([string]$QueueDb, $Marker) {
    # returns @{ Ok; Detail }
    if (-not (Test-Path $QueueDb)) { return [pscustomobject]@{ Ok = $false; Detail = 'queue.db is gone' } }
    try {
        $ic = ([WSqlite]::Run($QueueDb, 'PRAGMA integrity_check', 1) | Select-Object -First 1)
        if ($ic -ne 'ok') { return [pscustomobject]@{ Ok = $false; Detail = "integrity_check: $ic" } }
        $n = [int]([WSqlite]::Run($QueueDb, "SELECT count(*) FROM vmtest_marker WHERE token = '$($Marker.Token)'", 1) | Select-Object -First 1)
        $q = [WSqlite]::Run($QueueDb, 'SELECT count(*) FROM queue', 1) | Select-Object -First 1
        if ($n -ne $Marker.Count) { return [pscustomobject]@{ Ok = $false; Detail = "only $n of $($Marker.Count) markers left - the queue database was replaced or reset" } }
        return [pscustomobject]@{ Ok = $true; Detail = "integrity ok, all $n markers present, $q queue rows" }
    } catch { return [pscustomobject]@{ Ok = $false; Detail = "queue.db unreadable: $($_.Exception.Message)" } }
}

# ───────────────────────────── CRL: an independent evaluation of what a client downloads ─────────────────────────────
if (-not ('CrlInfo' -as [type])) {
Add-Type -TypeDefinition @"
using System; using System.Collections.Generic; using System.Globalization; using System.Security.Cryptography; using System.Security.Cryptography.X509Certificates;
public static class CrlInfo {
  public class Result { public DateTime ThisUpdate; public DateTime NextUpdate; public List<string> Revoked = new List<string>(); public byte[] Tbs; public byte[] Sig; }
  static void Tlv(byte[] b, ref int p, out int tag, out int start, out int len, out int end) {
    tag = b[p++]; int l = b[p++];
    if ((l & 0x80) != 0) { int n = l & 0x7F; l = 0; for (int i = 0; i < n; i++) l = (l << 8) | b[p++]; }
    start = p; len = l; end = p + l; if (end > b.Length) throw new Exception("truncated DER");
  }
  static DateTime Time(byte[] b, int s, int len, int tag) {
    string t = System.Text.Encoding.ASCII.GetString(b, s, len);
    string f = tag == 0x17 ? "yyMMddHHmmss'Z'" : "yyyyMMddHHmmss'Z'";
    return DateTime.ParseExact(t, f, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal);
  }
  static string Hex(byte[] b, int s, int len) { int i = s, e = s + len; while (i < e - 1 && b[i] == 0) i++; System.Text.StringBuilder sb = new System.Text.StringBuilder(); for (; i < e; i++) sb.Append(b[i].ToString("X2")); return sb.ToString().TrimStart('0'); }
  public static Result Parse(byte[] d) {
    Result r = new Result(); int p = 0, tag, s, len, end;
    Tlv(d, ref p, out tag, out s, out len, out end); if (tag != 0x30) throw new Exception("not a CRL");
    p = s; int tbsStart = p; Tlv(d, ref p, out tag, out s, out len, out end); if (tag != 0x30) throw new Exception("no tbsCertList");
    r.Tbs = new byte[end - tbsStart]; Array.Copy(d, tbsStart, r.Tbs, 0, r.Tbs.Length);
    int tbsEnd = end; p = s;
    Tlv(d, ref p, out tag, out s, out len, out end); if (tag == 0x02) { p = end; Tlv(d, ref p, out tag, out s, out len, out end); }   // optional version, then the algorithm
    p = end; Tlv(d, ref p, out tag, out s, out len, out end); p = end;                                                                       // issuer
    Tlv(d, ref p, out tag, out s, out len, out end); r.ThisUpdate = Time(d, s, len, tag); p = end;
    r.NextUpdate = DateTime.MaxValue;
    if (p < tbsEnd && (d[p] == 0x17 || d[p] == 0x18)) { Tlv(d, ref p, out tag, out s, out len, out end); r.NextUpdate = Time(d, s, len, tag); p = end; }
    if (p < tbsEnd && d[p] == 0x30) {
      Tlv(d, ref p, out tag, out s, out len, out end); int listEnd = end; p = s;
      while (p < listEnd) { int t2, s2, l2, e2; Tlv(d, ref p, out t2, out s2, out l2, out e2); int q = s2; int t3, s3, l3, e3; Tlv(d, ref q, out t3, out s3, out l3, out e3); r.Revoked.Add(Hex(d, s3, l3)); p = e2; }
    }
    p = tbsEnd; Tlv(d, ref p, out tag, out s, out len, out end); p = end;                                                                   // signatureAlgorithm
    Tlv(d, ref p, out tag, out s, out len, out end); if (tag != 0x03) throw new Exception("no signature");
    r.Sig = new byte[len - 1]; Array.Copy(d, s + 1, r.Sig, 0, r.Sig.Length);
    return r;
  }
  public static bool VerifySignature(Result r, X509Certificate2 issuer) {
    RSACryptoServiceProvider rsa = issuer.PublicKey.Key as RSACryptoServiceProvider; if (rsa == null) return false;
    return rsa.VerifyData(r.Tbs, "SHA256", r.Sig);
  }
  public static string NormalSerial(string hex) { return hex.TrimStart('0').ToUpperInvariant(); }
}
"@ -ReferencedAssemblies System.Core
}
function Test-CrlFile([byte[]]$Der, [string]$IssuerPem, [string]$CertPem, [datetime]$NowUtc = (Get-Date).ToUniversalTime()) {
    # Independent of the Collector and of the Windows chain cache: parse the CRL a client would download, check issuer signature, validity window and the certificate's serial.
    $issuer = New-Object Security.Cryptography.X509Certificates.X509Certificate2 $IssuerPem
    $cert = New-Object Security.Cryptography.X509Certificates.X509Certificate2 $CertPem
    try { $r = [CrlInfo]::Parse($Der) } catch { return [pscustomobject]@{ State = 'Invalid'; Detail = "not a valid CRL: $($_.Exception.Message)" } }
    if (-not [CrlInfo]::VerifySignature($r, $issuer)) { return [pscustomobject]@{ State = 'BadSignature'; Detail = 'the CRL is not signed by the pinned issuer' } }
    if ($NowUtc -lt $r.ThisUpdate) { return [pscustomobject]@{ State = 'NotYetValid'; Detail = "thisUpdate $($r.ThisUpdate.ToString('u'))" } }
    if ($NowUtc -gt $r.NextUpdate) { return [pscustomobject]@{ State = 'Expired'; Detail = "nextUpdate $($r.NextUpdate.ToString('u')) is in the past" } }
    if ($r.Revoked -contains [CrlInfo]::NormalSerial($cert.SerialNumber)) { return [pscustomobject]@{ State = 'Revoked'; Detail = "serial $($cert.SerialNumber) is listed" } }
    return [pscustomobject]@{ State = 'Good'; Detail = "valid until $($r.NextUpdate.ToString('u')), $($r.Revoked.Count) revoked entr$(if ($r.Revoked.Count -eq 1) { 'y' } else { 'ies' })" }
}
function Test-CrlFromServer([string]$CertPem) {
    # What does a client get right now from the CDP address in this certificate?
    $cert = New-Object Security.Cryptography.X509Certificates.X509Certificate2 $CertPem
    $url = "http://$($script:Cfg.ServerIp):$($script:Cfg.HttpPort)/pki/vmtest-ca.crl"
    try { $bytes = (New-Object Net.WebClient).DownloadData($url) } catch { return [pscustomobject]@{ State = 'Unreachable'; Detail = $_.Exception.Message } }
    return Test-CrlFile $bytes (Join-Path $script:Cfg.Root 'pki\test-root-ca.pem') $CertPem
}
function Clear-CryptoUrlCache {
    # Windows caches CRLs (and failed downloads) per user: SYSTEM (the service) and the administrator running this script. Without this a CRL switch would not be seen.
    & certutil.exe -urlcache * delete 2>&1 | Out-Null
    foreach ($base in @((Join-Path $env:windir 'System32\config\systemprofile\AppData\LocalLow\Microsoft\CryptnetUrlCache'), (Join-Path $env:USERPROFILE 'AppData\LocalLow\Microsoft\CryptnetUrlCache'))) {
        foreach ($sub in 'Content', 'MetaData') { $d = Join-Path $base $sub; if (Test-Path $d) { Get-ChildItem $d -File -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue } }
    }
}

# ───────────────────────────── fault injection ─────────────────────────────
function Block-Server { if (-not (Get-NetFirewallRule -DisplayName $script:FwRule -ErrorAction SilentlyContinue)) { New-NetFirewallRule -DisplayName $script:FwRule -Direction Outbound -Action Block -RemoteAddress $script:Cfg.ServerIp -Protocol TCP | Out-Null }; Say 'fault: ALL outbound TCP to the test server is blocked (VM firewall rule)' 'Yellow' }
function Unblock-Server { Get-NetFirewallRule -DisplayName $script:FwRule -ErrorAction SilentlyContinue | Remove-NetFirewallRule; Say 'fault removed: the test server is reachable again' 'Yellow' }
function Hold-MsiMutex { $m = New-Object System.Threading.Mutex($false, 'Global\_MSIExecute'); if (-not $m.WaitOne(0)) { throw 'Windows Installer is already busy' }; $script:MsiMutex = $m; Say 'fault: Global\_MSIExecute is held (an install appears to be running)' 'Yellow' }
function Release-MsiMutex { if ($script:MsiMutex) { try { $script:MsiMutex.ReleaseMutex() } catch { }; $script:MsiMutex = $null } }
function Stop-Updater { $p = @(Get-Process -Name 'LiderCollectorUpdate' -ErrorAction SilentlyContinue); foreach ($x in $p) { try { Stop-Process -Id $x.Id -Force } catch { } }; Say "fault: the update worker was killed ($($p.Count) process)" 'Yellow'; $p.Count }
function Remove-PreviousMsi { $n = 0; Get-ChildItem (Join-Path $script:Data 'updates') -Recurse -Filter 'previous-*.msi' -ErrorAction SilentlyContinue | ForEach-Object { Remove-Item $_.FullName -Force; $n++ }; Say "fault: the saved previous MSI was deleted ($n file)" 'Yellow'; $n }

# ───────────────────────────── ledger / resume ─────────────────────────────
function Save-LocalResult($Result) {
    $d = Join-Path $script:Work 'results'; New-Item -ItemType Directory -Force $d | Out-Null
    $f = Join-Path $d ("{0}-{1}.json" -f $Result.scenario, (Get-Date -Format 'yyyyMMdd-HHmmss'))
    $Result | ConvertTo-Json -Depth 8 | Set-Content $f -Encoding UTF8
    return $f
}
function New-Result([string]$Scenario, [string]$Stage) {
    [pscustomobject]@{ scenario = $Scenario; stage = $Stage; computer = $env:COMPUTERNAME; started_utc = (Get-Date).ToUniversalTime().ToString('o'); finished_utc = $null; passed = $false; checks = @(); notes = @(); extra = @{} }
}
function Complete-Result($R) {
    $R.finished_utc = (Get-Date).ToUniversalTime().ToString('o'); $R.checks = @($script:Checks); $R.notes = @($script:Notes)
    $R.passed = (@($script:Checks).Count -gt 0) -and (@($script:Checks | Where-Object { -not $_.ok }).Count -eq 0)
    $f = Save-LocalResult $R
    $up = Send-GwResult ("{0}-{1}" -f $R.scenario, (Get-Date -Format 'yyyyMMdd-HHmmss')) $R
    if ($R.passed) { Say "RESULT: $($R.scenario) PASSED" 'Green' } else { Say "RESULT: $($R.scenario) FAILED" 'Red' }
    Say ("  saved: $f" + $(if ($up -and $up.ok) { ' and on the test server' } else { '  (could NOT be uploaded to the test server: ' + $up.error + ')' }))
    return $R
}

# ───────────────────────────── pure decision logic (unit tested) ─────────────────────────────
function Get-VmStage([string]$InstalledVersion, [string]$ServerUrl) {
    # S0 clean, S1 baseline 1.3.x, S1b 1.4.x over http (after the manual upgrade), S2 1.4.0 over https, S3 1.4.1 over https
    if (-not $InstalledVersion) { return 'S0' }
    if ($InstalledVersion -like '1.3.*') { return 'S1' }
    if ($InstalledVersion -like '1.4.0*') { if ($ServerUrl -like 'https://*') { return 'S2' } else { return 'S1b' } }
    if ($InstalledVersion -match '^1\.4\.[1-9]') { if ($ServerUrl -like 'https://*') { return 'S3' } else { return 'S1b' } }   # S3 = 1.4.1+ over https (after the automatic update): the DLP / queue scenarios start here
    return 'Unknown'
}
function Get-NextScenario([string]$Stage, $Catalog, [string[]]$Passed) {
    foreach ($s in $Catalog) { $manual = ($s.PSObject.Properties['Manual'] -and $s.Manual); if ($s.Stage -eq $Stage -and -not $manual -and $Passed -notcontains $s.Name) { return $s } }
    return $null
}
function Test-ResultStatusMatches([string]$Actual, [string[]]$Expected) { return ($Expected -contains $Actual) }

# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ queue helpers (private rows in the Collector's own queue table) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Add-QueueRows([string]$QueueDb, [int]$Count, [string]$Printer = 'BACKLOG') {
    # Valid DLP events as the Collector would have queued them while offline (service stopped while this runs). The server stores each uid once, so delivery can be counted exactly.
    $now = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
    for ($i = 1; $i -le $Count; $i++) {
        $uid = ('vmtest-backlog-{0:D5}-{1}' -f $i, [guid]::NewGuid().ToString('N').Substring(0, 6))
        $payload = '{"events":[{"uid":"' + $uid + '","type":"print_job","occurred_at":"' + $now + '","host":"' + $env:COMPUTERNAME + '","data":{"printer":"' + $Printer + '","document":"x","pages":1,"user":"VMTEST"}}]}'
        [void][WSqlite]::Run($QueueDb, "INSERT INTO queue (endpoint, payload) VALUES ('dlp-events', '$payload')", 2)
    }
}
function Get-QueueCount([string]$QueueDb) { try { [int]([WSqlite]::Run($QueueDb, 'SELECT count(*) FROM queue', 1) | Select-Object -First 1) } catch { -1 } }