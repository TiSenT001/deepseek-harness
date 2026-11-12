/**
 * 存储概览：回答「磁盘被谁吃了」。
 *
 * 数据来自管理器 `/storage/summary`（纯只读 stat 统计）；按大小降序展示
 * 各目录/数据库文件的占用、文件数与最近修改时间，并给出磁盘剩余。
 * 不提供删除动作——清理入口仍在 ⋯ 菜单的「清理备份…」「清理缓存…」。
 */
import { useEffect, useState } from 'react'
import { loadStorageSummary } from '../api.ts'
import { reasonOf } from './errors.ts'
import { Button } from './primitives.ts'
import { Dialog } from './Dialog.tsx'
import type { StorageSummary } from './types.ts'

export interface StorageDialogProps {
  /** 关闭对话框。 */
  onClose: () => void
}

/** 字节数格式化成 B/KB/MB/GB/TB。 */
function human(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let index = 0
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index += 1
  }
  const digits = index === 0 || value >= 100 ? 0 : 1
  return `${value.toFixed(digits)} ${units[index]}`
}

/**
 * 渲染存储概览对话框。
 * @param props - 关闭回调
 * @returns 对话框元素（挂载即拉一次，可刷新）
 */
export function StorageDialog({ onClose }: StorageDialogProps): JSX.Element {
  const [summary, setSummary] = useState<StorageSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = async (): Promise<void> => {
    setBusy(true)
    try {
      setSummary(await loadStorageSummary())
      setError(null)
    } catch (e) {
      setError(reasonOf(e))
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => { void load() }, [])

  const items = summary?.items ?? []
  const largest = items.reduce((max, item) => Math.max(max, item.bytes), 0)
  const total = summary?.total_bytes ?? 0
  const free = summary?.disk?.free_bytes ?? null
  const diskTotal = summary?.disk?.total_bytes ?? null

  return (
    <Dialog
      open
      onClose={onClose}
      title="存储概览"
      closeLabel="关闭"
      description="只读统计：目录大小、文件数与磁盘剩余；不会删除任何文件"
      footer={(
        <>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => void load()}>
            {busy ? '统计中…' : '刷新'}
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>关闭</Button>
        </>
      )}
    >
      {error !== null && <div className="bc-backup-error">{error}</div>}
      {summary === null && error === null && <div className="bc-backup-empty">统计中…</div>}
      {summary !== null && (
        <div className="bc-storage">
          <div className="bc-storage-summary">
            <div className="bc-storage-total">
              <span>合计占用</span>
              <strong>{human(total)}</strong>
            </div>
            <div className="bc-storage-total">
              <span>磁盘可用 / 总容量</span>
              <strong className={free !== null && free < 10 * 1024 ** 3 ? 'bc-index-warn' : ''}>
                {human(free)}{diskTotal !== null ? ` / ${human(diskTotal)}` : ''}
              </strong>
            </div>
            <div className="bc-storage-time">统计于 {summary.generated_at}</div>
          </div>

          {items.length === 0 && <div className="bc-backup-empty">没有可统计的目录。</div>}
          {items.map((item) => {
            const share = total > 0 ? (item.bytes / total) * 100 : 0
            const width = largest > 0 ? (item.bytes / largest) * 100 : 0
            return (
              <div className="bc-storage-row" key={item.key}>
                <div className="bc-storage-head">
                  <span className="bc-storage-label" title={item.path}>{item.label}</span>
                  <strong>{human(item.bytes)}</strong>
                  <span className="bc-storage-share">{share.toFixed(share >= 10 ? 0 : 1)}%</span>
                </div>
                <div className="bc-storage-bar" role="img" aria-label={`${item.label} 占最大项的 ${width.toFixed(0)}%`}>
                  <div className="bc-storage-fill" style={{ width: `${width}%` }} />
                </div>
                <div className="bc-storage-meta">
                  <span>{item.files} 个文件</span>
                  {item.modified_at !== null && item.modified_at !== undefined && <span>最近修改 {item.modified_at}</span>}
                </div>
              </div>
            )
          })}

          <div className="bc-storage-hint">
            清理入口在 ⋯ 菜单：「清理备份…」「清理缓存…」「自动恢复记录… → 清理旧诊断包」。
          </div>
        </div>
      )}
    </Dialog>
  )
}
