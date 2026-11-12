/**
 * 浏览器下载工具：统一 Blob / 直链两种下载，避免各对话框重复写 anchor 逻辑。
 */

/** 触发一次文本文件下载。 */
export function downloadText(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  try {
    downloadUrl(url, filename)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** 触发一次 CSV 下载（自动拼接表头与行）。 */
export function downloadCsv(filename: string, header: string[], rows: (string | number)[][]): void {
  const lines = [header.join(','), ...rows.map((row) => row.map((cell) => String(cell)).join(','))]
  downloadText(filename, `${lines.join('\n')}\n`, 'text/csv')
}

/** 触发一次 JSON 下载（两空格缩进，便于阅读）。 */
export function downloadJson(filename: string, value: unknown): void {
  downloadText(filename, `${JSON.stringify(value, null, 2)}\n`, 'application/json')
}

/** 用 anchor 触发下载一个 URL（blob: 或 http(s):）。 */
export function downloadUrl(url: string, filename: string): void {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

/** 当前日期，格式 YYYY-MM-DD（用于文件名）。 */
export function todayStamp(): string {
  return new Date().toISOString().slice(0, 10)
}
