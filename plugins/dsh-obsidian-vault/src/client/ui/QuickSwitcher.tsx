/**
 * Command palette: fuzzy file switching by default; Tab or a leading `?`
 * switches to full-text search, and a leading `>` lists runnable commands.
 * Arrow keys navigate, Enter opens the hit or runs the command.
 * @module dsh-obsidian-vault/client/ui/QuickSwitcher
 */
import { useEffect, useRef, useState } from 'react'
import type { SearchHitDto } from '../../protocol.ts'
import { fetchSearch } from '../api.ts'
import { buildSearchQuery, DEFAULT_SEARCH_OPTIONS, parseSearchOptions, SEARCH_OPTIONS_KEY, serializeSearchOptions, type SearchOptions } from './searchPrefs.ts'
import type { Translate } from '../i18n.ts'
import type { CommandEntry } from './commands.ts'
import { css } from './theme.ts'

/** Palette mode: file switching hides body matches; search shows everything with snippets. */
export type QuickMode = 'files' | 'search' | 'commands'

/** Props for {@link QuickSwitcher}. */
export interface QuickSwitcherProps {
  readonly t: Translate
  /** Mode the palette opens in. */
  readonly initialMode?: QuickMode
  /** Query to pre-fill, used by tag chips and the search rail entry. */
  readonly initialQuery?: string
  /** Commands listed by the command mode; absent where the page has none. */
  readonly commands?: readonly CommandEntry[]
  readonly onOpen: (path: string) => void
  /** Run one palette command by id; the page closes the palette itself. */
  readonly onCommand?: (id: string) => void
  readonly onClose: () => void
}

/**
 * Render the palette overlay.
 * @param props - initial mode and query, commands, navigation callbacks, and dismissal.
 */
