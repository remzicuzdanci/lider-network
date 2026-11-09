#Requires -Version 5.1
<#
.SYNOPSIS
    Builds the Lider IT ONE Collector MSI (self-contained .NET 8, win-x64) and its stamping manifest.

.DESCRIPTION
    1. Publishes LiderCollector as a self-contained single-file executable (no .NET runtime needed on the target).
    2. Runs the unit tests (skippable for quick iterations only).
    3. Builds the WiX v4 MSI. Paths are converted to 8.3 short form because wix.exe splits arguments on spaces.
    4. Locates the ENROLLTOKEN / SERVERURL placeholders inside the MSI, writes <msi>.manifest.json
       (offsets, lengths, sha256, size) used by the server to stamp a per-customer copy, and
    5. reads the finished MSI back through the Windows Installer API (read-only; nothing is installed).

.PARAMETER Version   MSI / agent version, e.g. 1.1.0 (default: 1.1.0)
.PARAMETER SkipTests Skip unit tests
#>
param(
    [string]$Version = "1.1.0",
    [switch]$SkipTests
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Root         = $PSScriptRoot
$CollectorDir = Join-Path $Root "LiderCollector"
$TestDir      = Join-Path $Root "LiderCollector.Tests"
$InstallerDir = Join-Path $Root "LiderCollector.Installer"
$PublishDir   = Join-Path $CollectorDir "bin\Release\net8.0-windows\win-x64\publish"
$OutputDir    = Join-Path $Root "dist"
$MsiPath      = Join-Path $OutputDir "LiderITONECollector-$Version.msi"

function Step($m) { Write-Host "`n==> $m" -ForegroundColor Cyan }
function Short($p) { $fso = New-Object -ComObject Scripting.FileSystemObject; if (Test-Path $p -PathType Container) { return $fso.GetFolder($p).ShortPath } else { return $fso.GetFile($p).ShortPath } }

Step "Publishing LiderCollector $Version (Release / win-x64 / self-contained / single file)"
dotnet publish "$CollectorDir\LiderCollector.csproj" -c Release -r win-x64 --self-contained true `
    -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -p:Version=$Version
if ($LASTEXITCODE -ne 0) { throw "dotnet publish failed" }
$exe = Join-Path $PublishDir "LiderCollector.exe"
if (-not (Test-Path $exe)) { throw "published exe missing: $exe" }
Write-Host ("  {0} ({1:N1} MB)" -f $exe, ((Get-Item $exe).Length / 1MB))

if (-not $SkipTests) {
    Step "Running unit tests"
    dotnet test "$TestDir\LiderCollector.Tests.csproj" -c Release
    if ($LASTEXITCODE -ne 0) { throw "unit tests failed" }
} else { Write-Warning "Tests skipped" }

Step "Building MSI (WiX v4)"
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$wix = Join-Path $env:USERPROFILE ".dotnet\tools\wix.exe"
if (-not (Test-Path $wix)) { $wix = (Get-Command wix -ErrorAction Stop).Source }
$extDll = Get-ChildItem (Join-Path $env:USERPROFILE ".nuget\packages\wixtoolset.util.wixext") -Recurse -Filter "WixToolset.Util.wixext.dll" | Sort-Object FullName | Select-Object -Last 1
if (-not $extDll) { throw "WixToolset.Util.wixext not found in the NuGet cache (run: dotnet build the wixproj once, or 'wix extension add')" }

$inst8 = Short $InstallerDir; $pub8 = Short $PublishDir; $ext8 = Short $extDll.Directory.FullName; $out8 = Short $OutputDir
$msiShort = "$out8\LiderITONECollector-$Version.msi"
& (Short $wix) build -arch x64 -out $msiShort -ext "$ext8\WixToolset.Util.wixext.dll" `
    -d "CollectorPublishDir=$pub8\" -d "ProductVersion=$Version" -d "InstallerDir=$inst8\" `
    "$inst8\Package.wxs" "$inst8\Directories.wxs" "$inst8\DataDirectory.wxs" "$inst8\ServiceConfig.wxs"
if ($LASTEXITCODE -ne 0) { throw "wix build failed" }
if (-not (Test-Path $MsiPath)) { throw "MSI not produced: $MsiPath" }

Step "Locating stamp placeholders and writing the manifest"
$bytes = [System.IO.File]::ReadAllBytes($MsiPath)
$text  = [System.Text.Encoding]::GetEncoding(28591).GetString($bytes)   # latin1: 1 byte = 1 char, offsets stay exact
function Find-Placeholder($marker) {
    $ms = [regex]::Matches($text, [regex]::Escape($marker) + "#+")
    if ($ms.Count -ne 1) { throw "placeholder '$marker' found $($ms.Count) times in the MSI (expected exactly 1; it may straddle a sector boundary - change its length)" }
    return @{ offset = $ms[0].Index; length = $ms[0].Length; value = $ms[0].Value }
}
$tok = Find-Placeholder "@@LIDER_ENROLL_TOKEN@@"
$url = Find-Placeholder "@@LIDER_SERVER_URL@@"
$sha = (Get-FileHash $MsiPath -Algorithm SHA256).Hash.ToLower()
$manifest = [ordered]@{
    product        = "Lider IT ONE Collector"
    version        = $Version
    file           = (Split-Path $MsiPath -Leaf)
    size           = (Get-Item $MsiPath).Length
    sha256         = $sha
    built_at       = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    token          = $tok
    server_url     = $url
}
$manifest | ConvertTo-Json -Depth 4 | Set-Content -Encoding UTF8 (Join-Path $OutputDir "LiderITONECollector-$Version.manifest.json")
Write-Host ("  token placeholder @ {0} ({1} bytes), server_url placeholder @ {2} ({3} bytes)" -f $tok.offset, $tok.length, $url.offset, $url.length)

Step "Read-only MSI verification (Windows Installer API; nothing is installed)"
$wi = New-Object -ComObject WindowsInstaller.Installer
$db = $wi.OpenDatabase([string]$MsiPath, 0)
function Dump($sql) {
    $cols = (($sql -split " FROM ")[0] -split ",").Count
    $v = $db.OpenView($sql); [void]$v.Execute()
    while ($true) {
        $r = $v.Fetch(); if ($null -eq $r) { break }
        (1..$cols | ForEach-Object { [string]$r.StringData([int]$_) }) -join [char]9
    }
    [void]$v.Close()
}
function Rows($sql) { @(Dump $sql | ForEach-Object { ,($_ -split [char]9) }) }
$props = @{}
foreach ($r in (Rows "SELECT Property,Value FROM Property")) { $props[$r[0]] = $r[1] }
foreach ($k in "ProductName", "ProductVersion", "UpgradeCode", "Manufacturer") { Write-Host ("  {0,-15} {1}" -f $k, $props[$k]) }
if ($props["ProductVersion"] -ne $Version) { throw "ProductVersion mismatch" }
if (-not $props["ENROLLTOKEN"].StartsWith("@@LIDER_ENROLL_TOKEN@@")) { throw "ENROLLTOKEN placeholder not intact" }
if ($props["MsiHiddenProperties"] -notmatch "ENROLLTOKEN") { throw "ENROLLTOKEN is not hidden in installer logs" }
foreach ($line in (Dump "SELECT Name,StartType FROM ServiceInstall")) { $c = $line -split [char]9; Write-Host ("  ServiceInstall : {0} (start={1}, 2=auto)" -f $c[0], $c[1]) }
Write-Host ("  Files          : {0}" -f ((Rows "SELECT FileName,FileSize FROM File" | ForEach-Object { $_[0].Split('|')[-1] + " " + [math]::Round([double]$_[1] / 1MB, 1) + "MB" }) -join "; "))
Write-Host ("  Custom actions : {0}" -f ((Rows "SELECT Action,Type FROM CustomAction" | Where-Object { $_[0] -like 'Lider*' } | ForEach-Object { $_[0] }) -join ", "))
Write-Host ("  Launch cond.   : {0}" -f ((Rows "SELECT Condition,Description FROM LaunchCondition" | ForEach-Object { $_[0] }) -join " ; "))

Write-Host ""
Write-Host "MSI ready: $MsiPath" -ForegroundColor Green
Write-Host "SHA256   : $sha"
