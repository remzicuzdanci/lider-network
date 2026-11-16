#Requires -Version 5.1
<#
.SYNOPSIS
    One-time switch of ONE Collector from http:// to https:// with the LIDER private CA. Run elevated on that machine only. Needs Collector >= 1.4.0.

.DESCRIPTION
    Why 1.4.0+: the 1.3.0 Collector cannot verify a private CA that is not in the Windows certificate store (its revocation check reports "unknown" for such a chain).
    1.4.0 trusts exactly the CA named in collector.json (custom_ca_cert_path), checks the revocation list and refuses a certificate for another server name.
    Nothing is added to the Windows certificate store and TLS validation is never disabled.

    1. refuses to run on a Collector older than 1.4.0 and checks the root file against its pinned SHA-256, that it is a CA certificate and not expired
    2. records the identity (collector_id, server_url, BIOS UUID, secure.dat hash) and checks that the server's HTTPS port answers
    3. stops the service (verified), backs up collector.json, copies the root certificate next to it, sets server_url and custom_ca_cert_path (all other keys stay as they are)
    4. starts the service and waits for the service log to show an accepted inventory over the new address
    5. if that does not happen: restores the old collector.json and restarts the service on the old address; the service is never left stopped
    Exit codes: 0 switched and working, 1 failed (old settings restored), 2 refused before changing anything.   -WhatIf shows the plan and changes nothing.
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [string]$ServerUrl = 'https://192.168.20.61',
    [string]$RootPem = (Join-Path $PSScriptRoot 'lider-root-ca.pem'),
    [string]$RootSha256 = '21E94EC9750C21E2442E0818107BE870BE6C83AD1369D8DAAEACBE6D4EC733E2',
    [string]$MinVersion = '1.4.0',
    [int]$WaitMinutes = 8,
    [switch]$LibraryOnly
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ownLibraryOnly = $LibraryOnly   # the dot-sourced library has its own -LibraryOnly and would overwrite this variable
. (Join-Path $PSScriptRoot 'Pilot-Upgrade.ps1') -LibraryOnly -StopTimeoutSec 90 -StartTimeoutSec 90 -HealthWaitSec 5

function Test-RootFile([string]$Path, [string]$Pin) {
    if (-not (Test-Path $Path)) { return "root certificate file not found: $Path" }
    if ((Get-Sha256Shared $Path).ToUpper() -ne $Pin.ToUpper()) { return 'the root certificate file is not the pinned LIDER root (SHA-256 differs)' }
    try { $c = New-Object Security.Cryptography.X509Certificates.X509Certificate2 $Path } catch { return "not a certificate: $($_.Exception.Message)" }
    $bc = $c.Extensions | Where-Object { $_ -is [Security.Cryptography.X509Certificates.X509BasicConstraintsExtension] }
    if (-not $bc -or -not $bc.CertificateAuthority) { return 'the file is not a CA certificate' }
    if ((Get-Date) -lt $c.NotBefore -or (Get-Date) -gt $c.NotAfter) { return 'the root certificate is not valid now' }
    return $null
}
function Test-HttpsPort([string]$Url) { try { $u = [uri]$Url; $t = New-Object Net.Sockets.TcpClient; $r = $t.BeginConnect($u.Host, $(if ($u.Port -gt 0) { $u.Port } else { 443 }), $null, $null); $ok = $r.AsyncWaitHandle.WaitOne(5000) -and $t.Connected; $t.Close(); return $ok } catch { return $false } }

function Get-InstalledVersionOrNull { $i = Installed; if ($i) { return [version]$i.Version } else { return $null } }

function Get-AcceptedInventorySince([string]$LogDir, [datetime]$Since) {
    $ok = $false; $missed = 0
    foreach ($f in (Get-ChildItem $LogDir -Filter 'collector-*.log' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime | Select-Object -Last 2)) {
        $fs = New-Object IO.FileStream($f.FullName, 'Open', 'Read', ([IO.FileShare]'ReadWrite,Delete')); $sr = New-Object IO.StreamReader($fs)
        try { while ($null -ne ($l = $sr.ReadLine())) {
            if ($l -match '^(\d{4}-\d\d-\d\d \d\d:\d\d:\d\d)' -and ([datetime]$Matches[1]) -ge $Since) {
                if ($l -match 'Inventory sync sent') { $ok = $true }
                if ($l -match 'Heartbeat missed|certificate|SSL|TLS|Name mismatch') { $missed++ }
            } } } finally { $sr.Dispose(); $fs.Dispose() }
    }
    return [pscustomobject]@{ InventorySent = $ok; Problems = $missed }
}

