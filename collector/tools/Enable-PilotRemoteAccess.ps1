#Requires -Version 5.1
<#
.SYNOPSIS
    Opens a TEMPORARY, narrow remote-command path to THIS computer (MIKRO-PC) for the Collector pilot, and closes it again. Run elevated, on MIKRO-PC, by the administrator.

.DESCRIPTION
    What it opens:  OpenSSH Server, key login ONLY (no passwords), for the account that runs this script, from ONE address (-AllowFrom), with ONE public key (the pilot key below).
                    The matching private key stays on the assistant's workstation; it is deleted afterwards. The key is restricted with from="<address>" and no forwarding.
    What it does not do:  no password is created, shared or typed anywhere; no other firewall rule, user, group, certificate or service is changed; the sshd_config is replaced
                    by a minimal hardened one (the previous file is kept as .before-pilot and restored by -Teardown).
    How it closes:  a scheduled task (SYSTEM) runs this script with -Teardown after -Hours (default 4). You can also run  .\Enable-PilotRemoteAccess.ps1 -Teardown  yourself at any time:
                    it stops sshd, removes the firewall rule, the authorised key and the task, and restores sshd_config. (-RemoveFeature also uninstalls OpenSSH Server.)
    While it is open the holder of the private key can run any command as the account that ran this script - that is the whole point and the whole risk. Open it only for the pilot.
    -DryRun prints what would happen and changes nothing.
#>
[CmdletBinding()]
param(
    [string]$AllowFrom = '192.168.100.8',
    [int]$Hours = 4,
    [switch]$Teardown,
    [switch]$RemoveFeature,
    [switch]$DryRun
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$PubKey   = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIM/qQKBzhE3rSvkWtQTXqQHkdret5aT8nbjgnK+SnLHm lider-pilot-temp-20261114'
$RuleName = 'LIDER-PILOT-SSH'; $TaskName = 'LIDER-PILOT-SSH-TEARDOWN'
$SshDir   = Join-Path $env:ProgramData 'ssh'; $Cfg = Join-Path $SshDir 'sshd_config'; $AdminKeys = Join-Path $SshDir 'administrators_authorized_keys'
function Step($what, [scriptblock]$act) { if ($DryRun) { Write-Host "[dry-run] $what" } else { Write-Host "[pilot-ssh] $what"; & $act } }
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole('Administrators')) { throw 'run elevated (as an administrator)' }
if ($AllowFrom -notmatch '^\d{1,3}(\.\d{1,3}){3}$') { throw '-AllowFrom must be a single IPv4 address' }

if ($Teardown) {
    Step 'stop sshd and set it to manual/disabled' { Stop-Service sshd -Force -ErrorAction SilentlyContinue; Set-Service sshd -StartupType Disabled -ErrorAction SilentlyContinue }
    Step 'remove the firewall rule'  { Get-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue | Remove-NetFirewallRule }
    Step 'remove the pilot key from administrators_authorized_keys' {
        if (Test-Path $AdminKeys) { $keep = @(Get-Content $AdminKeys | Where-Object { $_ -notmatch 'lider-pilot-temp' }); if ($keep.Count) { $keep | Set-Content $AdminKeys -Encoding ascii } else { Remove-Item $AdminKeys -Force } }
    }
    Step 'restore the previous sshd_config' { if (Test-Path "$Cfg.before-pilot") { Move-Item "$Cfg.before-pilot" $Cfg -Force } }
    Step 'remove the teardown task' { Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue }
    if ($RemoveFeature) { Step 'uninstall OpenSSH Server' { Remove-WindowsCapability -Online -Name 'OpenSSH.Server~~~~0.0.1.0' | Out-Null } }
    if (-not $DryRun) {
        $left = @(); if ((Get-Service sshd -ErrorAction SilentlyContinue).Status -eq 'Running') { $left += 'sshd still running' }
        if (Get-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue) { $left += 'firewall rule still present' }
        if ((Test-Path $AdminKeys) -and (Select-String -Path $AdminKeys -Pattern 'lider-pilot-temp' -Quiet)) { $left += 'pilot key still present' }
        if ($left) { Write-Warning ('NOT fully closed: ' + ($left -join '; ')) ; exit 1 } else { Write-Host '[pilot-ssh] CLOSED: no listener, no rule, no key.' -ForegroundColor Green }
    }
    return
}

