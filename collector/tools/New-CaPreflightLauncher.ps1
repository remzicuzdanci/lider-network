#Requires -Version 5.1
# Builds the ONE-FILE read-only CA-host pre-flight (.cmd) for the DC from envanter\scripts\ca\Get-CaPreflight.ps1, with the SHA-256 of the repository CA scripts filled in.
param([string]$CaScripts = (Join-Path $PSScriptRoot '..\..\..\envanter\scripts\ca'), [string]$Out = (Join-Path $PSScriptRoot '..\dist\ca-preflight\CA-Preflight.cmd'))
$ErrorActionPreference = 'Stop'
$h = @{}; foreach ($n in 'LiderCA', 'Monitor-LiderCa', 'Publish-Crl') { $h[$n] = (Get-FileHash (Join-Path $CaScripts "$n.ps1") -Algorithm SHA256).Hash }
$t = [IO.File]::ReadAllText((Join-Path $CaScripts 'Get-CaPreflight.ps1'))
$t = $t.Replace('@@H_LiderCA@@', $h['LiderCA']).Replace('@@H_Monitor@@', $h['Monitor-LiderCa']).Replace('@@H_Publish@@', $h['Publish-Crl'])
$tmp = Join-Path ([IO.Path]::GetTempPath()) 'Get-CaPreflight.ps1'; [IO.File]::WriteAllText($tmp, $t, (New-Object Text.UTF8Encoding($false)))
New-Item -ItemType Directory -Force (Split-Path $Out) | Out-Null
& (Join-Path $PSScriptRoot 'New-PreflightLauncher.ps1') -Script $tmp -Out $Out -ReportPattern 'ca-preflight-*.txt' -Title 'LIDER CA host pre-flight (read-only)' -Elevate
Remove-Item -LiteralPath $tmp -Force
