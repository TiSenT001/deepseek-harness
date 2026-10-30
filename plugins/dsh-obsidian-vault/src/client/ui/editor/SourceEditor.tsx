/**
 * Markdown source editor: a full-file textarea with debounced autosave,
 * `Ctrl+S` / `Ctrl+E`, and a conflict bar when the file changed on disk since
 * this editor read it.
 * @module dsh-obsidian-vault/client/ui/editor/SourceEditor
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Translate } from '../../i18n.ts'
import { ApiError, fetchFile, saveNote } from '../../api.ts'
import { css } from '../theme.ts'

/** Quiet period after the last keystroke before an autosave runs. */
const AUTOSAVE_MS = 800

/** Props for {@link SourceEditor}. */
export interface SourceEditorProps {
  readonly t: Translate
  /** Vault-relative Markdown path. */
  readonly path: string
  /** Full text the file view already fetched. */
  readonly text: string
  /** Modification time that text came from; `undefined` disables the stale check. */
  readonly mtime: number | undefined
  /** Leave the editor for the reading view. */
  readonly onReading: () => void
  /** Called after a successful write so the page reloads the index. */
  readonly onSaved?: () => void
}

type SaveState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'saving' }
  | { readonly kind: 'saved' }
  | { readonly kind: 'conflict' }
  | { readonly kind: 'error'; readonly message: string }

/**
 * Render the Markdown editor for one note.
 * @param props - the note text, its modification time, and view callbacks.
 */
export function SourceEditor({ t, path, text, mtime, onReading, onSaved }: SourceEditorProps): JSX.Element {
  const [draft, setDraft] = useState(text)
  // A ref, not state: timers scheduled during an in-flight save must read the
  // freshest mtime, or a debounced write fires with the pre-save value and the
  // editor conflicts with its own autosave.
  const baseMtime = useRef(mtime)
  const [state, setState] = useState<SaveState>({ kind: 'idle' })
  const saved = useRef(text)
  const latest = useRef(text)
  const timer = useRef<number | undefined>(undefined)
  const saving = useRef(false)

  const save = useCallback(async (content: string, force: boolean): Promise<void> => {
    if (saving.current) return
    if (!force && content === saved.current) {
      setState({ kind: 'idle' })
      return
    }
    saving.current = true
    setState({ kind: 'saving' })
    try {
      const next = await saveNote(path, content, force ? undefined : baseMtime.current)
      saved.current = content
      baseMtime.current = next
      // A keystroke during the write keeps the dirty flag and the next autosave.
      setState(latest.current === content ? { kind: 'saved' } : { kind: 'idle' })
      onSaved?.()
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 409) setState({ kind: 'conflict' })
      else setState({ kind: 'error', message: cause instanceof Error ? cause.message : String(cause) })
    } finally {
      saving.current = false
    }
  }, [onSaved, path])

  const schedule = useCallback((): void => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      if (latest.current === saved.current) return
      void save(latest.current, false)
    }, AUTOSAVE_MS)
  }, [save])

  // Leaving the editor with unflushed keystrokes writes them rather than
  // dropping them; the user already confirmed the text is what they want.
  useEffect(() => () => {
    window.clearTimeout(timer.current)
    if (latest.current !== saved.current) void saveNote(path, latest.current).catch(() => undefined)
  }, [path])

  const reload = useCallback((): void => {
    void fetchFile(path)
      .then((file) => {
        const next = file.text ?? ''
        setDraft(next)
        baseMtime.current = file.mtime
        saved.current = next
        latest.current = next
        setState({ kind: 'idle' })
      })
      .catch((cause: unknown) => {
        setState({ kind: 'error', message: cause instanceof Error ? cause.message : String(cause) })
      })
  }, [path])

  const dirty = draft !== saved.current

  return (
    <div className={css.editorView}>
      <div className={css.codeHead}>
        <span className={css.codeLang}>{t('modeEdit')}</span>
        <span className={css.codeMeta}>{t('editorHint')}</span>
        <span className={css.codeActions}>
          <button type="button" className={css.button} onClick={onReading} aria-label={t('reading')}>
            {t('reading')}
          </button>
        </span>
      </div>
      {state.kind === 'conflict'
        ? (
          <div className={css.editorConflict} role="alert">
            <span className={css.editorConflictText}>{t('conflictTitle')}</span>
            <button type="button" className={css.button} onClick={reload}>{t('conflictReload')}</button>
            <button type="button" className={css.button} onClick={() => void save(latest.current, true)}>
              {t('conflictOverwrite')}
            </button>
          </div>
        )
        : null}
      {state.kind === 'error'
        ? <div className={css.codeNotice}>{t('saveFailed')}: {state.message}</div>
        : null}
      <textarea
        className={css.editorArea}
        aria-label={t('editorLabel')}
        value={draft}
        spellCheck={false}
        onChange={(event) => {
          const value = event.currentTarget.value
          latest.current = value
          setDraft(value)
          schedule()
        }}
        onKeyDown={(event) => {
          if (!(event.ctrlKey || event.metaKey)) return
          const key = event.key.toLowerCase()
          if (key === 's') {
            event.preventDefault()
            void save(latest.current, false)
          } else if (key === 'e') {
            event.preventDefault()
            onReading()
          }
        }}
      />
      <div className={css.editorStatus}>
        {state.kind === 'saving'
          ? t('saving')
          : state.kind === 'saved' && !dirty
            ? t('saved')
            : dirty
              ? t('unsaved')
              : t('editorHint')}
      </div>
    </div>
  )
}
