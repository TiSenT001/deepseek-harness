/**
 * 面板宿主配置：Brain 根目录与管理器地址。
 *
 * 持久化到 JSON（默认 `<cwd>/.dsh-home/brain-console.config.json`，可用
 * `BRAIN_CONSOLE_CONFIG` 覆盖），宿主按 Brain 根目录自动派生 launcher、脚本等
 * 路径，浏览器可在设置页读写。环境变量作为文件缺失时的兜底来源。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join } from 'node:path'

export interface StoredConfig {
  brainRoot?: string
  managerUrl?: string
}

export interface PanelConfig {
  /** 生效的 Brain 根目录；空字符串表示未配置。 */
  brainRoot: string
  /** 生效的管理器地址。 */
  managerUrl: string
  /** 派生：带名字的 pythonw 副本。 */
  namedLauncher: string
  /** 派生：通用 launcher。 */
  launcherPath: string
  /** 派生：管理器脚本。 */
  scriptPath: string
  /** 派生：日志文件。 */
  logPath: string
  /** 派生路径是否存在。 */
  namedLauncherExists: boolean
  launcherExists: boolean
  scriptExists: boolean
  /** 启动脚本使用的 pythonw（含完整路径时优先用其目录）。 */
  pythonw: string
  /** 实际使用的配置文件位置。 */
  configFile: string
  /** 各字段来源，便于排查。 */
  sources: {
    brainRoot: 'file' | 'env' | 'none'
    managerUrl: 'file' | 'env' | 'default'
  }
}

/** 配置文件位置。 */
export function configFile(): string {
  return process.env.BRAIN_CONSOLE_CONFIG ?? join(process.cwd(), '.dsh-home', 'brain-console.config.json')
}

/** 读已保存配置；文件缺失或损坏时返回空对象。 */
export function readStored(): StoredConfig {
  try {
    const raw = JSON.parse(readFileSync(configFile(), 'utf8')) as StoredConfig
    return typeof raw === 'object' && raw !== null ? raw : {}
  } catch {
    return {}
  }
}

function envBrainRoot(): string {
  if (process.env.BRAIN_ROOT !== undefined && process.env.BRAIN_ROOT !== '') return process.env.BRAIN_ROOT
  if (process.env.OBSIDIAN_VAULT !== undefined && process.env.OBSIDIAN_VAULT !== '') {
    return join(process.env.OBSIDIAN_VAULT, '.brain')
  }
  return ''
}

/** 计算生效配置与派生路径。 */
export function effectiveConfig(): PanelConfig {
  const stored = readStored()
  const fileRoot = typeof stored.brainRoot === 'string' ? stored.brainRoot.trim() : ''
  const envRoot = envBrainRoot()
  const brainRoot = fileRoot !== '' ? fileRoot : envRoot
  const fileUrl = typeof stored.managerUrl === 'string' ? stored.managerUrl.trim() : ''
  const envUrl = process.env.BRAIN_MANAGER_URL ?? ''
  const managerUrl = fileUrl !== '' ? fileUrl : envUrl !== '' ? envUrl : 'http://127.0.0.1:19998'
  const launcherDir = brainRoot === '' ? '' : join(brainRoot, 'tools', 'launcher')
  const namedLauncher = launcherDir === '' ? '' : join(launcherDir, 'py', 'brain_manager.exe')
  const launcherPath = launcherDir === '' ? '' : join(launcherDir, 'brain_manager.exe')
  return {
    brainRoot,
    managerUrl,
    namedLauncher,
    launcherPath,
    scriptPath: brainRoot === '' ? '' : join(brainRoot, 'services', 'brain_manager.py'),
    logPath: brainRoot === '' ? '' : join(brainRoot, 'logs', 'brain_manager.log'),
    namedLauncherExists: namedLauncher !== '' && existsSync(namedLauncher),
    launcherExists: launcherPath !== '' && existsSync(launcherPath),
    scriptExists: brainRoot !== '' && existsSync(join(brainRoot, 'services', 'brain_manager.py')),
    pythonw: process.env.BRAIN_PYTHONW ?? 'pythonw.exe',
    configFile: configFile(),
    sources: {
      brainRoot: fileRoot !== '' ? 'file' : envRoot !== '' ? 'env' : 'none',
      managerUrl: fileUrl !== '' ? 'file' : envUrl !== '' ? 'env' : 'default',
    },
  }
}

/**
 * 保存配置（只接受 brainRoot / managerUrl）。
 * @param patch - 待写入字段；空字符串表示清除该字段（回退环境变量/默认值）
 * @returns 保存结果与新的生效配置
 */
export function saveConfig(patch: StoredConfig): { ok: boolean; error?: string; config?: PanelConfig } {
  const next: StoredConfig = { ...readStored() }
  if (patch.brainRoot !== undefined) {
    const root = String(patch.brainRoot).trim()
    if (root !== '' && !isAbsolute(root)) return { ok: false, error: 'Brain 根目录必须是绝对路径（或留空回退环境变量）' }
    if (root === '') delete next.brainRoot
    else next.brainRoot = root
  }
  if (patch.managerUrl !== undefined) {
    const url = String(patch.managerUrl).trim()
    if (url !== '' && !/^https?:\/\/\S+$/i.test(url)) return { ok: false, error: '管理器地址必须是 http(s) URL（或留空回退默认）' }
    if (url === '') delete next.managerUrl
    else next.managerUrl = url.replace(/\/+$/, '')
  }
  try {
    const file = configFile()
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, JSON.stringify(next, null, 1), 'utf8')
  } catch (error) {
    return { ok: false, error: `写入配置失败: ${String(error)}` }
  }
  return { ok: true, config: effectiveConfig() }
}
