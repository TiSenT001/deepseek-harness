/**
 * 趋势曲线的平滑路径：单调三次贝塞尔（Fritsch–Carlson 斜率约束）。
 *
 * 为什么不用 Catmull-Rom：它会在数据单调的区间里「过冲」，把缓慢上升的一周画成
 * 先涨后跌的小鼓包，趋势图会撒谎。这里对每个点的切线做单调性约束，保证两个采样点
 * 之间曲线不发生额外拐弯。
 */

/** 一个采样点，按 x 升序传入。 */
export interface SmoothPoint {
  readonly x: number
  readonly y: number
}

/** 统一保留一位小数，减小 path 体积。 */
function fmt(value: number): string {
  return value.toFixed(1)
}

/**
 * 生成平滑折线的 SVG path。
 * @param points - 按 x 升序的采样点（至少 1 个）
 * @returns `M … C …` 形式的 path；点不足时退化成直线段
 */
export function smoothPath(points: readonly SmoothPoint[]): string {
  const count = points.length
  if (count === 0) return ''
  const first = points[0]!
  if (count === 1) return `M ${fmt(first.x)} ${fmt(first.y)}`
  const second = points[1]!
  if (count === 2) return `M ${fmt(first.x)} ${fmt(first.y)} L ${fmt(second.x)} ${fmt(second.y)}`

  const dx: number[] = []
  const slope: number[] = []
  for (let index = 0; index < count - 1; index += 1) {
    const left = points[index]!
    const right = points[index + 1]!
    const width = right.x - left.x
    dx.push(width)
    slope.push(width === 0 ? 0 : (right.y - left.y) / width)
  }

  // 端点切线取相邻区间斜率，内部点用 Fritsch–Carlson 加权调和平均。
  const tangent: number[] = new Array<number>(count).fill(0)
  tangent[0] = slope[0] ?? 0
  tangent[count - 1] = slope[count - 2] ?? 0
  for (let index = 1; index < count - 1; index += 1) {
    const previous = slope[index - 1] ?? 0
    const next = slope[index] ?? 0
    if (previous * next <= 0) {
      // 极值点：切线置零，曲线在该点变平，避免越过数据范围。
      tangent[index] = 0
      continue
    }
    const w1 = 2 * (dx[index] ?? 0) + (dx[index - 1] ?? 0)
    const w2 = (dx[index] ?? 0) + 2 * (dx[index - 1] ?? 0)
    tangent[index] = (w1 + w2) / (w1 / previous + w2 / next)
  }

  let path = `M ${fmt(first.x)} ${fmt(first.y)}`
  for (let index = 0; index < count - 1; index += 1) {
    const left = points[index]!
    const right = points[index + 1]!
    const width = dx[index] ?? 0
    const c1x = left.x + width / 3
    const c1y = left.y + ((tangent[index] ?? 0) * width) / 3
    const c2x = right.x - width / 3
    const c2y = right.y - ((tangent[index + 1] ?? 0) * width) / 3
    path += ` C ${fmt(c1x)} ${fmt(c1y)}, ${fmt(c2x)} ${fmt(c2y)}, ${fmt(right.x)} ${fmt(right.y)}`
  }
  return path
}

/**
 * 面积填充路径：平滑曲线 + 回落到基线闭合。
 * @param points - 采样点（按 x 升序）
 * @param baseline - 基线 y（通常图表底部）
 * @returns 闭合的 SVG path
 */
export function smoothAreaPath(points: readonly SmoothPoint[], baseline: number): string {
  if (points.length === 0) return ''
  const first = points[0]!
  const last = points[points.length - 1]!
  return `${smoothPath(points)} L ${fmt(last.x)} ${fmt(baseline)} L ${fmt(first.x)} ${fmt(baseline)} Z`
}
