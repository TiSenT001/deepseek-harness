/**
 * 日志设置：默认行数、默认级别、启动时是否展开上次日志（均存 localStorage）。
 */
import { useEffect, useState } from 'react'
import { LOG_LEVELS, LOG_LINE_OPTIONS, loadPrefs, savePrefs, subscribePrefs } from '../../prefs.ts'
import { Button } from '../primitives.ts'
import { SettingsSection } from './SettingsSection.tsx'

export interface LogSettingsProps {
  /** 保存成功提示 */
  onNotice?: (message: string) => void
}

/**
 * 渲染日志设置分组。
 * @param props - 提示回调
 * @returns 分组元素
 */
export function LogSettings({ onNotice }: LogSettingsProps): JSX.Element {
  const [logLines, setLogLines] = useState(() => loadPrefs().logLines)
  const [logLevel, setLogLevel] = useState(() => loadPrefs().logLevel)
  const [lastLogUnit, setLastLogUnit] = useState(() => loadPrefs().lastLogUnit)
  const [logDockOpen, setLogDockOpen] = useState(() => loadPrefs().logDockOpen)

  useEffect(() => subscribePrefs((prefs) => {
    setLastLogUnit(prefs.lastLogUnit)
    setLogDockOpen(prefs.logDockOpen)
  }), [])

  return (
    <SettingsSection title="日志" description="日志 dock 的默认行数与级别过滤；打开日志时生效。">
      <div className="bc-settings-row">
        {LOG_LINE_OPTIONS.map((lines) => (
          <Button
            key={lines}
            size="sm"
            variant={logLines === lines ? 'outline' : 'ghost'}
            onClick={() => {
              const next = savePrefs({ logLines: lines })
              setLogLines(next.logLines)
              onNotice?.(`日志行数已改为 ${lines}`)
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
              onNotice?.(`日志级别已改为 ${label}`)
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
            onNotice?.(next.logDockOpen ? '启动时会自动展开上次日志' : '启动时不再自动展开日志')
          }}
        >
          {logDockOpen ? '已开启' : '已关闭'}
        </Button>
      </div>
    </SettingsSection>
  )
}
