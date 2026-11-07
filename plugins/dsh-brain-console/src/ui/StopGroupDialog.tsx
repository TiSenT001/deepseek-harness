/**
 * 分组停止确认：停止会写抑制清单并把持久意愿置为 False，
 * 所以先把要停的单元列清楚，确认后才下发。
 */
import { Button, Modal } from './primitives.ts'

export interface StopGroupDialogProps {
  /** 要停止的分组名 */
  group: string
  /** 实际会被停止的单元（该组里正在运行的） */
  names: string[]
  /** 请求进行中：锁住对话框 */
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
}

/**
 * 渲染分组停止确认框。
 * @param props - 分组、单元名单与回调
 * @returns 对话框元素（挂载即打开）
 */
export function StopGroupDialog({ group, names, busy, onCancel, onConfirm }: StopGroupDialogProps): JSX.Element {
  const footer = (
    <>
      <Button size="sm" variant="ghost" disabled={busy} onClick={onCancel}>取消</Button>
      <Button size="sm" variant="primary" disabled={busy} onClick={onConfirm}>
        {busy ? '停止中…' : `停止 ${names.length} 个`}
      </Button>
    </>
  )
  return (
    <Modal
      open
      onClose={busy ? () => {} : onCancel}
      title={`停止「${group}」`}
      closeLabel="关闭"
      description={`将停止 ${names.length} 个正在运行的单元，并写入抑制清单`}
      footer={footer}
    >
      <ul className="bc-stop-list">
        {names.map((name) => (
          <li key={name} className="bc-stop-item">{name}</li>
        ))}
      </ul>
      <div className="bc-stop-note">停止后它们不会随管理器启动自动恢复，需要手动再点启动</div>
    </Modal>
  )
}
