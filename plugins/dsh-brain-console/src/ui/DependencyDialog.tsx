/**
 * 依赖关系拓扑：把 `/units` 里的 depends 画成图。
 *
 * 按分组纵向排列节点，箭头从「被依赖的单元」指向「依赖它的单元」；
 * 点击节点打开该单元的详情。底部另给一份依赖边清单，便于精确阅读。
 */
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

/**
 * 渲染依赖关系对话框。
 * @param props - 单元列表、节点点击回调与关闭回调
 * @returns 对话框元素
 */
export function DependencyDialog({ units, onOpenUnit, onClose }: DependencyDialogProps): JSX.Element {
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

  return (
    <Dialog
      open
      onClose={onClose}
      title="依赖关系"
      closeLabel="关闭"
      description="箭头指向依赖方（A 依赖 B 时画 B → A）；点击节点查看单元详情"
      footer={<Button size="sm" variant="ghost" onClick={onClose}>关闭</Button>}
    >
      <div className="bc-dependency">
        {units.length === 0 ? (
          <div className="bc-backup-empty">没有单元数据。</div>
        ) : (
          <>
            <svg
              className="bc-dep-graph"
              viewBox={`0 0 ${width} ${height}`}
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
                return (
                  <path
                    key={`${edge.from}-${edge.to}-${index}`}
                    className="bc-dep-edge"
                    d={`M${x1},${y1} C${x1 + bend},${y1} ${x2 - bend},${y2} ${x2},${y2}`}
                    markerEnd="url(#bc-dep-arrow)"
                  />
                )
              })}
              {groups.map((group, column) => (
                <text key={group} className="bc-dep-group" x={PAD + column * COL_W} y={12}>{group}</text>
              ))}
              {units.map((unit) => {
                const position = layouts.get(unit.name)
                if (position === undefined) return null
                const label = unit.name.length > 18 ? `${unit.name.slice(0, 17)}…` : unit.name
                return (
                  <g
                    key={unit.name}
                    className="bc-dep-node"
                    data-running={unit.running ? 'true' : 'false'}
                    transform={`translate(${position.x},${position.y})`}
                    role="button"
                    tabIndex={0}
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
                <div className="bc-dep-row" key={`${edge.from}-${edge.to}-row-${index}`}>
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
