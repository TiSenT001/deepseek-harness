/**
 * Markdown source editor: a full-file editor with a colour layer, debounced
 * autosave, `Ctrl+S` / `Ctrl+E`, find and replace, Markdown shortcuts, and a
 * conflict bar when the file changed on disk since this editor read it.
 * @module dsh-obsidian-vault/client/ui/editor/SourceEditor
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Translate } from '../../i18n.ts'
import { ApiError, fetchFile, saveNote } from '../../api.ts'
import { css } from '../theme.ts'
import { markdownTokens, tokenClass } from './markdown-tokens.ts'
import {
  findMatches,
  indentLines,
  newlineContinuation,
  outdentLines,
  replaceAll,
  replaceMatch,
  wrapSelection,
  type EditResult,
  type Match,
} from './source-edit.ts'

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

/** Highlight segments for one text, in one pass. */
function highlighted(text: string, tokens: ReturnType<typeof markdownTokens>): JSX.Element[] {
  const nodes: JSX.Element[] = []
  let cursor = 0
  tokens.forEach((token, index) => {
    if (token.start > cursor) nodes.push(<span key={`p${index}`}>{text.slice(cursor, token.start)}</span>)
    nodes.push(
      <span key={`t${index}`} className={tokenClass(token.kind)}>{text.slice(token.start, token.end)}</span>,
    )
    cursor = token.end
  })
  if (cursor < text.length) nodes.push(<span key="tail">{text.slice(cursor)}</span>)
  return nodes
}

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
  const root = useRef<HTMLDivElement | null>(null)
  const area = useRef<HTMLTextAreaElement | null>(null)
  const highlight = useRef<HTMLPreElement | null>(null)

  const [findOpen, setFindOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [replacement, setReplacement] = useState('')
  const [active, setActive] = useState(0)
  const findInput = useRef<HTMLInputElement | null>(null)
  const matches = useMemo<Match[]>(() => findMatches(draft, query), [draft, query])

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

  /** Apply a text edit and restore its selection on the next frame. */
  const applyEdit = useCallback((result: EditResult): void => {
    latest.current = result.text
    setDraft(result.text)
    schedule()
    window.requestAnimationFrame(() => {
      const element = area.current
      if (element === null) return
      element.focus()
      element.setSelectionRange(result.start, result.end)
    })
  }, [schedule])

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

  /** Select one match by index, scrolling it into view through the textarea. */
  const selectMatch = useCallback((index: number): void => {
    const element = area.current
    const match = matches[index]
    if (element === null || match === undefined) return
    element.focus()
    element.setSelectionRange(match.start, match.end)
    setActive(index)
  }, [matches])

  const openFind = useCallback((): void => {
    setFindOpen(true)
    window.requestAnimationFrame(() => findInput.current?.focus())
  }, [])

  const closeFind = useCallback((): void => {
    setFindOpen(false)
    area.current?.focus()
  }, [])

  const dirty = draft !== saved.current
  const tokens = useMemo(() => markdownTokens(draft), [draft])
  const counter = query.length === 0
    ? t('editorHint')
    : matches.length === 0
      ? t('editorFindNone')
      : t('editorFindCount').replace('{current}', String(Math.min(active + 1, matches.length))).replace('{total}', String(matches.length))

  // The page binds Ctrl+F to full-text search on window; stopping propagation on
  // the editor root keeps the two find surfaces from opening together.
  useEffect(() => {
    const node = root.current
    if (node === null) return
    const onKey = (event: KeyboardEvent): void => {
      const accel = event.ctrlKey || event.metaKey
      if (accel && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        event.stopPropagation()
        openFind()
        return
      }
      if (event.key === 'Escape' && findOpen) {
        event.preventDefault()
        event.stopPropagation()
        closeFind()
      }
    }
    node.addEventListener('keydown', onKey)
    return () => node.removeEventListener('keydown', onKey)
  }, [closeFind, findOpen, openFind])

  return (
    <div ref={root} className={css.editorView}>
      <div className={css.codeHead}>
        <span className={css.codeLang}>{t('modeEdit')}</span>
        <span className={css.codeMeta}>{t('editorHint')}</span>
        <span className={css.codeActions}>
          <button type="button" className={css.button} onClick={openFind} aria-label={t('editorFind')}>
            {t('editorFind')}
          </button>
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
      {findOpen
        ? (
          <div className={css.editorFind} role="search">
            <input
              ref={findInput}
              className={css.editorFindInput}
              value={query}
              placeholder={t('editorFindPlaceholder')}
              aria-label={t('editorFind')}
              onChange={(event) => {
                setQuery(event.target.value)
                setActive(0)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault()
                  closeFind()
                }
                if (event.key === 'Enter') {
                  event.preventDefault()
                  if (matches.length === 0) return
                  const next = (active + (event.shiftKey ? matches.length - 1 : 1)) % matches.length
                  selectMatch(next)
                }
              }}
            />
            <span className={css.editorFindCount}>{counter}</span>
            <button type="button" className={css.button} onClick={() => selectMatch((active + matches.length - 1) % Math.max(1, matches.length))} disabled={matches.length === 0}>
              {t('editorFindPrev')}
            </button>
            <button type="button" className={css.button} onClick={() => selectMatch((active + 1) % Math.max(1, matches.length))} disabled={matches.length === 0}>
              {t('editorFindNext')}
            </button>
            <input
              className={css.editorFindInput}
              value={replacement}
              placeholder={t('editorReplacePlaceholder')}
              aria-label={t('editorReplace')}
              onChange={(event) => setReplacement(event.target.value)}
            />
            <button
              type="button"
              className={css.button}
              disabled={matches.length === 0}
              onClick={() => {
                const match = matches[active]
                if (match === undefined) return
                applyEdit(replaceMatch(draft, match, replacement))
                setActive(0)
              }}
            >
              {t('editorReplaceOne')}
            </button>
            <button
              type="button"
              className={css.button}
              disabled={matches.length === 0}
              onClick={() => {
                applyEdit(replaceAll(draft, query, replacement))
                setActive(0)
              }}
            >
              {t('editorReplaceAll')}
            </button>
            <button type="button" className={css.button} onClick={closeFind}>{t('close')}</button>
          </div>
        )
        : null}
      <div className={css.editorCanvas}>
        <pre ref={highlight} className={css.editorHighlight} aria-hidden="true">{highlighted(draft, tokens)}{'\n'}</pre>
        <textarea
          ref={area}
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
          onScroll={(event) => {
            const pre = highlight.current
            if (pre === null) return
            pre.scrollTop = event.currentTarget.scrollTop
            pre.scrollLeft = event.currentTarget.scrollLeft
          }}
          onKeyDown={(event) => {
            const element = event.currentTarget
            const start = element.selectionStart
            const end = element.selectionEnd
            const command = event.ctrlKey || event.metaKey
            const key = event.key.toLowerCase()

            if (command && key === 'f') {
              event.preventDefault()
              event.stopPropagation()
              openFind()
              return
            }
            if (event.key === 'Escape' && findOpen) {
              event.preventDefault()
              closeFind()
              return
            }
            if (event.key === 'Tab') {
              event.preventDefault()
              applyEdit(event.shiftKey ? outdentLines(draft, start, end) : indentLines(draft, start, end))
              return
            }
            if (command && (key === 's' || key === 'e')) {
              event.preventDefault()
              if (key === 's') void save(latest.current, false)
              else onReading()
              return
            }
            if (command && key === 'b') {
              event.preventDefault()
              applyEdit(wrapSelection(draft, start, end, '**', '**'))
              return
            }
            if (command && key === 'i') {
              event.preventDefault()
              applyEdit(wrapSelection(draft, start, end, '*', '*'))
              return
            }
            if (command && key === 'k') {
              event.preventDefault()
              applyEdit(wrapSelection(draft, start, end, '[', ']()'))
              return
            }
            if (event.key === 'Enter' && !event.shiftKey && !command) {
              const continuation = newlineContinuation(draft, start)
              if (continuation === null) return
              event.preventDefault()
              const next = draft.slice(0, start) + continuation + draft.slice(end)
              applyEdit({ text: next, start: start + continuation.length, end: start + continuation.length })
            }
          }}
        />
      </div>
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
