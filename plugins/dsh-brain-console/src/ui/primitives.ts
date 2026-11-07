/**
 * 运行时桥：复用宿主 GUI 的共享基础组件（Button / StateDot / Tooltip / 图标）。
 *
 * 浏览器包把这些模块 id 作为 external，由模块加载器在运行时注入，
 * 因此插件不再自带一套按钮、状态灯和图标，明暗主题与交互行为跟随宿主。
 */
import type { ReactElement, ReactNode } from 'react'

declare const require: (id: string) => unknown

/** 共享 Button 的视觉变体，与 ui-primitives 一致。 */
export type SharedButtonVariant = 'primary' | 'ghost' | 'outline' | 'toolbar'

/** 共享 Button 接受的最小子集。 */
export interface SharedButtonProps {
  variant?: SharedButtonVariant
  size?: 'md' | 'sm'
  className?: string
  children?: ReactNode
  icon?: ReactNode
  disabled?: boolean
  title?: string
  onClick?: () => void
  'aria-label'?: string
  'aria-busy'?: boolean
  'aria-haspopup'?: boolean | 'menu'
  'aria-expanded'?: boolean
}

/** 共享图标组件的 props（aria-hidden 由图标自身设置）。 */
export interface SharedIconProps {
  size?: number
  className?: string
}

/** 共享状态灯语义：done / warning / ongoing / error / idle。 */
export type SharedStateDotState = 'done' | 'warning' | 'ongoing' | 'error' | 'idle'

/** 共享 StateDot 接受的最小子集。 */
export interface SharedStateDotProps {
  state: SharedStateDotState
  size?: number
  className?: string
}

/** 共享 Tooltip 接受的最小子集。 */
export interface SharedTooltipProps {
  label: string
  side?: 'top' | 'bottom' | 'left' | 'right'
  delayMs?: number
  focusDelayMs?: number
  portal?: boolean
  disabled?: boolean
  children: ReactElement
}

/** 共享对话框接受的最小子集：自己管遮罩、Esc、焦点归还，我们只给内容。 */
export interface SharedModalProps {
  open: boolean
  onClose: () => void
  title: string
  closeLabel: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
}

/** 菜单里的一行。 */
export interface SharedMenuItem {
  id: string
  label: ReactNode
  disabled?: boolean
  danger?: boolean
}

/** 菜单分组线（不可选）。 */
export interface SharedMenuSeparator {
  type: 'separator'
  id: string
}

/** 一条菜单条目：可执行行或分组线。 */
export type SharedMenuEntry = SharedMenuItem | SharedMenuSeparator

/** 共享 Menu 接受的最小子集：外部点击、Esc、焦点归还都由它负责。 */
export interface SharedMenuProps {
  open: boolean
  anchor: ReactElement
  items?: readonly SharedMenuEntry[]
  /** 打勾的行（用于开关型条目） */
  selectedId?: string
  onSelect?: (id: string) => void
  onClose: () => void
  align?: 'start' | 'end'
  side?: 'bottom' | 'top' | 'right'
  portal?: boolean
}

/** 共享组件的返回值类型；React 18 的 JSX 只接受元素，不接受任意 ReactNode。 */
type SharedComponent<Props> = (props: Props) => ReactElement | null

interface PrimitivesModule {
  readonly Button: SharedComponent<SharedButtonProps>
  readonly Menu: SharedComponent<SharedMenuProps>
  readonly Modal: SharedComponent<SharedModalProps>
  readonly StateDot: SharedComponent<SharedStateDotProps>
  readonly Tooltip: SharedComponent<SharedTooltipProps>
  readonly IconFlatListOutlineRegular: SharedComponent<SharedIconProps>
  readonly IconRefreshOutlineRegular: SharedComponent<SharedIconProps>
  readonly IconStopFillRegular: SharedComponent<SharedIconProps>
  readonly IconPlayOutlineRegular: SharedComponent<SharedIconProps>
  readonly IconChevronDownOutlineRegular: SharedComponent<SharedIconProps>
  readonly IconEllipsisOutlineRegular: SharedComponent<SharedIconProps>
  readonly IconShieldOutlineRegular: SharedComponent<SharedIconProps>
  readonly IconCopyOutlineRegular: SharedComponent<SharedIconProps>
  readonly IconCheckOutlineRegular: SharedComponent<SharedIconProps>
  readonly IconPauseOutlineRegular: SharedComponent<SharedIconProps>
}

const primitives = require('@deepseek-ai/dsh-client-ui-primitives') as PrimitivesModule

/** 宿主的按钮原子。 */
export const Button = primitives.Button

/** 宿主的锚定菜单：分组线、勾选态、键盘走位与关闭都由它负责。 */
export const Menu = primitives.Menu

/** 宿主的模态框原子：遮罩、Esc、焦点归还都由它负责。 */
export const Modal = primitives.Modal

/** 宿主的状态灯原子。 */
export const StateDot = primitives.StateDot

/** 宿主的悬停提示。 */
export const Tooltip = primitives.Tooltip

/** 列表图标：查看日志。 */
export const IconList = primitives.IconFlatListOutlineRegular

/** 刷新图标：刷新状态、重启单元。 */
export const IconRefresh = primitives.IconRefreshOutlineRegular

/** 方块图标：停止单元。 */
export const IconStop = primitives.IconStopFillRegular

/** 三角图标：启动单元。 */
export const IconPlay = primitives.IconPlayOutlineRegular

/** 下箭头图标：收起面板。 */
export const IconChevronDown = primitives.IconChevronDownOutlineRegular

/** 省略号图标：收纳更多操作的菜单入口。 */
export const IconEllipsis = primitives.IconEllipsisOutlineRegular

/** 盾牌图标：受保护、不可清理。 */
export const IconShield = primitives.IconShieldOutlineRegular

/** 复制图标：复制当前看得到的日志。 */
export const IconCopy = primitives.IconCopyOutlineRegular

/** 对勾图标：复制成功的瞬时反馈。 */
export const IconCheck = primitives.IconCheckOutlineRegular

/** 暂停图标：日志面板停止自动刷新。 */
export const IconPause = primitives.IconPauseOutlineRegular
