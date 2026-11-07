/**
 * 底部日志控制台：显示选中单元最近的日志。
 *
 * 作为页面底部的常驻面板，不覆盖卡片网格、不弹模态，切换单元只换内容。
 * 日志由页面静默轮询刷新：停在底部时自动跟随最新一行，向上翻看时保持不动。
 */
import { useLayoutEffect, useRef } from 'react'
import { IconButton } from './IconButton.tsx'
import { IconChevronDown, IconRefresh } from './primitives.ts'

export interface LogDockProps {
  /** 正在查看日志的单元名 */
  name: string
  /** 日志正文 */
  text: string
  /** 是否正在读取（手动刷新时显示转圈） */
  loading: boolean
  /** 最近一次刷新的时刻文本；空串表示还没读到 */
  readAt: string
  /** 立即重新读取 */
  onRefresh: () => void
  /** 收起面板 */
  onClose: () => void
}

/**
 * 渲染日志控制台。
 * @param props - 日志内容与回调
 * @returns 面板元素
 */
export function LogDock({ name, text, loading, readAt, onRefresh, onClose }: LogDockProps): JSX.Element {
  const body = useRef<HTMLPreElement | null>(null)
  const follow = useRef(true)

  // 换单元时重新贴到底部
  useLayoutEffect(() => {
    follow.current = true
    const element = body.current
    if (element !== null) element.scrollTop = element.scrollHeight
  }, [name])

  // 内容刷新：只有用户本来就停在底部才跟着走
  useLayoutEffect(() => {
    const element = body.current
    if (element !== null && follow.current) element.scrollTop = element.scrollHeight
  }, [text])

  const handleScroll = (): void => {
    const element = body.current
    if (element === null) return
    follow.current = element.scrollHeight - element.scrollTop - element.clientHeight < 24
  }

  return (
    <section className="bc-dock" aria-label={`${name} 日志`}>
      <header className="bc-dock-head">
        <span className="bc-dock-title">日志</span>
        <span className="bc-dock-sub">{name}</span>
        {readAt !== '' && <span className="bc-dock-sub">· {readAt} 刷新</span>}
        <span className="bc-dock-spacer" />
        <IconButton label="立即刷新" icon={IconRefresh} busy={loading} onClick={onRefresh} />
        <IconButton label="收起日志" icon={IconChevronDown} onClick={onClose} />
      </header>
      <pre ref={body} className="bc-dock-body" onScroll={handleScroll}>{loading && text === '' ? '读取中…' : text}</pre>
    </section>
  )
}
