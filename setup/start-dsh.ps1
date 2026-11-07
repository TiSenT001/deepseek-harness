<#
.SYNOPSIS
  Start the development server for this checkout with a self-contained DSH home.

.DESCRIPTION
  Reads setup\machine.env.ps1 when present, defaults DSH_HOME to <repo>\.dsh-home,
  starts `dsh web` in the background, waits for its URL, and opens the browser.
  Re-running while the server is up only re-opens the current URL.
#>
[CmdletBinding()]
param(
  [int]$Port = 3080,
  [string]$Vault,
  [string]$DshHome,
  [switch]$NoOpen
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$machineEnv = Join-Path $PSScriptRoot 'machine.env.ps1'
if (Test-Path -LiteralPath $machineEnv) { . $machineEnv }

if ([string]::IsNullOrWhiteSpace($DshHome)) { $DshHome = Join-Path $RepoRoot '.dsh-home' }
$env:DSH_HOME = $DshHome
if ($Vault) { $env:OBSIDIAN_VAULT = $Vault }

New-Item -ItemType Directory -Force -Path $DshHome | Out-Null
$log = Join-Path $DshHome 'dsh-web.log'
$err = Join-Path $DshHome 'dsh-web.err.log'

function LatestUrl([string]$path) {
  if (-not (Test-Path -LiteralPath $path)) { return $null }
  $lines = Get-Content -LiteralPath $path -Tail 80 -ErrorAction SilentlyContinue
  for ($index = $lines.Count - 1; $index -ge 0; $index -= 1) {
    if ($lines[$index] -match 'dsh web: (http://\S+)') { return $Matches[1].Trim() }
  }
  return $null
}

function Open-Url([string]$url) {
  if ($NoOpen) { Write-Host $url; return }
  Write-Host "Opening $url"
  Start-Process $url
}

$listening = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($null -ne $listening) {
  $url = LatestUrl $log
  if ($null -eq $url) {
    Write-Host "Port $Port is already in use but $log has no URL;" -ForegroundColor Yellow
    Write-Host 'stop the other process or pass -Port with a different value.' -ForegroundColor Yellow
    exit 1
  }
  Open-Url $url
  exit 0
}

if (-not (Test-Path (Join-Path $RepoRoot 'node_modules'))) {
  Write-Host 'Installing repository dependencies first (node_modules missing)...'
  Push-Location $RepoRoot
  try { pnpm install } finally { Pop-Location }
}

if ([string]::IsNullOrWhiteSpace($env:DEEPSEEK_API_KEY)) {
  Write-Host 'DEEPSEEK_API_KEY is not set; sign in through the GUI account panel or set it in machine.env.ps1.' -ForegroundColor Yellow
}

$arguments = @('--import', 'tsx/esm', 'apps/cli/src/bin.ts', 'web', '--no-open', '--port', "$Port")
Write-Host "Starting dsh web on port $Port (DSH_HOME=$DshHome)"
Push-Location $RepoRoot
try {
  Start-Process -FilePath 'node' -ArgumentList $arguments -WorkingDirectory $RepoRoot -WindowStyle Hidden `
    -RedirectStandardOutput $log -RedirectStandardError $err | Out-Null
} finally {
  Pop-Location
}

$deadline = (Get-Date).AddSeconds(90)
$url = $null
while ((Get-Date) -lt $deadline) {
  Start-Sleep -Milliseconds 700
  $url = LatestUrl $log
  if ($null -ne $url) { break }
}
if ($null -eq $url) {
  Write-Host 'The server did not report a URL within 90 seconds.' -ForegroundColor Red
  Write-Host "Check $log and $err" -ForegroundColor Red
  exit 1
}
Open-Url $url
