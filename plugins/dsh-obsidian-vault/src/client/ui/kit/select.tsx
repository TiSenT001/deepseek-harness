/**
 * Kit select: a button plus a themed listbox. The native element is not used
 * because its option list is drawn by the OS (light-blue highlight in dark
 * mode); this keeps the closed control and the open list on the same tokens as
 * the rest of the chrome.
 * @module dsh-obsidian-vault/client/ui/kit/select
 */
import { useEffect, useRef, useState } from 'react'
import { css } from './classes.ts'

/** One choice in a {@link Select}. */
export interface SelectOption {
  readonly value: string
  readonly label: string
}

/** Props for {@link Select}. */
export interface SelectProps {
  readonly value: string
  readonly options: readonly SelectOption[]
  readonly onChange: (value: string) => void
  /** Accessible name; the visible label is the trigger text. */
  readonly ariaLabel?: string
  /** Extra classes on the wrapper, for compact placements. */
  readonly className?: string
}

/**
 * Render a dropdown whose list matches the vault chrome.
 * @param props - current value, options, and the change callback.
 */
export function Select({ value, options, onChange, ariaLabel, className }: SelectProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const current = options.find(option => option.value === value) ?? options[0]

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event: PointerEvent): void => {
      if (rootRef.current !== null && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const step = (delta: number): void => {
    if (options.length === 0) return
    const index = Math.max(0, options.findIndex(option => option.value === value))
    const next = options[(index + delta + options.length) % options.length]
    if (next !== undefined) onChange(next.value)
  }

  return (
    <div className={`${css.selectRoot} ${className ?? ''}`.trim()} ref={rootRef}>
      <button
        type="button"
        className={css.selectTrigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen(value => !value)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            step(1)
          } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            step(-1)
          }
        }}
      >
        <span className={css.selectLabel}>{current?.label ?? ''}</span>
        <span className={css.selectChevron} aria-hidden="true">▾</span>
      </button>
      {open
        ? (
          <ul className={css.selectMenu} role="listbox" aria-label={ariaLabel}>
            {options.map(option => (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  className={css.selectOption}
                  aria-selected={option.value === value}
                  data-active={option.value === value ? 'true' : undefined}
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        )
        : null}
    </div>
  )
}
