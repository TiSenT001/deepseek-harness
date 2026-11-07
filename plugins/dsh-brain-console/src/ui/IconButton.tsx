/**
 * 图标按钮：宿主 Button + Tooltip + 忙碌态。
 *
 * 图标按钮没有可见文字，所以 aria-label 和悬停提示共用同一个动作名；
 * 忙碌时图标换成转圈、文案变成「重启中…」这样的进行时，并保持可见（不受禁用态变淡）。
 */
import type { ReactElement } from 'react'
import {
  Button, StateDot, Tooltip,
  type SharedButtonVariant, type SharedIconProps,
} from './primitives.ts'

export interface IconButtonProps {
  /** 动作名：同时作为 aria-label 与悬停提示（忙碌时自动加「中…」） */
  label: string
  /** 图标组件 */
  icon: (props: SharedIconProps) => ReactElement | null
  /** 按钮视觉变体，默认 ghost */
  variant?: SharedButtonVariant
  /** 破坏性动作：图标用错误色 */
  danger?: boolean
  /** 其他动作执行中，本按钮一起禁用 */
  disabled?: boolean
  /** 本按钮的动作正在执行 */
  busy?: boolean
  /** 开关型动作的当前态（例如日志面板已打开） */
  active?: boolean
  onClick: () => void
}

/**
 * 渲染一个图标按钮。
 * @param props - 动作名、图标与回调
 * @returns 按钮元素（包在悬停提示里）
 */
export function IconButton({
  label, icon: Glyph, variant = 'ghost', danger = false, disabled = false, busy = false, active = false, onClick,
}: IconButtonProps): JSX.Element {
  const text = busy ? `${label}中…` : label
  const tone = danger ? ' bc-danger' : ''
  return (
    <Tooltip label={text} side="bottom" delayMs={400} portal>
      <Button
        size="sm"
        variant={variant}
        className={`bc-icon-btn${tone}`}
        aria-label={text}
        aria-busy={busy || undefined}
        aria-pressed={active || undefined}
        disabled={disabled || busy}
        onClick={onClick}
        icon={busy ? <StateDot state="ongoing" size={12} /> : <Glyph size={16} />}
      />
    </Tooltip>
  )
}
