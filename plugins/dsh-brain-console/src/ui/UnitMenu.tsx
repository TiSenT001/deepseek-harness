/**
 * 单元「更多」菜单：收纳不常点的单元级设置。
 *
 * 菜单项语义：
 *   - 随管理器启动：勾选态 = enabled（管理器下次启动时是否恢复该单元，不改当前进程）
 *   - 接管为子进程：只在该单元是外部进程时出现（会重启它一次，交给管理器托管）
 */
import { useState } from 'react'
import { Button, IconEllipsis, Menu, type SharedMenuEntry } from './primitives.ts'
import type { Unit } from './types.ts'

export interface UnitMenuProps {
  /** 该菜单所属的单元 */
  unit: Unit
  /** 其他动作执行中：禁用菜单入口 */
  disabled: boolean
  /** 打开该单元的详情对话框 */
  onDetail: (name: string) => void
  /** 切换持久意愿（下次管理器启动是否恢复） */
  onToggleEnabled: (name: string, enabled: boolean) => void
  /** 接管：重启为管理器直接子进程 */
  onAdopt: (name: string) => void
}

/**
 * 渲染单元级「更多」图标按钮与它收纳的菜单。
 * @param props - 单元快照与单元级动作
 * @returns 菜单入口（含锚定菜单）
 */
export function UnitMenu({ unit, disabled, onDetail, onToggleEnabled, onAdopt }: UnitMenuProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const items: SharedMenuEntry[] = [
    { id: 'detail', label: '查看详情' },
    { id: 'enabled', label: '随管理器启动', disabled },
  ]
  if (unit.running && unit.child_of_manager === false) {
    items.push({ id: 'adopt', label: '接管为子进程（会重启）', disabled })
  }

  const select = (id: string): void => {
    setOpen(false)
    if (id === 'detail') onDetail(unit.name)
    else if (id === 'enabled') onToggleEnabled(unit.name, !unit.enabled)
    else if (id === 'adopt') onAdopt(unit.name)
  }

  return (
    <Menu
      open={open}
      anchor={(
        <Button
          size="sm"
          variant="ghost"
          className="bc-icon-btn"
          icon={<IconEllipsis size={16} />}
          aria-label="单元更多操作"
          aria-haspopup="menu"
          aria-expanded={open}
          disabled={disabled}
          onClick={() => setOpen((value) => !value)}
        />
      )}
      items={items}
      selectedId={unit.enabled ? 'enabled' : undefined}
      onSelect={select}
      onClose={() => setOpen(false)}
      align="end"
      side="bottom"
      portal
    />
  )
}
