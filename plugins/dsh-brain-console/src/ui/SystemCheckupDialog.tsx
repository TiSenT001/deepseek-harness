/**
 * 系统体检：跑 `tools/system_checkup.py --json` 的四类只读检查。
 *
 * 空表 / 孤儿表 / 膨胀表来自 sqlite 统计与源码 grep，约 2 秒；结果只读展示，
 * 不提供任何清理动作（DROP 表这类操作留给命令行）。
 */
import { useEffect, useState } from 'react'
import { loadSystemCheckup } from '../api.ts'
import { reasonOf } from './errors.ts'
import { Button } from './primitives.ts'
import { Dialog } from './Dialog.tsx'
import type { CheckupResult } from './types.ts'

export interface SystemCheckupDialogProps {
  /** 关闭对话框。 */
  onClose: () => void
}

/** 把毫秒格式化成一位小数的秒。 */
function seconds(ms: number | undefined): string {
  return ms === undefined ? '—' : `${(ms / 1000).toFixed(1)}s`
}

/**
 * 渲染系统体检对话框。
 * @param props - 关闭回调
 * @returns 对话框元素（挂载即跑一次，可重跑）
 */
export function SystemCheckupDialog({ onClose }: SystemCheckupDialogProps): JSX.Element {
  const [result, setResult] = useState<CheckupResult | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (): Promise<void> => {
    setRunning(true)
    setError(null)
    try {
      setResult(await loadSystemCheckup())
    } catch (e) {
      setError(reasonOf(e))
      setResult(null)
    } finally {
      setRunning(false)
    }
  }

  useEffect(() => { void run() }, [])

  const report = result?.ok ? result.report : undefined
  const orphans = report?.orphan_tables ?? []
  const empty = report?.empty_unknown ?? []
  const bloated = report?.bloated_tables ?? []

  return (
    <Dialog
      open
      onClose={onClose}
      title="系统体检"
      closeLabel="关闭"
      description="只读检查：空表 / 孤儿表 / 膨胀表；不会修改任何数据"
      footer={(
        <>
          <Button size="sm" variant="ghost" disabled={running} onClick={() => void run()}>
            {running ? '体检中…' : '重新体检'}
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>关闭</Button>
        </>
      )}
    >
      {error !== null && <div className="bc-backup-error">{error}</div>}
      {result !== null && !result.ok && <div className="bc-backup-error">{result.error ?? '体检失败'}</div>}
      {running && result === null && <div className="bc-backup-empty">体检中…（约 2 秒）</div>}
      {report !== undefined && (
        <div className="bc-checkup">
          <div className="bc-checkup-grid">
            <div className="bc-checkup-cell">
              <span>总表数</span>
              <strong>{report.total_tables}</strong>
            </div>
            <div className="bc-checkup-cell" data-tone={orphans.length > 0 ? 'bad' : undefined}>
              <span>孤儿表</span>
              <strong>{orphans.length}</strong>
            </div>
            <div className="bc-checkup-cell" data-tone={empty.length > 0 ? 'warn' : undefined}>
              <span>待核实空表</span>
              <strong>{empty.length}</strong>
            </div>
            <div className="bc-checkup-cell" data-tone={bloated.length > 0 ? 'warn' : undefined}>
              <span>膨胀表</span>
              <strong>{bloated.length}</strong>
            </div>
            <div className="bc-checkup-cell">
              <span>耗时</span>
              <strong>{seconds(result?.elapsed_ms)}</strong>
            </div>
          </div>

          {orphans.length === 0 && empty.length === 0 && bloated.length === 0 && (
            <div className="bc-backup-done" role="status">没有发现需要处理的问题。</div>
          )}

          {orphans.length > 0 && (
            <section className="bc-checkup-section">
              <h4>孤儿表（空 + 无写路径，可 DROP）</h4>
              <div className="bc-checkup-tags">
                {orphans.map((table) => <span key={table} className="bc-checkup-tag" data-tone="bad">{table}</span>)}
              </div>
            </section>
          )}

          {empty.length > 0 && (
            <section className="bc-checkup-section">
              <h4>待核实空表（空 + 有写路径，但不在事件驱动清单）</h4>
              <div className="bc-checkup-tags">
                {empty.map((table) => <span key={table} className="bc-checkup-tag" data-tone="warn">{table}</span>)}
              </div>
            </section>
          )}

          {bloated.length > 0 && (
            <section className="bc-checkup-section">
              <h4>膨胀表（行数超过 10 万）</h4>
              <div className="bc-checkup-list">
                {bloated.map(([table, count]) => (
                  <div className="bc-checkup-row" key={String(table)}>
                    <span className="bc-cron-name">{table}</span>
                    <span>{typeof count === 'number' ? count.toLocaleString('zh-CN') : String(count)} 行</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="bc-index-sample">
            已知事件驱动空表 {report.known_event_driven} 个（列在 system_checkup.py 的白名单里，属正常）
          </div>
        </div>
      )}
    </Dialog>
  )
}