export function QuickSwitcher({
  t, initialMode = 'files', initialQuery = '', commands = [], onOpen, onCommand, onClose,
}: QuickSwitcherProps): JSX.Element {
  const [mode, setMode] = useState<QuickMode>(initialMode)
  const [query, setQuery] = useState(initialQuery)
  const [hits, setHits] = useState<readonly SearchHitDto[]>([])
  const [active, setActive] = useState(0)
  const [options, setOptions] = useState<SearchOptions>(() => {
    try {
      return parseSearchOptions(window.localStorage.getItem(SEARCH_OPTIONS_KEY))
    } catch {
      // Storage can be unavailable (private mode, disabled cookies).
      return DEFAULT_SEARCH_OPTIONS
    }
  })
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    input.current?.focus()
  }, [])

  useEffect(() => {
    const text = query.trim()
    if (text.length === 0 || mode === 'commands') {
      setHits([])
      return
    }
    let cancelled = false
    const timer = setTimeout(() => {
      void fetchSearch(buildSearchQuery(text, options)).then(items => {
        if (cancelled) return
        setHits(items)
        setActive(0)
      }).catch(() => {
        if (!cancelled) setHits([])
      })
    }, 120)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [mode, query, options])

  const visible = mode === 'files' ? hits.filter(hit => hit.kind !== 'content') : hits
  const needle = query.trim().toLowerCase()
  const matched = mode === 'commands'
    ? commands.filter(entry => entry.label.toLowerCase().includes(needle))
    : []
  const shown = mode === 'commands' ? matched.length : visible.length
  // Typing narrows the list under a highlight that may sit past the new end,
  // so every read of the list clamps to the last remaining row.
  const cursor = shown === 0 ? 0 : Math.min(active, shown - 1)

  const onQuery = (value: string): void => {
    setActive(0)
    if (value.startsWith('>')) {
      setMode('commands')
      setQuery(value.slice(1))
      return
    }
    if (mode === 'files' && value.startsWith('?')) {
      setMode('search')
      setQuery(value.slice(1))
      return
    }
    setQuery(value)
  }

  const toggleOption = (key: keyof SearchOptions): void => {
    setOptions((previous) => {
      const next = { ...previous, [key]: !previous[key] }
      try {
        window.localStorage.setItem(SEARCH_OPTIONS_KEY, serializeSearchOptions(next))
      } catch {
        // Persisting is best-effort; the toggle still works for this mount.
      }
      return next
    })
  }

  const toggleMode = (): void => {
    setMode(current => (current === 'files' ? 'search' : 'files'))
    setActive(0)
  }

  return (
    <div className={css.quickLayer} role="presentation" onMouseDown={onClose}>
      <div className={css.quick} role="dialog" aria-label={t('quickSwitch')} onMouseDown={event => event.stopPropagation()}>
        <input
          ref={input}
          className={css.quickInput}
          value={query}
          placeholder={mode === 'search' ? t('searchPlaceholder') : t('quickPlaceholder')}
          onChange={event => onQuery(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Escape') {
              event.preventDefault()
              onClose()
              return
            }
            if (event.key === 'Tab') {
              event.preventDefault()
              toggleMode()
              return
            }
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setActive(Math.min(cursor + 1, Math.max(0, shown - 1)))
              return
            }
            if (event.key === 'ArrowUp') {
              event.preventDefault()
              setActive(Math.max(cursor - 1, 0))
              return
            }
            if (event.key === 'Enter') {
              event.preventDefault()
              if (mode === 'commands') {
                const entry = matched[cursor]
                if (entry !== undefined) onCommand?.(entry.id)
                return
              }
              const hit = visible[cursor]
              if (hit !== undefined) {
                onOpen(hit.path)
                onClose()
              }
            }
          }}
        />
        <div className={css.quickList}>
          {shown === 0
            ? (
              <div className={css.empty}>
                {query.trim().length === 0
                  ? mode === 'search'
                    ? t('searchHint')
                    : mode === 'commands' ? t('quickCommandsHint') : ''
                  : t('noResults')}
              </div>
            )
            : mode === 'commands'
              ? matched.map((entry, index) => (
                <button
                  key={entry.id}
                  type="button"
                  className={`${css.item} ${css.quickItem} ${index === cursor ? css.active : ''}`}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => onCommand?.(entry.id)}
                >
                  <span>{entry.label}</span>
                  {entry.hint === undefined ? null : <span className={css.quickKind}>{entry.hint}</span>}
                </button>
              ))
              : visible.map((hit, index) => mode === 'search'
                ? (
                <button
                  key={hit.path}
                  type="button"
                  className={`${css.item} ${index === cursor ? css.active : ''}`}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => {
                    onOpen(hit.path)
                    onClose()
                  }}
                >
                  <span className={css.quickLine}>
                    <span>{hit.title}</span>
                    <span className={css.quickKind}>{hit.kind} · {hit.path}</span>
                  </span>
                  {hit.snippet === undefined
                    ? null
                    : <span className={css.quickSnippet}>{highlight(hit.snippet, query)}</span>}
                </button>
              )
              : (
                <button
                  key={hit.path}
                  type="button"
                  className={`${css.item} ${css.quickItem} ${index === cursor ? css.active : ''}`}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => {
                    onOpen(hit.path)
                    onClose()
                  }}
                >
                  <span>{hit.title}</span>
                  <span className={css.quickKind}>{hit.kind} · {hit.path}</span>
                </button>
              ))}
        </div>
        <div className={css.quickFoot}>
          <span className={css.quickMode}>{t(mode === 'search' ? 'quickModeSearch' : mode === 'commands' ? 'quickModeCommands' : 'quickModeFiles')}</span>
          {mode === 'search'
            ? (
              <>
                <button
                  type='button'
                  className={css.button}
                  aria-pressed={options.matchCase}
                  title={t('searchMatchCase')}
                  onClick={() => toggleOption('matchCase')}
                >
                  Aa
                </button>
                <button
                  type='button'
                  className={css.button}
                  aria-pressed={options.regex}
                  title={t('searchRegex')}
                  onClick={() => toggleOption('regex')}
                >
                  .*
                </button>
              </>
            )
            : null}
          {query.trim().length > 0 ? <span>{shown} {t('results')}</span> : null}
          <span className={css.quickHint}>
            <kbd className={css.pillKbd}>&gt;</kbd>
            {t('quickCommandsHint')}
          </span>
          <span className={css.quickHint}>
            <kbd className={css.pillKbd}>Tab</kbd>
            {t('quickTabHint')}
          </span>
        </div>
      </div>
    </div>
  )
}

/** Wrap every case-insensitive occurrence of the query in `<mark>`. */
function highlight(text: string, query: string): Array<string | JSX.Element> {
  const needle = query.trim()
  if (needle.length === 0) return [text]
  const lower = text.toLowerCase()
  const target = needle.toLowerCase()
  const parts: Array<string | JSX.Element> = []
  let cursor = 0
  let index = lower.indexOf(target)
  let key = 0
  while (index !== -1) {
    if (index > cursor) parts.push(text.slice(cursor, index))
    parts.push(<mark key={`m${key}`} className={css.highlight}>{text.slice(index, index + needle.length)}</mark>)
    key += 1
    cursor = index + needle.length
    index = lower.indexOf(target, cursor)
  }
  if (cursor < text.length) parts.push(text.slice(cursor))
  return parts
}
