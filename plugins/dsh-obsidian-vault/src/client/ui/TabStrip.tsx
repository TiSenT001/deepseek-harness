/**
 * Document tab strip: preview tabs, drag reorder, middle-click close, the
 * new-tab button, an overflow list when tabs no longer fit, and the scene
 * request for the shared context menu.
 * @module dsh-obsidian-vault/client/ui/TabStrip
 */
import { useEffect, useRef, useState } from 'react'
import type { NoteDto } from '../../protocol.ts'
import type { Translate } from '../i18n.ts'
import type { MenuScene } from './menu/registry.ts'
import type { DocTab } from './tabs.ts'
import { css } from './theme.ts'

/** Props for {@link TabStrip}. */
export interface TabStripProps {
  readonly t: Translate
  readonly tabs: readonly DocTab[]
  readonly active: number
  readonly note: NoteDto | undefined
  readonly path: string | undefined
  readonly onSelect: (index: number) => void
  readonly onClose: (index: number) => void
  readonly onPin: (index: number) => void
  readonly onNew: () => void
  /** Move one tab to another position. */
  readonly onReorder: (from: number, to: number) => void
  /** Ask the page to open the shared context menu for a tab or the empty bar. */
  readonly onMenu: (scene: MenuScene, x: number, y: number) => void
}

/**
 * Render the tab bar.
 * @param props - tabs, active index, and the tab actions.
 */
export function TabStrip({
  t, tabs, active, note, path, onSelect, onClose, onPin, onNew, onReorder, onMenu,
}: TabStripProps): JSX.Element {
  const stripRef = useRef<HTMLDivElement>(null)
  const overflowRef = useRef<HTMLButtonElement>(null)
  const [overflow, setOverflow] = useState(false)
  const [open, setOpen] = useState(false)
  const [dragFrom, setDragFrom] = useState<number | undefined>()
  const [dropIndex, setDropIndex] = useState<number | undefined>()

  useEffect(() => {
    const element = stripRef.current
    if (element === null) return
    const measure = (): void => setOverflow(element.scrollWidth > element.clientWidth + 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [tabs.length])

  useEffect(() => {
    const element = stripRef.current?.children[active]
    if (element instanceof HTMLElement) element.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [active, tabs.length])

  useEffect(() => {
    if (!open) return
    const onDown = (event: MouseEvent): void => {
      const target = event.target instanceof Element ? event.target : undefined
      if (overflowRef.current?.contains(event.target as Node) === true) return
      if (target !== undefined && target.closest(`.${css.tabOverflow}`) !== null) return
      setOpen(false)
    }
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (tabs.length === 0) setOpen(false)
  }, [tabs.length])

  return (
    <div
      className={css.tabBar}
      onContextMenu={(event) => {
        // Any right-click on the bar that missed a tab row — the strip padding,
        // the new-tab button, the overflow trigger — opens the empty menu; tab
        // rows stop propagation with their own menu.
        if ((event.target as HTMLElement).closest('.ov-doctab') !== null) return
        event.preventDefault()
        onMenu({ kind: 'tabbar-empty' }, event.clientX, event.clientY)
      }}
    >
      <div className={css.tabStrip} ref={stripRef} role="tablist">
        {tabs.map((tab, index) => (
          <div
            key={`${tab.path}\u0000${index}`}
            role="tab"
            aria-selected={index === active}
            className={`${css.docTab} ${index === active ? css.docTabActive : ''} ${tab.preview ? css.docTabPreview : ''} ${dropIndex === index && dragFrom !== index ? css.doctabDrop : ''}`.trim()}
            title={tab.path}
            draggable
            onClick={() => onSelect(index)}
            onDoubleClick={() => onPin(index)}
            onAuxClick={(event) => {
              if (event.button === 1) onClose(index)
            }}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = 'move'
              event.dataTransfer.setData('text/plain', tab.path)
              setDragFrom(index)
            }}
            onDragOver={(event) => {
              if (dragFrom === undefined) return
              event.preventDefault()
              event.dataTransfer.dropEffect = 'move'
              setDropIndex(index)
            }}
            onDragLeave={() => setDropIndex(current => (current === index ? undefined : current))}
            onDrop={(event) => {
              event.preventDefault()
              if (dragFrom !== undefined) onReorder(dragFrom, index)
              setDragFrom(undefined)
              setDropIndex(undefined)
            }}
            onDragEnd={() => {
              setDragFrom(undefined)
              setDropIndex(undefined)
            }}
            onContextMenu={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onMenu({ kind: 'tab', index, path: tab.path, preview: tab.preview }, event.clientX, event.clientY)
            }}
          >
            <span className={css.docTabLabel}>{tabTitle(t, tab.path, note, path)}</span>
            <button
              type="button"
              className={css.docTabClose}
              aria-label={t('closeTab')}
              onClick={(event) => {
                event.stopPropagation()
                onClose(index)
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className={css.docTabNew}
        title={t('newTab')}
        aria-label={t('newTab')}
        onClick={onNew}
      >
        +
      </button>
      <button
        type="button"
        className={css.docTabMenu}
        title={t('tabMenu')}
        aria-label={t('tabMenu')}
        aria-haspopup="menu"
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          onMenu({ kind: 'tabbar-empty' }, rect.left, rect.bottom)
        }}
      >
        …
      </button>
      {overflow && tabs.length > 0
        ? (
          <button
            type="button"
            ref={overflowRef}
            className={css.tabOverflowButton}
            title={t('allTabs')}
            aria-label={t('allTabs')}
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen(value => !value)}
          >
            ▾
          </button>
        )
        : null}
      {open
        ? (
          <div className={css.tabOverflow} role="menu" aria-label={t('allTabs')}>
            {tabs.map((tab, index) => (
              <div key={`${tab.path}\u0000${index}`} className={css.tabOverflowRow}>
                <button
                  type="button"
                  role="menuitem"
                  className={`${css.tabOverflowItem} ${index === active ? css.tabOverflowActive : ''}`.trim()}
                  title={tab.path}
                  onClick={() => {
                    onSelect(index)
                    setOpen(false)
                  }}
                >
                  {tabTitle(t, tab.path, note, path)}
                </button>
                <button
                  type="button"
                  className={css.tabOverflowClose}
                  aria-label={t('closeTab')}
                  onClick={() => onClose(index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )
        : null}
    </div>
  )
}

/** Tab label: the open note's title when it is the loaded one, else the file stem. */
/** Tab label: the open note's title when it is the loaded one, else a friendly name. */
function tabTitle(t: Translate, item: string, note: NoteDto | undefined, active: string | undefined): string {
  if (note !== undefined && item === active) return note.title
  // A plugin-owned picture is addressed as `pur-asset:<id>`; the tab shows the
  // preview label plus a short id instead of that internal scheme.
  if (item.startsWith('pur-asset:')) {
    const id = item.slice('pur-asset:'.length).replace(/\.[^.]+$/, '')
    return `${t('previewImage')} · ${id.slice(0, 8)}`
  }
  const name = item.slice(item.lastIndexOf('/') + 1)
  return name.replace(/\.md$/i, '')
}
