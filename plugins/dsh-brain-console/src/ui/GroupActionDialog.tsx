/**
 * 分组动作确认框：批量停止 / 批量重启共用。
 * 先把会被影响的单元列清楚、说清后果，确认后才下发。
 */
import { Button, Modal } from './primitives.ts'

export interface GroupActionDialogProps {
  /** 对话框标题，例如「停止「核心服务」」 */
  title: string
  /** 一句话说明影响范围 */
  description: string
  /** 会被影响的单元名 */
  names: string[]
  /** 后果提示（停止会写抑制清单 / 重启会短暂中断） */
  note: string
  /** 确认按钮文案，例如「停止 4 个」 */
  confirmLabel: string
  /** 进行中的确认按钮文案，例如「停止中…」 */
  busyLabel: string
  /** 请求进行中：锁住对话框 */
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
}

/**
 * 渲染分组动作确认框。
 * @param props - 标题、单元名单与回调
 * @returns 对话框元素（挂载即打开）
 */
export function GroupActionDialog({
  title, description, names, note, confirmLabel, busyLabel, busy, onCancel, onConfirm,
}: GroupActionDialogProps): JSX.Element {
  const footer = (
    <>
      <Button size="sm" variant="ghost" disabled={busy} onClick={onCancel}>取消</Button>
      <Button size="sm" variant="primary" disabled={busy} onClick={onConfirm}>
        {busy ? busyLabel : confirmLabel}
      </Button>
    </>
  )
  return (
    <Modal
      open
      onClose={busy ? () => {} : onCancel}
      title={title}
      closeLabel="关闭"
      description={description}
      footer={footer}
    >
      <ul className="bc-stop-list">
        {names.map((name) => (
          <li key={name} className="bc-stop-item">{name}</li>
        ))}
      </ul>
      <div className="bc-stop-note">{note}</div>
    </Modal>
  )
}
