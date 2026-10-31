/**
 * The one context-menu renderer: grouped items, nested submenus, viewport
 * clamping, arrow/Enter/Escape navigation, first-letter jumps, and focus
 * restore. Every surface renders its scene through this component.
 * @module dsh-obsidian-vault/client/ui/menu/ContextMenu
 */
import {
  useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { Icon } from '../Icon.tsx'
import { css } from '../kit/index.ts'
import type { MenuGroup, MenuItem } from './types.ts'

/** Props for {@link ContextMenu}. */
export interface ContextMenuProps {
  readonly x: number
  readonly y: number
  readonly groups: readonly MenuGroup[]
  /** Accessible name, normally the action that opened the menu. */
  readonly label: string
  readonly onClose: () => void
}

interface PanelProps {
  readonly groups: readonly MenuGroup[]
  readonly x: number
  readonly y: number
  readonly label: string
  /** 0 for the root panel; nested panels use their own keyboard back step. */
  readonly level: number
  readonly onClose: () => void
  readonly onBack?: () => void
}

interface SubmenuState {
  readonly index: number
  readonly x: number
  readonly y: number
}

/** Gap between a submenu and its parent item, in px. */
const SUBMENU_OFFSET = 2

/**
 * Render a menu at a pointer position.
 * @param props - position, item groups, and the close callback.
 */
export function ContextMenu({ x, y, groups, label, onClose }: ContextMenuProps): JSX.Element {
  const restoreRef = useRef<Element | null>(null)
  useEffect(() => {
    restoreRef.current = document.activeElement
    return () => {
      const target = restoreRef.current
      if (target instanceof HTMLElement && target.isConnected) target.focus()
    }
  }, [])
  return (
    <>
      <div
        className={css.menuLayer}
        onPointerDown={onClose}
        onContextMenu={(event) => {
          event.preventDefault()
          onClose()
        }}
      />
      <MenuPanel groups={groups} x={x} y={y} label={label} level={0} onClose={onClose} />
    </>
  )
}

/**
 * One menu panel; nested panels render their own event handling.
 * @param props - the panel's items, position, and close chain.
 */
function MenuPanel({ groups, x, y, label, level, onClose, onBack }: PanelProps): JSX.Element {
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: x, top: y })
  const [active, setActive] = useState(0)
  const [submenu, setSubmenu] = useState<SubmenuState | undefined>()

  const flat = useMemo(() => groups.flat(), [groups])
  const bases = useMemo(() => {
    const starts: number[] = []
    let running = 0
    for (const group of groups) {
      starts.push(running)
      running += group.length
    }
    return starts
  }, [groups])

  useLayoutEffect(() => {
    const element = panelRef.current
    if (element === null) return
    // Clamp before paint so the panel never crosses a viewport edge.
    const rect = element.getBoundingClientRect()
    const maxLeft = Math.max(4, window.innerWidth - rect.width - 4)
    const maxTop = Math.max(4, window.innerHeight - rect.height - 4)
    setPos({
      left: Math.max(4, Math.min(x, maxLeft)),
      top: Math.max(4, Math.min(y, maxTop)),
    })
  }, [x, y, groups])

  useEffect(() => {
    panelRef.current?.focus()
  }, [])

  const itemAt = (index: number): MenuItem | undefined => flat[index]

  const nextEnabled = (from: number, step: 1 | -1): number => {
    if (flat.length === 0) return -1
    let index = from
    for (let count = 0; count < flat.length; count += 1) {
      index = (index + step + flat.length) % flat.length
      const item = flat[index]
      if (item !== undefined && item.disabled !== true) return index
    }
    return from
  }

  const openSubmenu = (index: number): void => {
    const element = panelRef.current?.querySelector<HTMLElement>(`[data-menu-index="${index}"]`)
    if (element === null || element === undefined) return
    const rect = element.getBoundingClientRect()
    setSubmenu({ index, x: rect.right + SUBMENU_OFFSET, y: rect.top - 4 })
  }

  const closeSubmenu = (): void => {
    setSubmenu(undefined)
    panelRef.current?.focus()
  }

  const activate = (item: MenuItem | undefined): void => {
    if (item === undefined || item.disabled === true) return
    if (item.children !== undefined) {
      const index = flat.indexOf(item)
      if (index !== -1) openSubmenu(index)
      return
    }
    item.onSelect?.()
    onClose()
  }

  const onKey = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    const key = event.key
    if (key === 'ArrowDown') {
      event.preventDefault()
      setActive(current => nextEnabled(current, 1))
      return
    }
    if (key === 'ArrowUp') {
      event.preventDefault()
      setActive(current => nextEnabled(current, -1))
      return
    }
    if (key === 'Home') {
      event.preventDefault()
      setActive(nextEnabled(-1, 1))
      return
    }
    if (key === 'End') {
      event.preventDefault()
      setActive(nextEnabled(0, -1))
      return
    }
    if (key === 'ArrowRight') {
      const item = itemAt(active)
      if (item?.children === undefined) return
      event.preventDefault()
      openSubmenu(active)
      return
    }
    if (key === 'ArrowLeft') {
      event.preventDefault()
      if (onBack === undefined) onClose()
      else onBack()
      return
    }
    if (key === 'Enter' || key === ' ') {
      event.preventDefault()
      activate(itemAt(active))
      return
    }
    if (key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      onClose()
      return
    }
    if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const needle = key.toLowerCase()
      const start = active + 1
      for (let step = 0; step < flat.length; step += 1) {
        const index = (start + step) % flat.length
        const item = flat[index]
        if (item === undefined || item.disabled === true) continue
        if (!item.label.toLowerCase().startsWith(needle)) continue
        event.preventDefault()
        setActive(index)
        return
      }
    }
  }

  return (
    <>
      <div
        ref={panelRef}
        className={`${css.menu} ${level > 0 ? css.menuSub : ''}`.trim()}
        // A folder list can hold every directory in the vault; cap the panel so
        // it scrolls inside the viewport instead of running off the bottom edge.
        style={{ ...pos, maxHeight: 'calc(100vh - 24px)', overflowY: 'auto' }}
        role="menu"
        aria-label={label}
        tabIndex={-1}
        data-menu-level={level}
        onKeyDown={onKey}
      >
        {groups.map((group, groupIndex) => (
          <div key={groupIndex} className={css.menuGroup} role="group">
            {group.map((item, itemIndex) => {
              const index = (bases[groupIndex] ?? 0) + itemIndex
              const isActive = index === active
              return (
                <button
                  key={item.id}
                  type="button"
                  role={item.checked === undefined ? 'menuitem' : 'menuitemcheckbox'}
                  aria-checked={item.checked}
                  data-menu-index={index}
                  data-menu-id={item.id}
                  aria-disabled={item.disabled === true}
                  aria-haspopup={item.children === undefined ? undefined : 'menu'}
                  aria-expanded={item.children !== undefined && submenu?.index === index}
                  className={`${css.menuItem} ${isActive ? css.menuItemActive : ''} ${item.danger === true ? css.menuItemDanger : ''}`.trim()}
                  onPointerEnter={() => {
                    if (item.disabled === true) return
                    setActive(index)
                    if (item.children === undefined) setSubmenu(undefined)
                    else openSubmenu(index)
                  }}
                  onClick={() => activate(item)}
                >
                  <span className={css.menuItemIcon} aria-hidden="true">
                    {item.checked === true ? '✓' : item.icon === undefined ? null : <Icon name={item.icon} size={13} />}
                  </span>
                  <span className={css.menuItemLabel}>{item.label}</span>
                  {item.shortcut === undefined ? null : <kbd className={css.menuShortcut}>{item.shortcut}</kbd>}
                  {item.children === undefined ? null : <span className={css.menuCaret} aria-hidden="true">›</span>}
                </button>
              )
            })}
          </div>
        ))}
      </div>
      {submenu === undefined
        ? null
        : (
          <MenuPanel
            groups={submenuGroups(flat[submenu.index])}
            x={submenu.x}
            y={submenu.y}
            label={label}
            level={level + 1}
            onClose={onClose}
            onBack={closeSubmenu}
          />
        )}
    </>
  )
}

/** Children of one parent item as a single group; empty when it has none. */
function submenuGroups(item: MenuItem | undefined): readonly MenuGroup[] {
  if (item?.children === undefined || item.children.length === 0) return []
  return [item.children]
}