function Set-CollectorConfigKeys([string]$Path, [hashtable]$Keys) {
    $j = Get-Content $Path -Raw | ConvertFrom-Json
    foreach ($k in $Keys.Keys) { if ($j.PSObject.Properties[$k]) { $j.$k = $Keys[$k] } else { $j | Add-Member -NotePropertyName $k -NotePropertyValue $Keys[$k] } }
    [IO.File]::WriteAllText($Path, ($j | ConvertTo-Json -Depth 8), (New-Object Text.UTF8Encoding($false)))
}

function Invoke-HttpsSwitch {
    if (-not $ServerUrl.StartsWith('https://')) { Warn 'ServerUrl must be https://'; return 2 }
    $v = Get-InstalledVersionOrNull
    if (-not $v) { Warn 'no Collector installed from an MSI here'; return 2 }
    if ($v -lt [version]$MinVersion) { Warn "Collector $v cannot verify a private CA; install $MinVersion first (see PILOT runbook). Nothing was changed."; return 2 }
    if ($why = Test-RootFile $RootPem $RootSha256) { Warn $why; return 2 }
    if (-not (Test-HttpsPort $ServerUrl)) { Warn "$ServerUrl does not answer on its HTTPS port; nothing was changed."; return 2 }

    $cfg = Join-Path $Data 'collector.json'; $caDst = Join-Path $Data 'lider-root-ca.pem'
    $idBefore = Get-Identity; $wasRunning = ((Get-SvcStatus) -eq 'Running')
    Info ("before: version {0}, service {1}, collector_id {2}, server_url {3}" -f $v, (Get-SvcStatus), $idBefore.collector_id, $idBefore.server_url)
    if (-not (Do-It "stop the service, back up collector.json, copy the root certificate to $caDst, set server_url=$ServerUrl and custom_ca_cert_path, start the service and wait up to $WaitMinutes min for an accepted inventory")) { return 0 }

    $bk = Join-Path $Data ("collector.json.before-https-{0}" -f (Get-Date -Format 'yyyyMMdd-HHmmss')); $changed = $false; $good = $false
    try {
        if ($wasRunning -and -not (Stop-CollectorService $StopTimeoutSec)) { Warn 'the service did not stop; nothing was changed.'; return 2 }
        Copy-FileShared $cfg $bk
        if ((Get-Sha256Shared $bk) -ne (Get-Sha256Shared $cfg)) { Warn 'backup of collector.json differs from the original; nothing was changed.'; return 2 }
        Copy-FileShared $RootPem $caDst
        Set-CollectorConfigKeys $cfg @{ server_url = $ServerUrl; custom_ca_cert_path = $caDst }; $changed = $true
        $t0 = Get-Date
        if (-not (Start-CollectorService $StartTimeoutSec)) { Warn 'the service did not start with the new settings' }
        else {
            $deadline = $t0.AddMinutes($WaitMinutes)
            do { Start-Sleep -Seconds 10; $ev = Get-AcceptedInventorySince (Join-Path $Data 'logs') $t0; Write-Host -NoNewline '.' } while (-not $ev.InventorySent -and (Get-Date) -lt $deadline)
            Write-Host ''
            $idNow = Get-Identity
            $diff = @(Compare-Identity ([pscustomobject]@{ collector_id = $idBefore.collector_id; server_url = $ServerUrl; enrolled_bios_uuid = $idBefore.enrolled_bios_uuid; secure_dat_sha256 = $idBefore.secure_dat_sha256 }) $idNow)
            if ($diff.Count) { Warn ('identity differs after the switch: ' + ($diff -join '; ')) }
            elseif ($ev.InventorySent) { $good = $true }
            else { Warn "no accepted inventory within $WaitMinutes min over $ServerUrl" }
        }
        if ($good) { Info "HTTPS OK: $ServerUrl is in use, an inventory was accepted, identity unchanged. Backup of the old settings: $bk"; return 0 }
        # revert
        Warn 'REVERTING to the previous collector.json'
        Stop-CollectorService $StopTimeoutSec | Out-Null
        Copy-FileShared $bk $cfg; $changed = $false
        if (-not (Start-CollectorService $StartTimeoutSec)) { Warn 'the service did not start after the revert - start LiderITONECollector manually' }
        return 1
    }
    finally {
        if ($changed -and -not $good) { try { Copy-FileShared $bk $cfg } catch { } }
        if ($wasRunning -and (Get-SvcStatus) -ne 'Running') { Warn 'safety net: starting the service'; Start-CollectorService $StartTimeoutSec | Out-Null }
    }
}

if ($ownLibraryOnly) { return }
$r = @(Invoke-HttpsSwitch); exit [int]$r[-1]
