/**
 * Promise-driven dialogs for the React Pur pane: a one-line text prompt
 * (export names, URLs) and a searchable markdown note picker used by
 * add-note-link and link-note flows. No `window.prompt`.
 * @module dsh-obsidian-vault/client/pur/picker
 */
import { useEffect, useState } from 'react'
import type { Translate } from '../i18n.ts'
import { css } from '../ui/kit/index.ts'
import { listMarkdownNotes } from './loader.ts'

/** Props for {@link PurPrompt}. */
export interface PurPromptProps {
  /** The workspace translator. */
  readonly t: Translate
  /** Dialog heading. */
  readonly title: string
  /** Initial input value. */
  readonly initial: string
  /** Settle the prompt; null means dismissed. */
  readonly resolve: (value: string | null) => void
}

/**
 * A one-line text prompt dialog; Enter or the confirm button submits the
 * trimmed text, Escape or an outside click dismisses with null.
 * @param props - the prompt configuration.
 */
export function PurPrompt(props: PurPromptProps): JSX.Element {
  const [value, setValue] = useState(props.initial)
  const submit = (): void => {
    props.resolve(value.trim() === '' ? null : value.trim())
  }
  return (
    <div className={css.dialogLayer} onMouseDown={(event) => {
      if (event.target === event.currentTarget) props.resolve(null)
    }}>
      <div
        className={css.dialog}
        role="dialog"
        onKeyDown={(event) => {
          event.stopPropagation()
          if (event.key === 'Escape') props.resolve(null)
          if (event.key === 'Enter') submit()
        }}
      >
        <div className={css.dialogHead}>
          <span className={css.dialogTitle}>{props.title}</span>
        </div>
        <div className={css.dialogBody}>
          <input className={css.input} value={value} placeholder={props.t('pur.urlPromptPlaceholder')} onChange={(event) => setValue(event.target.value)} autoFocus />
        </div>
        <div className={css.dialogActions}>
          <button type="button" className={css.dialogButton} onClick={() => props.resolve(null)}>{props.t('pur.cancel')}</button>
          <button type="button" className={css.dialogButtonPrimary} onClick={submit}>{props.t('pur.confirm')}</button>
        </div>
      </div>
    </div>
  )
}

/** Props for {@link PurNotePicker}. */
export interface PurNotePickerProps {
  /** The workspace translator. */
  readonly t: Translate
  /** Settle the picker with a vault path; null means dismissed. */
  readonly resolve: (path: string | null) => void
}

/**
 * A searchable list of the vault's markdown notes; picking one settles the
 * dialog with its path, Escape or an outside click dismisses with null.
 * @param props - the picker configuration.
 */
export function PurNotePicker(props: PurNotePickerProps): JSX.Element {
  const [notes, setNotes] = useState<readonly string[] | null>(null)
  const [query, setQuery] = useState('')
  useEffect(() => {
    let cancelled = false
    void listMarkdownNotes().then((list) => {
      if (!cancelled) setNotes(list)
    })
    return () => {
      cancelled = true
    }
  }, [])
  const queryLower = query.trim().toLowerCase()
  const shown = (notes ?? []).filter((path) => query.trim() === '' || path.toLowerCase().includes(queryLower)).slice(0, 50)
  return (
    <div className={css.dialogLayer} onMouseDown={(event) => {
      if (event.target === event.currentTarget) props.resolve(null)
    }}>
      <div
        className={css.dialog}
        role="dialog"
        onKeyDown={(event) => {
          event.stopPropagation()
          if (event.key === 'Escape') props.resolve(null)
        }}
      >
        <div className={css.dialogHead}>
          <span className={css.dialogTitle}>{props.t('pur.pickNote')}</span>
        </div>
        <div className={css.dialogBody}>
          <input className={css.input} value={query} placeholder={props.t('pur.pickNote')} onChange={(event) => setQuery(event.target.value)} autoFocus />
          <div className={css.purNoteList}>
            {notes === null ? <span className={css.dialogHint}>{props.t('pur.imageLoading')}</span> : null}
            {shown.map((path) => (
              <div key={path} className={css.quickItem} onClick={() => props.resolve(path)}>
                <span className={css.quickLine}>{path.replace(/\.md$/i, '')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
