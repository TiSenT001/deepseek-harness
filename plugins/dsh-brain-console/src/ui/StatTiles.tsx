/**
 * 概览指标带：数据库 / 知识边 / 笔记 / 记忆 / 失败边 / 上次备份。
 *
 * 只读观察值，不提供操作；「失败边」是唯一例外：点开看明细（只读清单）。
 * 有失败边时整块换成警示底色，而不是把数字染成低对比度文字。
 */
import { formatCount, formatMegabytes, formatRelative, formatShortMoment } from './format.ts'
import type { Overview } from './types.ts'

interface StatProps {
  label: string
  value: string
  hint: string
  /** 需要留意时用警示底色 */
  tone?: 'warn'
}

function Stat({ label, value, hint, tone }: StatProps): JSX.Element {
  return (
    <div className="bc-kpi" data-tone={tone}>
      <span className="bc-kpi-label">{label}</span>
      <span className="bc-kpi-value">{value}</span>
      <span className="bc-kpi-hint">{hint}</span>
    </div>
  )
}

/**
 * 渲染概览指标。
 * @param props.overview - `/status` 返回值；为空时不渲染
 * @param props.now - 当前毫秒时间戳，用于相对时间
 * @param props.onOpenFailed - 点开「失败边」明细
 * @returns 指标网格元素
 */
export function OverviewTiles({ overview, now, onOpenFailed }: {
  overview: Overview
  now: number
  onOpenFailed: () => void
}): JSX.Element {
  const backupAt = overview.last_backup.at
  const backupSize = overview.last_backup.size_mb
  const backupHint = [formatShortMoment(backupAt), backupSize === null ? null : formatMegabytes(backupSize)]
    .filter((part): part is string => part !== null)
    .join(' · ')
  const hasFailures = (overview.failure_edges ?? 0) > 0

  return (
    <div className="bc-kpis">
      <Stat label="数据库" value={formatMegabytes(overview.db_size_mb)} hint="brain.db" />
      <Stat label="知识边" value={formatCount(overview.edges)} hint="图谱连接" />
      <Stat label="笔记" value={formatCount(overview.notes)} hint="vault 索引" />
      <Stat label="记忆" value={formatCount(overview.sessions)} hint="会话记忆" />
      <button
        type="button"
        className="bc-kpi bc-kpi-action"
        data-tone={hasFailures ? 'warn' : undefined}
        onClick={onOpenFailed}
      >
        <span className="bc-kpi-label">失败边</span>
        <span className="bc-kpi-value">{formatCount(overview.failure_edges)}</span>
        <span className="bc-kpi-hint">待消解 · 查看</span>
      </button>
      <Stat
        label="上次备份"
        value={formatRelative(backupAt, now)}
        hint={backupHint === '' ? '暂无备份' : backupHint}
      />
    </div>
  )
}
