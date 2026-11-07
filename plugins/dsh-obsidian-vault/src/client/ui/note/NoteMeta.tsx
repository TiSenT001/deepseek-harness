/**
 * Frontmatter properties and body tags rendered above the document, matching
 * Obsidian's property list and tag row. Property values are editable in place:
 * the edit writes the note through the same guarded save as the source editor, so
 * an external change surfaces as a conflict instead of being overwritten.
 * @module dsh-obsidian-vault/client/ui/note/NoteMeta
 */
import { useState } from 'react'
import type { NoteDto } from '../../../protocol.ts'
import { ApiError, fetchFile, saveNote } from '../../api.ts'
import type { Translate } from '../../i18n.ts'
import { setFrontmatterProperty, yamlTextOf } from '../../markdown/frontmatter-edit.ts'
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
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** Values written from this panel, shown until the index refresh lands. */
  const [overrides, setOverrides] = useState<ReadonlyMap<string, string | null>>(new Map())

  const properties = Object.entries(note.frontmatter)
    .filter(([key]) => !overrides.has(key))
  const shown = [...properties, ...[...overrides].filter(([, value]) => value !== null).map(([key, value]) => [key, value] as const)]

  const startEdit = (key: string, value: unknown): void => {
    setEditing(key)
    setDraft(yamlTextOf(value))
    setError(null)
  }

  const save = async (key: string): Promise<void> => {
    setSaving(true)
    setError(null)
    try {
      const file = await fetchFile(note.path)
      const edit = setFrontmatterProperty(file.text ?? '', key, draft)
      await saveNote(note.path, edit.text, file.mtime)
      setOverrides(current => new Map(current).set(key, edit.value))
      setEditing(null)
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 409) setError(t('propertyConflict'))
      else setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {shown.length > 0
        ? (
          <section className={css.properties} aria-label={t('properties')}>
            {shown.map(([key, value]) => (
              <div key={key} className={css.propertyRow}>
                <span className={css.propertyKey}>
                  <span className={css.propertyIcon} aria-hidden="true">{propertyIcon(value)}</span>
                  {key}
                </span>
                {editing === key
                  ? (
                    <span className={css.propertyEdit}>
                      <input
                        className={css.propertyInput}
                        value={draft}
                        autoFocus
                        aria-label={t('propertyEdit')}
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            void save(key)
                          }
                          if (event.key === 'Escape') {
                            event.preventDefault()
                            setEditing(null)
                          }
                        }}
                      />
                      <button type="button" className={css.button} disabled={saving} onClick={() => void save(key)}>
                        {saving ? t('saving') : t('save')}
                      </button>
                      <button type="button" className={css.button} onClick={() => setEditing(null)}>{t('cancel')}</button>
                      {error === null ? null : <span className={css.propertyError} role="alert">{error}</span>}
                    </span>
                  )
                  : (
                    <button
                      type="button"
                      className={`${css.propertyValue} ${css.propertyEditable}`}
                      title={t('propertyEdit')}
                      aria-label={`${t('propertyEdit')}: ${key}`}
                      onClick={() => startEdit(key, value)}
                    >
                      {formatValue(value)}
                    </button>
                  )}
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
