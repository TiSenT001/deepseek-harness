/**
 * 阈值设置：磁盘告警、定时任务过期、趋势告警三组，读写大脑侧配置。
 * 磁盘阈值保存后通过回调通知页面刷新顶部告警。
 */
import { useEffect, useState } from 'react'
import {
  loadCronThresholds, loadStorageSummary, loadTrendThresholds,
  saveCronThresholds, saveStorageThresholds, saveTrendThreshold,
} from '../../api.ts'
import { reasonOf } from '../errors.ts'
import { Button } from '../primitives.ts'
import type { StorageThresholds } from '../types.ts'
import { SettingsSection } from './SettingsSection.tsx'

export interface ThresholdSettingsProps {
  /** 磁盘阈值保存成功后的回调（页面据此更新顶部告警） */
  onDiskThresholdsChanged?: (thresholds: StorageThresholds) => void
  /** 保存成功提示 */
  onNotice?: (message: string) => void
  /** 保存失败提示 */
  onError?: (message: string) => void
}

/**
 * 渲染阈值设置分组。
 * @param props - 磁盘阈值回调与提示回调
 * @returns 分组元素
 */
export function ThresholdSettings({ onDiskThresholdsChanged, onNotice, onError }: ThresholdSettingsProps): JSX.Element {
  const [warnInput, setWarnInput] = useState('')
  const [criticalInput, setCriticalInput] = useState('')
  const [failureInput, setFailureInput] = useState('')
  const [dbInput, setDbInput] = useState('')
  const [cronHoursInput, setCronHoursInput] = useState('')
  const [cronFactorInput, setCronFactorInput] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState<'disk' | 'cron' | 'trend' | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const [summary, trend, cron] = await Promise.all([
          loadStorageSummary(),
          loadTrendThresholds(),
          loadCronThresholds(),
        ])
        setWarnInput(String(summary.thresholds?.warn_gb ?? ''))
        setCriticalInput(String(summary.thresholds?.critical_percent ?? ''))
        const failure = trend.thresholds.failure_edges ?? trend.defaults.failure_edges
        const db = trend.thresholds.db_size_mb ?? trend.defaults.db_size_mb
        setFailureInput(failure === null || failure === undefined ? '' : String(failure))
        setDbInput(db === null || db === undefined ? '' : String(db))
        setCronHoursInput(String(cron.stale_hours))
        setCronFactorInput(String(cron.stale_factor))
        setLoaded(true)
      } catch (e) {
        onError?.(reasonOf(e))
      }
    })()
  }, [])

  const saveDisk = async (): Promise<void> => {
    const warn = Number(warnInput)
    const critical = Number(criticalInput)
    if (!Number.isFinite(warn) || !Number.isFinite(critical)) {
      onError?.('磁盘阈值必须是数字')
      return
    }
    setSaving('disk')
    try {
      const result = await saveStorageThresholds(warn, critical)
      if (!result.ok) {
        onError?.(result.error ?? '保存失败')
        return
      }
      if (result.thresholds !== undefined) {
        setWarnInput(String(result.thresholds.warn_gb))
        setCriticalInput(String(result.thresholds.critical_percent))
        onDiskThresholdsChanged?.(result.thresholds)
      }
      onNotice?.('磁盘告警阈值已保存')
    } catch (e) {
      onError?.(reasonOf(e))
    } finally {
      setSaving(null)
    }
  }

  const saveCron = async (): Promise<void> => {
    const hours = Number(cronHoursInput)
    const factor = Number(cronFactorInput)
    if (!Number.isFinite(hours) || !Number.isFinite(factor)) {
      onError?.('定时任务阈值必须是数字')
      return
    }
    setSaving('cron')
    try {
      const result = await saveCronThresholds(hours, factor)
      if (!result.ok || result.thresholds === undefined) {
        onError?.(result.error ?? '保存失败')
        return
      }
      setCronHoursInput(String(result.thresholds.stale_hours))
      setCronFactorInput(String(result.thresholds.stale_factor))
      onNotice?.('定时任务过期阈值已保存')
    } catch (e) {
      onError?.(reasonOf(e))
    } finally {
      setSaving(null)
    }
  }

  const saveTrend = async (): Promise<void> => {
    const failure = Number(failureInput)
    const db = Number(dbInput)
    if (!Number.isFinite(failure) || !Number.isFinite(db)) {
      onError?.('趋势阈值必须是数字')
      return
    }
    setSaving('trend')
    try {
      const first = await saveTrendThreshold('failure_edges', failure)
      if (!first.ok) {
        onError?.(first.error ?? '保存失败')
        return
      }
      const second = await saveTrendThreshold('db_size_mb', db)
      if (!second.ok) {
        onError?.(second.error ?? '保存失败')
        return
      }
      onNotice?.('趋势告警阈值已保存')
    } catch (e) {
      onError?.(reasonOf(e))
    } finally {
      setSaving(null)
    }
  }

  return (
    <>
      <SettingsSection
        title="磁盘告警"
        description="可用空间低于 N GB 时顶部显示黄色提示；剩余占比低于 M% 时标红。"
      >
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
      </SettingsSection>

      <SettingsSection
        title="定时任务"
        description="过期阈值 = max(兜底小时, 声明周期 × 倍数)；用于判断 cron 心跳是否过期。"
      >
        <div className="bc-settings-row">
          <label>
            兜底 &gt;
            <input
              className="bc-settings-input"
              inputMode="decimal"
              value={cronHoursInput}
              disabled={!loaded}
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
              disabled={!loaded}
              onChange={(event) => setCronFactorInput(event.target.value)}
              aria-label="定时任务周期倍数"
            />
          </label>
          <Button size="sm" variant="outline" disabled={!loaded || saving !== null} onClick={() => void saveCron()}>
            {saving === 'cron' ? '保存中…' : '保存定时任务阈值'}
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection
        title="趋势告警"
        description="趋势图超过阈值时画告警线：失败边数与数据库大小（MB）。"
      >
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
      </SettingsSection>
    </>
  )
}
