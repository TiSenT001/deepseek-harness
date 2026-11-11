/**
 * The right rail column: the outline/backlinks panel plus, while docked, its
 * resize handle.
 * @module dsh-obsidian-vault/client/ui/RailColumn
 */
import type { BacklinkDto, NoteDto } from '../../protocol.ts'
import type { Translate } from '../i18n.ts'
import type { BookmarkEntry } from './bookmarks.ts'
import { RailPanel, type Rail } from './Panels.tsx'
import { Splitter } from './Splitter.tsx'
import type { MenuScene } from './menu/registry.ts'
import { css } from './theme.ts'

/** Props for {@link RailColumn}. */
export interface RailColumnProps {
  readonly t: Translate
  readonly rail: Rail
  readonly note: NoteDto | undefined
  readonly backlinks: readonly BacklinkDto[]
  readonly unlinked: readonly BacklinkDto[]
  readonly activeHeading: string | undefined
  readonly bookmarks: readonly BookmarkEntry[]
  readonly onRail: (rail: Rail) => void
  readonly onOpen: (path: string) => void
  readonly onHeading: (text: string) => void
  /** Promote or demote the heading on a 1-based body line. */
  readonly onShiftHeading: (line: number, delta: number) => void
  readonly onRemoveBookmark: (path: string) => void
  /** Create an unresolved outgoing link from the rail. */
  readonly onCreate?: (target: string) => void
  readonly onMenu: (scene: MenuScene, x: number, y: number) => void
  /** True below the docked breakpoint, where the pane becomes a drawer. */
  readonly narrow: boolean
  readonly open: boolean
  readonly width: number
  readonly onResize: (width: number) => void
  readonly onResetWidth: () => void
}

/**
 * Render the rail and its splitter.
 * @param props - the active tab, its data, and the pane width.
 */
export function RailColumn(props: RailColumnProps): JSX.Element {
  const {
    t, rail, note, backlinks, unlinked, activeHeading, bookmarks, onRail, onOpen, onHeading, onShiftHeading,
    onRemoveBookmark, onCreate, onMenu, narrow, open, width, onResize, onResetWidth,
  } = props

  return (
    <>
      {open && !narrow
        ? (
          <Splitter
            side="right"
            value={width}
            label={t('resizeRail')}
            onChange={(_side, value) => onResize(value)}
            onReset={onResetWidth}
          />
        )
        : null}
      <RailPanel
        t={t}
        rail={rail}
        note={note}
        backlinks={backlinks}
        unlinked={unlinked}
        activeHeading={activeHeading}
        bookmarks={bookmarks}
        onRail={onRail}
        onOpen={onOpen}
        onHeading={onHeading}
        onShiftHeading={onShiftHeading}
        onRemoveBookmark={onRemoveBookmark}
        {...(onCreate === undefined ? {} : { onCreate })}
        onMenu={onMenu}
        className={narrow
          ? (open ? css.paneOpen : '')
          : (open ? '' : css.paneHidden)}
      />
    </>
  )
}
