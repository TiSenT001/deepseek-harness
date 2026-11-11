/**
 * 通用确认框：不可撤销的动作（清空日志等）先讲清后果再执行。
 */
import { Button } from './primitives.ts'
import { Dialog } from './Dialog.tsx'

export interface ConfirmDialogProps {
  /** 对话框标题 */
  title: string
  /** 一句话说明要做什么 */
  description: string
  /** 后果说明（例如「不可恢复」） */
  note?: string
  /** 确认按钮文案 */
  confirmLabel: string
  /** 进行中的确认按钮文案 */
  busyLabel?: string
  /** 请求进行中：锁住对话框 */
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
}

/**
 * 渲染确认框。
 * @param props - 文案与回调
 * @returns 对话框元素（挂载即打开）
 */
export function ConfirmDialog({
  title, description, note, confirmLabel, busyLabel = '处理中…', busy, onCancel, onConfirm,
}: ConfirmDialogProps): JSX.Element {
  const footer = (
    <>
      <Button size="sm" variant="ghost" disabled={busy} onClick={onCancel}>取消</Button>
      <Button size="sm" variant="primary" disabled={busy} onClick={onConfirm}>
        {busy ? busyLabel : confirmLabel}
      </Button>
    </>
  )
  return (
    <Dialog open onClose={busy ? () => {} : onCancel} title={title} closeLabel="关闭" description={description} footer={footer}>
      {note !== undefined && <div className="bc-stop-note">{note}</div>}
    </Dialog>
  )
}
