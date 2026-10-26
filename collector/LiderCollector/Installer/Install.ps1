#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Lider IT ONE Collector - Windows Service Installer

.DESCRIPTION
    Installs the LiderITONE Collector as a Windows Service.
    Must be run as Administrator.

.PARAMETER EnrollToken
    One-time enrollment token issued from the Lider IT ONE portal.
    Required for first-time installation.

.PARAMETER ServerUrl
    HTTPS URL of the Lider IT ONE server.
    Example: https://itone.example.com

.PARAMETER CaCertPath
    Optional path to a custom CA certificate (.crt / .pem) for internal PKI.
    When provided, the collector will use it to verify the server's SSL certificate.

.PARAMETER InstallPath
    Directory to install the collector into.
    Default: C:\Program Files\LiderITONECollector

.PARAMETER Uninstall
    If specified, stops and removes the service.

.EXAMPLE
    .\Install.ps1 -EnrollToken "abc123..." -ServerUrl "https://itone.example.com"

.EXAMPLE
    .\Install.ps1 -Uninstall
#>

param(
    [string]$EnrollToken,
    [string]$ServerUrl,
    [string]$CaCertPath,
    [string]$InstallPath = "C:\Program Files\LiderITONECollector",
    [switch]$Uninstall
)

$ServiceName = "LiderITONECollector"
$ExeName     = "LiderCollector.exe"

# ── Helper functions ───────────────────────────────────────────────────────────

function Write-Step([string]$msg) {
    Write-Host "  >> $msg" -ForegroundColor Cyan
}

function Write-Ok([string]$msg) {
    Write-Host "  [OK] $msg" -ForegroundColor Green
}

function Write-Fail([string]$msg) {
    Write-Host "  [FAIL] $msg" -ForegroundColor Red
}

# ── Uninstall path ─────────────────────────────────────────────────────────────

if ($Uninstall) {
    Write-Host "`nLider IT ONE Collector - Uninstall`n" -ForegroundColor Yellow

    $svc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($svc) {
        Write-Step "Stopping service..."
        Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2

        Write-Step "Removing service..."
        sc.exe delete $ServiceName | Out-Null
        Write-Ok "Service removed."
    } else {
        Write-Host "  Service not found — nothing to remove."
    }

    if (Test-Path $InstallPath) {
        $confirm = Read-Host "  Remove installation directory $InstallPath? [y/N]"
        if ($confirm -eq 'y' -or $confirm -eq 'Y') {
            Remove-Item -Path $InstallPath -Recurse -Force
            Write-Ok "Installation directory removed."
        }
    }

    Write-Host "`nUninstall complete.`n"
    exit 0
}

# ── Install path ───────────────────────────────────────────────────────────────

Write-Host "`nLider IT ONE Collector v0.1 - Installer`n" -ForegroundColor Cyan

# Validate required parameters
if ([string]::IsNullOrWhiteSpace($EnrollToken)) {
    Write-Fail "EnrollToken is required. Use -EnrollToken <token>"
    exit 1
}
if ([string]::IsNullOrWhiteSpace($ServerUrl)) {
    Write-Fail "ServerUrl is required. Use -ServerUrl <url>"
    exit 1
}
if (-not $ServerUrl.StartsWith("https://")) {
    Write-Fail "ServerUrl must use HTTPS (https://...)"
    exit 1
}

# Locate the collector exe (same directory as this script)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ExeSource = Join-Path $ScriptDir $ExeName
if (-not (Test-Path $ExeSource)) {
    Write-Fail "Collector executable not found at: $ExeSource"
    exit 1
}

# ── Create install directory ───────────────────────────────────────────────────

Write-Step "Creating installation directory: $InstallPath"
New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
New-Item -ItemType Directory -Path "$InstallPath\logs" -Force | Out-Null

# ── Copy files ─────────────────────────────────────────────────────────────────

