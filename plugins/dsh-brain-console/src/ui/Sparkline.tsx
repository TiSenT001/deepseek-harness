/**
 * 迷你趋势线：指标卡里那根 20px 高的曲线（单调三次贝塞尔平滑）。
 *
 * 只在至少两个有效采样点时渲染（一个点画不出趋势）；
 * 用 viewBox + width="100%" 自适应卡片宽度。
 */
import { smoothPath } from './smooth.ts'

export interface SparklineProps {
  /** 按时间升序的数值（已过滤掉空值） */
  values: number[]
  /** 逻辑高度（可视高度由 CSS 控制） */
  height?: number
  /** 线色，默认跟随当前文字色 */
  className?: string
}

const VIEW_WIDTH = 100

/**
 * 渲染一条迷你折线。
 * @param props - 数值序列与尺寸
 * @returns SVG 元素；点数不足时返回 null
 */
export function Sparkline({ values, height = 20, className }: SparklineProps): JSX.Element | null {
  if (values.length < 2) return null
  const padding = 2
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const step = VIEW_WIDTH / (values.length - 1)
  const points = values.map((value, index) => ({
    x: index * step,
    y: height - padding - ((value - min) / span) * (height - padding * 2),
  }))
  const path = smoothPath(points)

  return (
    <svg
      className={className === undefined ? 'bc-spark' : `bc-spark ${className}`}
      viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      role="img"
      aria-label="趋势"
    >
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
