/**
 * 概览指标带：数据库 / 知识边 / 笔记 / 记忆 / 失败边 / 上次备份。
 *
 * 前五项各带一条 30 天迷你趋势线，点开看完整趋势（可切 7 / 30 / 90 / 365 天窗口）。
 * 「失败边」有值时整块换成警示底色，而不是把数字染成低对比度文字。
 */
import { formatCount, formatMegabytes, formatRelative, formatShortMoment } from './format.ts'
import type { MetricKey } from './metrics.ts'
import { Sparkline } from './Sparkline.tsx'
import type { HistoryListing, Overview } from './types.ts'

/** 指标带里趋势线的窗口（天）。 */
const SPARK_DAYS = 30

/** 取最近 N 天里该指标的数值（升序，跳过空点）。 */
function seriesValues(points: HistoryListing['points'] | undefined, key: MetricKey): number[] {
  if (points === undefined) return []
  const cutoff = Date.now() - SPARK_DAYS * 86400000
  const values: number[] = []
  for (const point of points) {
    const value = point[key]
    if (value === null) continue
    const stamp = Date.parse(point.ts.includes('T') ? point.ts : point.ts.replace(' ', 'T'))
    if (Number.isFinite(stamp) && stamp >= cutoff) values.push(value)
  }
  return values
}

interface StatProps {
  label: string
  value: string
  hint: string
  /** 需要留意时用警示底色 */
  tone?: 'warn'
  /** 迷你趋势线数据；不足两点时不渲染 */
  spark?: number[]
  /** 给出时整块变成按钮（打开趋势对话框） */
  onClick?: () => void
}

function Stat({ label, value, hint, tone, spark, onClick }: StatProps): JSX.Element {
  const content = (
    <>
      <span className="bc-kpi-label">{label}</span>
      <span className="bc-kpi-value">{value}</span>
      <span className="bc-kpi-hint">{hint}</span>
      {spark !== undefined && spark.length > 1 && <Sparkline values={spark} />}
    </>
  )
  if (onClick === undefined) {
    return <div className="bc-kpi" data-tone={tone}>{content}</div>
  }
  return (
    <button type="button" className="bc-kpi bc-kpi-action" data-tone={tone} onClick={onClick}>
      {content}
    </button>
  )
}

/**
 * 渲染概览指标。
 * @param props.overview - `/status` 返回值；为空时不渲染
 * @param props.now - 当前毫秒时间戳，用于相对时间
 * @param props.history - `/status/history` 的采样点；为空时只显示数值
 * @param props.onOpenTrend - 点开某个指标的趋势图
 * @returns 指标网格元素
 */
export function OverviewTiles({ overview, now, history, onOpenTrend }: {
  overview: Overview
  now: number
  history: HistoryListing | null
  onOpenTrend: (key: MetricKey) => void
}): JSX.Element {
  const backupAt = overview.last_backup.at
  const backupSize = overview.last_backup.size_mb
  const backupHint = [formatShortMoment(backupAt), backupSize === null ? null : formatMegabytes(backupSize)]
    .filter((part): part is string => part !== null)
    .join(' · ')
  const points = history?.points
  const hasFailures = (overview.failure_edges ?? 0) > 0

  return (
    <div className="bc-kpis">
      <Stat
        label="数据库"
        value={formatMegabytes(overview.db_size_mb)}
        hint="brain.db"
        spark={seriesValues(points, 'db_size_mb')}
        onClick={() => onOpenTrend('db_size_mb')}
      />
      <Stat
        label="知识边"
        value={formatCount(overview.edges)}
        hint="图谱连接"
        spark={seriesValues(points, 'edges')}
        onClick={() => onOpenTrend('edges')}
      />
      <Stat
        label="笔记"
        value={formatCount(overview.notes)}
        hint="vault 索引"
        spark={seriesValues(points, 'notes')}
        onClick={() => onOpenTrend('notes')}
      />
      <Stat
        label="记忆"
        value={formatCount(overview.sessions)}
        hint="会话记忆"
        spark={seriesValues(points, 'sessions')}
        onClick={() => onOpenTrend('sessions')}
      />
      <Stat
        label="失败边"
        value={formatCount(overview.failure_edges)}
        hint="待消解 · 查看"
        tone={hasFailures ? 'warn' : undefined}
        spark={seriesValues(points, 'failure_edges')}
        onClick={() => onOpenTrend('failure_edges')}
      />
      <Stat
        label="上次备份"
        value={formatRelative(backupAt, now)}
        hint={backupHint === '' ? '暂无备份' : backupHint}
      />
    </div>
  )
}
