/**
 * 备份清理对话框：**先列出、再确认**，不做静默删除。
 *
 * 清理是不可逆操作，所以这里刻意多一步：
 *   1) 打开即拉 `/actions/backups`，把每个快照标成「保留 / 将删除」；
 *   2) 保留数可调，但下限是 1 —— 永远留一个回滚点；
 *   3) 只有点确认才调用 `/actions/prune-backups`，删完重新列一遍并显示释放了多少。
 *
 * 删除永远由管理器执行（它才是唯一执行器），本组件只下发 keep 值。
 */
import { useCallback, useEffect, useState } from 'react'
import { formatMegabytes } from './format.ts'
import { Button, Modal } from './primitives.ts'
import type { BackupListing, PruneResult } from './types.ts'

export interface BackupDialogProps {
  /** 拉取快照列表 */
  load: () => Promise<BackupListing>
  /** 执行清理；keep = 保留最近几个（管理器侧还会再夹一次下限 1） */
  prune: (keep: number) => Promise<PruneResult>
  /** 清理成功后通知页面刷新概览指标 */
  onChanged: () => void
  /** 关闭对话框 */
  onClose: () => void
}

/** 默认保留数，与管理器 `prune_backups` 的默认值一致。 */
const DEFAULT_KEEP = 2

/** 把未知异常收敛成一句话；fetch 的网络失败只有 TypeError。 */
function reasonOf(error: unknown): string {
  if (error instanceof TypeError) return '连接被拒绝或超时'
  return error instanceof Error ? error.message : String(error)
}

/**
 * 渲染备份清理对话框。
 * @param props - 读写回调与关闭命令
 * @returns 对话框元素（挂载即打开，由父组件条件渲染）
 */
export function BackupDialog({ load, prune, onChanged, onClose }: BackupDialogProps): JSX.Element {
  const [listing, setListing] = useState<BackupListing | null>(null)
  const [keep, setKeep] = useState(DEFAULT_KEEP)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PruneResult | null>(null)

  /** 重新拉列表；保留数收进 [1, 快照数] 区间，避免列表变短后停在上一次的大值。 */
  const refresh = useCallback(async (): Promise<void> => {
    try {
      const answer = await load()
      setListing(answer)
      setKeep((current) => Math.min(Math.max(1, current), Math.max(1, answer.files.length)))
      setError(null)
    } catch (e) {
      setError(reasonOf(e))
    }
  }, [load])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const files = listing?.files ?? []
  const totalMb = listing?.total_mb ?? 0
  const doomed = files.slice(keep)
  const keptMb = files.slice(0, keep).reduce((sum, file) => sum + file.size_mb, 0)
  const doomedMb = files.slice(keep).reduce((sum, file) => sum + file.size_mb, 0)
  const canPrune = !busy && doomed.length > 0

  const confirm = async (): Promise<void> => {
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      const answer = await prune(keep)
      if (!answer.ok) {
        setError(answer.error ?? '清理失败')
        return
      }
      setResult(answer)
      onChanged()
      await refresh()
    } catch (e) {
      setError(reasonOf(e))
    } finally {
      setBusy(false)
    }
  }

  const footer = (
    <>
      <Button size="sm" variant="ghost" disabled={busy} onClick={onClose}>取消</Button>
      <Button size="sm" variant="primary" disabled={!canPrune} onClick={() => void confirm()}>
        {busy
          ? '清理中…'
          : doomed.length === 0
            ? '没有可删的'
            : `删除 ${doomed.length} 个 · 释放 ${formatMegabytes(doomedMb)}`}
      </Button>
    </>
  )

  return (
    <Modal
      open
      onClose={busy ? () => {} : onClose}
      title="清理备份"
      closeLabel="关闭"
      description={listing === null
        ? '读取快照列表…'
        : `${files.length} 个快照 · 共 ${formatMegabytes(totalMb)} · 保留 ${keep} 个后剩 ${formatMegabytes(keptMb)}`}
      footer={footer}
    >
      {error !== null && <div className="bc-backup-error">{error}</div>}

      {listing === null && error === null && (
        <div className="bc-backup-empty">读取中…</div>
      )}

      {listing !== null && files.length === 0 && (
        <div className="bc-backup-empty">还没有快照——点标题行的「立即备份」生成第一个。</div>
      )}

      {files.length > 0 && (
        <>
          <div className="bc-backup-keep">
            <span>保留最近</span>
            <div className="bc-stepper">
              <button
                type="button"
                className="bc-stepper-btn"
                aria-label="少保留一个"
                disabled={busy || keep <= 1}
                onClick={() => setKeep((current) => Math.max(1, current - 1))}
              >−</button>
              <span className="bc-stepper-value" aria-live="polite">{keep}</span>
              <button
                type="button"
                className="bc-stepper-btn"
                aria-label="多保留一个"
                disabled={busy || keep >= files.length}
                onClick={() => setKeep((current) => Math.min(files.length, current + 1))}
              >+</button>
            </div>
            <span>个（至少 1 个，保住回滚点）</span>
          </div>

          <ul className="bc-backup-list">
            {files.map((file, index) => (
              <li key={file.name} className="bc-backup-row" data-doomed={index >= keep || undefined}>
                <div className="bc-backup-main">
                  <span className="bc-backup-name" title={file.name}>{file.name}</span>
                  <span className="bc-backup-tag">{index < keep ? '保留' : '将删除'}</span>
                </div>
                <div className="bc-backup-sub">{file.at} · {formatMegabytes(file.size_mb)}</div>
              </li>
            ))}
          </ul>
        </>
      )}

      {result !== null && (
        <div className="bc-backup-done" role="status">
          {result.removed.length === 0
            ? '没有删除任何文件（已经只剩保留数）'
            : `已删除 ${result.removed.length} 个快照，释放 ${formatMegabytes(result.freed_mb)}`}
        </div>
      )}
    </Modal>
  )
}
