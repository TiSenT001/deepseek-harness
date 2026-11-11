/**
 * 控制台统一对话框容器：给共享 Modal 套上限高与内部滚动。
 *
 * 共享 Modal 的 `.dialog` 没有默认 max-height（文档要求消费方自己 `max-height: 100%`）；
 * 这里统一传 `className`/`contentClassName`，并把 children 包进一个可滚动的内容区，
 * 头/脚（title、footer）保持固定。长列表对话框因此不会把整窗撑出视口。
 */
import type { ReactNode } from 'react'
import { Modal } from './primitives.ts'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  closeLabel: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
}

/**
 * 渲染一个限高、内容可滚动的对话框。
 * @param props - 与共享 Modal 相同的字段
 * @returns 对话框元素
 */
export function Dialog({ children, ...rest }: DialogProps): JSX.Element {
  return (
    <Modal
      {...rest}
      className="bc-dialog-capped"
      contentClassName="bc-dialog-content"
    >
      <div className="bc-dialog-scroll">{children}</div>
    </Modal>
  )
}
