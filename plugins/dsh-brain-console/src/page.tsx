/**
 * ConsolePage — TiSenT Brain 面板（大脑各项服务的查看与人工启停）。
 *
 * 数据源是独立进程 `brain_manager`（127.0.0.1:19998）。本页面**只做组合与下发**：
 * 轮询、日志、历史、动作都拆在 `hooks/` 里，这里只保留弹窗开关、派生值、快捷键和 JSX。
 *
 * 布局：
 *   1) 标题行 —— 运行计数、最后刷新、刷新图标与「更多」菜单（备份 / 清理 / 开机启动）
 *   2) 概览指标带 —— 只读观察值（库大小/边/笔记/记忆/失败边/上次备份）
 *   3) 分组卡片 —— 状态灯 + 名称/端口/说明/运行信息 + 图标操作（日志/启停）
 *   4) 底部日志控制台 —— 常驻面板，不遮挡卡片
 */
import { useEffect, useState } from 'react'
import {
  DIAGNOSTICS_URL, loadBackups, loadCaches, loadFailedEdges, loadIndexHealth, postManager, pruneBackups, pruneCaches, restoreBackup,
} from './api.ts'
import { useConsoleActions } from './hooks/useConsoleActions.ts'
import { useConsoleFeed } from './hooks/useConsoleFeed.ts'
import { useHistory } from './hooks/useHistory.ts'
import { useLogDock } from './hooks/useLogDock.ts'
import { BrainConsoleIcon } from './icon.tsx'
import { BackupDialog } from './ui/BackupDialog.tsx'
import { CacheDialog } from './ui/CacheDialog.tsx'
import { ConfirmDialog } from './ui/ConfirmDialog.tsx'
import { reasonOf } from './ui/errors.ts'
import { FailedEdgesDialog } from './ui/FailedEdgesDialog.tsx'
import { AutoRecoverDialog } from './ui/AutoRecoverDialog.tsx'
import { SystemCheckupDialog } from './ui/SystemCheckupDialog.tsx'
import { StorageDialog } from './ui/StorageDialog.tsx'
import { IndexHealthDialog } from './ui/IndexHealthDialog.tsx'
import { GroupActionDialog } from './ui/GroupActionDialog.tsx'
import { IconButton } from './ui/IconButton.tsx'
import { LogDock } from './ui/LogDock.tsx'
import { MoreMenu } from './ui/MoreMenu.tsx'
import { Button, IconRefresh, StateDot, Tooltip } from './ui/primitives.ts'
import { OverviewTiles } from './ui/StatTiles.tsx'
import { TrendDialog } from './ui/TrendDialog.tsx'
import { UnitDetailDialog } from './ui/UnitDetailDialog.tsx'
import { UnitSection } from './ui/UnitSection.tsx'
import { metricSpec, type MetricKey } from './ui/metrics.ts'
import { ensureConsoleStyles } from './ui/styles.ts'
import type { Overview, Unit } from './ui/types.ts'

ensureConsoleStyles()

/**
 * 渲染大脑控制台。
 * @returns 页面元素
 */
