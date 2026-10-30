/**
 * Tag filter dropdown for the graph toolbar: a filterable popover, because a
 * native select over hundreds of tags is unusable. Row 0 clears the filter.
 * @module dsh-obsidian-vault/client/ui/graph/TagPicker
 */
import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { TagCountDto } from '../../../protocol.ts'
import type { Translate } from '../../i18n.ts'
import { css } from '../theme.ts'

/** Props for {@link TagPicker}. */
export interface TagPickerProps {
  readonly t: Translate
  readonly options: readonly TagCountDto[]
  readonly value: string
  readonly onChange: (tag: string) => void
}

/**
 * Render the tag filter.
 * @param props - tags with counts, the active tag, and the change callback.
 */
export function TagPicker({ t, options, value, onChange }: TagPickerProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase().replace(/^#/, '')
    if (needle.length === 0) return options
    return options.filter(option => option.tag.toLowerCase().includes(needle))
  }, [options, query])

  useEffect(() => {
    if (!open) return
    setQuery('')
    setIndex(0)
    inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    listRef.current?.children[index]?.scrollIntoView({ block: 'nearest' })
  }, [index])

  const choose = (tag: string): void => {
    onChange(tag)
    setOpen(false)
  }

  const onKey = (event: ReactKeyboardEvent): void => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setIndex(current => Math.min(filtered.length, current + 1))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setIndex(current => Math.max(0, current - 1))
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      choose(index === 0 ? '' : (filtered[index - 1]?.tag ?? ''))
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
    }
  }

  return (
    <span className={css.tagPicker}>
      <button
        type="button"
        className={css.pill}
        aria-label={t('filterTag')}
        aria-expanded={open}
        title={t('filterTag')}
        onClick={() => setOpen(value => !value)}
      >
        {value.length === 0 ? t('allTags') : `#${value}`}
        <span aria-hidden="true">▾</span>
      </button>
      {open
        ? (
          <>
            <div className={css.menuLayer} onPointerDown={() => setOpen(false)} />
            <div className={css.tagPop} role="listbox" aria-label={t('filterTag')}>
              <input
                ref={inputRef}
                className={css.tagPopInput}
                value={query}
                placeholder={t('searchTags')}
                aria-label={t('searchTags')}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setIndex(0)
                }}
                onKeyDown={onKey}
              />
              <div ref={listRef} className={css.tagPopList}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === ''}
                  data-selected={value === ''}
                  className={`${css.tagPopItem} ${index === 0 ? css.tagPopActive : ''}`.trim()}
                  onPointerEnter={() => setIndex(0)}
                  onClick={() => choose('')}
                >
                  <span>{t('allTags')}</span>
                </button>
                {filtered.map((option, position) => (
                  <button
                    key={option.tag}
                    type="button"
                    role="option"
                    aria-selected={value === option.tag}
                    data-selected={value === option.tag}
                    className={`${css.tagPopItem} ${index === position + 1 ? css.tagPopActive : ''}`.trim()}
                    onPointerEnter={() => setIndex(position + 1)}
                    onClick={() => choose(option.tag)}
                  >
                    <span>#{option.tag}</span>
                    <span className={css.tagPopCount}>{option.count}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )
        : null}
    </span>
  )
}
