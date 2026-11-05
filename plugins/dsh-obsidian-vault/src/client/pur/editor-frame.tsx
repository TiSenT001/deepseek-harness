/**
 * Shared chrome for every element editor: one dialog width, one field rhythm and
 * one commit model, so a text card, a code node, a connector and a note link all
 * open the same looking panel.
 * @module dsh-obsidian-vault/client/pur/editor-frame
 */
import type { CSSProperties, ReactNode } from 'react'

/** Control style every editor field shares. */
export const purInputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(128,128,128,0.12)',
  color: 'inherit',
  border: '1px solid rgba(128,128,128,0.35)',
  borderRadius: 4,
  padding: '6px 8px',
  fontSize: 13,
  lineHeight: 1.5,
}

/** Caption style above every field. */
export const purLabelStyle: CSSProperties = { fontSize: 11, opacity: 0.65, display: 'block', marginBottom: 2 }

/** Gap between fields, in pixels. */
export const FIELD_GAP = 8

/** Dialog width shared by every element editor. */
export const EDITOR_WIDTH = 460

/** Dialog width for the text and code editors, which hold a body plus snippet controls. */
export const EDITOR_WIDTH_WIDE = 560

/** A colour swatch: the native picker with the field's own border, sized to a control. */
export const purColorStyle: CSSProperties = {
  width: 46,
  height: 30,
  padding: 2,
  border: '1px solid rgba(128,128,128,0.35)',
  borderRadius: 4,
  background: 'transparent',
  cursor: 'pointer',
}

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
  return (
    <div
      className="ov-dialog-layer"
      style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)' }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) props.onCommit()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={props.title}
        className="ov-dialog"
        style={{ width: props.wide === true ? EDITOR_WIDTH_WIDE : EDITOR_WIDTH, maxWidth: '92vw', maxHeight: '86vh', display: 'flex', flexDirection: 'column', background: 'var(--dsw-alias-bg-layer-1, #1b1b20)', border: '1px solid rgba(128,128,128,0.28)', borderRadius: 10, boxShadow: '0 18px 48px rgba(0,0,0,0.55)' }}
        onKeyDown={(event) => {
          event.stopPropagation()
          if (event.key === 'Escape') props.onDiscard()
          const modified = event.ctrlKey || event.metaKey
          if (event.key === 'Enter' && modified) props.onCommit()
          else if (event.key === 'Enter' && event.target instanceof HTMLInputElement) props.onCommit()
        }}
      >
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(128,128,128,0.2)' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{props.title}</span>
          <span style={{ fontSize: 11, opacity: 0.55 }}>Esc</span>
        </header>
        <div style={{ padding: '12px 14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: FIELD_GAP }}>
          {props.children}
        </div>
        <footer style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '10px 14px', borderTop: '1px solid rgba(128,128,128,0.2)' }}>
          <button type="button" className="ov-button" onClick={props.onDiscard}>{props.cancelLabel}</button>
          <button type="button" className="ov-button ov-button-primary" onClick={props.onCommit}>{props.saveLabel}</button>
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
    <label style={{ display: 'block' }}>
      <span style={purLabelStyle}>{props.label}</span>
      {props.children}
    </label>
  )
}

/**
 * A titled group of related fields, so every editor reads as the same form.
 * @param props - section caption and fields; `columns` lays them out side by side.
 */
export function Section(props: { title: string; children: ReactNode; columns?: number }): JSX.Element {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: FIELD_GAP }}>
      <div style={{ fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', opacity: 0.5 }}>{props.title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${props.columns ?? 1}, minmax(0, 1fr))`, gap: FIELD_GAP }}>
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
        style={{
          ...purInputStyle,
          resize: 'vertical',
          ...(props.code ? { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12.5, tabSize: 2 } : {}),
        }}
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
    <select style={purInputStyle} value={props.value} onChange={(event) => props.onChange(event.target.value)}>
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
