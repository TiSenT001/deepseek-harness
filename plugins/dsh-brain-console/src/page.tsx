/**
 * ConsolePage — TiSenT Brain 面板（大脑各项服务的查看与人工启停）。
 *
 * 数据源是独立进程 `brain_manager`（127.0.0.1:19998）。本页面**只做展示与下发**，
 * 不推断状态：每次操作后重新拉 /units，以管理器返回为准（避免 UI 和实际不一致）。
 *
 * 布局：
 *   1) 标题行 —— 运行计数、最后刷新、刷新图标与「更多」菜单（备份 / 清理 / 开机启动）
 *   2) 概览指标带 —— 只读观察值（库大小/边/笔记/记忆/失败边/上次备份）
 *   3) 分组卡片 —— 状态灯 + 名称/端口/说明/运行信息 + 图标操作（日志/启停）
 *   4) 底部日志控制台 —— 常驻面板，不遮挡卡片
 */
import { useCallback, useEffect, useState } from 'react'
import { BrainConsoleIcon } from './icon.tsx'
import { BackupDialog } from './ui/BackupDialog.tsx'
import { CacheDialog } from './ui/CacheDialog.tsx'
import { ConfirmDialog } from './ui/ConfirmDialog.tsx'
import { FailedEdgesDialog } from './ui/FailedEdgesDialog.tsx'
import { GroupActionDialog } from './ui/GroupActionDialog.tsx'
import { formatClock } from './ui/format.ts'
import { IconButton } from './ui/IconButton.tsx'
import { LogDock } from './ui/LogDock.tsx'
import { MoreMenu } from './ui/MoreMenu.tsx'
import { Button, IconPlay, IconRefresh, IconStop, StateDot, Tooltip } from './ui/primitives.ts'
import { ServiceCard } from './ui/ServiceCard.tsx'
import { OverviewTiles } from './ui/StatTiles.tsx'
import { TrendDialog } from './ui/TrendDialog.tsx'
import { UnitDetailDialog } from './ui/UnitDetailDialog.tsx'
import { metricSpec, type MetricKey } from './ui/metrics.ts'
import { ensureConsoleStyles } from './ui/styles.ts'
import type {
  BackupListing, BatchRestartResult, BatchStartResult, BatchStopResult, CacheListing, CachePruneResult,
  FailedEdgesListing, HistoryListing, Overview, PruneResult, Unit, UnitAction,
} from './ui/types.ts'

ensureConsoleStyles()

/** brain_manager 的 HTTP 地址。 */
const API = 'http://127.0.0.1:19998'

/** 自动刷新间隔（毫秒）。 */
const POLL_MS = 5000

/** 日志读取行数。 */
/** 日志一次读取的行数档位（点「N 行」循环）。 */
const LOG_LINE_OPTIONS = [120, 300, 1000] as const

/** 日志面板打开时的静默刷新间隔（毫秒）。 */
const LOG_POLL_MS = 4000

/** 日志面板的一次读取结果。 */
interface LogState {
  name: string
  text: string
  at: string
  loading: boolean
}

const ACTION_LABEL: Record<UnitAction, string> = { start: '启动', stop: '停止', restart: '重启' }

async function jget<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as T
}

async function postManager(path: string, body?: unknown): Promise<void> {
  await postJson<unknown>(path, body)
}

/** POST 并解析 JSON 应答（清理备份要读回删了哪些、释放多少）。 */
async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as T
}

/** 备份对话框的回调做成模块级常量：引用稳定，对话框只在挂载时拉一次列表。 */
const loadBackups = (): Promise<BackupListing> => jget<BackupListing>('/actions/backups')
const pruneBackups = (keep: number): Promise<PruneResult> =>
  postJson<PruneResult>('/actions/prune-backups', { keep })
/** 失败边明细：KPI 点开时读一次实时清单。 */
const loadFailedEdges = (): Promise<FailedEdgesListing> =>
  jget<FailedEdgesListing>('/quality/failed-edges?limit=80')
/** 指标趋势：一次取满一年，对话框里再按 7/30/90/365 天切窗口。 */
const loadHistory = (): Promise<HistoryListing> => jget<HistoryListing>('/status/history?days=365')

