/**
 * Note header: title when the document has no H1, the folder breadcrumb, and
 * the source switch. Backlinks live on the rail tab, the status bar, and the
 * in-document section, so the header does not repeat them.
 * @module dsh-obsidian-vault/client/ui/note/NoteHeader
 */
import type { NoteDto } from '../../../protocol.ts'
import type { Translate } from '../../i18n.ts'
import type { MenuScene } from '../menu/registry.ts'
import { css } from '../theme.ts'

/** Props for {@link NoteHeader}. */
export interface NoteHeaderProps {
  readonly t: Translate
  readonly note: NoteDto
  readonly onPathFilter: (prefix: string) => void
  /**
   * Open the shared context menu for the note file this header names; absent
   * when the surface has no menu host.
   */
  readonly onMenu?: (scene: MenuScene, x: number, y: number) => void
  /** Switch the same Markdown file to its source view; absent without one. */
  readonly onSource?: () => void
  /** Open the print window for this note; absent without a reading surface. */
  readonly onPrint?: () => void
  /** Toggle the in-document backlinks section; absent when the note has none. */
  readonly onToggleBacklinks?: () => void
  /** Whether that section currently renders. */
  readonly backlinksVisible?: boolean
}

/**
 * Render the note header.
 * @param props - the note and the header actions.
 */
export function NoteHeader({
  t, note, onPathFilter, onSource, onPrint, onToggleBacklinks, backlinksVisible = true, onMenu,
}: NoteHeaderProps): JSX.Element {
  const folders = note.path.split('/').slice(0, -1)

  return (
    <header
      className={css.noteHead}
      onContextMenu={(event) => {
        if (onMenu === undefined) return
        event.preventDefault()
        // The header names exactly one file, so the file menu applies unchanged.
        onMenu({ kind: 'tree-file', path: note.path }, event.clientX, event.clientY)
      }}
    >
      {note.headings[0]?.level === 1 ? null : <h1 className={css.title}>{note.title}</h1>}
      <div className={css.noteHeadRow}>
        <nav className={css.breadcrumb} aria-label={note.path}>
          {folders.map((folder, index) => {
            const prefix = folders.slice(0, index + 1).join('/')
            return (
              <span key={prefix}>
                {index > 0 ? <span className={css.breadcrumbSep}>/</span> : null}
                <button type="button" className={css.breadcrumbItem} onClick={() => onPathFilter(prefix)}>
                  {folder}
                </button>
              </span>
            )
          })}
          {folders.length > 0 ? <span className={css.breadcrumbSep}>/</span> : null}
          <span className={css.path}>{note.path.slice(note.path.lastIndexOf('/') + 1)}</span>
        </nav>
        {onToggleBacklinks === undefined
          ? null
          : (
            <button
              type="button"
              className={css.button}
              onClick={onToggleBacklinks}
              aria-pressed={backlinksVisible}
              title={t('backlinks')}
            >
              {backlinksVisible ? t('backlinksHide') : t('backlinksShow')}
            </button>
          )}
        {onPrint === undefined ? null : (
          <button type="button" className={css.button} onClick={onPrint} title={t('print')}>
            {t('print')}
          </button>
        )}
        {onSource === undefined ? null : (
          <button type="button" className={css.button} onClick={onSource} title={t('source')}>
            {t('source')}
          </button>
        )}
      </div>
    </header>
  )
}
