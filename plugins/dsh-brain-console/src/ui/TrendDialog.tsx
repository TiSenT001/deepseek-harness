/**
 * 指标趋势对话框：点指标卡打开，默认 30 天，可切 7 / 30 / 90 / 365 天。
 *
 * 数据来自 `/status/history`（管理器每天采一次 metrics_snapshots）。
 * 悬停图上任意位置会读出该采样点的日期与数值；点数不足时明确提示「数据不足」，
 * 不画一条假线。失败边指标额外给一个「查看明细」入口。
 */
import { useMemo, useState } from 'react'
import { Button, Modal } from './primitives.ts'
import type { MetricSpec } from './metrics.ts'
import type { MetricPoint } from './types.ts'

const CHART_W = 600
const CHART_H = 170
const PAD = 14

/** 可选时间窗口（天）。 */
const RANGES: readonly { days: number; label: string }[] = [
  { days: 7, label: '7 天' },
  { days: 30, label: '30 天' },
  { days: 90, label: '90 天' },
  { days: 365, label: '365 天' },
]

/** 管理器的时间戳有两种写法（ISO 带 T / 空格分隔），统一成可解析的形式。 */
function parseTs(ts: string): number {
  const normalized = ts.includes('T') ? ts : ts.replace(' ', 'T')
  return Date.parse(normalized)
}

/** `2026-11-07T23:18:28` → `11-07`。 */
function shortDate(ts: string): string {
  const day = ts.slice(5, 10)
  return day.length === 5 ? day : ts.slice(0, 10)
}

export interface TrendDialogProps {
  /** 指标定义（标签、单位、格式化） */
  metric: MetricSpec
  /** 接口返回的全部采样点（升序） */
  points: MetricPoint[]
  /** 失败边指标：打开明细清单 */
  onOpenFailed?: () => void
  onClose: () => void
}

/**
 * 渲染指标趋势对话框。
 * @param props - 指标、采样点与回调
 * @returns 对话框元素（挂载即打开）
 */
export function TrendDialog({ metric, points, onOpenFailed, onClose }: TrendDialogProps): JSX.Element {
  const [days, setDays] = useState(30)
  const [hover, setHover] = useState<number | null>(null)

  const series = useMemo(() => {
    const cutoff = Date.now() - days * 86400000
    return points
      .map((point) => ({ ts: point.ts, value: point[metric.key] }))
      .filter((point): point is { ts: string; value: number } =>
        point.value !== null && Number.isFinite(parseTs(point.ts)) && parseTs(point.ts) >= cutoff)
  }, [points, days, metric.key])

  const count = series.length
  const values = series.map((point) => point.value)
  const min = count > 0 ? Math.min(...values) : 0
  const max = count > 0 ? Math.max(...values) : 0
  const span = max - min || 1
  const xAt = (index: number): number => (count <= 1 ? CHART_W / 2 : (index / (count - 1)) * CHART_W)
  const yAt = (value: number): number => CHART_H - PAD - ((value - min) / span) * (CHART_H - PAD * 2)

  const line = series.map((point, index) => `${xAt(index).toFixed(1)},${yAt(point.value).toFixed(1)}`).join(' ')
  const area = series.length > 0
    ? `0,${CHART_H} ${line} ${CHART_W},${CHART_H}`
    : ''

  const handleMove = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (count === 0) return
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    setHover(Math.round(ratio * (count - 1)))
  }

  const latest = count > 0 ? series[count - 1] ?? null : null
  const first = series[0]
  const readout = hover !== null && series[hover] !== undefined
    ? `${shortDate(series[hover].ts)} · ${metric.format(series[hover].value)}`
    : latest !== null
      ? `最新 ${metric.format(latest.value)}`
      : '暂无采样'

  const footer = (
    <>
      {onOpenFailed !== undefined && (
        <Button size="sm" variant="ghost" onClick={onOpenFailed}>查看失败边明细</Button>
      )}
      <Button size="sm" variant="ghost" onClick={onClose}>关闭</Button>
    </>
  )

  return (
    <Modal
      open
      onClose={onClose}
      title={`${metric.label}趋势`}
      closeLabel="关闭"
      description={`${days} 天窗口 · ${count} 个采样点 · 单位${metric.unit}`}
      footer={footer}
    >
      <div className="bc-trend">
        <div className="bc-trend-head">
          <div className="bc-trend-ranges">
            {RANGES.map((range) => (
              <Button
                key={range.days}
                size="sm"
                variant={days === range.days ? 'outline' : 'ghost'}
                onClick={() => { setDays(range.days); setHover(null) }}
              >
                {range.label}
              </Button>
            ))}
          </div>
          <span className="bc-trend-readout">{readout}</span>
        </div>

        <div className="bc-trend-chart" onMouseMove={handleMove} onMouseLeave={() => setHover(null)}>
          <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} width="100%" height="170" preserveAspectRatio="none" role="img" aria-label={`${metric.label}趋势图`}>
            {count > 1 && <polygon points={area} className="bc-trend-area" />}
            {count > 1 && <polyline points={line} className="bc-trend-line" vectorEffect="non-scaling-stroke" />}
            {hover !== null && series[hover] !== undefined && (
              <>
                <line x1={xAt(hover)} x2={xAt(hover)} y1={0} y2={CHART_H} className="bc-trend-guide" vectorEffect="non-scaling-stroke" />
                <circle cx={xAt(hover)} cy={yAt(series[hover].value)} r={4} className="bc-trend-dot" />
              </>
            )}
            {count === 1 && series[0] !== undefined && (
              <circle cx={CHART_W / 2} cy={yAt(series[0].value)} r={4} className="bc-trend-dot" />
            )}
          </svg>
        </div>

        <div className="bc-trend-axis">
          <span>{first !== undefined ? shortDate(first.ts) : '—'}</span>
          <span>{count > 0 ? `最高 ${metric.format(max)} · 最低 ${metric.format(min)}` : ''}</span>
          <span>{latest !== null ? shortDate(latest.ts) : '—'}</span>
        </div>

        {count < 2 && (
          <div className="bc-trend-empty">
            数据不足：当前窗口只有 {count} 个采样点。管理器每天采一次，明天起才会有折线。
          </div>
        )}
      </div>
    </Modal>
  )
}
