/**
 * Kit form controls: an Obsidian-style sliding toggle and a pointer-draggable
 * slider with a drag tooltip and keyboard support. Both are controlled and
 * theme-token driven, so any panel can use them.
 * @module dsh-obsidian-vault/client/ui/kit/controls
 */
import { useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { css } from './classes.ts'

/** Props for {@link Toggle}. */
export interface ToggleProps {
  readonly checked: boolean
  readonly label: string
  /** Accessible name; needed when the visible label is empty. */
  readonly ariaLabel?: string
  readonly onChange: (checked: boolean) => void
}

/**
 * A sliding switch; the native checkbox stays for a11y but is visually hidden.
 * @param props - checked state and change callback.
 */
export function Toggle({ checked, label, ariaLabel, onChange }: ToggleProps): JSX.Element {
  return (
    <label className={css.kitToggle} data-on={checked}>
      <input
        type="checkbox"
        checked={checked}
        aria-label={ariaLabel}
        onChange={event => onChange(event.target.checked)}
      />
      <span className={css.kitToggleTrack} aria-hidden="true">
        <span className={css.kitToggleKnob} />
      </span>
      <span className={css.kitToggleLabel}>{label}</span>
    </label>
  )
}

/** Props for {@link Slider}. */
export interface SliderProps {
  readonly value: number
  readonly min: number
  readonly max: number
  readonly step: number
  readonly label: string
  readonly onChange: (value: number) => void
  /** Value → slider position 0…1; defaults to linear. */
  readonly toPosition?: (value: number) => number
  /** Slider position 0…1 → value; defaults to linear. Inverse of toPosition. */
  readonly fromPosition?: (position: number) => number
  readonly format?: (value: number) => string
}

/**
 * A custom slider: track + fill + thumb, pointer dragging with a value
 * tooltip, and arrow-key stepping. Positions may be warped (log-ish) through
 * the optional mapping props.
 * @param props - value range and change callback.
 */
export function Slider(props: SliderProps): JSX.Element {
  const { value, min, max, step, label, onChange } = props
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const toPosition = props.toPosition ?? ((v: number): number => (v - min) / (max - min))
  const fromPosition = props.fromPosition ?? ((t: number): number => min + t * (max - min))
  const format = props.format ?? ((v: number): string => String(v))

  const clampStep = (raw: number): number => {
    const snapped = Math.round(raw / step) * step
    return Math.min(max, Math.max(min, Number(snapped.toFixed(6))))
  }

  const position = Math.min(1, Math.max(0, toPosition(value)))

  const valueAt = (clientX: number): number => {
    const track = trackRef.current
    if (track === null) return value
    const rect = track.getBoundingClientRect()
    if (rect.width === 0) return value
    const t = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    return clampStep(fromPosition(t))
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)
    onChange(valueAt(event.clientX))
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (!dragging) return
    const next = valueAt(event.clientX)
    if (next !== value) onChange(next)
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>): void => {
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const onKey = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    const delta = event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -step
      : event.key === 'ArrowRight' || event.key === 'ArrowUp' ? step
      : 0
    if (delta === 0) return
    event.preventDefault()
    onChange(clampStep(value + delta))
  }

  return (
    <div className={css.kitSlider} data-dragging={dragging}>
      <span className={css.kitSliderLabel}>{label}</span>
      <div
        ref={trackRef}
        className={css.kitSliderTrack}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={format(value)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={onKey}
      >
        <div className={css.kitSliderFill} style={{ width: `${position * 100}%` }} />
        <div className={css.kitSliderThumb} style={{ left: `${position * 100}%` }} />
        {dragging
          ? <div className={css.kitSliderTip} style={{ left: `${position * 100}%` }}>{format(value)}</div>
          : null}
      </div>
      <span className={css.kitSliderValue}>{format(value)}</span>
    </div>
  )
}

/** Props for {@link SettingsRow}. */
export interface SettingsRowProps {
  readonly label: string
  /** Label tooltip. */
  readonly hint?: string
  /** Unit suffix rendered after the control. */
  readonly unit?: string
  readonly children: JSX.Element
}

/**
 * One settings row: a fixed label column and the control with an optional unit.
 * @param props - label, hint, unit suffix and the control.
 */
export function SettingsRow(props: SettingsRowProps): JSX.Element {
  return (
    <div className={css.settingsRow}>
      <span className={css.settingsLabel} title={props.hint}>{props.label}</span>
      <div className={css.settingsControl}>
        {props.children}
        {props.unit === undefined ? null : <span className={css.settingsUnit}>{props.unit}</span>}
      </div>
    </div>
  )
}
