/**
 * 展示层格式化：计数、容量的千分位与单位、时刻、相对时间、运行时长。
 *
 * 这里只做格式化，不参与状态判断 —— 单元是否运行一律以 `/units` 的 `state` 为准。
 */

/**
 * 千分位计数。
 * @param value - 计数；null 表示管理器没给值
 * @returns 形如 `54,081`；null 返回破折号
 */
export function formatCount(value: number | null): string {
  return value === null ? '—' : value.toLocaleString('zh-CN')
}

/**
 * 容量：不足 1 MB 用 KB，不足 1024 MB 用 MB，否则换成 GB 并保留一位小数。
 * @param value - 兆字节数；null 表示未知
 * @returns 形如 `512 KB` / `605 MB` / `1.4 GB`；null 返回破折号
 */
export function formatMegabytes(value: number | null): string {
  if (value === null) return '—'
  if (value < 1) return `${Math.round(value * 1024)} KB`
  if (value < 1024) return `${Math.round(value)} MB`
  return `${(value / 1024).toFixed(1)} GB`
}

/**
 * 解析管理器给的本地时间文本（无时区后缀），按浏览器本地时区理解。
 * @param text - 形如 `2026-11-07 17:00:30`
 * @returns Date；缺失或不可解析返回 null
 */
function parseLocalTime(text: string | null): Date | null {
  if (text === null) return null
  const parsed = new Date(text.replace(' ', 'T'))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/**
 * 相对时间：刚刚 / N 分钟前 / N 小时前 / N 天前。
 * @param text - 管理器给的本地时间文本
 * @param now - 当前毫秒时间戳
 * @returns 相对描述；缺失或不可解析返回破折号
 */
export function formatRelative(text: string | null, now: number): string {
  const at = parseLocalTime(text)
  if (at === null) return '—'
  const seconds = Math.max(0, Math.round((now - at.getTime()) / 1000))
  if (seconds < 60) return '刚刚'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  return `${Math.round(hours / 24)} 天前`
}

/**
 * 运行时长，用于运行中单元的元信息行。
 * @param startedAt - 启动时间文本；未运行为 null
 * @param now - 当前毫秒时间戳
 * @returns 形如 `2 小时 31 分`；缺失或不可解析返回 null
 */
export function formatUptime(startedAt: string | null, now: number): string | null {
  const at = parseLocalTime(startedAt)
  if (at === null) return null
  const minutes = Math.floor((now - at.getTime()) / 60000)
  if (minutes < 1) return '不到 1 分钟'
  if (minutes < 60) return `${minutes} 分钟`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours < 24) return rest === 0 ? `${hours} 小时` : `${hours} 小时 ${rest} 分`
  const days = Math.floor(hours / 24)
  return `${days} 天 ${hours % 24} 小时`
}

/**
 * 短时刻：省略年份，用于指标卡副标题这类窄位置。
 * @param text - 形如 `2026-11-07 17:01`
 * @returns 形如 `11-07 17:01`；缺失或不可解析返回破折号
 */
export function formatShortMoment(text: string | null): string {
  if (text === null) return '—'
  const match = /^\d{4}-(\d{2}-\d{2})[ T](\d{2}:\d{2})/.exec(text)
  return match === null ? text : `${match[1]} ${match[2]}`
}

/**
 * 24 小时制时钟文本。
 * @param now - 当前毫秒时间戳
 * @returns 形如 `19:32:05`
 */
export function formatClock(now: number): string {
  const date = new Date(now)
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
