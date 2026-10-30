/**
 * The Pur context menu as a React overlay: renders the kernel's
 * {@link PurMenuModel} with hover-opened submenus, `separatorAfter` dividers,
 * and an inline range input for the opacity entry. Entry clicks dispatch
 * through the pane; the slider previews on input and commits on change.
 * @module dsh-obsidian-vault/client/pur/menu
 */
import { useState } from 'react'
import type { PurMenuEntry, PurMenuModel, PurMenuPoint } from '../../pur-kernel/index.ts'
import type { PurLabelBundles } from '../i18n/pur-labels.ts'
import { css } from '../ui/theme.ts'

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
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000 }}
      onMouseDown={props.onClose}
      onContextMenu={(event) => {
        event.preventDefault()
        props.onClose()
      }}
    >
      <div
        className={css.menu}
        style={{ position: 'fixed', left, top, minWidth: 180, maxHeight: '70vh', overflowY: 'auto' }}
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
  const [openId, setOpenId] = useState<string | null>(null)
  return (
    <>
      {props.entries.map((entry, index) => (
        <div key={`${entry.id}:${index}`} style={{ position: 'relative' }}>
          {entry.id === 'opacity' && entry.value !== undefined ? (
            <div className={css.menuItem} onMouseEnter={() => setOpenId(null)}>
              <span className={css.menuItemLabel}>{props.labels.menuTitle(entry)}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                defaultValue={entry.value}
                style={{ width: 90 }}
                onClick={(event) => event.stopPropagation()}
                onInput={(event) => props.onPreviewOpacity(Number((event.target as HTMLInputElement).value))}
                onChange={(event) => {
                  props.onAction(entry.id, Number((event.target as HTMLInputElement).value))
                  props.onClose()
                }}
              />
            </div>
          ) : (
            <div
              className={css.menuItem}
              onMouseEnter={() => setOpenId(entry.children !== undefined ? entry.id : null)}
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
          {entry.children !== undefined && openId === entry.id ? (
            <div className={css.menu} style={{ position: 'absolute', left: '100%', top: 0, minWidth: 160, maxHeight: '60vh', overflowY: 'auto' }}>
              <PurMenuEntries entries={entry.children} labels={props.labels} onAction={props.onAction} onPreviewOpacity={props.onPreviewOpacity} onClose={props.onClose} />
            </div>
          ) : null}
          {entry.separatorAfter === true ? <div style={{ borderTop: '1px solid rgba(128,128,128,0.3)', margin: '4px 6px' }} /> : null}
        </div>
      ))}
    </>
  )
}
