/**
 * 单元详情：把 `/units` 里这一条的所有字段摊开，排查问题不用再猜。
 *
 * 只读；动作仍走卡片上的按钮和 ⋯ 菜单。
 */
import { Button, Modal } from './primitives.ts'
import { formatUptime } from './format.ts'
import type { Unit } from './types.ts'

export interface UnitDetailDialogProps {
  /** 该单元的当前快照 */
  unit: Unit
  /** 当前时间戳，用于运行时长 */
  now: number
  /** 依赖本单元的其它单元 */
  dependents: string[]
  onClose: () => void
}

/**
 * 渲染单元详情对话框。
 * @param props - 单元快照、时间与回调
 * @returns 对话框元素（挂载即打开）
 */
export function UnitDetailDialog({ unit, now, dependents, onClose }: UnitDetailDialogProps): JSX.Element {
  const uptime = unit.running ? formatUptime(unit.started_at, now) : null
  const rows: { label: string; value: string; mono?: boolean }[] = [
    { label: '分组', value: unit.group },
    { label: '描述', value: unit.desc },
    { label: '脚本', value: unit.script, mono: true },
    { label: '启动参数', value: (unit.args ?? []).join(' ') || '（无）', mono: true },
    { label: '端口', value: typeof unit.port === 'number' ? String(unit.port) : '（无，无端口服务）' },
    { label: '状态', value: unit.state },
    { label: 'PID', value: typeof unit.pid === 'number' ? String(unit.pid) : '—' },
    { label: '父进程', value: typeof unit.ppid === 'number' ? String(unit.ppid) : '—' },
    { label: '托管方式', value: unit.child_of_manager ? '管理器子进程' : '外部进程' },
    { label: '随管理器启动', value: unit.enabled ? '是' : '否' },
    { label: '运行时长', value: uptime ?? '—' },
    { label: '健康', value: unit.health_error ?? (unit.running ? '正常' : '—') },
    { label: '退出码', value: typeof unit.last_exit_code === 'number' ? String(unit.last_exit_code) : '—' },
    { label: '依赖', value: (unit.depends ?? []).join('、') || '（无）' },
    { label: '被依赖', value: dependents.join('、') || '（无）' },
  ]

  const footer = <Button size="sm" variant="ghost" onClick={onClose}>关闭</Button>

  return (
    <Modal
      open
      onClose={onClose}
      title={unit.name}
      closeLabel="关闭"
      description={unit.desc}
      footer={footer}
    >
      <dl className="bc-detail-list">
        {rows.map((row) => (
          <div key={row.label} className="bc-detail-row">
            <dt className="bc-detail-label">{row.label}</dt>
            <dd className={row.mono === true ? 'bc-detail-value bc-detail-mono' : 'bc-detail-value'}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </Modal>
  )
}