Write-Step "Copying files..."
Copy-Item -Path "$ScriptDir\*" -Destination $InstallPath -Recurse -Force -Exclude "*.ps1"
Write-Ok "Files copied."

# ── Write initial collector.json ───────────────────────────────────────────────

Write-Step "Writing configuration..."
$config = @{
    server_url                         = $ServerUrl
    collector_id                       = 0
    heartbeat_interval_seconds         = 60
    inventory_sync_interval_seconds    = 900
    performance_interval_seconds       = 120
    offline_threshold_missed_heartbeats = 3
    log_level                          = "Information"
    modules = @{
        system      = $true
        software    = $true
        performance = $true
        event_log   = $true
        windows_update = $true
        ad          = $false
        hyper_v     = $false
        vmware      = $false
    }
}

if (-not [string]::IsNullOrWhiteSpace($CaCertPath)) {
    if (Test-Path $CaCertPath) {
        $destCert = Join-Path $InstallPath "ca.crt"
        Copy-Item -Path $CaCertPath -Destination $destCert -Force
        $config.custom_ca_cert_path = $destCert
        Write-Ok "Custom CA certificate copied."
    } else {
        Write-Fail "CA cert not found at: $CaCertPath"
        exit 1
    }
}

$configJson = $config | ConvertTo-Json -Depth 5
Set-Content -Path "$InstallPath\collector.json" -Value $configJson -Encoding UTF8
Write-Ok "Configuration written."

# ── Store enrollment token in DPAPI via the collector itself ───────────────────
# We write a bootstrap file that the service reads on first start to
# seed the DPAPI store, then deletes itself.

Write-Step "Storing enrollment token..."
$bootstrapPath = Join-Path $InstallPath "enroll_bootstrap.txt"
Set-Content -Path $bootstrapPath -Value $EnrollToken -Encoding UTF8
# The collector reads this file on first start, calls SecureStorage.Set("enroll_token", ...)
# and then deletes enroll_bootstrap.txt.
Write-Ok "Enrollment token staged."

# ── Install service ────────────────────────────────────────────────────────────

Write-Step "Registering Windows Service..."
$ExePath = Join-Path $InstallPath $ExeName

# Remove any existing registration
$existingSvc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existingSvc) {
    Write-Step "Stopping existing service..."
    Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    sc.exe delete $ServiceName | Out-Null
    Start-Sleep -Seconds 1
}

sc.exe create $ServiceName binPath= "`"$ExePath`"" DisplayName= "Lider IT ONE Collector" start= auto | Out-Null
sc.exe description $ServiceName "Lider IT ONE Site Collector - hardware and software inventory agent" | Out-Null
sc.exe failure $ServiceName reset= 86400 actions= restart/60000/restart/60000/restart/60000 | Out-Null

Write-Ok "Service registered."

# ── Set service account ────────────────────────────────────────────────────────
# Runs as LocalSystem to allow DPAPI (CurrentUser scope is the service account)
# For production, consider a dedicated service account with least privilege.
sc.exe config $ServiceName obj= LocalSystem | Out-Null

# ── Start service ──────────────────────────────────────────────────────────────

Write-Step "Starting service..."
Start-Service -Name $ServiceName
Start-Sleep -Seconds 3

$svc = Get-Service -Name $ServiceName
if ($svc.Status -eq "Running") {
    Write-Ok "Service is running."
} else {
    Write-Fail "Service did not start. Check logs: $InstallPath\logs\"
    exit 1
}

Write-Host "`nInstallation complete.`n" -ForegroundColor Green
Write-Host "  Install path : $InstallPath"
Write-Host "  Log files    : $InstallPath\logs\"
Write-Host "  Config file  : $InstallPath\collector.json"
Write-Host ""
Write-Host "  The collector will enroll automatically on first heartbeat."
Write-Host "  Monitor enrollment status in the Lider IT ONE portal."
Write-Host ""
