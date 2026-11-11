/**
 * 失败边明细：指标带里「失败边」数字点开后的只读清单。
 *
 * 数据来自管理器 `/quality/failed-edges`（读 brain.db 的 neural_edges.failure_count）。
 * 只读——降权/清理策略由 edge_reinforcer 与指标快照的阈值机制负责，面板不在这里改库。
 */
import { useEffect, useState } from 'react'
import { ignoreFailedEdge } from '../api.ts'
import { reasonOf } from './errors.ts'
import { Button } from './primitives.ts'
import { Dialog } from './Dialog.tsx'
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

/**
 * 渲染失败边明细。
 * @param props - 读取回调与关闭命令
 * @returns 对话框元素（挂载即打开并读取）
 */
export function FailedEdgesDialog({ load, onClose }: FailedEdgesDialogProps): JSX.Element {
  const [listing, setListing] = useState<FailedEdgesListing | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [ignoring, setIgnoring] = useState<string | null>(null)

  const reload = async (): Promise<void> => {
    try {
      setListing(await load())
    } catch (e) {
      setError(reasonOf(e))
    }
  }

  // 忽略：写忽略表后重拉清单，行消失但边本身不删（趋势与明细口径一致）。
  const ignoreOne = async (source: string, target: string): Promise<void> => {
    const key = `${source}\n${target}`
    setIgnoring(key)
    try {
      await ignoreFailedEdge(source, target)
      await reload()
    } catch (e) {
      setError(reasonOf(e))
    } finally {
      setIgnoring(null)
    }
  }

  useEffect(() => {
    void (async () => {
      try {
        setListing(await load())
      } catch (e) {
        setError(reasonOf(e))
      }
    })()
  }, [load])

  // 复制成 TSV（贴进表格/Excel 就能用）：表头 + 每条边一行
  const copyList = async (): Promise<void> => {
    if (listing === null || listing.edges.length === 0) return
    const header = 'source\ttarget\tfailures\tweight\tconfidence\torigin\tlast_seen'
    const rows = listing.edges.map((edge) => [
      edge.source, edge.target, String(edge.failures), String(edge.weight),
      String(edge.confidence), edge.origin ?? '', edge.last_seen ?? '',
    ].join('\t'))
    try {
      await navigator.clipboard.writeText([header, ...rows].join('\n'))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // 剪贴板不可用时保持原样，避免误报已复制
    }
  }

  const footer = (
    <>
      {listing !== null && listing.edges.length > 0 && (
        <Button size="sm" variant="ghost" onClick={() => void copyList()}>
          {copied ? '已复制' : `复制清单（${listing.edges.length} 条）`}
        </Button>
      )}
      <Button size="sm" variant="ghost" onClick={onClose}>关闭</Button>
    </>
  )
  const description = listing === null
    ? '读取中…'
    : `failure_count > 0 的边 · 实时 ${listing.total ?? '—'} 条`

  return (
    <Dialog open onClose={onClose} title="失败边" closeLabel="关闭" description={description} footer={footer}>
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
                <button
                  type="button"
                  className="bc-failed-ignore"
                  disabled={ignoring !== null}
                  title="加入忽略名单：不删除边，只从待消解清单隐藏"
                  onClick={() => void ignoreOne(edge.source, edge.target)}
                >
                  {ignoring === `${edge.source}\n${edge.target}` ? '处理中…' : '忽略'}
                </button>
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
    </Dialog>
  )
}
