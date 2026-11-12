/**
 * Note composer-style merge dialog: pick another Markdown note, preview the
 * merged body, and append it to the current note under a heading.
 * @module dsh-obsidian-vault/client/ui/MergeNotesDialog
 */
import { useEffect, useMemo, useState } from 'react'
import type { Translate } from '../i18n.ts'
import { fetchNote, saveNote } from '../api-vault.ts'
import { mergeNoteBodies } from './note-merge.ts'
import { Icon } from './Icon.tsx'
import { css } from './theme.ts'

/** Props for {@link MergeNotesDialog}. */
export interface MergeNotesDialogProps {
  readonly t: Translate
  /** Current Markdown note that receives the merged body. */
  readonly path: string
  /** Other Markdown files in the vault. */
  readonly notes: readonly string[]
  readonly onClose: () => void
  readonly onMerged: () => void
}

/**
 * Render the merge dialog.
 * @param props - target note, candidate paths and completion callbacks.
 */
export function MergeNotesDialog({ t, path, notes, onClose, onMerged }: MergeNotesDialogProps): JSX.Element {
  const [target, setTarget] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    void fetchNote(path)
      .then((note) => { if (!cancelled) setTarget(note.content) })
      .catch((cause: unknown) => { if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause)) })
    return () => { cancelled = true }
  }, [path])
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return needle.length === 0 ? notes : notes.filter(note => note.toLowerCase().includes(needle))
  }, [notes, query])
  const pick = (note: string): void => {
    setSelected(note)
    setError(null)
    void (async () => {
      try {
        const source = await fetchNote(note)
        setPreview(target === null ? '' : mergeNoteBodies(target, { title: source.title, content: source.content }))
      } catch (cause: unknown) {
        setError(cause instanceof Error ? cause.message : String(cause))
      }
    })()
  }
  const confirm = (): void => {
    if (selected === null || preview.length === 0 || busy) return
    setBusy(true)
    void saveNote(path, preview)
      .then(() => { onMerged(); onClose() })
      .catch((cause: unknown) => { setError(cause instanceof Error ? cause.message : String(cause)) })
      .finally(() => setBusy(false))
  }
  return (
    <div
      className={css.dialogLayer}
      role="presentation"
      onMouseDown={onClose}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          onClose()
        }
      }}
    >
      <div
        className={`${css.dialog} ${css.mergeDialog}`}
        role="dialog"
        aria-modal="true"
        aria-label={t('mergeNotes')}
        onMouseDown={event => event.stopPropagation()}
      >
        <header className={css.dialogHead}>
          <span className={css.dialogTitle}>{t('mergeNotes')}</span>
          <button type="button" className={css.dialogClose} aria-label={t('close')} title={t('close')} onClick={onClose}>
            <Icon name="close" size={14} />
          </button>
        </header>
        <div className={css.dialogBody}>
          <div className={css.templateField}>
            <span className={css.templateLabel}>{t('mergeSource')}</span>
            <input
              className={css.dialogInput}
              value={query}
              aria-label={t('mergeSearch')}
              placeholder={t('mergeSearch')}
              onChange={event => setQuery(event.target.value)}
            />
          </div>
          <div className={css.mergeList} role="listbox" aria-label={t('mergeSource')}>
            {filtered.length === 0
              ? <p className={css.templateEmpty}>{t('mergeEmpty')}</p>
              : filtered.map(note => (
                <button
                  key={note}
                  type="button"
                  role="option"
                  aria-selected={selected === note}
                  className={`${css.mergeRow} ${selected === note ? css.mergeRowActive : ''}`.trim()}
                  onClick={() => pick(note)}
                >
                  {note}
                </button>
              ))}
          </div>
          <div className={css.mergePreviewHead}>{t('mergePreview')}</div>
          <pre className={css.mergePreview}>{preview || t('mergeSelectFirst')}</pre>
          {target === null && error === null ? <p className={css.mergeStatus}>{t('loadingNote')}</p> : null}
          {error === null ? null : <p className={css.mergeStatus}>{t('mergeFailed')}: {error}</p>}
          <div className={css.dialogActions}>
            <button type="button" className={css.dialogButton} onClick={onClose}>{t('cancel')}</button>
            <button
              type="button"
              className={`${css.dialogButton} ${css.dialogButtonPrimary}`.trim()}
              disabled={selected === null || preview.length === 0 || busy}
              onClick={confirm}
            >
              {busy ? t('mergeWorking') : t('mergeAction')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
