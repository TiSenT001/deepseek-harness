/**
 * 复制反馈状态：成功后在 timeout 毫秒内返回 copied=true，供按钮显示「已复制」。
 */
import { useEffect, useRef, useState } from 'react'
import { copyText } from './clipboard.ts'

export interface CopyFeedback {
  /** 最近一次复制是否成功（短暂保持） */
  copied: boolean
  /** 复制文本；返回是否成功 */
  copy: (value: string) => Promise<boolean>
}

/**
 * 渲染复制反馈状态。
 * @param timeout - 「已复制」保持的毫秒数
 * @returns copied 状态与 copy 函数
 */
export function useCopy(timeout = 1600): CopyFeedback {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
  }, [])

  const copy = async (value: string): Promise<boolean> => {
    const ok = await copyText(value)
    if (!ok) return false
    setCopied(true)
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), timeout)
    return true
  }

  return { copied, copy }
}
