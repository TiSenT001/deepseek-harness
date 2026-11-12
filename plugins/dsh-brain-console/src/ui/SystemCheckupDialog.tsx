/**
 * 系统体检：跑 `tools/system_checkup.py --json` 的四类只读检查。
 *
 * 空表 / 孤儿表 / 膨胀表来自 sqlite 统计与源码 grep，约 2 秒；结果只读展示，
 * 不提供任何清理动作（DROP 表这类操作留给命令行）。每次体检会留一行摘要，
 * 本对话框展示「较上次」对比与最近几次历史；膨胀表可下钻看列结构与行数。
 */
import { useEffect, useState } from 'react'
import { loadSystemCheckup, loadTableInfo } from '../api.ts'
import { reasonOf } from './errors.ts'
import { Button } from './primitives.ts'
import { Dialog } from './Dialog.tsx'
import type { CheckupResult, CheckupSummary, TableInfo } from './types.ts'

export interface SystemCheckupDialogProps {
  /** 关闭对话框。 */
  onClose: () => void
}

/** 把毫秒格式化成一位小数的秒。 */
function seconds(ms: number | undefined): string {
  return ms === undefined ? '—' : `${(ms / 1000).toFixed(1)}s`
}

/** 数字变化：上涨用 +，下降用 −，不变返回空。 */
function diff(before: number | null | undefined, after: number | null | undefined): string {
  if (before === null || before === undefined || after === null || after === undefined) return ''
  const delta = after - before
  if (delta === 0) return ''
  return delta > 0 ? `（+${delta}）` : `（${delta}）`
}

/** 一条历史记录的摘要行。 */
function HistoryRow({ item }: { item: CheckupSummary }): JSX.Element {
  return (
    <div className="bc-checkup-history-row">
      <span className="bc-checkup-history-at">{item.at}</span>
      <span>总表 {item.total_tables ?? '—'}</span>
      <span>孤儿 {item.orphan}</span>
      <span>空表 {item.empty}</span>
      <span>膨胀 {item.bloated}</span>
    </div>
  )
}

/** 一个可展开的膨胀表行：点开列结构。 */
function BloatRow({ name, count, info, open, busy, onToggle }: {
  name: string
  count: string | number
  info: TableInfo | undefined
  open: boolean
  busy: boolean
  onToggle: () => void
}): JSX.Element {
  return (
    <div className="bc-checkup-bloat">
      <button type="button" className="bc-checkup-row bc-checkup-row-btn" aria-expanded={open} onClick={onToggle}>
        <span className="bc-cron-name">{name}</span>
        <span>{typeof count === 'number' ? count.toLocaleString('zh-CN') : String(count)} 行</span>
      </button>
      {open && (
        <div className="bc-checkup-columns">
          {busy && <span className="bc-index-note">读取列结构…</span>}
          {!busy && info?.ok === false && <span className="bc-backup-error">{info.error ?? '读取失败'}</span>}
          {!busy && info?.ok === true && (
            <>
              <span className="bc-index-note">共 {info.columns?.length ?? 0} 列 · {info.rows?.toLocaleString('zh-CN')} 行</span>
              <div className="bc-checkup-tags">
                {(info.columns ?? []).map((column) => (
                  <span key={column.name} className="bc-checkup-tag" title={`${column.type || 'ANY'}${column.notnull ? ' NOT NULL' : ''}${column.pk ? ' PRIMARY KEY' : ''}`}>
                    {column.name}
                    <span className="bc-checkup-tag-type">{column.type || '—'}{column.pk ? ' · pk' : ''}</span>
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
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
  const [tables, setTables] = useState<Record<string, TableInfo>>({})
  const [openTable, setOpenTable] = useState<string | null>(null)
  const [tableBusy, setTableBusy] = useState<string | null>(null)

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

  const toggleTable = async (name: string): Promise<void> => {
    if (openTable === name) {
      setOpenTable(null)
      return
    }
    setOpenTable(name)
    if (tables[name] !== undefined) return
    setTableBusy(name)
    try {
      const info = await loadTableInfo(name)
      setTables((prev) => ({ ...prev, [name]: info }))
    } catch (e) {
      setTables((prev) => ({ ...prev, [name]: { ok: false, error: reasonOf(e) } }))
    } finally {
      setTableBusy(null)
    }
  }

  const report = result?.ok ? result.report : undefined
  const orphans = report?.orphan_tables ?? []
  const empty = report?.empty_unknown ?? []
  const bloated = report?.bloated_tables ?? []
  const previous = result?.previous ?? null
  const history = result?.history ?? []

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

          {previous !== null && (
            <div className="bc-checkup-delta">
              较上次（{previous.at}）：总表 {previous.total_tables ?? '—'} → {report.total_tables}{diff(previous.total_tables, report.total_tables)}
              {' · '}孤儿 {previous.orphan} → {orphans.length}{diff(previous.orphan, orphans.length)}
              {' · '}空表 {previous.empty} → {empty.length}{diff(previous.empty, empty.length)}
              {' · '}膨胀 {previous.bloated} → {bloated.length}{diff(previous.bloated, bloated.length)}
            </div>
          )}

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
              <h4>膨胀表（行数超过 10 万，点开看列结构）</h4>
              <div className="bc-checkup-list">
                {bloated.map(([table, count]) => (
                  <BloatRow
                    key={String(table)}
                    name={String(table)}
                    count={count ?? '—'}
                    info={tables[String(table)]}
                    open={openTable === String(table)}
                    busy={tableBusy === String(table)}
                    onToggle={() => void toggleTable(String(table))}
                  />
                ))}
              </div>
            </section>
          )}

          <div className="bc-index-sample">
            已知事件驱动空表 {report.known_event_driven} 个（列在 system_checkup.py 的白名单里，属正常）
          </div>

          {history.length > 0 && (
            <details className="bc-checkup-history">
              <summary>历史体检（{history.length}）</summary>
              <div className="bc-checkup-history-list">
                {[...history].reverse().map((item) => <HistoryRow key={item.at} item={item} />)}
              </div>
            </details>
          )}
        </div>
      )}
    </Dialog>
  )
}
