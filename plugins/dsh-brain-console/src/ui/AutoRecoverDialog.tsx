/**
 * 自动恢复记录：崩溃自愈线程最近 20 次尝试的时间线。
 *
 * 数据来自管理器 `/auto-recover`（自愈线程每 20 秒巡视一次）；只读展示，
 * 不做任何操作。每条记录带单元名、尝试序号、结果、退出码与诊断包路径。
 */
import { useEffect, useState } from 'react'
import { diagnosticsFileUrl, loadAutoRecover, pruneAutoRecoverBundles, pruneAutoRecoverEvents } from '../api.ts'
import { reasonOf } from './errors.ts'
import { Button } from './primitives.ts'
import { Dialog } from './Dialog.tsx'
import type { AutoRecoverStatus } from './types.ts'

export interface AutoRecoverDialogProps {
  /** 关闭对话框。 */
  onClose: () => void
}

/** 秒级时间戳 → 本地可读时间。 */
function when(at: number): string {
  const stamp = new Date(at * 1000)
  if (Number.isNaN(stamp.getTime())) return '—'
  return stamp.toLocaleString('zh-CN', { hour12: false })
}

/**
 * 渲染自愈记录对话框。
 * @param props - 关闭回调
 * @returns 对话框元素（挂载即拉一次，可手动刷新）
 */
export function AutoRecoverDialog({ onClose }: AutoRecoverDialogProps): JSX.Element {
  const [status, setStatus] = useState<AutoRecoverStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [armed, setArmed] = useState<'bundles' | 'events' | null>(null)
  const [busy, setBusy] = useState(false)

  const load = async (): Promise<void> => {
    try {
      setStatus(await loadAutoRecover())
      setError(null)
    } catch (e) {
      setError(reasonOf(e))
    }
  }

  useEffect(() => { void load() }, [])

  const events = [...(status?.events ?? [])].reverse()
  const missingCount = events.filter((event) => event.bundle && event.bundle_exists === false).length
  const counters = Object.entries(status?.counters ?? {}).filter(([, n]) => n > 0)
  const summary = counters.length === 0
    ? '还没有发生过自动恢复'
    : counters.map(([unit, n]) => `${unit} × ${n}`).join(' · ')

  const runPrune = async (kind: 'bundles' | 'events'): Promise<void> => {
    setBusy(true)
    try {
      if (kind === 'bundles') await pruneAutoRecoverBundles()
      else await pruneAutoRecoverEvents()
      setArmed(null)
      await load()
    } catch (e) {
      setError(`清理失败：${reasonOf(e)}`)
    } finally {
      setBusy(false)
    }
  }

  const copyBundles = async (): Promise<void> => {
    const paths = events.map((event) => event.bundle).filter((path): path is string => Boolean(path))
    if (paths.length === 0) return
    try {
      await navigator.clipboard.writeText(paths.join('\n'))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // 剪贴板不可用时保持原样，避免误报「已复制」
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="自动恢复记录"
      closeLabel="关闭"
      description={`每小时最多 ${status?.max_per_hour ?? 3} 次 · 退避 ${(status?.backoff_s ?? [30, 120, 600]).join(' / ')} 秒`}
      footer={(
        <>
          {armed !== null ? (
            <>
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => void runPrune(armed)}>
                {armed === 'bundles' ? '确认清理旧包' : `确认清理 ${missingCount} 条`}
              </Button>
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => setArmed(null)}>
                取消
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => setArmed('bundles')}>
                清理旧诊断包…
              </Button>
              {missingCount > 0 && (
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => setArmed('events')}>
                  清理失效记录（{missingCount}）
                </Button>
              )}
            </>
          )}
          {events.some((event) => event.bundle) && (
            <Button size="sm" variant="ghost" onClick={() => void copyBundles()}>
              {copied ? '已复制' : '复制诊断包路径'}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => void load()}>刷新</Button>
          <Button size="sm" variant="ghost" onClick={onClose}>关闭</Button>
        </>
      )}
    >
      {error !== null && <div className="bc-backup-error">{error}</div>}
      {status === null && error === null && <div className="bc-backup-empty">读取中…</div>}
      {status !== null && (
        <div className="bc-auto">
          <div className="bc-auto-summary">{summary}</div>
          {events.length === 0 && (
            <div className="bc-backup-empty">没有恢复记录——进程都在正常运行。</div>
          )}
          <ul className="bc-auto-list">
            {events.map((event, index) => (
              <li
                key={`${event.unit}-${event.at}-${index}`}
                className="bc-auto-row"
                data-ok={event.ok ? 'true' : 'false'}
              >
                <div className="bc-auto-main">
                  <span className="bc-auto-dot" aria-hidden="true" />
                  <span className="bc-auto-unit">{event.unit}</span>
                  <span className="bc-auto-attempt">第 {event.attempt} 次</span>
                  <span className="bc-auto-ok">{event.ok ? '已重启' : '重启失败'}</span>
                  <span className="bc-auto-time">{when(event.at)}</span>
                </div>
                <div className="bc-auto-sub">
                  退出码 {event.exit_code ?? '—'}
                  {event.error !== null && event.error !== undefined ? ` · ${event.error}` : ''}
                </div>
                {event.bundle !== null && event.bundle !== undefined && (
                  <div className="bc-auto-bundle" title={event.bundle}>
                    {event.bundle_exists === false ? (
                      <span className="bc-auto-bundle-missing">诊断包已清理 · {event.bundle}</span>
                    ) : (
                      <a
                        className="bc-auto-bundle-link"
                        href={diagnosticsFileUrl(event.bundle.split(/[\\/]/).pop() ?? event.bundle)}
                        download
                      >
                        {event.bundle}
                      </a>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Dialog>
  )
}
