/**
 * 路径设置：Brain 根目录与管理器地址，保存到宿主配置文件；
 * launcher / 脚本 / 日志等路径由根目录自动派生，这里只读展示。
 */
import { useEffect, useState } from 'react'
import { loadPanelConfig, savePanelConfig, setApiBase, type PanelConfigView } from '../../api.ts'
import { reasonOf } from '../errors.ts'
import { Button } from '../primitives.ts'
import { SettingsSection } from './SettingsSection.tsx'

export interface PathSettingsProps {
  /** 保存成功提示 */
  onNotice?: (message: string) => void
  /** 读取或保存失败提示 */
  onError?: (message: string) => void
}

/**
 * 渲染路径设置分组。
 * @param props - 提示回调
 * @returns 分组元素
 */
export function PathSettings({ onNotice, onError }: PathSettingsProps): JSX.Element {
  const [config, setConfig] = useState<PanelConfigView | null>(null)
  const [configError, setConfigError] = useState<string | null>(null)
  const [brainRoot, setBrainRoot] = useState('')
  const [managerUrl, setManagerUrl] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const answer = await loadPanelConfig()
        setConfig(answer)
        setBrainRoot(answer.brainRoot)
        setManagerUrl(answer.managerUrl)
      } catch (e) {
        setConfigError(reasonOf(e))
      }
    })()
  }, [])

  const save = async (): Promise<void> => {
    setSaving(true)
    try {
      const result = await savePanelConfig({ brainRoot: brainRoot.trim(), managerUrl: managerUrl.trim() })
      if (!result.ok || result.config === undefined) {
        onError?.(result.error ?? '路径配置保存失败')
        return
      }
      setConfig(result.config)
      setBrainRoot(result.config.brainRoot)
      setManagerUrl(result.config.managerUrl)
      setApiBase(result.config.managerUrl)
      onNotice?.('路径配置已保存：管理器地址即时生效，Brain 路径在下次启动管理器时生效')
    } catch (e) {
      onError?.(reasonOf(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <SettingsSection
      title="路径"
      description="Brain 根目录与管理器地址。其余路径（launcher / 脚本 / 日志）由根目录自动派生，不用逐个填。"
    >
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
            value={brainRoot}
            disabled={config === null || saving}
            placeholder="留空则用 BRAIN_ROOT 环境变量"
            onChange={(event) => setBrainRoot(event.target.value)}
            aria-label="Brain 根目录"
          />
        </label>
        <label className="bc-settings-wide">
          管理器地址
          <input
            className="bc-settings-input-wide"
            value={managerUrl}
            disabled={config === null || saving}
            placeholder="留空则用默认 http://127.0.0.1:19998"
            onChange={(event) => setManagerUrl(event.target.value)}
            aria-label="管理器地址"
          />
        </label>
        <Button size="sm" variant="outline" disabled={config === null || saving} onClick={() => void save()}>
          {saving ? '保存中…' : '保存路径配置'}
        </Button>
      </div>
      {config !== null && (
        <div className="bc-settings-derived">
          <span>派生路径（来源：{config.sources.brainRoot}）</span>
          <div className="bc-settings-derived-row"><span>管理器脚本</span><code>{config.scriptPath || '—'}</code></div>
          <div className="bc-settings-derived-row"><span>launcher</span><code>{config.launcherPath || '—'}</code></div>
          <div className="bc-settings-derived-row"><span>pythonw</span><code>{config.pythonw}</code></div>
          <div className="bc-settings-derived-row"><span>配置文件</span><code>{config.configFile}</code></div>
          <div className="bc-settings-derived-row">
            <span>检查</span>
            <code>脚本 {config.scriptExists ? '存在' : '缺失'} · launcher {config.launcherPath !== '' && config.launcherExists ? '存在' : '缺失'}</code>
          </div>
        </div>
      )}
    </SettingsSection>
  )
}
