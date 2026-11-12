/**
 * 依赖关系拓扑：把 `/units` 里的 depends 画成图。
 *
 * 按分组纵向排列节点，箭头从「被依赖的单元」指向「依赖它的单元」；
 * 悬停边或底部依赖行会高亮对应边与两端节点；支持放大/缩小/重置（viewBox）。
 * 点击节点打开该单元的详情。
 */
import { useState } from 'react'
import { Button } from './primitives.ts'
import { Dialog } from './Dialog.tsx'
import type { Unit } from './types.ts'

export interface DependencyDialogProps {
  /** 当前单元列表（含 depends） */
  units: Unit[]
  /** 点击节点时打开单元详情 */
  onOpenUnit: (name: string) => void
  /** 关闭对话框 */
  onClose: () => void
}

const NODE_W = 150
const NODE_H = 30
const COL_W = 190
const ROW_H = 44
const PAD = 20
const ZOOM_MIN = 0.6
const ZOOM_MAX = 3
const ZOOM_STEP = 0.25

/** 把缩放值夹在允许范围内。 */
function clampZoom(value: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value * 100) / 100))
}

/**
 * 渲染依赖关系对话框。
 * @param props - 单元列表、节点点击回调与关闭回调
 * @returns 对话框元素
 */
export function DependencyDialog({ units, onOpenUnit, onClose }: DependencyDialogProps): JSX.Element {
  const [zoom, setZoom] = useState(1)
  const [activeEdge, setActiveEdge] = useState<number | null>(null)
  const [hoverNode, setHoverNode] = useState<string | null>(null)

  const groups = Array.from(new Set(units.map((unit) => unit.group)))
  const layouts = new Map<string, { x: number; y: number }>()
  for (const [column, group] of groups.entries()) {
    units
      .filter((unit) => unit.group === group)
      .forEach((unit, row) => layouts.set(unit.name, { x: PAD + column * COL_W, y: PAD + row * ROW_H }))
  }
  const edges = units.flatMap((unit) =>
    (unit.depends ?? [])
      .filter((dependency) => layouts.has(dependency))
      .map((dependency) => ({ from: dependency, to: unit.name })))
  const rows = Math.max(1, ...groups.map((group) => units.filter((unit) => unit.group === group).length))
  const width = PAD * 2 + Math.max(1, groups.length) * COL_W
  const height = PAD * 2 + rows * ROW_H

  const nodeEdgeIndexes = hoverNode === null
    ? []
    : edges.map((edge, index) => (edge.from === hoverNode || edge.to === hoverNode ? index : -1)).filter((index) => index >= 0)
  const isEdgeActive = (index: number): boolean => activeEdge === index || nodeEdgeIndexes.includes(index)
  const activeNodeNames = new Set<string>()
  if (activeEdge !== null) {
    const edge = edges[activeEdge]
    if (edge !== undefined) {
      activeNodeNames.add(edge.from)
      activeNodeNames.add(edge.to)
    }
  }

  const vbWidth = width / zoom
  const vbHeight = height / zoom
  const viewBox = `${(width - vbWidth) / 2} ${(height - vbHeight) / 2} ${vbWidth} ${vbHeight}`

  return (
    <Dialog
      open
      onClose={onClose}
      title="依赖关系"
      closeLabel="关闭"
      description="箭头指向依赖方（A 依赖 B 时画 B → A）；悬停边/下方清单可高亮，点击节点查看详情"
      footer={<Button size="sm" variant="ghost" onClick={onClose}>关闭</Button>}
    >
      <div className="bc-dependency">
        {units.length === 0 ? (
          <div className="bc-backup-empty">没有单元数据。</div>
        ) : (
          <>
            <div className="bc-dep-zoom">
              <Button size="sm" variant="ghost" aria-label="缩小" onClick={() => setZoom((value) => clampZoom(value - ZOOM_STEP))}>
                缩小
              </Button>
              <span className="bc-dep-zoom-value">{zoom.toFixed(2)}×</span>
              <Button size="sm" variant="ghost" aria-label="放大" onClick={() => setZoom((value) => clampZoom(value + ZOOM_STEP))}>
                放大
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setZoom(1)}>重置</Button>
            </div>
            <svg
              className="bc-dep-graph"
              viewBox={viewBox}
              width="100%"
              role="img"
              aria-label="服务依赖图"
            >
              <defs>
                <marker id="bc-dep-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="currentColor" />
                </marker>
              </defs>
              {edges.map((edge, index) => {
                const from = layouts.get(edge.from)
                const to = layouts.get(edge.to)
                if (from === undefined || to === undefined) return null
                const x1 = from.x + NODE_W
                const y1 = from.y + NODE_H / 2
                const x2 = to.x
                const y2 = to.y + NODE_H / 2
                const bend = Math.max(24, Math.abs(x2 - x1) / 2)
                const d = `M${x1},${y1} C${x1 + bend},${y1} ${x2 - bend},${y2} ${x2},${y2}`
                return (
                  <g key={`${edge.from}-${edge.to}-${index}`}>
                    <path
                      className="bc-dep-edge"
                      data-active={isEdgeActive(index) || undefined}
                      d={d}
                      markerEnd="url(#bc-dep-arrow)"
                    />
                    <path
                      className="bc-dep-edge-hit"
                      data-index={index}
                      d={d}
                      onMouseEnter={() => setActiveEdge(index)}
                      onMouseLeave={() => setActiveEdge(null)}
                    />
                  </g>
                )
              })}
              {groups.map((group, column) => (
                <text key={group} className="bc-dep-group" x={PAD + column * COL_W} y={12}>{group}</text>
              ))}
              {units.map((unit) => {
                const position = layouts.get(unit.name)
                if (position === undefined) return null
                const label = unit.name.length > 18 ? `${unit.name.slice(0, 17)}…` : unit.name
                const active = activeNodeNames.has(unit.name) || hoverNode === unit.name
                return (
                  <g
                    key={unit.name}
                    className="bc-dep-node"
                    data-running={unit.running ? 'true' : 'false'}
                    data-active={active || undefined}
                    transform={`translate(${position.x},${position.y})`}
                    role="button"
                    tabIndex={0}
                    onMouseEnter={() => setHoverNode(unit.name)}
                    onMouseLeave={() => setHoverNode(null)}
                    onClick={() => onOpenUnit(unit.name)}
                    onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onOpenUnit(unit.name) }}
                  >
                    <rect width={NODE_W} height={NODE_H} rx="7" />
                    <text x="10" y="19">{label}</text>
                  </g>
                )
              })}
            </svg>
            <div className="bc-dep-list">
              {edges.length === 0 && <div className="bc-index-note">这些单元没有声明 depends。</div>}
              {edges.slice(0, 60).map((edge, index) => (
                <div
                  className="bc-dep-row"
                  key={`${edge.from}-${edge.to}-row-${index}`}
                  data-active={activeEdge === index || undefined}
                  onMouseEnter={() => setActiveEdge(index)}
                  onMouseLeave={() => setActiveEdge(null)}
                >
                  <span className="bc-dep-from">{edge.from}</span>
                  <span className="bc-dep-arrow">→</span>
                  <span className="bc-dep-to">{edge.to}</span>
                  <span className="bc-dep-note">{edge.to} 依赖 {edge.from}</span>
                </div>
              ))}
            </div>
            <div className="bc-index-note">
              {units.length} 个单元 · {edges.length} 条依赖 · {groups.length} 个分组
            </div>
          </>
        )}
      </div>
    </Dialog>
  )
}
