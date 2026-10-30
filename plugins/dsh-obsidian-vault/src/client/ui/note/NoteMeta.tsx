/**
 * Frontmatter properties and body tags rendered above the document, matching
 * Obsidian's property list and tag row.
 * @module dsh-obsidian-vault/client/ui/note/NoteMeta
 */
import type { NoteDto } from '../../../protocol.ts'
import type { Translate } from '../../i18n.ts'
import { css } from '../theme.ts'

/** Props for {@link NoteMeta}. */
export interface NoteMetaProps {
  readonly t: Translate
  readonly note: NoteDto
  readonly onTag: (tag: string) => void
}

/**
 * Render the property list and tag row; nothing when the note has neither.
 * @param props - the note and its tag handler.
 */
export function NoteMeta({ t, note, onTag }: NoteMetaProps): JSX.Element {
  const properties = Object.entries(note.frontmatter)

  return (
    <>
      {properties.length > 0
        ? (
          <section className={css.properties} aria-label={t('properties')}>
            {properties.map(([key, value]) => (
              <div key={key} className={css.propertyRow}>
                <span className={css.propertyKey}>
                  <span className={css.propertyIcon} aria-hidden="true">{propertyIcon(value)}</span>
                  {key}
                </span>
                <span className={css.propertyValue}>{formatValue(value)}</span>
              </div>
            ))}
          </section>
        )
        : null}
      {note.tags.length > 0
        ? (
          <div className={css.tagRow}>
            {note.tags.map(tag => (
              <button key={tag} type="button" className={css.chip} onClick={() => onTag(tag)}>
                #{tag}
              </button>
            ))}
          </div>
        )
        : null}
    </>
  )
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (Array.isArray(value)) return value.map(String).join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/** A small type cue in front of a property name, as Obsidian's property list does. */
function propertyIcon(value: unknown): string {
  if (Array.isArray(value)) return '≡'
  if (typeof value === 'boolean') return '☑'
  if (typeof value === 'number') return '#'
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return '◷'
  if (typeof value === 'object') return '{}'
  return 'Aa'
}
