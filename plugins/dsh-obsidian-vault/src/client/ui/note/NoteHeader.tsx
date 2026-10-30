/**
 * Note header: title when the document has no H1, the folder breadcrumb, and
 * the source switch. Backlinks live on the rail tab, the status bar, and the
 * in-document section, so the header does not repeat them.
 * @module dsh-obsidian-vault/client/ui/note/NoteHeader
 */
import type { NoteDto } from '../../../protocol.ts'
import type { Translate } from '../../i18n.ts'
import { css } from '../theme.ts'

/** Props for {@link NoteHeader}. */
export interface NoteHeaderProps {
  readonly t: Translate
  readonly note: NoteDto
  readonly onPathFilter: (prefix: string) => void
  /** Switch the same Markdown file to its source view; absent without one. */
  readonly onSource?: () => void
}

/**
 * Render the note header.
 * @param props - the note and the header actions.
 */
export function NoteHeader({ t, note, onPathFilter, onSource }: NoteHeaderProps): JSX.Element {
  const folders = note.path.split('/').slice(0, -1)

  return (
    <header className={css.noteHead}>
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
        {onSource === undefined ? null : (
          <button type="button" className={css.button} onClick={onSource} title={t('source')}>
            {t('source')}
          </button>
        )}
      </div>
    </header>
  )
}
