/**
 * 设置页：面板内可编辑的部署参数集中在这里。
 *
 * 当前两组：磁盘告警（可用 GB / 剩余占比，存大脑 data/storage_thresholds.json）
 * 与趋势告警（失败边数 / 库大小 MB，存大脑 data/trend_thresholds.json）。
 * 保存成功后通过回调让顶部告警立即使用新值；返回按钮回主面板。
 */
import { useEffect, useState } from 'react'
import {
  jget, loadCronThresholds, loadPanelConfig, loadStorageSummary, loadTrendThresholds,
  saveCronThresholds, savePanelConfig, saveStorageThresholds, saveTrendThreshold, setApiBase,
  type PanelConfigView,
} from '../api.ts'
import { reasonOf } from './errors.ts'
import { Button } from './primitives.ts'
import { LOG_LEVELS, LOG_LINE_OPTIONS, loadPrefs, REFRESH_OPTIONS, savePrefs, subscribePrefs } from '../prefs.ts'
import type { StorageThresholds } from './types.ts'

export interface SettingsPageProps {
  /** 返回主面板。 */
  onBack: () => void
  /** 磁盘阈值保存成功后回传给页面，用于立即刷新顶部告警。 */
  onDiskThresholdsChanged?: (thresholds: StorageThresholds) => void
}

/**
 * 渲染设置页。
 * @param props - 返回回调与磁盘阈值回传
 * @returns 设置页元素（挂载即读当前阈值）
 */
