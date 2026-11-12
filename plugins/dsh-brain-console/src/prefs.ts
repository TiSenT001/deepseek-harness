/**
 * 面板本地偏好：只影响浏览器端表现，存 localStorage，不上报大脑。
 *
 * 当前只有自动刷新间隔；切换后通过订阅立即应用到轮询，不需要刷新页面。
 */
export interface ConsolePrefs {
  /** 主面板自动刷新间隔（秒）。 */
  refreshSeconds: number
}

/** 可选的刷新间隔（秒）。 */
export const REFRESH_OPTIONS = [5, 10, 30, 60] as const

/** 默认偏好。 */
export const DEFAULT_PREFS: ConsolePrefs = { refreshSeconds: 5 }

const STORAGE_KEY = 'brain.console.prefs.v1'
const listeners = new Set<(prefs: ConsolePrefs) => void>()

/**
 * 读取偏好；损坏或非法值回退默认值。
 * @returns 当前偏好
 */
export function loadPrefs(): ConsolePrefs {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw !== null) {
      const parsed = JSON.parse(raw) as Partial<ConsolePrefs>
      const seconds = parsed.refreshSeconds
      if (typeof seconds === 'number' && (REFRESH_OPTIONS as readonly number[]).includes(seconds)) {
        return { refreshSeconds: seconds }
      }
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