$user = $env:USERNAME
Write-Host "[pilot-ssh] account that will be reachable: $env:USERDOMAIN\$user   only from: $AllowFrom   open for: $Hours h"
Step 'install OpenSSH Server if missing (Windows feature; needs Windows Update/WSUS access - if it fails, install the official Win32-OpenSSH MSI offline and re-run)' {
    if (-not (Get-Service sshd -ErrorAction SilentlyContinue)) { Add-WindowsCapability -Online -Name 'OpenSSH.Server~~~~0.0.1.0' | Out-Null }
}
Step 'keep the current sshd_config as .before-pilot and write a minimal key-only one' {
    New-Item -ItemType Directory -Force -Path $SshDir | Out-Null
    if ((Test-Path $Cfg) -and -not (Test-Path "$Cfg.before-pilot")) { Copy-Item $Cfg "$Cfg.before-pilot" }
    @(
        "# LIDER pilot - temporary. Restored by Enable-PilotRemoteAccess.ps1 -Teardown",
        'Port 22', 'PasswordAuthentication no', 'KbdInteractiveAuthentication no', 'PubkeyAuthentication yes', 'PermitEmptyPasswords no',
        "AllowUsers $user", 'AllowTcpForwarding no', 'X11Forwarding no', 'MaxAuthTries 3', 'LoginGraceTime 30', 'LogLevel VERBOSE',
        'Match Group administrators', '       AuthorizedKeysFile __PROGRAMDATA__/ssh/administrators_authorized_keys'
    ) | Set-Content $Cfg -Encoding ascii
}
Step 'install the pilot public key (only from the allowed address, no forwarding) with a locked-down ACL' {
    $line = 'from="' + $AllowFrom + '",no-port-forwarding,no-agent-forwarding,no-X11-forwarding ' + $PubKey
    $existing = @(); if (Test-Path $AdminKeys) { $existing = @(Get-Content $AdminKeys | Where-Object { $_ -notmatch 'lider-pilot-temp' }) }
    ($existing + $line) | Set-Content $AdminKeys -Encoding ascii
    icacls $AdminKeys /inheritance:r /grant 'SYSTEM:F' /grant 'Administrators:F' | Out-Null
}
Step "firewall: allow TCP 22 only from $AllowFrom" {
    Get-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue | Remove-NetFirewallRule
    New-NetFirewallRule -DisplayName $RuleName -Direction Inbound -Protocol TCP -LocalPort 22 -RemoteAddress $AllowFrom -Action Allow -Profile Any | Out-Null
}
Step 'start sshd (manual start type, never automatic)' { Set-Service sshd -StartupType Manual; Restart-Service sshd }
Step "schedule the automatic teardown in $Hours h" {
    $self = $PSCommandPath; if (-not $self) { throw 'run this from a saved .ps1 file so the teardown task can call it' }
    $a = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument ('-NoProfile -ExecutionPolicy Bypass -File "' + $self + '" -Teardown')
    Register-ScheduledTask -TaskName $TaskName -Action $a -Trigger (New-ScheduledTaskTrigger -Once -At (Get-Date).AddHours($Hours)) -User 'SYSTEM' -RunLevel Highest -Force | Out-Null
}
if (-not $DryRun) {
    Write-Host "`n=== give the assistant these (they are public) ==="
    Write-Host "computer : $env:COMPUTERNAME   account: $env:USERDOMAIN\$user   address: $((Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like '192.168.20.*' } | Select-Object -First 1).IPAddress)"
    foreach ($k in Get-ChildItem "$SshDir\ssh_host_*_key.pub" -ErrorAction SilentlyContinue) { Write-Host ("host key : " + (& ssh-keygen.exe -lf $k.FullName)) }
    Write-Host "closes   : automatically at $((Get-Date).AddHours($Hours).ToString('yyyy-MM-dd HH:mm'))  (or run  .\Enable-PilotRemoteAccess.ps1 -Teardown)"
}
