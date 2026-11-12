/**
 * 系统体检：跑 `tools/system_checkup.py --json` 的四类只读检查。
 *
 * 空表 / 孤儿表 / 膨胀表来自 sqlite 统计与源码 grep，约 2 秒；结果只读展示，
 * 不提供任何清理动作（DROP 表这类操作留给命令行）。每次体检会留一行摘要，
 * 本对话框展示「较上次」对比与最近几次历史；膨胀表可下钻看列结构与行数。
 */
import { useEffect, useState } from 'react'
import { clearCheckupHistory, loadSystemCheckup, loadTableInfo, loadTableUsage } from '../api.ts'
import { Sparkline } from './Sparkline.tsx'
import { reasonOf } from './errors.ts'
import { Button } from './primitives.ts'
import { Dialog } from './Dialog.tsx'
import type { CheckupResult, CheckupSummary, TableInfo, TableUsage } from './types.ts'

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

/** 复制文本；navigator.clipboard 无权限时退回 textarea + execCommand。 */
async function copyText(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value)
    return
  } catch {
    // 无剪贴板权限时走兼容路径
  }
  const area = document.createElement('textarea')
  area.value = value
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(area)
  if (!ok) throw new Error('浏览器拒绝了复制')
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
              {((info.indexes ?? []).length > 0 || (info.triggers ?? []).length > 0) && (
                <div className="bc-checkup-index">
                  <span className="bc-index-note">
                    索引 {info.indexes?.length ?? 0} 个
                    {(info.triggers ?? []).length > 0 ? ` · 触发器 ${info.triggers?.length}` : ''}
                  </span>
                  {(info.indexes ?? []).length === 0 && (
                    <span className="bc-checkup-tag" data-tone="warn">无索引，可考虑补</span>
                  )}
                  <div className="bc-checkup-tags">
                    {(info.indexes ?? []).map((index) => (
                      <span key={index.name} className="bc-checkup-tag">
                        {index.name}{index.unique ? ' · unique' : ''}
                        <span className="bc-checkup-tag-type">{index.columns.join(', ')}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
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
  const [usage, setUsage] = useState<Record<string, TableUsage>>({})
  const [openUsage, setOpenUsage] = useState<string | null>(null)
  const [usageBusy, setUsageBusy] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [armedClear, setArmedClear] = useState(false)
  const [clearing, setClearing] = useState(false)

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

  const toggleUsage = async (name: string): Promise<void> => {
    if (openUsage === name) {
      setOpenUsage(null)
      return
    }
    setOpenUsage(name)
    if (usage[name] !== undefined) return
    setUsageBusy(name)
    try {
      const info = await loadTableUsage(name)
      setUsage((prev) => ({ ...prev, [name]: info }))
    } catch (e) {
      setUsage((prev) => ({ ...prev, [name]: { ok: false, error: reasonOf(e) } }))
    } finally {
      setUsageBusy(null)
    }
  }

  const report = result?.ok ? result.report : undefined
  const orphans = report?.orphan_tables ?? []
  const empty = report?.empty_unknown ?? []
  const bloated = report?.bloated_tables ?? []
  const previous = result?.previous ?? null
  const history = result?.history ?? []
  // 按天聚合：每天取最后一次，趋势看日序列更稳
  const dailyHistory = (() => {
    const byDay = new Map<string, CheckupSummary>()
    for (const item of history) {
      const day = item.at.slice(0, 10)
      const existing = byDay.get(day)
      if (existing === undefined || item.at > existing.at) byDay.set(day, item)
    }
    return [...byDay.values()].sort((left, right) => left.at.localeCompare(right.at))
  })()
  const trendRows: { label: string; values: number[]; current: number | null }[] = [
    {
      label: '总表',
      values: dailyHistory.map((item) => item.total_tables).filter((value): value is number => value !== null),
      current: report?.total_tables ?? null,
    },
    { label: '待核实空表', values: dailyHistory.map((item) => item.empty), current: empty.length },
    { label: '膨胀表', values: dailyHistory.map((item) => item.bloated), current: bloated.length },
  ]

  const buildSummary = (): string => {
    const lines = [`## 系统体检 ${result?.at ?? ''}`.trim(), '']
    lines.push(`- 总表：${report?.total_tables ?? '—'}`)
    lines.push(`- 孤儿表：${orphans.length}`)
    lines.push(`- 待核实空表：${empty.length}${empty.length > 0 ? `（${empty.join('、')}）` : ''}`)
    const bloatText = bloated
      .map(([table, count]) => `${table} ${typeof count === 'number' ? count.toLocaleString('zh-CN') : String(count)} 行`)
      .join('、')
    lines.push(`- 膨胀表：${bloated.length}${bloatText === '' ? '' : `（${bloatText}）`}`)
    lines.push(`- 耗时：${seconds(result?.elapsed_ms)}`)
    if (previous !== null) {
      lines.push(`- 较上次（${previous.at}）：总表 ${previous.total_tables ?? '—'} · 空表 ${previous.empty} · 膨胀 ${previous.bloated}`)
    }
    return lines.join('\n')
  }

  const clearHistory = async (): Promise<void> => {
    setClearing(true)
    try {
      await clearCheckupHistory()
      setArmedClear(false)
      await run()
    } catch (e) {
      setError(`清空失败：${reasonOf(e)}`)
    } finally {
      setClearing(false)
    }
  }

  const exportCsv = (): void => {
    const header = 'at,total_tables,orphan,empty,bloated'
    const rows = history.map((item) => [
      item.at,
      item.total_tables ?? '',
      item.orphan,
      item.empty,
      item.bloated,
    ].join(','))
    const blob = new Blob([`${header}\n${rows.join('\n')}\n`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchorEl = document.createElement('a')
    anchorEl.href = url
    anchorEl.download = `brain-checkup-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(anchorEl)
    anchorEl.click()
    anchorEl.remove()
    URL.revokeObjectURL(url)
  }

  const copySummary = async (): Promise<void> => {
    try {
      await copyText(buildSummary())
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch (e) {
      setError(`复制失败：${reasonOf(e)}`)
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="系统体检"
      closeLabel="关闭"
      description="只读检查：空表 / 孤儿表 / 膨胀表；不会修改任何数据"
      footer={(
        <>
          <Button size="sm" variant="ghost" disabled={running} onClick={() => void copySummary()}>
            {copied ? '已复制' : '复制摘要'}
          </Button>
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
              <h4>待核实空表（空 + 有写路径，点击看源码引用）</h4>
              <div className="bc-checkup-tags">
                {empty.map((table) => (
                  <button
                    key={table}
                    type="button"
                    className="bc-checkup-tag bc-checkup-tag-btn"
                    data-tone="warn"
                    aria-expanded={openUsage === table}
                    onClick={() => void toggleUsage(table)}
                  >
                    {table}
                  </button>
                ))}
              </div>
              {openUsage !== null && empty.includes(openUsage) && (
                <div className="bc-checkup-usage">
                  {usageBusy === openUsage && <span className="bc-index-note">扫描源码引用…</span>}
                  {usageBusy !== openUsage && usage[openUsage]?.ok === false && (
                    <span className="bc-backup-error">{usage[openUsage]?.error ?? '扫描失败'}</span>
                  )}
                  {usageBusy !== openUsage && usage[openUsage]?.ok === true && (
                    <>
                      <span className="bc-index-note">
                        {openUsage} · 扫描 {usage[openUsage]?.scanned} 个文件 · {(usage[openUsage]?.matches ?? []).length} 处引用
                      </span>
                      {(usage[openUsage]?.matches ?? []).length === 0 && (
                        <span className="bc-index-note">没有找到引用</span>
                      )}
                      {(usage[openUsage]?.matches ?? []).map((match) => (
                        <div className="bc-checkup-usage-row" key={`${match.file}:${match.line}`}>
                          <span className="bc-checkup-use-file">{match.file}:{match.line}</span>
                          <code>{match.text}</code>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
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
              <summary>历史体检（{history.length} 条 / {dailyHistory.length} 天）</summary>
              <div className="bc-checkup-history-actions">
                <Button size="sm" variant="ghost" disabled={history.length === 0} onClick={() => exportCsv()}>
                  导出 CSV
                </Button>
                {armedClear ? (
                  <>
                    <Button size="sm" variant="ghost" disabled={clearing} onClick={() => void clearHistory()}>
                      确认清空
                    </Button>
                    <Button size="sm" variant="ghost" disabled={clearing} onClick={() => setArmedClear(false)}>
                      取消
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="ghost" disabled={clearing} onClick={() => setArmedClear(true)}>
                    清空历史
                  </Button>
                )}
              </div>
              {dailyHistory.length >= 2 && (
                <div className="bc-checkup-trend">
                  {trendRows.map((row) => {
                    const min = row.values.length > 0 ? Math.min(...row.values) : null
                    const max = row.values.length > 0 ? Math.max(...row.values) : null
                    return (
                      <div className="bc-checkup-trend-row" key={row.label}>
                        <span>{row.label}</span>
                        <Sparkline values={row.values} height={18} className="bc-checkup-spark" />
                        <span className="bc-checkup-trend-range">{min === null ? '—' : `${min}–${max}`}</span>
                        <strong>{row.current ?? '—'}</strong>
                      </div>
                    )
                  })}
                </div>
              )}
              <div className="bc-checkup-history-list">
                {[...dailyHistory].reverse().map((item) => <HistoryRow key={`day-${item.at}`} item={item} />)}
              </div>
              <div className="bc-index-note">
                {history.length} 条记录按天聚合为 {dailyHistory.length} 天（列表与趋势都显示每天最后一次）
              </div>
            </details>
          )}
        </div>
      )}
    </Dialog>
  )
}