export function ConsolePage(): JSX.Element {
  const { history, refreshHistory } = useHistory()
  const feed = useConsoleFeed(() => { void refreshHistory() })
  const logDock = useLogDock()
  const actions = useConsoleActions({
    units: feed.units,
    load: feed.load,
    log: logDock.log,
    readLog: logDock.readLog,
  })

  // 弹窗开关（只属于页面）
  const [backupOpen, setBackupOpen] = useState(false)
  const [cacheOpen, setCacheOpen] = useState(false)
  const [failedOpen, setFailedOpen] = useState(false)
  const [indexOpen, setIndexOpen] = useState(false)
  const [cronAlerts, setCronAlerts] = useState<{ stale: number; zombies: number } | null>(null)
  const [autoRecoverOpen, setAutoRecoverOpen] = useState(false)
  const [checkupOpen, setCheckupOpen] = useState(false)
  const [storageOpen, setStorageOpen] = useState(false)
  const [trend, setTrend] = useState<MetricKey | null>(null)
  const [detailName, setDetailName] = useState<string | null>(null)
  const [stopGroup, setStopGroup] = useState<{ group: string; names: string[] } | null>(null)
  const [restartGroup, setRestartGroup] = useState<{ group: string; names: string[] } | null>(null)
  const [stopUnit, setStopUnit] = useState<{ name: string; dependents: string[] } | null>(null)
  const [clearLogOpen, setClearLogOpen] = useState(false)
  const [shutdownOpen, setShutdownOpen] = useState(false)

  // 诊断包：19998 的响应带 Content-Disposition，锚点点击即下载，不需要页面内预览
  const downloadDiagnostics = (): void => {
    const anchor = document.createElement('a')
    anchor.href = DIAGNOSTICS_URL
    anchor.rel = 'noopener'
    anchor.click()
  }

  // 开机启动开关（写 HKCU Run；管理器下次登录自启并按上次状态恢复服务）
  const [workingBusy, setWorkingBusy] = useState<string | null>(null)
  const toggleAutostart = async (): Promise<void> => {
    const autostart = feed.autostart
    if (autostart === null || !autostart.supported) return
    setWorkingBusy('autostart')
    actions.setActionError(null)
    try {
      await postManager('/autostart', { enabled: !autostart.enabled })
      await feed.load()
    } catch (error) {
      actions.setActionError(`开机启动设置失败：${reasonOf(error)}`)
    } finally {
      setWorkingBusy(null)
    }
  }

  // 管理器没跑时，由 DSH 宿主代为拉起（浏览器无法 spawn 进程）
  const startManager = async (): Promise<void> => {
    setWorkingBusy('manager')
    try {
      const res = await fetch('/brain-console/api/manager/start', { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await feed.load()
    } finally {
      setWorkingBusy(null)
    }
  }

  // 关闭启动器：停掉全部在跑单元并结束管理器；之后面板会看到连接失败，可用「启动管理器」重新拉起
  const shutdownManager = async (): Promise<void> => {
    setWorkingBusy('manager-stop')
    try {
      await postManager('/manager/stop')
    } catch (error) {
      actions.setActionError(`关闭启动器失败：${reasonOf(error)}`)
    } finally {
      setWorkingBusy(null)
      setShutdownOpen(false)
    }
  }

  const busy = workingBusy ?? actions.busy

  // 停止一个有「在跑依赖者」的单元时先确认：否则依赖它的服务会无声失去后端
  const handleAction = (name: string, action: 'start' | 'stop' | 'restart'): void => {
    if (action === 'stop') {
      const runningDependents = feed.units
        .filter((unit) => unit.running && (unit.depends ?? []).includes(name))
        .map((unit) => unit.name)
      if (runningDependents.length > 0) {
        setStopUnit({ name, dependents: runningDependents })
        return
      }
    }
    void actions.act(name, action)
  }

  const confirmClearLog = async (): Promise<void> => {
    try {
      await logDock.clearLogNow()
    } catch (error) {
      actions.setActionError(`${logDock.logName ?? '日志'} 清空失败：${reasonOf(error)}`)
    } finally {
      setClearLogOpen(false)
    }
  }

  const running = feed.units.filter((unit) => unit.running).length
  // 运行中但健康探测失败的单元：顶部给一个红 chip，点一下滚到第一张异常卡
  const abnormalCount = feed.units.filter((unit) => unit.state !== '运行中' && unit.state !== '已停止').length
  const focusAbnormal = (): void => {
    document.querySelector<HTMLElement>('article.bc-card[data-abnormal="true"]')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  const groups = Array.from(new Set(feed.units.map((unit) => unit.group)))
  const autostartOn = feed.autostart?.supported === true && feed.autostart.enabled
  // 依赖反查：brain_server 被 mcp_server 依赖 → { brain_server: ['mcp_server'] }
  const dependentsByUnit: Record<string, string[]> = {}
  for (const unit of feed.units) {
    for (const dependency of unit.depends ?? []) {
      dependentsByUnit[dependency] = [...(dependentsByUnit[dependency] ?? []), unit.name]
    }
  }
  const now = Date.now()
  const detailUnit = detailName === null ? undefined : feed.units.find((unit) => unit.name === detailName)
  const openLog = logDock.log

  // 管理器没起来时首次拉历史会失败；面板一旦恢复（overview 到手）就自动补拉一次，
  // 否则 KPI 卡的趋势线要手动刷新页面才出现。
  useEffect(() => {
    if (feed.overview !== null && history === null) void refreshHistory()
  }, [feed.overview, history, refreshHistory])

  // 定时任务健康度：顶部只显示计数，详情在「索引与嵌入」里；管理器不可达时保留上一次读数
  useEffect(() => {
    void (async () => {
      try {
        const health = await loadIndexHealth()
        setCronAlerts({
          stale: health.stale_crons?.length ?? 0,
          zombies: health.zombie_crons?.length ?? 0,
        })
      } catch {
        // 管理器短暂不可用：不清空读数，下次刷新再试
      }
    })()
  }, [feed.updatedAt])

  // 快捷键：r 刷新、/ 聚焦日志过滤、Esc 收起日志（有对话框时让对话框自己处理）
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const target = event.target instanceof HTMLElement ? event.target : null
      const typing = target !== null
        && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      if (event.key === 'Escape') {
        if (document.querySelector('[role="dialog"]') !== null) return
        logDock.closeLog()
        return
      }
      if (typing || event.ctrlKey || event.metaKey || event.altKey) return
      if (event.key === 'r') {
        event.preventDefault()
        void feed.load(true)
      }
      if (event.key === '/') {
        event.preventDefault()
        document.querySelector<HTMLInputElement>('.bc-dock-filter')?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [feed.load, logDock.closeLog])

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
              disabled={feed.autostart === null || !feed.autostart.supported}
            >
              <span
                className="bc-count"
                data-tone={feed.units.length > 0 && running === feed.units.length ? 'all' : undefined}
                data-autostart={autostartOn ? 'on' : 'off'}
              >
                <span className="bc-count-dot" />
                {feed.units.length === 0 ? '—' : `${running} / ${feed.units.length} 运行中`}
              </span>
            </Tooltip>
            {abnormalCount > 0 && (
              <button
                type="button"
                className="bc-header-alert"
                title="定位到第一个异常单元"
                onClick={focusAbnormal}
              >
                <span className="bc-status-dot" aria-hidden="true" />
                {abnormalCount} 个异常
              </button>
            )}
            {(cronAlerts?.stale ?? 0) > 0 && (
              <button
                type="button"
                className="bc-header-alert"
                title="查看过期的定时任务"
                onClick={() => setIndexOpen(true)}
              >
                <span className="bc-status-dot" aria-hidden="true" />
                {cronAlerts?.stale} 个定时任务过期
              </button>
            )}
            {(cronAlerts?.stale ?? 0) === 0 && (cronAlerts?.zombies ?? 0) > 0 && (
              <button
                type="button"
                className="bc-header-alert"
                title="查看并清理失效心跳"
                onClick={() => setIndexOpen(true)}
              >
                <span className="bc-status-dot" aria-hidden="true" />
                {cronAlerts?.zombies} 条失效心跳
              </button>
            )}
            <div className="bc-header-actions">
              {feed.updatedAt !== null && <span className="bc-updated">最后刷新 {feed.updatedAt}</span>}
              <IconButton label="刷新" icon={IconRefresh} busy={feed.refreshing} onClick={() => void feed.load(true)} />
              <MoreMenu
                autostart={feed.autostart}
                busy={busy}
                onBackup={() => void actions.backup()}
                onPrune={() => setBackupOpen(true)}
                onCaches={() => setCacheOpen(true)}
    onIndex={() => setIndexOpen(true)}
    onAutoRecover={() => setAutoRecoverOpen(true)}
    onCheckup={() => setCheckupOpen(true)}
    onStorage={() => setStorageOpen(true)}
    onDiagnostics={downloadDiagnostics}
                onToggleAutostart={() => void toggleAutostart()}
                onShutdown={() => setShutdownOpen(true)}
              />
            </div>
          </header>

          {feed.connectionError !== null && (
            <div className="bc-notice" data-kind="connection" role="status">
              <div className="bc-notice-body">
                <span className="bc-notice-title">无法连接 brain_manager（127.0.0.1:19998）</span>
                <span className="bc-notice-text">
                  {feed.connectionError}。面板是管理器的前端，管理器没跑时无法启停单元，可由宿主代为拉起
                </span>
              </div>
              <div className="bc-notice-actions">
                <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => void startManager()}>
                  {busy === 'manager' ? '启动中…' : '启动管理器'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void feed.load(true)}>重试</Button>
              </div>
            </div>
          )}

          {actions.actionError !== null && (
            <div className="bc-notice" data-kind="action" role="status">
              <div className="bc-notice-body">
                <span className="bc-notice-text">{actions.actionError}</span>
              </div>
              <div className="bc-notice-actions">
                <Button size="sm" variant="ghost" onClick={() => actions.setActionError(null)}>知道了</Button>
              </div>
            </div>
          )}

          {feed.overview !== null && (
            <OverviewTiles
              overview={feed.overview}
              now={now}
              history={history}
              onOpenTrend={(key) => setTrend(key)}
            />
          )}

          {!feed.loaded ? (
            <div className="bc-loading">
              <StateDot state="ongoing" />
              正在连接 brain_manager…
            </div>
          ) : feed.units.length === 0 ? (
            feed.connectionError === null ? <div className="bc-empty">管理器没有返回受管单元</div> : null
          ) : (
            groups.map((group) => (
              <UnitSection
                key={group}
                group={group}
                members={feed.units.filter((unit) => unit.group === group)}
                now={now}
                busy={busy}
                logName={logDock.logName}
                dependents={dependentsByUnit}
                onLog={logDock.toggleLog}
                onAction={handleAction}
                onStartAll={(group) => void actions.startGroup(group)}
                onStopAll={(group) => setStopGroup({
                  group,
                  names: feed.units.filter((unit) => unit.group === group && unit.running).map((unit) => unit.name),
                })}
                onRestartAll={(group) => setRestartGroup({
                  group,
                  names: feed.units.filter((unit) => unit.group === group && unit.running).map((unit) => unit.name),
                })}
                onToggleEnabled={(name, enabled) => void actions.setUnitEnabled(name, enabled)}
                onAdopt={(name) => void actions.adoptUnit(name)}
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
            restore={restoreBackup}
          onChanged={() => { void feed.load() }}
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

      {indexOpen && <IndexHealthDialog onClose={() => setIndexOpen(false)} />}
  {autoRecoverOpen && <AutoRecoverDialog onClose={() => setAutoRecoverOpen(false)} />}
  {checkupOpen && <SystemCheckupDialog onClose={() => setCheckupOpen(false)} />}
  {storageOpen && <StorageDialog onClose={() => setStorageOpen(false)} />}

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
          onConfirm={() => { void actions.stopGroupNow(stopGroup.group, stopGroup.names).finally(() => setStopGroup(null)) }}
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
          onConfirm={() => { void actions.restartGroupNow(restartGroup.group, restartGroup.names).finally(() => setRestartGroup(null)) }}
        />
      )}

      {openLog !== null && (
        <LogDock
          name={openLog.name}
          text={openLog.text}
          loading={openLog.loading}
          readAt={openLog.at}
          paused={logDock.paused}
          lines={logDock.lines}
          onRefresh={() => void logDock.readLog(openLog.name)}
          onTogglePause={() => logDock.setPaused(!logDock.paused)}
          onCycleLines={logDock.cycleLines}
          onClear={() => setClearLogOpen(true)}
          onClose={logDock.closeLog}
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

      {stopUnit !== null && (
        <ConfirmDialog
          title={`停止「${stopUnit.name}」`}
          description={`${stopUnit.dependents.join('、')} 依赖它，停止后这些单元会失去后端`}
          note="停止会写抑制清单并把持久意愿置为 False，不会随管理器启动自动恢复"
          confirmLabel="停止"
          busyLabel="停止中…"
          busy={busy === `${stopUnit.name}:stop`}
          onCancel={() => setStopUnit(null)}
          onConfirm={() => { const target = stopUnit.name; setStopUnit(null); void actions.act(target, 'stop') }}
        />
      )}

      {shutdownOpen && (
        <ConfirmDialog
          title="关闭启动器"
          description={`将停止全部 ${running} 个正在运行的单元，并结束 brain_manager 进程`}
          note="之后面板无法启停任何单元；需要时可用连接提示里的「启动管理器」重新拉起（或运行 start_manager.cmd）"
          confirmLabel="关闭"
          busyLabel="关闭中…"
          busy={busy === 'manager-stop'}
          onCancel={() => setShutdownOpen(false)}
          onConfirm={() => void shutdownManager()}
        />
      )}

      {clearLogOpen && openLog !== null && (
        <ConfirmDialog
          title={`清空「${openLog.name}」日志`}
          description="把该单元的日志文件截断为空"
          note="旧内容不可恢复；正在运行的服务会从空文件继续写入"
          confirmLabel="清空"
          busyLabel="清空中…"
          busy={logDock.clearing}
          onCancel={() => setClearLogOpen(false)}
          onConfirm={() => void confirmClearLog()}
        />
      )}
    </div>
  )
}
