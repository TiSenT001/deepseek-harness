/**
 * 时间戳小工具：管理器返回的时间戳有两种写法（ISO 带 T / 空格分隔），
 * 图表和悬停读数共用这里的解析与短日期格式。
 */

/** `2026-11-07T23:18:28` / `2026-11-07 23:18:28` → 毫秒时间戳。 */
export function parseTs(ts: string): number {
  const normalized = ts.includes('T') ? ts : ts.replace(' ', 'T')
  return Date.parse(normalized)
}

/** `2026-11-07T23:18:28` → `11-07`。 */
export function shortDate(ts: string): string {
  const day = ts.slice(5, 10)
  return day.length === 5 ? day : ts.slice(0, 10)
}
