/**
 * 面板本地偏好：只影响浏览器端表现，存 localStorage，不上报大脑。
 *
 * 覆盖刷新间隔、日志默认行数/级别、分组顺序与折叠状态；切换后通过订阅
 * 立即应用到当前页面。
 */
export type LogLevelFilter = 'all' | 'warn' | 'error'

export interface ConsolePrefs {
  /** 主面板自动刷新间隔（秒）。 */
  refreshSeconds: number
  /** 日志默认读取行数。 */
  logLines: number
  /** 日志默认级别过滤。 */
  logLevel: LogLevelFilter
  /** 分组顺序（组名列表，缺省按后端返回顺序）。 */
  groupOrder: string[]
  /** 已折叠的分组名。 */
  collapsedGroups: string[]
}

/** 可选的刷新间隔（秒）。 */
export const REFRESH_OPTIONS = [5, 10, 30, 60] as const

/** 可选的日志行数。 */
export const LOG_LINE_OPTIONS = [120, 300, 1000] as const

/** 日志级别过滤选项。 */
export const LOG_LEVELS: readonly (readonly [LogLevelFilter, string])[] = [
  ['all', '全部'],
  ['warn', '警告'],
  ['error', '错误'],
]

/** 默认偏好。 */
export const DEFAULT_PREFS: ConsolePrefs = {
  refreshSeconds: 5,
  logLines: 120,
  logLevel: 'all',
  groupOrder: [],
  collapsedGroups: [],
}

const STORAGE_KEY = 'brain.console.prefs.v1'
const listeners = new Set<(prefs: ConsolePrefs) => void>()

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

/**
 * 读取偏好；损坏或非法值回退默认值。
 * @returns 当前偏好
 */
export function loadPrefs(): ConsolePrefs {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw !== null) {
      const parsed = JSON.parse(raw) as Partial<ConsolePrefs>
      const prefs: ConsolePrefs = { ...DEFAULT_PREFS }
      const seconds = parsed.refreshSeconds
      if (typeof seconds === 'number' && (REFRESH_OPTIONS as readonly number[]).includes(seconds)) {
        prefs.refreshSeconds = seconds
      }
      const lines = parsed.logLines
      if (typeof lines === 'number' && (LOG_LINE_OPTIONS as readonly number[]).includes(lines)) {
        prefs.logLines = lines
      }
      const level = parsed.logLevel
      if (level === 'all' || level === 'warn' || level === 'error') prefs.logLevel = level
      if (isStringArray(parsed.groupOrder)) prefs.groupOrder = parsed.groupOrder
      if (isStringArray(parsed.collapsedGroups)) prefs.collapsedGroups = parsed.collapsedGroups
      return prefs
    }
  } catch {
    // localStorage 被禁用或 JSON 损坏：用默认值
  }
  return { ...DEFAULT_PREFS }
}

/**
 * 合并并保存偏好，随后通知订阅者。
 * @param patch - 要更新的字段
 * @returns 保存后的完整偏好
 */
export function savePrefs(patch: Partial<ConsolePrefs>): ConsolePrefs {
  const next = { ...loadPrefs(), ...patch }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // 隐私模式下写不进去：本次会话仍生效
  }
  for (const listener of listeners) listener(next)
  return next
}

/**
 * 订阅偏好变化。
 * @param listener - 收到新偏好时调用
 * @returns 取消订阅
 */
export function subscribePrefs(listener: (prefs: ConsolePrefs) => void): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
