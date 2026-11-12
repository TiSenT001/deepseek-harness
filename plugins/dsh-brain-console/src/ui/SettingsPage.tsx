/**
 * 设置页：面板内可编辑的部署参数集中在这里。
 *
 * 当前两组：磁盘告警（可用 GB / 剩余占比，存大脑 data/storage_thresholds.json）
 * 与趋势告警（失败边数 / 库大小 MB，存大脑 data/trend_thresholds.json）。
 * 保存成功后通过回调让顶部告警立即使用新值；返回按钮回主面板。
 */
import { useEffect, useState } from 'react'
import { jget, loadStorageSummary, loadTrendThresholds, saveStorageThresholds, saveTrendThreshold } from '../api.ts'
import { reasonOf } from './errors.ts'
import { Button } from './primitives.ts'
import { LOG_LEVELS, LOG_LINE_OPTIONS, loadPrefs, REFRESH_OPTIONS, savePrefs } from '../prefs.ts'
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
  const [groupOrder, setGroupOrder] = useState<string[]>([])

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
