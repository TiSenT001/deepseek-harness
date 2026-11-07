<#
.SYNOPSIS
  Provision this checkout on a new Windows machine: repository dependencies, the
  local plugins, the web profile, and a portable launcher.

.DESCRIPTION
  Everything machine-specific (vault path, terminal cwd, LSP directory) lives in
  setup\machine.env.ps1 or in the generated profile; nothing in the repository
  hardcodes a drive letter. Run this once after cloning and checking out the
  feature branch.

.PARAMETER Vault
  Absolute path of the Obsidian vault. Defaults to $env:OBSIDIAN_VAULT.

.PARAMETER DshHome
  DSH home directory. Defaults to <repo>\.dsh-home so the checkout is self-contained.

.PARAMETER LspDir
  Optional directory holding the LSP language servers. Omit to skip the LSP rows.

.PARAMETER SkipInstall
  Do not run pnpm install in the repository or the profile.

.PARAMETER SkipSidebar
  Do not clone or patch dsh-better-sidebar.

.PARAMETER Force
  Re-render the profile even when one already exists (existing files are backed up).

.PARAMETER Shortcut
  Create a desktop shortcut that runs setup\start-dsh.ps1.

.PARAMETER DryRun
  Print every action without writing files or running installs.
#>
[CmdletBinding()]
param(
  [string]$Vault = $env:OBSIDIAN_VAULT,
  [string]$DshHome,
  [string]$LspDir = $env:DSH_LSP_DIR,
  [string]$BrainRoot = $env:BRAIN_ROOT,
  [string]$BrainPythonw = $env:BRAIN_PYTHONW,
  [string]$Profile = 'web',
  [switch]$SkipInstall,
  [switch]$SkipSidebar,
  [switch]$Force,
  [switch]$Shortcut,
  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
if ([string]::IsNullOrWhiteSpace($DshHome)) { $DshHome = Join-Path $RepoRoot '.dsh-home' }
$ProfileDir = Join-Path $DshHome "profiles\$Profile"
$BetterSidebar = Join-Path $RepoRoot 'plugins\dsh-better-sidebar-src'
$SidebarRepo = 'https://github.com/omdsh-dev/DSH-better-sidebar.git'
$SidebarCommit = '83faf70'

function Step([string]$message) { Write-Host "`n== $message" -ForegroundColor Cyan }
function Info([string]$message) { Write-Host "   $message" }
function Warn([string]$message) { Write-Host "   ! $message" -ForegroundColor Yellow }
function Fail([string]$message) { Write-Host "   x $message" -ForegroundColor Red; exit 1 }
function Write-Utf8([string]$path, [string]$content) {
  [System.IO.File]::WriteAllText($path, $content, (New-Object System.Text.UTF8Encoding($false)))
}
function Write-Utf8Bom([string]$path, [string]$content) {
  [System.IO.File]::WriteAllText($path, $content, (New-Object System.Text.UTF8Encoding($true)))
}
function Get-RelativePath([string]$fromDir, [string]$toPath) {
  if ($null -ne [System.IO.Path].GetMethod('GetRelativePath', [type[]]@([string], [string]))) {
    return [System.IO.Path]::GetRelativePath($fromDir, $toPath)
  }
  $from = New-Object Uri (($fromDir.TrimEnd('\') + '\'))
  $to = New-Object Uri (($toPath.TrimEnd('\') + '\'))
  return [Uri]::UnescapeDataString($from.MakeRelativeUri($to).ToString()).Replace('/', '\')
}
function Invoke-Action([string]$description, [scriptblock]$action) {
  if ($DryRun) { Info "[dry-run] $description"; return }
  Info $description
  & $action
}

Step 'Preflight'
foreach ($tool in @('node', 'pnpm', 'git')) {
  $command = Get-Command $tool -ErrorAction SilentlyContinue
  if ($null -eq $command) { Fail "$tool is not on PATH; install it and reopen the terminal." }
  Info "$tool -> $($command.Source)"
}
if (-not $Vault) { Fail 'No vault path. Pass -Vault "D:\path\to\vault" or set OBSIDIAN_VAULT.' }
if (-not (Test-Path -LiteralPath $Vault)) { Fail "Vault does not exist: $Vault" }
if ([string]::IsNullOrWhiteSpace($BrainRoot)) { $BrainRoot = Join-Path $Vault '.brain' }
$nodeVersion = (& node --version).TrimStart('v')
if ([int]($nodeVersion.Split('.')[0]) -lt 24) { Warn "Node $nodeVersion is old; dsh expects >= 24.9." }

$branch = (& git -C $RepoRoot rev-parse --abbrev-ref HEAD).Trim()
Info "repository: $RepoRoot"
Info "branch:     $branch"
Info "vault:      $Vault"
Info "DSH home:   $DshHome"
if ($branch -ne 'feat/pur-studio-canvas') {
  Warn 'This checkout is not on feat/pur-studio-canvas; local plugin work may be missing.'
}

Step 'Repository dependencies'
if (-not $SkipInstall) {
  Invoke-Action 'pnpm install (repository)' { Push-Location $RepoRoot; try { pnpm install } finally { Pop-Location } }
} else { Info 'skipped (-SkipInstall)' }

Step 'Third-party plugin: dsh-better-sidebar'
if (-not $SkipSidebar) {
  if (-not (Test-Path (Join-Path $BetterSidebar '.git'))) {
    Invoke-Action "clone $SidebarRepo" { & git clone $SidebarRepo $BetterSidebar }
    Invoke-Action "checkout $SidebarCommit" { & git -C $BetterSidebar checkout $SidebarCommit }
  } else {
    Info "already present at $BetterSidebar"
  }
  $patch = Join-Path $PSScriptRoot 'patches\dsh-better-sidebar.patch'
  if (Test-Path -LiteralPath $patch) {
    $dirty = (& git -C $BetterSidebar status --porcelain) -join "`n"
    if ($dirty.Trim().Length -eq 0) {
      Invoke-Action 'apply local sidebar patch' { & git -C $BetterSidebar apply $patch; if ($LASTEXITCODE -ne 0) { throw 'git apply failed' } }
    } else {
      Warn 'sidebar checkout has local changes; patch not applied'
    }
  }
} else { Info 'skipped (-SkipSidebar)' }

Step "Profile: $ProfileDir"
$relative = (Get-RelativePath $ProfileDir $RepoRoot).TrimEnd('\', '/').Replace('\', '/')
$profileExists = Test-Path (Join-Path $ProfileDir 'package.json')
if ($profileExists -and -not $Force) {
  Warn "profile already exists; use -Force to re-render (a backup is kept)"
} else {
  if ($profileExists) {
    $backup = "$ProfileDir.bak-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Invoke-Action "back up the existing profile's config files to $backup" {
      New-Item -ItemType Directory -Force -Path $backup | Out-Null
      foreach ($file in @('package.json', 'cordis.yml', 'cordis.patch.yml', 'pnpm-workspace.yaml', 'pnpm-lock.yaml')) {
        $source = Join-Path $ProfileDir $file
        if (Test-Path -LiteralPath $source) { Copy-Item -LiteralPath $source -Destination (Join-Path $backup $file) -Force }
      }
    }
  }
  Invoke-Action 'create profile directory' { New-Item -ItemType Directory -Force -Path $ProfileDir | Out-Null }
  $nodeExe = (Get-Command node).Source
  $lspBlock = ''
  if ($LspDir) {
    if (-not (Test-Path -LiteralPath $LspDir)) { Warn "LSP directory does not exist: $LspDir (LSP rows skipped)" }
    else {
      $lspBlock = @"
- insert:
    - id: lsp
      name: '@deepseek-ai/dsh-lsp'
    - id: lsp-stdio
      name: '@deepseek-ai/dsh-lsp-stdio'
      config:
        servers:
          typescript:
            command: '$($nodeExe)'
            args:
              - '$((Join-Path $LspDir 'node_modules\typescript-language-server\lib\cli.mjs'))'
              - '--stdio'
            extensionToLanguage:
              '.ts': typescript
              '.tsx': typescriptreact
              '.mts': typescript
              '.cts': typescript
              '.js': javascript
              '.jsx': javascriptreact
              '.mjs': javascript
              '.cjs': javascript
            initializationOptions:
              tsserver:
                fallbackPath: '$((Join-Path $LspDir 'node_modules\typescript'))'
          python:
            command: '$($nodeExe)'
            args:
              - '$((Join-Path $LspDir 'node_modules\pyright\langserver.index.js'))'
              - '--stdio'
            extensionToLanguage:
              '.py': python
    - id: tool-lsp
      name: '@deepseek-ai/dsh-tool-lsp'
"@
    }
  }

  $packageTemplate = Get-Content -Raw (Join-Path $PSScriptRoot 'profile\package.json.template')
  Invoke-Action 'render profile package.json' {
    Write-Utf8 (Join-Path $ProfileDir 'package.json') ($packageTemplate.Replace('{{REL}}', $relative))
  }
  $patchTemplate = Get-Content -Raw (Join-Path $PSScriptRoot 'profile\cordis.patch.yml.template')
  Invoke-Action 'render profile cordis.patch.yml' {
    Write-Utf8 (Join-Path $ProfileDir 'cordis.patch.yml') ($patchTemplate.Replace('{{REL}}', $relative).Replace('{{VAULT}}', $Vault.Replace("'", "''")).Replace('{{LSP_BLOCK}}', $lspBlock))
  }
  foreach ($name in @('cordis.yml', 'pnpm-workspace.yaml')) {
    Invoke-Action "write profile $name" { Copy-Item -LiteralPath (Join-Path $PSScriptRoot "profile\$name") -Destination (Join-Path $ProfileDir $name) -Force }
  }
}

Step 'Profile dependencies'
if (-not $SkipInstall) {
  Invoke-Action 'pnpm install (profile)' { Push-Location $ProfileDir; try { pnpm install } finally { Pop-Location } }
} else { Info 'skipped (-SkipInstall)' }

Step 'Machine environment file'
$envFile = Join-Path $PSScriptRoot 'machine.env.ps1'
Invoke-Action "write $envFile" {
  $lines = @('# Generated by setup-machine.ps1; safe to edit and delete.', "`$env:OBSIDIAN_VAULT = '$($Vault.Replace("'", "''"))'")
  $lines += "`$env:BRAIN_ROOT = '$($BrainRoot.Replace("'", "''"))'"
  if ($BrainPythonw) { $lines += "`$env:BRAIN_PYTHONW = '$($BrainPythonw.Replace("'", "''"))'" }
  if ($LspDir) { $lines += "`$env:DSH_LSP_DIR = '$($LspDir.Replace("'", "''"))'" }
  Write-Utf8Bom $envFile (($lines -join "`r`n") + "`r`n")
}

Step 'Launcher'
$cmdLauncher = Join-Path $RepoRoot 'start-dsh.cmd'
Invoke-Action 'write start-dsh.cmd' {
  "@echo off`r`npowershell -NoProfile -ExecutionPolicy Bypass -File `"%~dp0setup\start-dsh.ps1`" %*`r`n" | Set-Content -NoNewline -Encoding ascii $cmdLauncher
}
if ($Shortcut) {
  Invoke-Action 'create desktop shortcut' {
    $desktop = [Environment]::GetFolderPath('Desktop')
    $link = Join-Path $desktop 'DeepSeek Harness.lnk'
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($link)
    $shortcut.TargetPath = 'powershell.exe'
    $shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$(Join-Path $RepoRoot 'setup\start-dsh.ps1')`""
    $shortcut.WorkingDirectory = $RepoRoot
    $icon = Join-Path $RepoRoot 'DeepSeek-Harness.ico'
    if (Test-Path $icon) { $shortcut.IconLocation = $icon }
    $shortcut.Save()
    Info "shortcut: $link"
  }
}

Write-Host ''
Write-Host 'Done.' -ForegroundColor Green
Info "Start with: $(Join-Path $RepoRoot 'start-dsh.cmd')"
Info 'Environment keys read by the runtime:'
Info '  OBSIDIAN_VAULT        vault path (also written into the profile)'
Info '  BRAIN_ROOT            TiSenT brain directory (defaults to <vault>\.brain)'
Info '  BRAIN_PYTHONW         pythonw.exe used to launch the brain manager (optional)'
Info '  DSH_LSP_DIR           LSP servers directory (optional)'
Info '  DSH_HOME              defaults to <repo>\.dsh-home in start-dsh.ps1'
Info '  DEEPSEEK_API_KEY      or sign in through the GUI account panel'
Info '  ANTHROPIC_AUTH_TOKEN  optional, for the Claude Code subagent'
