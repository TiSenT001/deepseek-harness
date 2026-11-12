/**
 * Note composer-style split dialog: preview the rewritten index and the new
 * notes, then create the notes and replace the source headings with wikilinks.
 * @module dsh-obsidian-vault/client/ui/SplitNoteDialog
 */
import { useEffect, useMemo, useState } from 'react'
import type { Translate } from '../i18n.ts'
import { createNote, fetchNote, saveNote } from '../api-vault.ts'
import { planSplit, type SplitLevel } from './note-split.ts'
import { Icon } from './Icon.tsx'
import { css } from './theme.ts'

/** Props for {@link SplitNoteDialog}. */
export interface SplitNoteDialogProps {
  readonly t: Translate
  /** Source note being split. */
  readonly path: string
  /** Other Markdown paths in the vault, used to avoid name collisions. */
  readonly notes: readonly string[]
  readonly onClose: () => void
  readonly onSplit: () => void
}

/**
 * Render the split dialog.
 * @param props - source path, candidate paths and completion callbacks.
 */
export function SplitNoteDialog({ t, path, notes, onClose, onSplit }: SplitNoteDialogProps): JSX.Element {
  const [content, setContent] = useState<string | null>(null)
  const [level, setLevel] = useState<SplitLevel>(2)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    void fetchNote(path)
      .then((note) => { if (!cancelled) setContent(note.content) })
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
  const plan = useMemo(
    () => content === null ? { index: '', notes: [] } : planSplit(path, content, level, notes),
    [content, level, notes, path],
  )
  const confirm = (): void => {
    if (plan.notes.length === 0 || busy) return
    setBusy(true)
    setError(null)
    void (async () => {
      try {
        for (const note of plan.notes) {
          if (!(await createNote(note.path))) throw new Error(`${t('splitExists')}: ${note.path}`)
          await saveNote(note.path, note.content)
        }
        await saveNote(path, plan.index)
        onSplit()
        onClose()
      } catch (cause: unknown) {
        setError(cause instanceof Error ? cause.message : String(cause))
      } finally {
        setBusy(false)
      }
    })()
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
        aria-label={t('splitNotes')}
        onMouseDown={event => event.stopPropagation()}
      >
        <header className={css.dialogHead}>
          <span className={css.dialogTitle}>{t('splitNotes')}</span>
          <button type="button" className={css.dialogClose} aria-label={t('close')} title={t('close')} onClick={onClose}>
            <Icon name="close" size={14} />
          </button>
        </header>
        <div className={css.dialogBody}>
          <div className={css.templateField}>
            <span className={css.templateLabel}>{t('splitLevel')}</span>
            <div className={css.mergeList} role="group" aria-label={t('splitLevel')}>
              {([2, 3] as const).map(option => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={level === option}
                  className={`${css.mergeRow} ${level === option ? css.mergeRowActive : ''}`.trim()}
                  onClick={() => setLevel(option)}
                >
                  {option === 2 ? t('splitAtH2') : t('splitAtH3')}
                </button>
              ))}
            </div>
          </div>
          <div className={css.mergePreviewHead}>{t('splitPreview')}</div>
          <pre className={css.mergePreview}>{content === null ? t('loadingNote') : plan.index}</pre>
          {content !== null && plan.notes.length === 0 ? <p className={css.mergeStatus}>{t('splitEmpty')}</p> : null}
          {plan.notes.length === 0 ? null : (
            <ul className={css.splitList}>
              {plan.notes.map(note => <li key={note.path}>{note.path}</li>)}
            </ul>
          )}
          {error === null ? null : <p className={css.mergeStatus}>{t('splitFailed')}: {error}</p>}
          <div className={css.dialogActions}>
            <button type="button" className={css.dialogButton} onClick={onClose}>{t('cancel')}</button>
            <button
              type="button"
              className={`${css.dialogButton} ${css.dialogButtonPrimary}`.trim()}
              disabled={plan.notes.length === 0 || busy}
              onClick={confirm}
            >
              {busy ? t('splitWorking') : t('splitAction')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
