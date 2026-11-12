<#
.SYNOPSIS
  重启 DSH Web 服务器（承载 GUI 的 `pnpm dsh web --no-open`），并顺带拉起 brain_manager。

.DESCRIPTION
  DSH 的**宿主半部插件代码**只在进程启动时加载，改完这类代码（例如
  plugins/dsh-brain-console/src/index.ts）必须重启整个 Web 服务器才生效。

  本脚本做四件事：
    1. 杀掉正在跑的 `pnpm dsh web` 进程树（可用 -NoKill 跳过，交给调用方杀）；
    2. 在仓库根目录重新拉起 `pnpm dsh web --no-open`（隐藏窗口，输出落盘）；
    3. 从输出里抓新的 `http://127.0.0.1:3080/?token=...`，写到 dsh-url.txt 并打印；
    4. 调宿主路由 `POST /brain-console/api/manager/start` 拉起 brain_manager
       （DSH 重启会带走旧 Job 里的管理器；管理器再恢复各个服务）。

  **注意**：如果启动本脚本的进程属于将被杀掉的 DSH 进程树，它自己也会被杀。
  从终端直接运行没问题；由 agent/脚本触发时应通过 WMI 等方式脱离进程树，
  并传 -NoKill（由调用方负责杀旧服务器）。

.PARAMETER NoKill
  不杀旧服务器。适用于调用方已经/即将杀掉旧服务器的场景（脱树 helper 模式）。

.PARAMETER DryRun
  只打印将要做什么（旧进程列表、端口状态、启动命令），不杀不启动。

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\restart-dsh.ps1
#>
[CmdletBinding()]
param(
  # 知识库根目录：给宿主插件的 BRAIN_ROOT 用；空字符串表示不设置
  # 知识库根目录；默认取环境变量 BRAIN_ROOT，空字符串表示不设置
  [string]$BrainRoot = $env:BRAIN_ROOT,
  [switch]$NoKill,
  [switch]$DryRun,
  # GUI 终端的默认起始目录。DSH 的终端控制器优先读这个环境变量；
  # 不设时退回会话工作目录（本会话是 worktree，会出现"终端打开位置变了"）。
  # GUI 终端默认起始目录；默认取环境变量 DSH_TERMINAL_CWD
  [string]$TerminalCwd = $env:DSH_TERMINAL_CWD
)

$ErrorActionPreference = 'SilentlyContinue'

$Repo = Split-Path $PSScriptRoot -Parent
$DocumentsDir = [Environment]::GetFolderPath('MyDocuments')
$OutDir = if ($env:DSH_RESTART_OUT) { $env:DSH_RESTART_OUT } elseif ($DocumentsDir) { Join-Path $DocumentsDir 'dsh-temp' } else { Join-Path (Get-Location) 'dsh-temp' }
$LogFile = Join-Path $OutDir 'dsh-restart.log'
$UrlFile = Join-Path $OutDir 'dsh-url.txt'
$nodeExe = (Get-Command node -ErrorAction SilentlyContinue).Source
$NodeDir = if ($nodeExe) { Split-Path -Parent $nodeExe } else { '' }
$pnpmCmd = (Get-Command pnpm -ErrorAction SilentlyContinue).Source
$PnpmDir = if ($pnpmCmd) { Split-Path -Parent $pnpmCmd } else { '' }

function Write-Log([string]$Message) {
  $line = '[{0:HH:mm:ss}] {1}' -f (Get-Date), $Message
  $line | Out-File -FilePath $LogFile -Append -Encoding utf8
  Write-Host $line
}

function Test-Port([int]$Port) {
  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $task = $client.ConnectAsync('127.0.0.1', $Port)
    if (-not $task.Wait(800)) { return $false }
    return $client.Connected
  } catch {
    return $false
  } finally {
    $client.Dispose()
  }
}

