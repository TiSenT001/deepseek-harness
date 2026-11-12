/**
 * 剪贴板工具：优先 navigator.clipboard，失败时回退 textarea + execCommand。
 */

/**
 * 复制一段文本。
 * @param value - 待复制内容
 * @returns 是否复制成功
 */
export async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    // 无权限时走兼容路径
  }
  const area = document.createElement('textarea')
  area.value = value
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  let copied = false
  try {
    copied = document.execCommand('copy')
  } catch {
    copied = false
  }
  area.remove()
  return copied
}
