/**
 * 指标定义：指标带和趋势图共用一份（标签、单位、格式化）。
 */
import { formatCount, formatMegabytes } from './format.ts'

/** 有采样序列的指标键（与 `/status/history` 的字段一致）。 */
export type MetricKey = 'db_size_mb' | 'edges' | 'notes' | 'sessions' | 'failure_edges'

export interface MetricSpec {
  key: MetricKey
  /** 指标带上的标题 */
  label: string
  /** 单位提示，用于趋势图的描述行 */
  unit: string
  /** 数值格式化 */
  format: (value: number) => string
}

/** 指标顺序与指标带一致。 */
export const METRICS: readonly MetricSpec[] = [
  { key: 'db_size_mb', label: '数据库', unit: 'MB', format: (value) => formatMegabytes(value) },
  { key: 'edges', label: '知识边', unit: '条', format: (value) => formatCount(value) },
  { key: 'notes', label: '笔记', unit: '篇', format: (value) => formatCount(value) },
  { key: 'sessions', label: '记忆', unit: '条', format: (value) => formatCount(value) },
  { key: 'failure_edges', label: '失败边', unit: '条', format: (value) => formatCount(value) },
]

/** 按 key 取指标定义。 */
export function metricSpec(key: MetricKey): MetricSpec {
  const found = METRICS.find((spec) => spec.key === key)
  if (found === undefined) throw new Error(`unknown metric: ${key}`)
  return found
}
