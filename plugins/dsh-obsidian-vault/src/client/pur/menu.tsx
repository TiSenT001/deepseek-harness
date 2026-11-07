/**
 * The Pur context menu as a React overlay: renders the kernel's
 * {@link PurMenuModel} with hover-opened submenus, `separatorAfter` dividers,
 * and an inline range input for the opacity entry. Entry clicks dispatch
 * through the pane; the slider previews on input and commits on change.
 * @module dsh-obsidian-vault/client/pur/menu
 */
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PurMenuEntry, PurMenuModel, PurMenuPoint } from '../../pur-kernel/index.ts'
import type { PurLabelBundles } from '../i18n/pur-labels.ts'
import { css } from '../ui/kit/index.ts'

/** An open menu: viewport anchor, world origin and the kernel model. */
export interface PurMenuState {
  /** Viewport x of the menu. */
  readonly x: number
  /** Viewport y of the menu. */
  readonly y: number
  /** Menu origin in world coordinates, for creation commands. */
  readonly world: PurMenuPoint
  /** Element the menu was opened on, when there is one. */
  readonly targetId?: string
  /** The kernel menu model. */
  readonly model: PurMenuModel
}

/** Props for {@link PurContextMenu}. */
export interface PurContextMenuProps {
  /** The open menu. */
  readonly state: PurMenuState
  /** Localized label bundles, for entry titles. */
  readonly labels: PurLabelBundles
  /** Dispatch an entry id, with the committed value for the opacity entry. */
  readonly onAction: (id: string, value?: number) => void
  /** Preview an opacity value while the slider moves. */
  readonly onPreviewOpacity: (value: number) => void
  /** Close the menu. */
  readonly onClose: () => void
}

/** Approximate menu box, for viewport clamping. */
const MENU_W = 220
const MENU_H = 320

/**
 * Render the open context menu and its dismiss layer.
 * @param props - the menu state and dispatch callbacks.
 */
export function PurContextMenu(props: PurContextMenuProps): JSX.Element {
  const left = Math.max(4, Math.min(props.state.x, window.innerWidth - MENU_W))
  const top = Math.max(4, Math.min(props.state.y, window.innerHeight - MENU_H))
  const boxRef = useRef<HTMLDivElement | null>(null)

  // The menu has no focusable trigger, so it owns the keyboard while open:
  // Escape dismisses, the arrows walk the entries and Enter activates one.
  useEffect(() => {
    const items = (): HTMLElement[] =>
      Array.from(boxRef.current?.querySelectorAll<HTMLElement>('[data-pur-menu-item]') ?? [])
    boxRef.current?.focus()
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        props.onClose()
        return
      }
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Enter' && event.key !== ' ') return
      const all = items()
      if (all.length === 0) return
      const current = all.indexOf(document.activeElement as HTMLElement)
      if (event.key === 'Enter' || event.key === ' ') {
        const item = all[current]
        if (item === undefined) return
        event.preventDefault()
        item.click()
        return
      }
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      const next = current < 0 ? (step > 0 ? 0 : all.length - 1) : (current + step + all.length) % all.length
      all[next]?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [props])

  return (
    <div
      className={css.menuLayer}
      onMouseDown={props.onClose}
      // The menu opens on the canvas pointerup that ends a right-click, and the
      // browser fires `contextmenu` right after that same gesture. Closing here
      // would dismiss the menu in the frame it appeared, so the overlay only
      // suppresses the native menu; dismissal stays on mousedown, Escape and
      // entry activation.
      onContextMenu={(event) => event.preventDefault()}
    >
      <div
        ref={boxRef}
        role="menu"
        tabIndex={-1}
        className={`${css.menu} ${css.purMenu}`}
        style={{ left, top, outline: 'none' }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <PurMenuEntries entries={props.state.model.entries} labels={props.labels} onAction={props.onAction} onPreviewOpacity={props.onPreviewOpacity} onClose={props.onClose} />
      </div>
    </div>
  )
}

/** Props for one entry list (root or submenu). */
interface PurMenuEntriesProps {
  readonly entries: readonly PurMenuEntry[]
  readonly labels: PurLabelBundles
  readonly onAction: (id: string, value?: number) => void
  readonly onPreviewOpacity: (value: number) => void
  readonly onClose: () => void
}

/**
 * Render one entry list; entries with children open their submenu on hover.
 * @param props - the entries and dispatch callbacks.
 */
function PurMenuEntries(props: PurMenuEntriesProps): JSX.Element {
  const [submenu, setSubmenu] = useState<{ id: string; x: number; y: number } | null>(null)
  return (
    <>
      {props.entries.map((entry, index) => (
        <div key={`${entry.id}:${index}`} style={{ position: 'relative' }}>
          {entry.id === 'opacity' && entry.value !== undefined ? (
            <div className={css.menuItem} onMouseEnter={() => setSubmenu(null)}>
              <span className={css.menuItemLabel}>{props.labels.menuTitle(entry)}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                defaultValue={entry.value}
                className={css.purMenuSlider}
                onMouseDown={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
                onInput={(event) => props.onPreviewOpacity(Number((event.target as HTMLInputElement).value))}
                // React maps `onChange` to the native input event, which fires on
                // every step of a drag; committing there would close the menu after
                // the first step. Preview on input, commit on release.
                onPointerUp={(event) => {
                  props.onAction(entry.id, Number((event.currentTarget as HTMLInputElement).value))
                  props.onClose()
                }}
                onKeyUp={(event) => {
                  props.onAction(entry.id, Number((event.currentTarget as HTMLInputElement).value))
                  props.onClose()
                }}
              />
            </div>
          ) : (
            <div
              className={css.menuItem}
              role="menuitem"
              tabIndex={-1}
              data-pur-menu-item=""
              onMouseEnter={(event) => {
                if (entry.children === undefined) {
                  setSubmenu(null)
                  return
                }
                const rect = event.currentTarget.getBoundingClientRect()
                const height = entry.children.length * 28 + 16
                setSubmenu({ id: entry.id, x: Math.min(rect.right + 2, window.innerWidth - 220), y: Math.max(8, Math.min(rect.top, window.innerHeight - height)) })
              }}
              onClick={() => {
                if (entry.children !== undefined) return
                props.onAction(entry.id)
                props.onClose()
              }}
            >
              <span className={css.menuItemLabel}>{props.labels.menuTitle(entry)}</span>
              {entry.children === undefined ? null : <span className={css.menuCaret}>▸</span>}
            </div>
          )}
          {submenu !== null && submenu.id === entry.id && entry.children !== undefined
            ? createPortal(
              <div
                // Portalled out of the scrolling panel: an absolutely positioned
                // child would be clipped by the menu's overflow and become
                // invisible. `ov-menu-sub` stacks it above the dismiss layer.
                className={`${css.menu} ${css.menuSub} ${css.purMenuSub}`}
                style={{ left: submenu.x, top: submenu.y }}
                onMouseDown={(event) => event.stopPropagation()}
                onContextMenu={(event) => event.preventDefault()}
              >
                <PurMenuEntries
                  entries={entry.children}
                  labels={props.labels}
                  onAction={props.onAction}
                  onPreviewOpacity={props.onPreviewOpacity}
                  onClose={props.onClose}
                />
              </div>,
              document.body,
            )
            : null}
          {entry.separatorAfter === true ? <div className={css.menuSeparator} /> : null}
        </div>
      ))}
    </>
  )
}
