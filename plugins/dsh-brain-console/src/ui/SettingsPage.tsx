/**
 * 设置页：阈值、路径、界面、日志、分组顺序的入口。
 *
 * 各分组做成自包含组件（自己加载/保存），本页只负责布局、全局提示与返回。
 */
import { useState } from 'react'
import { REFRESH_OPTIONS, loadPrefs, savePrefs } from '../prefs.ts'
import { Button } from './primitives.ts'
import type { StorageThresholds } from './types.ts'
import { SettingsSection } from './settings/SettingsSection.tsx'
import { PathSettings } from './settings/PathSettings.tsx'
import { ThresholdSettings } from './settings/ThresholdSettings.tsx'
import { LogSettings } from './settings/LogSettings.tsx'
import { GroupOrderSettings } from './settings/GroupOrderSettings.tsx'

export interface SettingsPageProps {
  /** 返回主面板。 */
  onBack: () => void
  /** 磁盘阈值保存成功后回传给页面，用于立即刷新顶部告警。 */
  onDiskThresholdsChanged?: (thresholds: StorageThresholds) => void
}

/**
 * 渲染设置页。
 * @param props - 返回回调与磁盘阈值回传
 * @returns 设置页元素
 */
export function SettingsPage({ onBack, onDiskThresholdsChanged }: SettingsPageProps): JSX.Element {
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [refreshSeconds, setRefreshSeconds] = useState(() => loadPrefs().refreshSeconds)

  const notify = (message: string): void => {
    setError(null)
    setNotice(message)
  }
  const fail = (message: string): void => {
    setNotice(null)
    setError(message)
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

      <PathSettings onNotice={notify} onError={fail} />
      <ThresholdSettings
        onDiskThresholdsChanged={onDiskThresholdsChanged}
        onNotice={notify}
        onError={fail}
      />

      <SettingsSection title="界面" description="主面板自动刷新间隔。保存在本机浏览器（localStorage），不写大脑。">
        <div className="bc-settings-row">
          {REFRESH_OPTIONS.map((seconds) => (
            <Button
              key={seconds}
              size="sm"
              variant={refreshSeconds === seconds ? 'outline' : 'ghost'}
              onClick={() => {
                const next = savePrefs({ refreshSeconds: seconds })
                setRefreshSeconds(next.refreshSeconds)
                notify(`刷新间隔已改为 ${seconds} 秒`)
              }}
            >
              {seconds} 秒
            </Button>
          ))}
        </div>
      </SettingsSection>

      <LogSettings onNotice={notify} />
      <GroupOrderSettings onNotice={notify} />
    </div>
  )
}
