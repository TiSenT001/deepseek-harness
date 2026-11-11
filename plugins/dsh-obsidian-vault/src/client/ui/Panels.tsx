/**
 * The right rail: outline (with the heading in view highlighted) and backlinks
 * with unlinked mentions.
 * @module dsh-obsidian-vault/client/ui/Panels
 */
import type { BacklinkDto, NoteDto } from '../../protocol.ts'
import type { Translate } from '../i18n.ts'
import type { BookmarkEntry } from './bookmarks.ts'
import { renderBacklinks } from './panels/Backlinks.tsx'
import { renderBookmarks } from './panels/Bookmarks.tsx'
import { renderOutgoing } from './panels/Outgoing.tsx'
import { Outline } from './panels/Outline.tsx'
import { railSurface, RAIL_SURFACES, type RailId } from './kit/registry.ts'
import type { MenuScene } from './menu/registry.ts'
import { css } from './theme.ts'

/** Rail panels the page can show. */
export type Rail = RailId

/** Props for {@link RailPanel}. */
export interface RailProps {
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
  /** Create an unresolved outgoing link. */
  readonly onCreate?: (target: string) => void
  /** Ask the page to open the shared context menu for a rail tab. */
  readonly onMenu: (scene: MenuScene, x: number, y: number) => void
  /** Extra classes, used by the narrow-screen drawer state. */
  readonly className?: string
}

const TABS: readonly Rail[] = RAIL_SURFACES.map(surface => surface.id)

/** Rail surface label from the registry, falling back to the id. */
function surfaceLabel(id: Rail): Parameters<Translate>[0] {
  return railSurface(id)?.label ?? 'outline'
}

/**
 * Render the rail with its tab strip.
 * @param props - the active tab and its data.
 */
export function RailPanel({
  t, rail, note, backlinks, unlinked, activeHeading, bookmarks, onRail, onOpen, onHeading, onShiftHeading,
  onRemoveBookmark, onCreate, onMenu, className,
}: RailProps): JSX.Element {
  // Rows inherit the explorer's file menu: a backlink or a bookmark names a real
  // vault file, so 打开/新标签页/复制链接/关系图 all apply unchanged.
  const rowMenu = (path: string, x: number, y: number): void => {
    onMenu({ kind: 'tree-file', path }, x, y)
  }
  return (

    <aside className={`${css.rail} ${className ?? ''}`.trim()}>
      <nav className={css.tabs} aria-label={t('vault')}>
        {TABS.map(tab => (
          <button
            key={tab}
            type="button"
            className={`${css.tab} ${tab === rail ? css.active : ''}`}
            onClick={() => onRail(tab)}
            onContextMenu={(event) => {
              event.preventDefault()
              onMenu({ kind: 'panel', rail: tab }, event.clientX, event.clientY)
            }}
          >
            {t(surfaceLabel(tab))}
            {tab === 'backlinks' && backlinks.length + unlinked.length > 0
              ? <span className={css.tabCount}>{backlinks.length + unlinked.length}</span>
              : null}
            {tab === 'outgoing' && note !== undefined && note.links.length > 0
              ? <span className={css.tabCount}>{note.links.length}</span>
              : null}
          </button>
        ))}
      </nav>
      <div className={css.panel}>
        {rail === 'outline'
          ? <Outline t={t} note={note} activeHeading={activeHeading} onHeading={onHeading} onShift={onShiftHeading} />
          : null}
        {rail === 'backlinks' ? renderBacklinks(t, backlinks, unlinked, onOpen, rowMenu) : null}
        {rail === 'outgoing' ? renderOutgoing(t, note, onOpen, onCreate) : null}
        {rail === 'bookmarks' ? renderBookmarks(t, bookmarks, onOpen, onRemoveBookmark, rowMenu) : null}
      </div>
    </aside>
  )
}
