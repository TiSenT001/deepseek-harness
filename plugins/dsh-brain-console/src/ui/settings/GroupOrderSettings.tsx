/**
 * 分组顺序：按 /units 返回的分组拉列表，↑↓ 调整后存 localStorage。
 */
import { useEffect, useState } from 'react'
import { jget } from '../../api.ts'
import { loadPrefs, savePrefs } from '../../prefs.ts'
import { Button } from '../primitives.ts'
import { SettingsSection } from './SettingsSection.tsx'

export interface GroupOrderSettingsProps {
  /** 保存成功提示 */
  onNotice?: (message: string) => void
}

/**
 * 渲染分组顺序设置分组。
 * @param props - 提示回调
 * @returns 分组元素
 */
export function GroupOrderSettings({ onNotice }: GroupOrderSettingsProps): JSX.Element {
  const [groupOrder, setGroupOrder] = useState<string[]>([])

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

  const move = (index: number, offset: -1 | 1): void => {
    const target = index + offset
    const next = [...groupOrder]
    const current = next[index]
    const other = next[target]
    if (current === undefined || other === undefined) return
    next[target] = current
    next[index] = other
    setGroupOrder(savePrefs({ groupOrder: next }).groupOrder)
    onNotice?.('分组顺序已保存')
  }

  return (
    <SettingsSection title="分组顺序" description="调整首页服务分组的先后；顺序保存在本机浏览器。">
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
              onClick={() => move(index, -1)}
            >
              ↑
            </Button>
            <Button
              size="sm"
              variant="ghost"
              aria-label={`下移 ${name}`}
              disabled={index === groupOrder.length - 1}
              onClick={() => move(index, 1)}
            >
              ↓
            </Button>
          </div>
        ))}
      </div>
    </SettingsSection>
  )
}
