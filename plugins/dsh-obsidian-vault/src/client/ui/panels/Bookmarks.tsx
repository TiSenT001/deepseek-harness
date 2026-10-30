/**
 * Bookmark panel: the files the user pinned, each row opening its note and a
 * trailing control removing the entry from `bookmarks.json`.
 * @module dsh-obsidian-vault/client/ui/panels/Bookmarks
 */
import type { Translate } from '../../i18n.ts'
import type { BookmarkEntry } from '../bookmarks.ts'
import { css } from '../theme.ts'

function bookmarks(
  t: Translate,
  entries: readonly BookmarkEntry[],
  onOpen: (path: string) => void,
  onRemove: (path: string) => void,
): JSX.Element {
  return <BookmarksPanel t={t} entries={entries} onOpen={onOpen} onRemove={onRemove} />
}

/**
 * One rail panel listing bookmarks.
 * @param props - translator, entries, and the open and remove callbacks.
 */
function BookmarksPanel({
  t, entries, onOpen, onRemove,
}: {
  readonly t: Translate
  readonly entries: readonly BookmarkEntry[]
  readonly onOpen: (path: string) => void
  readonly onRemove: (path: string) => void
}): JSX.Element {
  if (entries.length === 0) return <div className={css.empty}>{t('noBookmarks')}</div>
  return (
    <>
      <div className={css.sectionTitle}>{t('bookmarks')} · {entries.length}</div>
      {entries.map(entry => (
        <div key={entry.path} className={css.bookmarkRow}>
          <button type="button" className={css.item} title={entry.path} onClick={() => onOpen(entry.path)}>
            <span className={css.backlinkName}>{entry.title ?? stemOf(entry.path)}</span>
            <div className={css.itemMeta}>{entry.path}</div>
          </button>
          <button
            type="button"
            className={css.bookmarkRemove}
            title={t('bookmarkRemove')}
            aria-label={t('bookmarkRemove')}
            onClick={() => onRemove(entry.path)}
          >
            ×
          </button>
        </div>
      ))}
    </>
  )
}

/** File name without its `.md` extension. */
function stemOf(path: string): string {
  const name = path.slice(path.lastIndexOf('/') + 1)
  return name.replace(/\.md$/i, '')
}

export { bookmarks as renderBookmarks }
