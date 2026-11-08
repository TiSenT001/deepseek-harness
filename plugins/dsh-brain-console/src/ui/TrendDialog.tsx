/**
 * 指标趋势对话框：点指标卡打开，默认 30 天，可切 7 / 30 / 90 / 365 天。
 *
 * 数据来自 `/status/history`（管理器每 6 小时采一次 metrics_snapshots）。
 * 图上支持滚轮缩放（以光标为中心）、拖拽平移、双击重置；悬停读出该采样点日期与数值。
 * 点数不足时明确提示「数据不足」，不画一条假线。失败边指标额外给一个「查看明细」入口。
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { loadTrendThresholds, saveTrendThreshold } from '../api.ts'
import { reasonOf } from './errors.ts'
import { Button, Modal } from './primitives.ts'
import type { MetricSpec } from './metrics.ts'
import { parseTs, shortDate } from './time.ts'
import { smoothAreaPath, smoothPath } from './smooth.ts'
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

/** 把缩放窗口夹到合法范围；窗口至少 2 个点。 */
function clampView(start: number, end: number, total: number): { start: number; end: number } {
  const size = Math.max(2, Math.min(total, end - start + 1))
  const safeStart = Math.max(0, Math.min(total - size, start))
  return { start: safeStart, end: safeStart + size - 1 }
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
  const [zoom, setZoom] = useState<{ start: number; end: number } | null>(null)
  const [limits, setLimits] = useState<Record<string, number | null> | null>(null)
  const [limitOpen, setLimitOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [limitError, setLimitError] = useState<string | null>(null)
  const chartRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<{ x: number; start: number; end: number } | null>(null)

  const series = useMemo(() => {
    const cutoff = Date.now() - days * 86400000
    return points
      .map((point) => ({ ts: point.ts, value: point[metric.key] }))
      .filter((point): point is { ts: string; value: number } =>
        point.value !== null && Number.isFinite(parseTs(point.ts)) && parseTs(point.ts) >= cutoff)
  }, [points, days, metric.key])

  const total = series.length
  const view = zoom === null
    ? { start: 0, end: Math.max(0, total - 1) }
    : clampView(zoom.start, zoom.end, total)
  const visible = total === 0 ? [] : series.slice(view.start, view.end + 1)
  const count = visible.length

  const values = visible.map((point) => point.value)
  const min = count > 0 ? Math.min(...values) : 0
  const max = count > 0 ? Math.max(...values) : 0
  const span = max - min || 1
  const xAt = (index: number): number => (count <= 1 ? CHART_W / 2 : (index / (count - 1)) * CHART_W)
  const yAt = (value: number): number => CHART_H - PAD - ((value - min) / span) * (CHART_H - PAD * 2)

  const plotPoints = visible.map((point, index) => ({ x: xAt(index), y: yAt(point.value) }))
  const line = smoothPath(plotPoints)
  const area = smoothAreaPath(plotPoints, CHART_H)
  const zoomed = zoom !== null && (view.end - view.start + 1) < total

  // 滚轮缩放：以光标为中心收放可见窗口（原生监听才能 preventDefault）
  useEffect(() => {
    const element = chartRef.current
    if (element === null) return
    const handleWheel = (event: WheelEvent): void => {
      if (total < 3) return
      event.preventDefault()
      const rect = element.getBoundingClientRect()
      const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
      const currentCount = view.end - view.start + 1
      const factor = event.deltaY > 0 ? 1.3 : 1 / 1.3
      const nextCount = Math.max(2, Math.min(total, Math.round(currentCount * factor)))
      if (nextCount >= total) {
        setZoom(null)
        return
      }
      const cursorIndex = view.start + ratio * (currentCount - 1)
      const start = Math.round(cursorIndex - ratio * (nextCount - 1))
      setZoom(clampView(start, start + nextCount - 1, total))
    }
    element.addEventListener('wheel', handleWheel, { passive: false })
    return () => element.removeEventListener('wheel', handleWheel)
  }, [total, view.start, view.end])

  // 阈值从管理器读（面板可改，跨会话保留）；读不到就用指标自带的默认值。
  useEffect(() => {
    void (async () => {
      try {
        setLimits((await loadTrendThresholds()).thresholds)
      } catch {
        setLimits(null)
      }
    })()
  }, [])

  // 切窗口/换指标时重置缩放和悬停，避免窗口对不上
  useEffect(() => {
    setZoom(null)
    setHover(null)
  }, [days, metric.key])

  const saveLimit = async (clear: boolean): Promise<void> => {
    const value = clear ? null : Number(draft)
    if (!clear && (draft.trim() === '' || !Number.isFinite(value) || (value as number) <= 0)) {
      setLimitError('请输入正数')
      return
    }
    try {
      const result = await saveTrendThreshold(metric.key, value)
      if (!result.ok) {
        setLimitError(result.error ?? '保存失败')
        return
      }
      if (result.thresholds !== undefined) setLimits(result.thresholds)
      setLimitOpen(false)
      setLimitError(null)
    } catch (e) {
      setLimitError(reasonOf(e))
    }
  }

  const handleMove = (event: React.MouseEvent<HTMLDivElement>): void => {
    if (count === 0) return
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    setHover(Math.round(ratio * (count - 1)))
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (total < 3) return
    dragRef.current = { x: event.clientX, start: view.start, end: view.end }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    const drag = dragRef.current
    if (drag === null) return
    const rect = chartRef.current?.getBoundingClientRect()
    if (rect === undefined) return
    const size = drag.end - drag.start + 1
    const shift = Math.round(((drag.x - event.clientX) / rect.width) * size)
    const start = Math.max(0, Math.min(total - size, drag.start + shift))
    setZoom(start === 0 && size >= total ? null : clampView(start, start + size - 1, total))
  }

  const handlePointerUp = (): void => {
    dragRef.current = null
  }

  const resetZoom = (): void => {
    setZoom(null)
    setHover(null)
  }

  const latest = count > 0 ? visible[count - 1] ?? null : null
  const first = visible[0]

  // 24h 变化：取窗口内距现在最近、且不晚于 24h 前的那个点做基准；
  // 窗口更短（例如刚攒了 2 个小时的点）时退回窗口首点，并标记「基准不足 24h」。
  const change = (() => {
    if (latest === null || count < 2) return null
    // 取距离「24 小时前」最近的那个采样点做基准；偏差超过 6 小时说明窗口里
    // 没有合适的当天基准，退回窗口首点，标签也改成「窗口」而不是谎报 24h。
    const target = Date.now() - 86400000
    let best = visible[0]!
    let bestDistance = Math.abs(parseTs(best.ts) - target)
    for (const point of visible) {
      const distance = Math.abs(parseTs(point.ts) - target)
      if (distance < bestDistance) {
        best = point
        bestDistance = distance
      }
    }
    const older = bestDistance <= 6 * 3600000
    // 没有合适的 24h 基准时，退而和上一个采样点比，标签说清楚是「较上次」。
    const base = older ? best : (visible[count - 2] ?? best)
    const delta = latest.value - base.value
    const percent = base.value === 0 ? null : (delta / base.value) * 100
    return { delta, percent, label: older ? '24h' : '较上次' }
  })()

  // 阈值线：面板里设置的值优先于指标默认值；null 表示不画。
  const configured = limits !== null && metric.key in limits ? limits[metric.key] : metric.threshold
  const threshold = configured ?? undefined
  const thresholdY = threshold === undefined ? null : Math.min(CHART_H - PAD, Math.max(PAD, yAt(threshold)))
  // 标签是胶囊（高约 18px），中心点贴线但要夹在画布内，避免半截被裁掉
  const tagY = thresholdY === null ? null : Math.min(CHART_H - 11, Math.max(11, thresholdY))
  const overThreshold = threshold !== undefined && latest !== null && latest.value > threshold
  const readout = hover !== null && visible[hover] !== undefined
    ? `${shortDate(visible[hover].ts)} · ${metric.format(visible[hover].value)}`
    : latest !== null
      ? `最新 ${metric.format(latest.value)}`
      : '暂无采样'

  const footer = (
    <>
      {zoomed && <Button size="sm" variant="ghost" onClick={resetZoom}>重置缩放</Button>}
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
      description={`${days} 天窗口 · ${count} / ${total} 个采样点 · 单位${metric.unit}`}
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
                onClick={() => setDays(range.days)}
              >
                {range.label}
              </Button>
            ))}
          </div>
          <Button size="sm" variant="ghost" onClick={() => {
            setLimitOpen((open) => !open)
            setDraft(threshold === undefined ? '' : String(threshold))
            setLimitError(null)
          }}>
            阈值
          </Button>
          <span className="bc-trend-readout">
            {change !== null && (
              <span
                className={`bc-trend-delta${(metric.badWhen === 'up' && change.delta > 0) ? ' bc-trend-delta-bad' : ''}`}
                title={change.label === '24h' ? '与 24 小时前的采样点比较' : '窗口里没有 24 小时前的点，与上一个采样点比较'}
              >
                {change.label} {change.delta > 0 ? '+' : ''}{metric.format(change.delta)}
                {change.percent === null ? '' : `（${change.percent > 0 ? '+' : ''}${change.percent.toFixed(1)}%）`}
              </span>
            )}
            {overThreshold && <span className="bc-trend-delta bc-trend-delta-bad">超告警</span>}
            {readout}
          </span>
        </div>

        {limitOpen && (
          <div className="bc-trend-limit-row">
            <span>告警线</span>
            <input
              type="number"
              min="0"
              className="bc-trend-limit-input"
              value={draft}
              placeholder={metric.threshold === undefined ? '留空 = 不画线' : String(metric.threshold)}
              onChange={(event) => setDraft(event.target.value)}
            />
            <Button size="sm" variant="ghost" onClick={() => void saveLimit(false)}>保存</Button>
            <Button size="sm" variant="ghost" onClick={() => void saveLimit(true)}>清除</Button>
            {limitError !== null && <span className="bc-index-warn">{limitError}</span>}
          </div>
        )}

        <div
          ref={chartRef}
          className="bc-trend-chart"
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDoubleClick={resetZoom}
        >
          <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} width="100%" height="170" preserveAspectRatio="none" role="img" aria-label={`${metric.label}趋势图`}>
            {count > 1 && <path d={area} className="bc-trend-area" />}
{threshold !== undefined && thresholdY !== null && (
              <line
                x1={0} x2={CHART_W} y1={thresholdY} y2={thresholdY}
                className="bc-trend-threshold" vectorEffect="non-scaling-stroke"
              />
            )}
            {count > 1 && <path d={line} className="bc-trend-line" vectorEffect="non-scaling-stroke" />}
            {hover !== null && visible[hover] !== undefined && (
              <line x1={xAt(hover)} x2={xAt(hover)} y1={0} y2={CHART_H} className="bc-trend-guide" vectorEffect="non-scaling-stroke" />
            )}
          </svg>
          {hover !== null && visible[hover] !== undefined && (
            <span
              className="bc-trend-marker"
              style={{
                left: `${(xAt(hover) / CHART_W) * 100}%`,
                top: `${(yAt(visible[hover].value) / CHART_H) * 100}%`,
              }}
            />
          )}
          {count === 1 && visible[0] !== undefined && (
            <span
              className="bc-trend-marker"
              style={{
                left: '50%',
                top: `${(yAt(visible[0].value) / CHART_H) * 100}%`,
              }}
            />
          )}
          {threshold !== undefined && thresholdY !== null && (
            <span
              className={`bc-trend-threshold-tag${overThreshold ? ' bc-trend-threshold-tag-over' : ''}`}
              style={{ top: `${((tagY ?? thresholdY) / CHART_H) * 100}%` }}
            >
              {overThreshold ? '已超告警线' : '告警线'} {metric.format(threshold)}
            </span>
          )}
        </div>

        <div className="bc-trend-axis">
          <span>{first !== undefined ? shortDate(first.ts) : '—'}</span>
          <span>{count > 0 ? `最高 ${metric.format(max)} · 最低 ${metric.format(min)}` : ''}</span>
          <span>{latest !== null ? shortDate(latest.ts) : '—'}</span>
        </div>

        {count < 2 ? (
          <div className="bc-trend-empty">
            数据不足：当前窗口只有 {count} 个采样点。管理器每小时采一次，攒两次就会有折线。
          </div>
        ) : (
          <div className="bc-trend-hint">滚轮缩放 · 拖拽平移 · 双击重置</div>
        )}
      </div>
    </Modal>
  )
}
