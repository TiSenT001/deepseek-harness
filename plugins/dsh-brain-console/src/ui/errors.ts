/**
 * 把未知异常收敛成一句话。
 *
 * 浏览器 fetch 的网络失败只有 TypeError（连接被拒绝/超时），换成中文便于阅读；
 * 其余异常直接用 message。
 */
export function reasonOf(error: unknown): string {
  if (error instanceof TypeError) return '连接被拒绝或超时'
  return error instanceof Error ? error.message : String(error)
}
