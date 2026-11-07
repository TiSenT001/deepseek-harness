/**
 * 一个分组：标题行（运行计数 + 全部启动/重启/停止）+ 该组的单元卡片。
 */
import { IconButton } from './IconButton.tsx'
import { Button, IconPlay, IconRefresh, IconStop } from './primitives.ts'
import { ServiceCard } from './ServiceCard.tsx'
import type { Unit, UnitAction } from './types.ts'
import { busyActionOf } from '../api.ts'

export interface UnitSectionProps {
  group: string
  members: Unit[]
  now: number
  /** 有动作进行中时的动作键（`<name>:<action>` / `group:<g>` / `stop-group:<g>` …） */
  busy: string | null
  /** 正在看日志的单元名 */
  logName: string | null
  /** 依赖关系反查：单元名 → 依赖它的单元名 */
  dependents: Record<string, string[]>
  onLog: (name: string) => void
  onAction: (name: string, action: UnitAction) => void
  /** 启动该分组里所有已停止的单元 */
  onStartAll: (group: string) => void
  /** 停止该分组里所有正在运行的单元（先确认） */
  onStopAll: (group: string) => void
  /** 重启该分组里所有正在运行的单元（先确认） */
  onRestartAll: (group: string) => void
  /** 切换单个单元的「随管理器启动」 */
  onToggleEnabled: (name: string, enabled: boolean) => void
  /** 把单个外部进程接管为管理器子进程 */
  onAdopt: (name: string) => void
  /** 打开单个单元的详情 */
  onDetail: (name: string) => void
}

/**
 * 渲染一个服务分组。
 * @param props - 分组、成员与回调
 * @returns 分组元素
 */
export function UnitSection({
  group, members, now, busy, logName, dependents, onLog, onAction,
  onStartAll, onStopAll, onRestartAll, onToggleEnabled, onAdopt, onDetail,
}: UnitSectionProps): JSX.Element {
  const running = members.filter((unit) => unit.running).length
  const stopped = members.length - running
  const abnormal = members.filter((unit) => unit.state !== '运行中' && unit.state !== '已停止').length
  return (
    <section className="bc-section">
      <div className="bc-section-head">
        <span className="bc-section-name">{group}</span>
        <span className="bc-section-count">{running} / {members.length} 运行</span>
        {stopped > 0 && (
          <IconButton
            label="全部启动"
            icon={IconPlay}
            disabled={busy !== null}
            busy={busy === `group:${group}`}
            onClick={() => onStartAll(group)}
          />
        )}
        {running > 0 && (
          <IconButton
            label="全部重启"
            icon={IconRefresh}
            disabled={busy !== null}
            busy={busy === `restart-group:${group}`}
            onClick={() => onRestartAll(group)}
          />
        )}
        {running > 0 && (
          <IconButton
            label="全部停止"
            icon={IconStop}
            danger
            disabled={busy !== null}
            busy={busy === `stop-group:${group}`}
            onClick={() => onStopAll(group)}
          />
        )}
        {abnormal > 0 && <span className="bc-section-warn">{abnormal} 个异常</span>}
        <span className="bc-rule" />
      </div>
      <div className="bc-grid">
        {members.map((unit) => (
          <ServiceCard
            key={unit.name}
            unit={unit}
            now={now}
            busyAction={busyActionOf(busy, unit.name)}
            disabled={busy !== null}
            logOpen={logName === unit.name}
            dependents={dependents[unit.name] ?? []}
            onLog={onLog}
            onAction={onAction}
            onToggleEnabled={onToggleEnabled}
            onAdopt={onAdopt}
            onDetail={onDetail}
          />
        ))}
      </div>
    </section>
  )
}
