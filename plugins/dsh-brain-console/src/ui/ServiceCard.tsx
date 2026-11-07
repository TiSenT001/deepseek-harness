/**
 * 单个受管单元卡片：状态灯 + 名称 + 端口 + 描述 + 运行信息 + 图标操作。
 *
 * 纯展示组件，不自己发请求；启停与日志由页面统一下发，状态以管理器回报为准。
 */
import { IconButton } from './IconButton.tsx'
import { IconList, IconPlay, IconRefresh, IconStop, StateDot, type SharedStateDotState } from './primitives.ts'
import { formatUptime } from './format.ts'
import { UnitMenu } from './UnitMenu.tsx'
import type { Unit, UnitAction } from './types.ts'

const STATE_DOT: Record<string, SharedStateDotState> = {
  运行中: 'done',
  已停止: 'idle',
  异常: 'error',
}

export interface ServiceCardProps {
  /** 该卡片展示的单元 */
  unit: Unit
  /** 当前毫秒时间戳，用于计算运行时长 */
  now: number
  /** 本单元正在执行的动作；没有则为 null */
  busyAction: UnitAction | null
  /** 是否有动作在执行（含其他单元或备份） */
  disabled: boolean
  /** 该单元的日志面板是否已打开 */
  logOpen: boolean
  /** 切换日志面板 */
  onLog: (name: string) => void
  /** 下发启停动作 */
  onAction: (name: string, action: UnitAction) => void
  /** 切换「随管理器启动」 */
  onToggleEnabled: (name: string, enabled: boolean) => void
  /** 接管为管理器子进程 */
  onAdopt: (name: string) => void
}

/**
 * 渲染一张单元卡片。
 * @param props - 单元快照与回调
 * @returns 卡片元素
 */
export function ServiceCard({
  unit, now, busyAction, disabled, logOpen, onLog, onAction, onToggleEnabled, onAdopt,
}: ServiceCardProps): JSX.Element {
  const details: string[] = []
  if (unit.running) {
    const uptime = formatUptime(unit.started_at, now)
    if (uptime !== null) details.push(`已运行 ${uptime}`)
    if (typeof unit.pid === 'number') details.push(`pid ${unit.pid}`)
    if (unit.child_of_manager === false) details.push('外部进程')
  } else {
    details.push(unit.enabled ? '随管理器启动' : '不自动启动')
  }

  return (
    <article className="bc-card">
      <div className="bc-card-top">
        <StateDot state={STATE_DOT[unit.state] ?? 'warning'} />
        <span className="bc-name">{unit.name}</span>
        {unit.port !== null && <span className="bc-port">:{unit.port}</span>}
        <span className="bc-spacer" />
        <div className="bc-actions">
          <IconButton
            label={logOpen ? '收起日志' : '查看日志'}
            icon={IconList}
            disabled={disabled}
            active={logOpen}
            onClick={() => onLog(unit.name)}
          />
          {unit.running ? (
            <>
              <IconButton
                label="重启"
                icon={IconRefresh}
                disabled={disabled}
                busy={busyAction === 'restart'}
                onClick={() => onAction(unit.name, 'restart')}
              />
              <IconButton
                label="停止"
                icon={IconStop}
                danger
                disabled={disabled}
                busy={busyAction === 'stop'}
                onClick={() => onAction(unit.name, 'stop')}
              />
            </>
          ) : (
            <IconButton
              label="启动"
              icon={IconPlay}
              disabled={disabled}
              busy={busyAction === 'start'}
              onClick={() => onAction(unit.name, 'start')}
            />
          )}
          <UnitMenu
            unit={unit}
            disabled={disabled}
            onToggleEnabled={onToggleEnabled}
            onAdopt={onAdopt}
          />
        </div>
      </div>
      <div className="bc-desc">{unit.desc}</div>
      <div className="bc-meta">
        <span className="bc-meta-state" data-abnormal={unit.state === '异常'}>{unit.state}</span>
        {details.length > 0 && <span className="bc-meta-detail">· {details.join(' · ')}</span>}
      </div>
    </article>
  )
}
