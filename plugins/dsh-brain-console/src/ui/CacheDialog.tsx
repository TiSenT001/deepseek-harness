/**
 * 缓存清理对话框：只清**大脑自己的**缓存，先列出、再勾选、最后确认。
 *
 * 范围边界：Python 字节码 / ruff / 临时文件 / 图谱与联网缓存。
 * 外部工具的缓存（HF 下载、Codex 运行时、DSH 临时目录）归各自工具所有，这里不碰。
 *
 * 三条安全规则：
 *   1) 受保护条目（图像向量库等）展示但不可选——让人看到「为什么不能删」；
 *   2) 「需确认」条目默认不勾（可疑孤儿、大件）；
 *   3) 只有点确认才下发，删完重新统计并显示释放多少。
 */
import { useCallback, useEffect, useState } from 'react'
import { formatMegabytes } from './format.ts'
import { Button, IconShield, Modal } from './primitives.ts'
import type { CacheItem, CacheListing, CachePruneResult } from './types.ts'

export interface CacheDialogProps {
  /** 拉取缓存登记表（含各条目体积） */
  load: () => Promise<CacheListing>
  /** 按 id 清理 */
  prune: (ids: string[]) => Promise<CachePruneResult>
  /** 关闭对话框 */
  onClose: () => void
}

/** 把未知异常收敛成一句话；fetch 的网络失败只有 TypeError。 */
function reasonOf(error: unknown): string {
  if (error instanceof TypeError) return '连接被拒绝或超时'
  return error instanceof Error ? error.message : String(error)
}

/** 风险标签的文案。 */
const RISK_LABEL: Record<CacheItem['risk'], string> = {
  safe: '可删',
  confirm: '需确认',
  protected: '受保护',
}

/**
 * 渲染缓存清理对话框。
 * @param props - 读写回调与关闭命令
 * @returns 对话框元素（挂载即打开）
 */
export function CacheDialog({ load, prune, onClose }: CacheDialogProps): JSX.Element {
  const [listing, setListing] = useState<CacheListing | null>(null)
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CachePruneResult | null>(null)

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const answer = await load()
      setListing(answer)
      // 默认只勾「安全且默认」的条目；需确认的留给人手动点
      const defaults: Record<string, boolean> = {}
      for (const item of answer.items) {
        if (item.default_on && !item.protected && item.available) defaults[item.id] = true
      }
      setSelected(defaults)
      setError(null)
    } catch (e) {
      setError(reasonOf(e))
    }
  }, [load])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const items = listing?.items ?? []
  const selectable = items.filter((item) => !item.protected && item.available)
  const protectedItems = items.filter((item) => item.protected)
  const chosen = selectable.filter((item) => selected[item.id] === true)
  const chosenMb = chosen.reduce((sum, item) => sum + item.size_mb, 0)
  const canPrune = !busy && chosen.length > 0

  const toggle = (id: string): void => {
    setSelected((current) => ({ ...current, [id]: current[id] !== true }))
  }

  const confirm = async (): Promise<void> => {
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const answer = await prune(chosen.map((item) => item.id))
      if (!answer.ok) {
        setError(answer.error ?? '清理失败')
        return
      }
      setResult(answer)
      await refresh()
    } catch (e) {
      setError(reasonOf(e))
    } finally {
      setBusy(false)
    }
  }

  const failed = result === null
    ? []
    : result.items.flatMap((entry) => entry.failed.map((reason) => `${entry.label}：${reason}`))
  // 请求失败优先，其次是管理器自报（比如 path_config 不可用）
  const notice = error ?? listing?.error ?? null

  const footer = (
    <>
      <Button size="sm" variant="ghost" disabled={busy} onClick={onClose}>取消</Button>
      <Button size="sm" variant="primary" disabled={!canPrune} onClick={() => void confirm()}>
        {busy
          ? '清理中…'
          : chosen.length === 0
            ? '未选择'
            : `清理 ${chosen.length} 项 · 释放 ${formatMegabytes(chosenMb)}`}
      </Button>
    </>
  )

  return (
    <Modal
      open
      onClose={busy ? () => {} : onClose}
      title="清理缓存"
      closeLabel="关闭"
      description={listing === null
        ? '统计中…'
        : `大脑自己的缓存 · 共 ${formatMegabytes(listing.total_mb)}，其中可清 ${formatMegabytes(listing.reclaimable_mb)}`}
      footer={footer}
    >
      {notice !== null && <div className="bc-backup-error">{notice}</div>}
      {listing === null && error === null && <div className="bc-backup-empty">统计中…</div>}

      {selectable.length > 0 && (
        <ul className="bc-cache-list">
          {selectable.map((item) => (
            <li key={item.id} className="bc-cache-row" data-risk={item.risk}>
              <label className="bc-cache-main">
                <input
                  type="checkbox"
                  className="bc-cache-check"
                  checked={selected[item.id] === true}
                  disabled={busy}
                  onChange={() => toggle(item.id)}
                />
                <span className="bc-cache-label">{item.label}</span>
                <span className="bc-cache-size">{formatMegabytes(item.size_mb)}</span>
                <span className="bc-cache-tag">{RISK_LABEL[item.risk]}</span>
              </label>
              <div className="bc-cache-note">{item.note}</div>
            </li>
          ))}
        </ul>
      )}

      {selectable.length === 0 && listing !== null && (
        <div className="bc-backup-empty">没有可清理的缓存</div>
      )}

      {protectedItems.length > 0 && (
        <>
          <div className="bc-cache-section">受保护（不是缓存或在用，不可清理）</div>
          <ul className="bc-cache-list">
            {protectedItems.map((item) => (
              <li key={item.id} className="bc-cache-row" data-risk="protected">
                <div className="bc-cache-main">
                  <span className="bc-cache-lock" aria-hidden="true"><IconShield size={14} /></span>
                  <span className="bc-cache-label">{item.label}</span>
                  <span className="bc-cache-size">{formatMegabytes(item.size_mb)}</span>
                  <span className="bc-cache-tag">{RISK_LABEL.protected}</span>
                </div>
                <div className="bc-cache-note">{item.note}</div>
              </li>
            ))}
          </ul>
        </>
      )}

      {listing !== null && (
        <div className="bc-cache-dir">统一位置：<code>{listing.cache_dir}</code></div>
      )}

      {result !== null && (
        <div className="bc-backup-done" role="status">
          {result.items.length === 0
            ? '没有清理任何条目'
            : `已清理 ${result.items.length} 项，释放 ${formatMegabytes(result.freed_mb)}`}
          {failed.length > 0 && (
            <span className="bc-cache-failed">（{failed.length} 项失败：{failed.slice(0, 2).join('；')}）</span>
          )}
        </div>
      )}
    </Modal>
  )
}