export function SettingsPage({ onBack, onDiskThresholdsChanged }: SettingsPageProps): JSX.Element {
  const [warnInput, setWarnInput] = useState('')
  const [criticalInput, setCriticalInput] = useState('')
  const [failureInput, setFailureInput] = useState('')
  const [dbInput, setDbInput] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState<'disk' | 'trend' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [refreshSeconds, setRefreshSeconds] = useState(() => loadPrefs().refreshSeconds)
  const [logLines, setLogLines] = useState(() => loadPrefs().logLines)
  const [logLevel, setLogLevel] = useState(() => loadPrefs().logLevel)
  const [lastLogUnit, setLastLogUnit] = useState(() => loadPrefs().lastLogUnit)
  const [logDockOpen, setLogDockOpen] = useState(() => loadPrefs().logDockOpen)
  const [groupOrder, setGroupOrder] = useState<string[]>([])
  const [panelConfig, setPanelConfig] = useState<PanelConfigView | null>(null)
  const [configError, setConfigError] = useState<string | null>(null)
  const [brainRootInput, setBrainRootInput] = useState('')
  const [managerUrlInput, setManagerUrlInput] = useState('')
  const [savingPaths, setSavingPaths] = useState(false)
  const [cronHoursInput, setCronHoursInput] = useState('')
  const [cronFactorInput, setCronFactorInput] = useState('')
  const [savingCron, setSavingCron] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const [summary, trend] = await Promise.all([loadStorageSummary(), loadTrendThresholds()])
        setWarnInput(String(summary.thresholds?.warn_gb ?? ''))
        setCriticalInput(String(summary.thresholds?.critical_percent ?? ''))
        const failure = trend.thresholds.failure_edges ?? trend.defaults.failure_edges
        const db = trend.thresholds.db_size_mb ?? trend.defaults.db_size_mb
        setFailureInput(failure === null || failure === undefined ? '' : String(failure))
        setDbInput(db === null || db === undefined ? '' : String(db))
        setLoaded(true)
      } catch (e) {
        setError(reasonOf(e))
      }
    })()
  }, [])

  useEffect(() => subscribePrefs((prefs) => {
    setLastLogUnit(prefs.lastLogUnit)
    setLogDockOpen(prefs.logDockOpen)
  }), [])

  // 宿主路径/地址配置：旧版宿主没有该路由时给出提示，不阻塞其余设置
  useEffect(() => {
    void (async () => {
      try {
        const config = await loadPanelConfig()
        setPanelConfig(config)
        setBrainRootInput(config.brainRoot)
        setManagerUrlInput(config.managerUrl)
      } catch (e) {
        setConfigError(reasonOf(e))
      }
    })()
  }, [])

  // 定时任务过期阈值：与索引对话框共用后端配置
  useEffect(() => {
    void (async () => {
      try {
        const thresholds = await loadCronThresholds()
        setCronHoursInput(String(thresholds.stale_hours))
        setCronFactorInput(String(thresholds.stale_factor))
      } catch {
        // 管理器不可用时留空，保存按钮会提示
      }
    })()
  }, [])

  // 分组单独拉取：不阻塞阈值加载，也不被存储目录扫描拖慢
  useEffect(() => {
    void (async () => {
      try {
        const answer = await jget<{ units: { group: string }[] }>('/units')
        const names = Array.from(new Set(answer.units.map((unit) => unit.group)))
        const preferred = loadPrefs().groupOrder
        setGroupOrder([
          ...preferred.filter((name) => names.includes(name)),
          ...names.filter((name) => !preferred.includes(name)),
        ])
      } catch {
        // 管理器不可用时分组顺序留空，稍后刷新重试
      }
    })()
  }, [])

  const savePaths = async (): Promise<void> => {
    setError(null)
    setNotice(null)
    setSavingPaths(true)
    try {
      const result = await savePanelConfig({
        brainRoot: brainRootInput.trim(),
        managerUrl: managerUrlInput.trim(),
      })
      if (!result.ok || result.config === undefined) {
        setError(result.error ?? '路径配置保存失败')
        return
      }
      setPanelConfig(result.config)
      setBrainRootInput(result.config.brainRoot)
      setManagerUrlInput(result.config.managerUrl)
      setApiBase(result.config.managerUrl)
      setNotice('路径配置已保存：管理器地址即时生效，Brain 路径在下次启动管理器时生效')
    } catch (e) {
      setError(reasonOf(e))
    } finally {
      setSavingPaths(false)
    }
  }

  const saveCron = async (): Promise<void> => {
    setError(null)
    setNotice(null)
    const hours = Number(cronHoursInput)
    const factor = Number(cronFactorInput)
    if (!Number.isFinite(hours) || !Number.isFinite(factor)) {
      setError('定时任务阈值必须是数字')
      return
    }
    setSavingCron(true)
    try {
      const result = await saveCronThresholds(hours, factor)
      if (!result.ok || result.thresholds === undefined) {
        setError(result.error ?? '保存失败')
        return
      }
      setCronHoursInput(String(result.thresholds.stale_hours))
      setCronFactorInput(String(result.thresholds.stale_factor))
      setNotice('定时任务过期阈值已保存')
    } catch (e) {
      setError(reasonOf(e))
    } finally {
      setSavingCron(false)
    }
  }

  const saveDisk = async (): Promise<void> => {
    setError(null)
    setNotice(null)
    const warn = Number(warnInput)
    const critical = Number(criticalInput)
    if (!Number.isFinite(warn) || !Number.isFinite(critical)) {
      setError('磁盘阈值必须是数字')
      return
    }
    setSaving('disk')
    try {
      const result = await saveStorageThresholds(warn, critical)
      if (!result.ok) {
        setError(result.error ?? '保存失败')
        return
      }
      if (result.thresholds !== undefined) {
        setWarnInput(String(result.thresholds.warn_gb))
        setCriticalInput(String(result.thresholds.critical_percent))
        onDiskThresholdsChanged?.(result.thresholds)
      }
      setNotice('磁盘告警阈值已保存')
    } catch (e) {
      setError(reasonOf(e))
    } finally {
      setSaving(null)
    }
  }

  const saveTrend = async (): Promise<void> => {
    setError(null)
    setNotice(null)
    const failure = Number(failureInput)
    const db = Number(dbInput)
    if (!Number.isFinite(failure) || !Number.isFinite(db)) {
      setError('趋势阈值必须是数字')
      return
    }
    setSaving('trend')
    try {
      const first = await saveTrendThreshold('failure_edges', failure)
      if (!first.ok) {
        setError(first.error ?? '保存失败')
        return
      }
      const second = await saveTrendThreshold('db_size_mb', db)
      if (!second.ok) {
        setError(second.error ?? '保存失败')
        return
      }
      setNotice('趋势告警阈值已保存')
    } catch (e) {
      setError(reasonOf(e))
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="bc-settings">
      <div className="bc-settings-head">
        <div>
          <h2>设置</h2>
          <p>阈值保存在大脑侧，改完立即生效，不需要重启服务。</p>
        </div>
        <Button size="sm" variant="ghost" onClick={onBack}>返回面板</Button>
      </div>

      {error !== null && <div className="bc-backup-error">{error}</div>}
      {notice !== null && <div className="bc-settings-notice" role="status">{notice}</div>}

      <section className="bc-settings-group">
        <h3>路径</h3>
        <p>Brain 根目录与管理器地址。其余路径（launcher / 脚本 / 日志）由根目录自动派生，不用逐个填。</p>
        {configError !== null && (
          <div className="bc-index-note">
            宿主路径配置暂不可用（{configError}）。重启 DSH Web 后这里可编辑。
          </div>
        )}
        <div className="bc-settings-row">
          <label className="bc-settings-wide">
            Brain 根目录
            <input
              className="bc-settings-input-wide"
              value={brainRootInput}
              disabled={panelConfig === null || savingPaths}
              placeholder="留空则用 BRAIN_ROOT 环境变量"
              onChange={(event) => setBrainRootInput(event.target.value)}
              aria-label="Brain 根目录"
            />
          </label>
          <label className="bc-settings-wide">
            管理器地址
            <input
              className="bc-settings-input-wide"
              value={managerUrlInput}
              disabled={panelConfig === null || savingPaths}
              placeholder="留空则用默认 http://127.0.0.1:19998"
              onChange={(event) => setManagerUrlInput(event.target.value)}
              aria-label="管理器地址"
            />
          </label>
          <Button
            size="sm"
            variant="outline"
            disabled={panelConfig === null || savingPaths}
            onClick={() => void savePaths()}
          >
            {savingPaths ? '保存中…' : '保存路径配置'}
          </Button>
        </div>
        {panelConfig !== null && (
          <div className="bc-settings-derived">
            <span>派生路径（来源：{panelConfig.sources.brainRoot}）</span>
            <div className="bc-settings-derived-row"><span>管理器脚本</span><code>{panelConfig.scriptPath || '—'}</code></div>
            <div className="bc-settings-derived-row"><span>launcher</span><code>{panelConfig.launcherPath || '—'}</code></div>
            <div className="bc-settings-derived-row"><span>pythonw</span><code>{panelConfig.pythonw}</code></div>
            <div className="bc-settings-derived-row"><span>配置文件</span><code>{panelConfig.configFile}</code></div>
            <div className="bc-settings-derived-row">
              <span>检查</span>
              <code>脚本 {panelConfig.scriptExists ? '存在' : '缺失'} · launcher {panelConfig.launcherPath !== '' && panelConfig.launcherExists ? '存在' : '缺失'}</code>
            </div>
          </div>
        )}
      </section>

      <section className="bc-settings-group">
        <h3>磁盘告警</h3>
        <p>可用空间低于 N GB 时顶部显示黄色提示；剩余占比低于 M% 时标红。</p>
        <div className="bc-settings-row">
          <label>
            可用 &lt;
            <input
              className="bc-settings-input"
              inputMode="decimal"
              value={warnInput}
              disabled={!loaded}
              onChange={(event) => setWarnInput(event.target.value)}
              aria-label="磁盘可用 GB 阈值"
            />
            GB
          </label>
          <label>
            占比 &lt;
            <input
              className="bc-settings-input"
              inputMode="decimal"
              value={criticalInput}
              disabled={!loaded}
              onChange={(event) => setCriticalInput(event.target.value)}
              aria-label="磁盘剩余占比阈值"
            />
            %
          </label>
          <Button size="sm" variant="outline" disabled={!loaded || saving !== null} onClick={() => void saveDisk()}>
            {saving === 'disk' ? '保存中…' : '保存磁盘阈值'}
          </Button>
        </div>
      </section>

      <section className="bc-settings-group">
        <h3>界面</h3>
        <p>主面板自动刷新间隔。保存在本机浏览器（localStorage），不写大脑。</p>
        <div className="bc-settings-row">
          {REFRESH_OPTIONS.map((seconds) => (
            <Button
              key={seconds}
              size="sm"
              variant={refreshSeconds === seconds ? 'outline' : 'ghost'}
              onClick={() => {
                const next = savePrefs({ refreshSeconds: seconds })
                setRefreshSeconds(next.refreshSeconds)
                setNotice(`刷新间隔已改为 ${seconds} 秒`)
              }}
            >
              {seconds} 秒
            </Button>
          ))}
        </div>
      </section>

      <section className="bc-settings-group">
        <h3>日志</h3>
        <p>日志 dock 的默认行数与级别过滤；打开日志时生效。</p>
        <div className="bc-settings-row">
          {LOG_LINE_OPTIONS.map((lines) => (
            <Button
              key={lines}
              size="sm"
              variant={logLines === lines ? 'outline' : 'ghost'}
              onClick={() => {
                const next = savePrefs({ logLines: lines })
                setLogLines(next.logLines)
                setNotice(`日志行数已改为 ${lines}`)
              }}
            >
              {lines} 行
            </Button>
          ))}
          {LOG_LEVELS.map(([key, label]) => (
            <Button
              key={key}
              size="sm"
              variant={logLevel === key ? 'outline' : 'ghost'}
              onClick={() => {
                const next = savePrefs({ logLevel: key })
                setLogLevel(next.logLevel)
                setNotice(`日志级别已改为 ${label}`)
              }}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="bc-settings-row">
          <span>启动时展开上次日志：{lastLogUnit !== '' ? lastLogUnit : '（还没有记录）'}</span>
          <Button
            size="sm"
            variant={logDockOpen ? 'outline' : 'ghost'}
            onClick={() => {
              const next = savePrefs({ logDockOpen: !logDockOpen })
              setLogDockOpen(next.logDockOpen)
              setNotice(next.logDockOpen ? '启动时会自动展开上次日志' : '启动时不再自动展开日志')
            }}
          >
            {logDockOpen ? '已开启' : '已关闭'}
          </Button>
        </div>
      </section>

      <section className="bc-settings-group">
        <h3>分组顺序</h3>
        <p>调整首页服务分组的先后；顺序保存在本机浏览器。</p>
        <div className="bc-settings-order">
          {groupOrder.length === 0 && <span className="bc-index-note">还没有分组数据（管理器不可用？）</span>}
          {groupOrder.map((name, index) => (
            <div className="bc-settings-order-row" key={name}>
              <span className="bc-settings-order-name">{name}</span>
              <Button
                size="sm"
                variant="ghost"
                aria-label={`上移 ${name}`}
                disabled={index === 0}
                onClick={() => {
                  const next = [...groupOrder]
                  const current = next[index]
                  const other = next[index - 1]
                  if (current !== undefined && other !== undefined) {
                    next[index - 1] = current
                    next[index] = other
                  }
                  setGroupOrder(savePrefs({ groupOrder: next }).groupOrder)
                  setNotice('分组顺序已保存')
                }}
              >
                ↑
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-label={`下移 ${name}`}
                disabled={index === groupOrder.length - 1}
                onClick={() => {
                  const next = [...groupOrder]
                  const current = next[index]
                  const other = next[index + 1]
                  if (current !== undefined && other !== undefined) {
                    next[index + 1] = current
                    next[index] = other
                  }
                  setGroupOrder(savePrefs({ groupOrder: next }).groupOrder)
                  setNotice('分组顺序已保存')
                }}
              >
                ↓
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="bc-settings-group">
        <h3>定时任务</h3>
        <p>过期阈值 = max(兜底小时, 声明周期 × 倍数)；用于判断 cron 心跳是否过期。</p>
        <div className="bc-settings-row">
          <label>
            兜底 &gt;
            <input
              className="bc-settings-input"
              inputMode="decimal"
              value={cronHoursInput}
              onChange={(event) => setCronHoursInput(event.target.value)}
              aria-label="定时任务过期小时"
            />
            小时
          </label>
          <label>
            周期 ×
            <input
              className="bc-settings-input"
              inputMode="decimal"
              value={cronFactorInput}
              onChange={(event) => setCronFactorInput(event.target.value)}
              aria-label="定时任务周期倍数"
            />
          </label>
          <Button size="sm" variant="outline" disabled={savingCron || saving !== null} onClick={() => void saveCron()}>
            {savingCron ? '保存中…' : '保存定时任务阈值'}
          </Button>
        </div>
      </section>

      <section className="bc-settings-group">
        <h3>趋势告警</h3>
        <p>趋势图超过阈值时画告警线：失败边数与数据库大小（MB）。</p>
        <div className="bc-settings-row">
          <label>
            失败边 ≥
            <input
              className="bc-settings-input"
              inputMode="numeric"
              value={failureInput}
              disabled={!loaded}
              onChange={(event) => setFailureInput(event.target.value)}
              aria-label="失败边数阈值"
            />
          </label>
          <label>
            库大小 ≥
            <input
              className="bc-settings-input"
              inputMode="numeric"
              value={dbInput}
              disabled={!loaded}
              onChange={(event) => setDbInput(event.target.value)}
              aria-label="数据库大小阈值"
            />
            MB
          </label>
          <Button size="sm" variant="outline" disabled={!loaded || saving !== null} onClick={() => void saveTrend()}>
            {saving === 'trend' ? '保存中…' : '保存趋势阈值'}
          </Button>
        </div>
      </section>
    </div>
  )
}
