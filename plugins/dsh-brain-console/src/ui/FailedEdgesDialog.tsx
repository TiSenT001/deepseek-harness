/**
 * 失败边明细：指标带里「失败边」数字点开后的只读清单。
 *
 * 数据来自管理器 `/quality/failed-edges`（读 brain.db 的 neural_edges.failure_count）。
 * 只读——降权/清理策略由 edge_reinforcer 与指标快照的阈值机制负责，面板不在这里改库。
 */
import { useEffect, useState } from 'react'
import { Button, Modal } from './primitives.ts'
import type { FailedEdgesListing } from './types.ts'

export interface FailedEdgesDialogProps {
  /** 拉取失败边列表 */
  load: () => Promise<FailedEdgesListing>
  /** 关闭对话框 */
  onClose: () => void
}

/** 把 `note:目录/文件.md` 压成文件名，长路径靠 title 查看。 */
function shortName(id: string): string {
  const withoutScheme = id.startsWith('note:') ? id.slice(5) : id
  const parts = withoutScheme.split('/')
  return parts[parts.length - 1] ?? withoutScheme
}

/** 把未知异常收敛成一句话；fetch 的网络失败只有 TypeError。 */
function reasonOf(error: unknown): string {
  if (error instanceof TypeError) return '连接被拒绝或超时'
  return error instanceof Error ? error.message : String(error)
}

/**
 * 渲染失败边明细。
 * @param props - 读取回调与关闭命令
 * @returns 对话框元素（挂载即打开并读取）
 */
export function FailedEdgesDialog({ load, onClose }: FailedEdgesDialogProps): JSX.Element {
  const [listing, setListing] = useState<FailedEdgesListing | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        setListing(await load())
      } catch (e) {
        setError(reasonOf(e))
      }
    })()
  }, [load])

  const footer = <Button size="sm" variant="ghost" onClick={onClose}>关闭</Button>
  const description = listing === null
    ? '读取中…'
    : `failure_count > 0 的边 · 实时 ${listing.total ?? '—'} 条`

  return (
    <Modal open onClose={onClose} title="失败边" closeLabel="关闭" description={description} footer={footer}>
      {error !== null && <div className="bc-backup-error">{error}</div>}
      {listing === null && error === null && <div className="bc-backup-empty">读取中…</div>}
      {listing !== null && listing.edges.length === 0 && <div className="bc-backup-empty">没有失败边</div>}
      {listing !== null && listing.edges.length > 0 && (
        <ul className="bc-failed-list">
          {listing.edges.map((edge) => (
            <li key={`${edge.source}→${edge.target}`} className="bc-failed-row">
              <div className="bc-failed-main">
                <span className="bc-failed-name" title={`${edge.source}\n→ ${edge.target}`}>
                  {shortName(edge.source)} → {shortName(edge.target)}
                </span>
                <span className="bc-failed-count">失败 {edge.failures}</span>
              </div>
              <div className="bc-failed-sub">
                {edge.origin ?? '未知来源'} · 权重 {edge.weight.toFixed(3)}
                {' · '}置信 {edge.confidence.toFixed(2)} · {edge.last_seen ?? '—'}
              </div>
            </li>
          ))}
        </ul>
      )}
      {listing !== null && listing.total !== null && listing.edges.length < listing.total && (
        <div className="bc-failed-more">只显示前 {listing.edges.length} 条，共 {listing.total} 条</div>
      )}
    </Modal>
  )
}