/** 缓存对话框的回调同样模块级（引用稳定）。 */
const loadCaches = (): Promise<CacheListing> => jget<CacheListing>('/actions/caches')
const pruneCaches = (ids: string[]): Promise<CachePruneResult> =>
  postJson<CachePruneResult>('/actions/caches/prune', { ids })

/** 把未知异常收敛成一句话；浏览器 fetch 的网络失败只有 TypeError，换成中文便于阅读。 */
function reasonOf(error: unknown): string {
  if (error instanceof TypeError) return '连接被拒绝或超时'
  return error instanceof Error ? error.message : String(error)
}

/** 从 `<name>:<action>` 里取出正在执行的动作；不属于该单元则为 null。 */
function busyActionOf(busy: string | null, name: string): UnitAction | null {
  if (busy === null) return null
  const [unit, action] = busy.split(':')
  if (unit !== name) return null
  return action === 'start' || action === 'stop' || action === 'restart' ? action : null
}

interface UnitSectionProps {
  group: string
  members: Unit[]
  now: number
  busy: string | null
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

function UnitSection({
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

export function ConsolePage(): JSX.Element {
  const [units, setUnits] = useState<Unit[]>([])
  const [overview, setOverview] = useState<Overview | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [log, setLog] = useState<LogState | null>(null)
  const [logLines, setLogLines] = useState<number>(LOG_LINE_OPTIONS[0])
  const [logPaused, setLogPaused] = useState(false)
  const [clearLogOpen, setClearLogOpen] = useState(false)
  const [detailName, setDetailName] = useState<string | null>(null)
  const [autostart, setAutostart] = useState<{ supported: boolean; enabled: boolean } | null>(null)
  const [backupOpen, setBackupOpen] = useState(false)
  const [cacheOpen, setCacheOpen] = useState(false)
  const [failedOpen, setFailedOpen] = useState(false)
  const [history, setHistory] = useState<HistoryListing | null>(null)
  const [trend, setTrend] = useState<MetricKey | null>(null)
  const [stopGroup, setStopGroup] = useState<{ group: string; names: string[] } | null>(null)
  const [restartGroup, setRestartGroup] = useState<{ group: string; names: string[] } | null>(null)

  // 趋势采样一天一条，不进 5 秒轮询：挂载时和手动刷新时各取一次
  const refreshHistory = useCallback(async (): Promise<void> => {
    try {
      setHistory(await loadHistory())
    } catch {
      // 历史取不到不影响主面板，指标卡退化成纯数值
    }
  }, [])

  const load = useCallback(async (manual = false): Promise<void> => {
    if (manual) setRefreshing(true)
    try {
      const [unitsAnswer, status, boot] = await Promise.all([
        jget<{ units: Unit[] }>('/units'),
        jget<Overview>('/status'),
        jget<{ supported: boolean; enabled: boolean }>('/autostart').catch(() => null),
      ])
      setUnits(unitsAnswer.units)
      setOverview(status)
      setAutostart(boot)
      setConnectionError(null)
      setUpdatedAt(formatClock(Date.now()))
      if (manual) void refreshHistory()
    } catch (error) {
      setConnectionError(reasonOf(error))
    } finally {
      setLoaded(true)
      if (manual) setRefreshing(false)
    }
  }, [refreshHistory])

  useEffect(() => {
    void load()
    void refreshHistory()
    const timer = setInterval(() => void load(), POLL_MS)
    return () => clearInterval(timer)
  }, [load, refreshHistory])

  const readLog = useCallback(async (name: string, silent = false, lines = logLines): Promise<void> => {
    if (!silent) {
      setLog((previous) => previous?.name === name
        ? { ...previous, loading: true }
        : { name, text: '', at: '', loading: true })
    }
    try {
      const answer = await jget<{ log: string }>(`/units/${name}/log?lines=${lines}`)
      // 轮询回来时面板可能已经关了或换了单元：只更新还开着的那一个，避免它自己弹回来
      setLog((previous) => previous !== null && previous.name === name
        ? { name, text: answer.log || '（暂无日志）', at: formatClock(Date.now()), loading: false }
        : previous)
    } catch (error) {
      // 静默轮询失败保留上一次内容，不把面板刷成错误
      if (silent) return
      setLog((previous) => previous !== null && previous.name === name
        ? { name, text: `读取失败：${reasonOf(error)}`, at: formatClock(Date.now()), loading: false }
        : previous)
    }
  }, [logLines])

  // 日志面板开着时静默跟随：4 秒一次，不打断用户向上翻看；暂停时完全停
  const logName = log?.name ?? null
  useEffect(() => {
    if (logName === null || logPaused) return
    const timer = setInterval(() => { void readLog(logName, true) }, LOG_POLL_MS)
    return () => clearInterval(timer)
  }, [logName, logPaused, readLog])

  const toggleLog = (name: string): void => {
    if (log?.name === name) {
      setLog(null)
      return
    }
    setLogPaused(false)
    void readLog(name)
  }

  const cycleLogLines = (): void => {
    const current = LOG_LINE_OPTIONS.indexOf(logLines as (typeof LOG_LINE_OPTIONS)[number])
    const next = LOG_LINE_OPTIONS[(current + 1) % LOG_LINE_OPTIONS.length] ?? LOG_LINE_OPTIONS[0]
    setLogLines(next)
    if (log !== null) void readLog(log.name, true, next)
  }

  // 清空日志：先确认再截断；在跑的进程会从空文件继续写，所以截断后立刻重读
  const clearLogNow = async (): Promise<void> => {
    if (log === null) return
    setBusy('clear-log')
    setActionError(null)
    try {
      await postManager(`/units/${log.name}/truncate-log`)
      await readLog(log.name, true)
    } catch (error) {
      setActionError(`${log.name} 日志清空失败：${reasonOf(error)}`)
    } finally {
      setBusy(null)
      setClearLogOpen(false)
    }
  }

  const act = async (name: string, action: UnitAction): Promise<void> => {
    setBusy(`${name}:${action}`)
    setActionError(null)
    try {
      await postManager(`/units/${name}/${action}`)
      await load()
      if (log?.name === name) await readLog(name)
    } catch (error) {
      setActionError(`${name} ${ACTION_LABEL[action]}失败：${reasonOf(error)}`)
    } finally {
      setBusy(null)
    }
  }

  // 分组批量启动：优先走管理器侧批量接口（一次请求、服务端顺序下发）；
  // 老版本管理器没有该路由（404）时退回逐个下发，面板不必等服务端升级。
  const startGroup = async (group: string): Promise<void> => {
    const targets = units.filter((unit) => unit.group === group && !unit.running)
    if (targets.length === 0) return
    setBusy(`group:${group}`)
    setActionError(null)
    const failures: string[] = []
    try {
      const batch = await postJson<BatchStartResult>('/units/start-batch', { group }).catch((error: unknown) => {
        if (error instanceof Error && error.message === 'HTTP 404') return null
        throw error
      })
      if (batch === null) {
        for (const unit of targets) {
          try {
            await postManager(`/units/${unit.name}/start`)
          } catch (error) {
            failures.push(`${unit.name}：${reasonOf(error)}`)
          }
        }
      } else {
        for (const item of batch.failed) failures.push(`${item.name}：${item.error}`)
      }
      await load()
    } catch (error) {
      setActionError(`${group}批量启动失败：${reasonOf(error)}`)
      return
    } finally {
      setBusy(null)
    }
    if (failures.length > 0) setActionError(`${group}有 ${failures.length} 个没启动：${failures.join('；')}`)
  }

  // 分组批量停止：同样先走管理器侧批量接口，老版本管理器 404 时退回逐个下发
  const stopGroupNow = async (group: string, names: string[]): Promise<void> => {
    setBusy(`stop-group:${group}`)
    setActionError(null)
    const failures: string[] = []
    try {
      const batch = await postJson<BatchStopResult>('/units/stop-batch', { group }).catch((error: unknown) => {
        if (error instanceof Error && error.message === 'HTTP 404') return null
        throw error
      })
      if (batch === null) {
        for (const name of names) {
          try {
            await postManager(`/units/${name}/stop`)
          } catch (error) {
            failures.push(`${name}：${reasonOf(error)}`)
          }
        }
      } else {
        for (const item of batch.failed) failures.push(`${item.name}：${item.error}`)
      }
      await load()
    } catch (error) {
      setActionError(`${group}批量停止失败：${reasonOf(error)}`)
      return
    } finally {
      setBusy(null)
      setStopGroup(null)
    }
    if (failures.length > 0) setActionError(`${group}有 ${failures.length} 个没停下来：${failures.join('；')}`)
  }

  // 分组批量重启：同样先走管理器侧批量接口，老版本管理器 404 时退回逐个重启
  const restartGroupNow = async (group: string, names: string[]): Promise<void> => {
    setBusy(`restart-group:${group}`)
    setActionError(null)
    const failures: string[] = []
    try {
      const batch = await postJson<BatchRestartResult>('/units/restart-batch', { group }).catch((error: unknown) => {
        if (error instanceof Error && error.message === 'HTTP 404') return null
        throw error
      })
      if (batch === null) {
        for (const name of names) {
          try {
            await postManager(`/units/${name}/restart`)
          } catch (error) {
            failures.push(`${name}：${reasonOf(error)}`)
          }
        }
      } else {
        for (const item of batch.failed) failures.push(`${item.name}：${item.error}`)
      }
      await load()
      if (log !== null && names.includes(log.name)) await readLog(log.name, true)
    } catch (error) {
      setActionError(`${group}批量重启失败：${reasonOf(error)}`)
      return
    } finally {
      setBusy(null)
      setRestartGroup(null)
    }
    if (failures.length > 0) setActionError(`${group}有 ${failures.length} 个没重启：${failures.join('；')}`)
  }

  // 单元级设置：随管理器启动（只改持久意愿，不立即起停）
  const setUnitEnabled = async (name: string, enabled: boolean): Promise<void> => {
    setBusy(`${name}:enabled`)
    setActionError(null)
    try {
      await postManager(`/units/${name}/enabled`, { enabled })
      await load()
    } catch (error) {
      setActionError(`${name} 设置失败：${reasonOf(error)}`)
    } finally {
      setBusy(null)
    }
  }

  // 接管：把外部进程重启为管理器直接子进程（会中断一次）
  const adoptUnit = async (name: string): Promise<void> => {
    setBusy(`${name}:adopt`)
    setActionError(null)
    try {
      await postManager(`/units/${name}/adopt`)
      await load()
    } catch (error) {
      setActionError(`${name} 接管失败：${reasonOf(error)}`)
    } finally {
      setBusy(null)
    }
  }

  // 开机启动开关（写 HKCU Run；管理器下次登录自启并按上次状态恢复服务）
  const toggleAutostart = async (): Promise<void> => {
    if (autostart === null || !autostart.supported) return
    setBusy('autostart')
    setActionError(null)
    try {
      await postManager('/autostart', { enabled: !autostart.enabled })
      await load()
    } catch (error) {
      setActionError(`开机启动设置失败：${reasonOf(error)}`)
    } finally {
      setBusy(null)
    }
  }

  const backup = async (): Promise<void> => {
    setBusy('backup')
    setActionError(null)
    try {
      await postManager('/actions/backup')
      await load()
    } catch (error) {
      setActionError(`备份失败：${reasonOf(error)}`)
    } finally {
      setBusy(null)
    }
  }

  // 管理器没跑时，由 DSH 宿主代为拉起（浏览器无法 spawn 进程）
  const startManager = async (): Promise<void> => {
    setBusy('manager')
    try {
      const res = await fetch('/brain-console/api/manager/start', { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await load()
    } catch (error) {
      setConnectionError(reasonOf(error))
    } finally {
      setBusy(null)
    }
  }

  const running = units.filter((unit) => unit.running).length
  const groups = Array.from(new Set(units.map((unit) => unit.group)))
  const autostartOn = autostart?.supported === true && autostart.enabled
  // 依赖反查：brain_server 被 mcp_server 依赖 → { brain_server: ['mcp_server'] }
  const dependentsByUnit: Record<string, string[]> = {}
  for (const unit of units) {
    for (const dependency of unit.depends ?? []) {
      dependentsByUnit[dependency] = [...(dependentsByUnit[dependency] ?? []), unit.name]
    }
  }
  const now = Date.now()
  const detailUnit = detailName === null ? undefined : units.find((unit) => unit.name === detailName)

  // 快捷键：r 刷新、/ 聚焦日志过滤、Esc 收起日志（有对话框时让对话框自己处理）
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const target = event.target instanceof HTMLElement ? event.target : null
      const typing = target !== null
        && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      if (event.key === 'Escape') {
        if (document.querySelector('[role="dialog"]') !== null) return
        if (log !== null) setLog(null)
        return
      }
      if (typing || event.ctrlKey || event.metaKey || event.altKey) return
      if (event.key === 'r') {
        event.preventDefault()
        void load(true)
      }
      if (event.key === '/') {
        event.preventDefault()
        document.querySelector<HTMLInputElement>('.bc-dock-filter')?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [load, log])

  return (
    <div className="bc-root">
      <div className="bc-scroll">
        <div className="bc-inner">
          <header className="bc-header">
            <span className="bc-logo" aria-hidden="true"><BrainConsoleIcon size={18} title="TiSenT Brain" /></span>
            <h1 className="bc-title">TiSenT Brain</h1>
            <Tooltip
              label={autostartOn ? '开机启动：已开启（⋯ 菜单里可关）' : '开机启动：未开启（⋯ 菜单里可开）'}
              side="bottom"
              delayMs={150}
              portal
              disabled={autostart === null || !autostart.supported}
            >
              <span
                className="bc-count"
                data-tone={units.length > 0 && running === units.length ? 'all' : undefined}
                data-autostart={autostartOn ? 'on' : 'off'}
              >
                <span className="bc-count-dot" />
                {units.length === 0 ? '—' : `${running} / ${units.length} 运行中`}
              </span>
            </Tooltip>
            <div className="bc-header-actions">
              {updatedAt !== null && <span className="bc-updated">最后刷新 {updatedAt}</span>}
              <IconButton label="刷新" icon={IconRefresh} busy={refreshing} onClick={() => void load(true)} />
              <MoreMenu
                autostart={autostart}
                busy={busy}
                onBackup={() => void backup()}
                onPrune={() => setBackupOpen(true)}
                onCaches={() => setCacheOpen(true)}
                onToggleAutostart={() => void toggleAutostart()}
              />
            </div>
          </header>

          {connectionError !== null && (
            <div className="bc-notice" data-kind="connection" role="status">
              <div className="bc-notice-body">
                <span className="bc-notice-title">无法连接 brain_manager（127.0.0.1:19998）</span>
                <span className="bc-notice-text">
                  {connectionError}。面板是管理器的前端，管理器没跑时无法启停单元，可由宿主代为拉起
                </span>
              </div>
              <div className="bc-notice-actions">
                <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => void startManager()}>
                  {busy === 'manager' ? '启动中…' : '启动管理器'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void load(true)}>重试</Button>
              </div>
            </div>
          )}

          {actionError !== null && (
            <div className="bc-notice" data-kind="action" role="status">
              <div className="bc-notice-body">
                <span className="bc-notice-text">{actionError}</span>
              </div>
              <div className="bc-notice-actions">
                <Button size="sm" variant="ghost" onClick={() => setActionError(null)}>知道了</Button>
              </div>
            </div>
          )}

          {overview !== null && (
            <OverviewTiles
              overview={overview}
              now={now}
              history={history}
              onOpenTrend={(key) => setTrend(key)}
            />
          )}

          {!loaded ? (
            <div className="bc-loading">
              <StateDot state="ongoing" />
              正在连接 brain_manager…
            </div>
          ) : units.length === 0 ? (
            connectionError === null ? <div className="bc-empty">管理器没有返回受管单元</div> : null
          ) : (
            groups.map((group) => (
              <UnitSection
                key={group}
                group={group}
                members={units.filter((unit) => unit.group === group)}
                now={now}
                busy={busy}
                logName={log?.name ?? null}
                dependents={dependentsByUnit}
                onLog={toggleLog}
                onAction={(name, action) => void act(name, action)}
                onStartAll={(group) => void startGroup(group)}
                onStopAll={(group) => setStopGroup({
                  group,
                  names: units.filter((unit) => unit.group === group && unit.running).map((unit) => unit.name),
                })}
                onRestartAll={(group) => setRestartGroup({
                  group,
                  names: units.filter((unit) => unit.group === group && unit.running).map((unit) => unit.name),
                })}
                onToggleEnabled={(name, enabled) => void setUnitEnabled(name, enabled)}
                onAdopt={(name) => void adoptUnit(name)}
                onDetail={(name) => setDetailName(name)}
              />
            ))
          )}
        </div>
      </div>

      {backupOpen && (
        <BackupDialog
          load={loadBackups}
          prune={pruneBackups}
          onChanged={() => { void load() }}
          onClose={() => setBackupOpen(false)}
        />
      )}

      {trend !== null && (
        <TrendDialog
          metric={metricSpec(trend)}
          points={history?.points ?? []}
          onOpenFailed={trend === 'failure_edges' ? () => { setTrend(null); setFailedOpen(true) } : undefined}
          onClose={() => setTrend(null)}
        />
      )}

      {failedOpen && (
        <FailedEdgesDialog load={loadFailedEdges} onClose={() => setFailedOpen(false)} />
      )}

      {cacheOpen && (
        <CacheDialog
          load={loadCaches}
          prune={pruneCaches}
          onClose={() => setCacheOpen(false)}
        />
      )}

      {stopGroup !== null && (
        <GroupActionDialog
          title={`停止「${stopGroup.group}」`}
          description={`将停止 ${stopGroup.names.length} 个正在运行的单元，并写入抑制清单`}
          names={stopGroup.names}
          note="停止后它们不会随管理器启动自动恢复，需要手动再点启动"
          confirmLabel={`停止 ${stopGroup.names.length} 个`}
          busyLabel="停止中…"
          busy={busy === `stop-group:${stopGroup.group}`}
          onCancel={() => setStopGroup(null)}
          onConfirm={() => void stopGroupNow(stopGroup.group, stopGroup.names)}
        />
      )}

      {restartGroup !== null && (
        <GroupActionDialog
          title={`重启「${restartGroup.group}」`}
          description={`将重启 ${restartGroup.names.length} 个正在运行的单元`}
          names={restartGroup.names}
          note="重启会中断它们几秒到十几秒；期间依赖它们的调用可能失败"
          confirmLabel={`重启 ${restartGroup.names.length} 个`}
          busyLabel="重启中…"
          busy={busy === `restart-group:${restartGroup.group}`}
          onCancel={() => setRestartGroup(null)}
          onConfirm={() => void restartGroupNow(restartGroup.group, restartGroup.names)}
        />
      )}

      {log !== null && (
        <LogDock
          name={log.name}
          text={log.text}
          loading={log.loading}
          readAt={log.at}
          paused={logPaused}
          lines={logLines}
          onRefresh={() => void readLog(log.name)}
          onTogglePause={() => setLogPaused((paused) => !paused)}
          onCycleLines={cycleLogLines}
          onClear={() => setClearLogOpen(true)}
          onClose={() => setLog(null)}
        />
      )}

      {detailUnit !== undefined && (
        <UnitDetailDialog
          unit={detailUnit}
          now={now}
          dependents={dependentsByUnit[detailUnit.name] ?? []}
          onClose={() => setDetailName(null)}
        />
      )}

      {clearLogOpen && log !== null && (
        <ConfirmDialog
          title={`清空「${log.name}」日志`}
          description="把该单元的日志文件截断为空"
          note="旧内容不可恢复；正在运行的服务会从空文件继续写入"
          confirmLabel="清空"
          busyLabel="清空中…"
          busy={busy === 'clear-log'}
          onCancel={() => setClearLogOpen(false)}
          onConfirm={() => void clearLogNow()}
        />
      )}
    </div>
  )
}