function Get-OldServerProcesses {
  $cmds = Get-CimInstance Win32_Process | Where-Object {
    $_.Name -eq 'cmd.exe' -and $_.CommandLine -match 'pnpm dsh web'
  }
  $nodes = Get-CimInstance Win32_Process | Where-Object {
    $_.CommandLine -match 'apps/cli/src/bin\.ts web'
  }
  return @($cmds) + @($nodes)
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
Write-Log ('restart-dsh start (NoKill=' + [bool]$NoKill + ', DryRun=' + [bool]$DryRun + ', pid=' + $PID + ')')

# 1) 杀掉旧服务器
$old = Get-OldServerProcesses
if ($old.Count -gt 0) {
  foreach ($proc in $old) { Write-Log ('old server: pid ' + $proc.ProcessId + ' ' + $proc.Name) }
} else {
  Write-Log 'no running dsh web found'
}
if ($DryRun) {
  Write-Log ('dry run: would kill ' + $old.Count + ' process(es); port 3080 busy=' + (Test-Port 3080))
  Write-Log ('dry run: would start: cmd /c pnpm dsh web --no-open (cwd ' + $Repo + ')')
  return
}
if (-not $NoKill) {
  foreach ($proc in $old) {
    & taskkill /F /T /PID $proc.ProcessId 2>&1 | Out-Null
    Write-Log ('killed ' + $proc.ProcessId)
  }
}

# 2) 等端口释放（最多 20s）
for ($i = 0; $i -lt 40; $i++) {
  if (-not (Test-Port 3080)) { break }
  Start-Sleep -Milliseconds 500
}
if (Test-Port 3080) {
  Write-Log 'port 3080 still busy after 20s; aborting to avoid a second server'
  exit 1
}
Write-Log 'port 3080 free, starting server'

# 3) 拉起新服务器并等 URL
$pathParts = @($NodeDir, $PnpmDir) | Where-Object { $_ -ne '' }
$env:PATH = (@($pathParts) + @($env:PATH)) -join ';'
# GUI 终端默认起在 $TerminalCwd（终端控制器优先读这个变量）
# 宿主插件 dsh-brain-console 靠 BRAIN_ROOT 定位 .brain（面板的「启动管理器」路由）；
# 从别的 shell / 调度器重启时这个变量常常不在，统一在脚本里兜住。
if ($BrainRoot -ne '') {
  $env:BRAIN_ROOT = $BrainRoot
  if (-not $env:OBSIDIAN_VAULT) { $env:OBSIDIAN_VAULT = Split-Path -Parent $BrainRoot }
}
if ($TerminalCwd -ne '') { $env:DSH_TERMINAL_CWD = $TerminalCwd }
Write-Log ('terminal cwd: ' + $env:DSH_TERMINAL_CWD)
$url = $null
for ($try = 1; $try -le 3; $try++) {
  $outLog = Join-Path $OutDir ('dsh-server-out-' + $try + '.log')
  $errLog = Join-Path $OutDir ('dsh-server-err-' + $try + '.log')
  Remove-Item $outLog, $errLog -ErrorAction SilentlyContinue
  $started = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'pnpm dsh web --no-open' `
    -WorkingDirectory $Repo -WindowStyle Hidden `
    -RedirectStandardOutput $outLog -RedirectStandardError $errLog -PassThru
  Write-Log ('try ' + $try + ': cmd pid ' + $started.Id)
  for ($i = 0; $i -lt 180; $i++) {
    Start-Sleep -Milliseconds 500
    $text = ''
    foreach ($file in @($outLog, $errLog)) {
      if (Test-Path $file) { $text += [string](Get-Content -LiteralPath $file -Raw -ErrorAction SilentlyContinue) }
    }
    $match = [regex]::Match($text, 'dsh web: (http://127\.0\.0\.1:\d+/\?token=[A-Za-z0-9_\-]+)')
    if ($match.Success) { $url = $match.Groups[1].Value; break }
  }
  if ($url) { break }
  Write-Log ('try ' + $try + ' failed to print a URL')
}

if (-not $url) {
  'URL not found - see dsh-server-out-*.log' | Out-File -FilePath $UrlFile -Encoding utf8
  Write-Log 'URL not found; see dsh-server-out-*.log / dsh-server-err-*.log'
  exit 1
}
$url | Out-File -FilePath $UrlFile -Encoding utf8
# 同步 DSH home 的 token 文件：面板冒烟/脚本靠它自动发现地址（否则 token 轮换后仍读旧值）
$url | Out-File -FilePath (Join-Path $Repo '.dsh-home\dsh_web_token.txt') -Encoding utf8 -NoNewline
Write-Log ('ready: ' + $url)
# 打开新地址（旧标签页的 token 已失效）
Start-Process $url

# 4) 拉起 brain_manager（宿主路由带进程内去抖与命名副本逻辑）
for ($i = 0; $i -lt 12; $i++) {
  try {
    $answer = Invoke-RestMethod -Method POST -Uri 'http://127.0.0.1:3080/brain-console/api/manager/start' -TimeoutSec 120
    Write-Log ('manager route: ' + ($answer | ConvertTo-Json -Compress))
    break
  } catch {
    Write-Log ('manager route retry ' + ($i + 1) + ': ' + $_.Exception.Message)
    Start-Sleep -Seconds 5
  }
}

Write-Log 'done'
Write-Host ''
Write-Host ('DSH URL: ' + $url)
