/**
 * 设置页：面板内可编辑的部署参数集中在这里。
 *
 * 当前两组：磁盘告警（可用 GB / 剩余占比，存大脑 data/storage_thresholds.json）
 * 与趋势告警（失败边数 / 库大小 MB，存大脑 data/trend_thresholds.json）。
 * 保存成功后通过回调让顶部告警立即使用新值；返回按钮回主面板。
 */
import { useEffect, useState } from 'react'
import { loadStorageSummary, loadTrendThresholds, saveStorageThresholds, saveTrendThreshold } from '../api.ts'
import { reasonOf } from './errors.ts'
import { Button } from './primitives.ts'
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
