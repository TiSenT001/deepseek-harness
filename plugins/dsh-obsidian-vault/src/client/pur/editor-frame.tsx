/**
 * Shared chrome for every element editor: one dialog width, one field rhythm and
 * one commit model, so a text card, a code node, a connector and a note link all
 * open the same looking panel. All visuals come from the kit (`ov-dialog`,
 * `ov-input`, `ov-pur-*`); this file only wires the structure.
 * @module dsh-obsidian-vault/client/pur/editor-frame
 */
import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { css } from '../ui/theme.ts'

/** Props for {@link PurEditorFrame}. */
export interface PurEditorFrameProps {
  /** Dialog heading. */
  readonly title: string
  /** Commit the draft and close. */
  readonly onCommit: () => void
  /** Discard the draft and close. */
  readonly onDiscard: () => void
  /** Confirm button text. */
  readonly saveLabel: string
  /** Cancel button text. */
  readonly cancelLabel: string
  /** Dialog fields. */
  readonly children: ReactNode
  /** Wider dialog for the editors that need a body plus its controls. */
  readonly wide?: boolean
}

/**
 * The shared dialog chrome: overlay click and the confirm button commit, Escape
 * discards, Enter commits from a single-line input, and Ctrl+Enter commits from
 * a body textarea.
 * @param props - heading, callbacks and fields.
 */
export function PurEditorFrame(props: PurEditorFrameProps): JSX.Element {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    // The canvas keeps the focus when the dialog opens, so without this every key —
    // Escape included — went to the canvas instead of the form.
    const dialog = dialogRef.current
    if (dialog === null) return
    const field = dialog.querySelector<HTMLElement>('input, textarea, select')
    ;(field ?? dialog).focus()
  }, [])
  return (
    <div
      className={`${css.dialogLayer} ${css.dialogLayerCenter}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) props.onCommit()
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={props.title}
        className={`${css.dialog} ${props.wide === true ? css.purDialogWide : css.purDialog}`}
        onKeyDown={(event) => {
          event.stopPropagation()
          if (event.key === 'Escape') props.onDiscard()
          const modified = event.ctrlKey || event.metaKey
          if (event.key === 'Enter' && modified) props.onCommit()
          else if (event.key === 'Enter' && event.target instanceof HTMLInputElement) props.onCommit()
        }}
      >
        <header className={css.dialogHead}>
          <span className={css.dialogTitle}>{props.title}</span>
          <span className={`${css.dialogHint} ${css.purEsc}`}>Esc</span>
        </header>
        <div className={css.dialogBody}>
          {props.children}
        </div>
        <footer className={css.purFooter}>
          <button type="button" className={css.dialogButton} onClick={props.onDiscard}>{props.cancelLabel}</button>
          <button type="button" className={`${css.dialogButton} ${css.dialogButtonPrimary}`} onClick={props.onCommit}>{props.saveLabel}</button>
        </footer>
      </div>
    </div>
  )
}

/**
 * One labelled field.
 * @param props - caption and control.
 */
export function Field(props: { label: string; children: ReactNode }): JSX.Element {
  return (
    <label className={css.field}>
      <span className={css.fieldLabel}>{props.label}</span>
      {props.children}
    </label>
  )
}

/**
 * A titled group of related fields, so every editor reads as the same form.
 * The caption sits on its own hairline so a long form has visible structure.
 * @param props - section caption and fields; `columns` lays them out side by side.
 */
export function Section(props: { title: string; children: ReactNode; columns?: number }): JSX.Element {
  return (
    <section className={css.purSection}>
      <div className={css.purSectionHead}>
        <span className={css.purSectionTitle}>{props.title}</span>
        <span className={css.purSectionRule} />
      </div>
      <div
        className={css.purFields}
        style={props.columns === undefined ? undefined : { gridTemplateColumns: `repeat(${props.columns}, minmax(0, 1fr))` }}
      >
        {props.children}
      </div>
    </section>
  )
}

/** Props for {@link BodyArea}. */
export interface BodyAreaProps {
  /** Field caption. */
  readonly label: string
  /** Draft text. */
  readonly value: string
  /** Draft update. */
  readonly onChange: (value: string) => void
  /** Visible rows before the textarea scrolls. */
  readonly rows: number
  /** Render in the monospace face and insert spaces on Tab. */
  readonly code: boolean
  /** Placeholder text. */
  readonly placeholder?: string
}

/**
 * The body field. Code bodies get the monospace face and Tab inserts two
 * spaces; Ctrl+Enter commits in both cases (handled by the frame).
 * @param props - draft, rows and the code flag.
 */
export function BodyArea(props: BodyAreaProps): JSX.Element {
  return (
    <Field label={props.label}>
      <textarea
        className={props.code ? `${css.input} ${css.purCode}` : css.input}
        rows={props.rows}
        spellCheck={!props.code}
        {...(props.placeholder === undefined ? {} : { placeholder: props.placeholder })}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        onKeyDown={(event) => {
          if (!props.code || event.key !== 'Tab') return
          event.preventDefault()
          const target = event.currentTarget
          const { selectionStart, selectionEnd } = target
          props.onChange(`${props.value.slice(0, selectionStart)}  ${props.value.slice(selectionEnd)}`)
          // Restore the caret after React re-renders the value.
          requestAnimationFrame(() => {
            target.selectionStart = selectionStart + 2
            target.selectionEnd = selectionStart + 2
          })
        }}
      />
    </Field>
  )
}

/** A font-family select of generic CSS families. */
export function FontSelect(props: { value: string; onChange: (value: string) => void }): JSX.Element {
  return (
    <select className={css.input} value={props.value} onChange={(event) => props.onChange(event.target.value)}>
      {['sans-serif', 'serif', 'monospace', 'cursive'].map((family) => <option key={family} value={family}>{family}</option>)}
    </select>
  )
}

/**
 * Parse a numeric input, falling back when empty or invalid.
 * @param text - the field's raw text.
 * @param fallback - value used when the text is not a finite number.
 * @returns the parsed number or the fallback.
 */
export function numberValue(text: string, fallback: number): number {
  const value = Number(text)
  return Number.isFinite(value) ? value : fallback
}

/**
 * A colour field: the native picker plus the value it holds, so the exact colour is
 * readable and copyable instead of hidden behind a swatch.
 * @param props - current colour and its change handler.
 */
export function ColorField(props: { value: string; onChange: (value: string) => void }): JSX.Element {
  return (
    <div className={css.purRow}>
      <input type="color" className={css.colorSwatch} value={props.value} onChange={(event) => props.onChange(event.target.value)} />
      <span className={css.colorValue}>{props.value}</span>
    </div>
  )
}
