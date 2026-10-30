/**
 * Element editor dialogs for the React Pur pane: text/code-node, group, line
 * and note-link overlays that edit a local draft and commit through the
 * controller once (save button, Enter, or outside click); Escape discards.
 * @module dsh-obsidian-vault/client/pur/editors
 */
import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { findElement } from '../../pur-kernel/index.ts'
import type { PurController, PurControllerEffect, PurLineStyle } from '../../pur-kernel/index.ts'
import type { Translate } from '../i18n.ts'
import { css } from '../ui/theme.ts'

/** Shared single-line control style, matching the Obsidian adapter's fields. */
export const purInputStyle: CSSProperties = { width: '100%', boxSizing: 'border-box', background: 'rgba(128,128,128,0.12)', color: 'inherit', border: '1px solid rgba(128,128,128,0.35)', borderRadius: 4, padding: '6px 8px', fontSize: 13 }

/** Shared field caption style. */
export const purLabelStyle: CSSProperties = { fontSize: 11, opacity: 0.65, display: 'block', marginBottom: 2 }

/** Props every Pur editor dialog receives. */
export interface PurEditorProps {
  /** The workspace translator. */
  readonly t: Translate
  /** The canvas controller. */
  readonly controller: PurController
  /** The element being edited. */
  readonly id: string
  /** Drain controller effects into the pane's sink. */
  readonly run: (effects: readonly PurControllerEffect[]) => void
  /** Close the dialog without further commits. */
  readonly onClose: () => void
}

/** Props for {@link PurEditorFrame}. */
interface PurEditorFrameProps {
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
}

/**
 * The shared dialog chrome: overlay commit-on-outside-click, Escape to
 * discard, Enter on a single-line input to commit.
 * @param props - heading, callbacks and fields.
 */
function PurEditorFrame(props: PurEditorFrameProps): JSX.Element {
  return (
    <div className={css.dialogLayer} onMouseDown={(event) => {
      if (event.target === event.currentTarget) props.onCommit()
    }}>
      <div
        className={css.dialog}
        role="dialog"
        onKeyDown={(event) => {
          event.stopPropagation()
          if (event.key === 'Escape') props.onDiscard()
          if (event.key === 'Enter' && event.target instanceof HTMLInputElement) props.onCommit()
        }}
      >
        <div className={css.dialogHead}>
          <span className={css.dialogTitle}>{props.title}</span>
        </div>
        <div className={css.dialogBody} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {props.children}
        </div>
        <div className={css.dialogActions}>
          <button type="button" className={css.dialogButton} onClick={props.onDiscard}>{props.cancelLabel}</button>
          <button type="button" className={css.dialogButtonPrimary} onClick={props.onCommit}>{props.saveLabel}</button>
        </div>
      </div>
    </div>
  )
}

/** One labelled field row. */
function Field(props: { label: string; children: ReactNode }): JSX.Element {
  return (
    <label style={{ display: 'block' }}>
      <span style={purLabelStyle}>{props.label}</span>
      {props.children}
    </label>
  )
}

/** A font-family select of generic CSS families. */
function FontSelect(props: { value: string; onChange: (value: string) => void }): JSX.Element {
  return (
    <select style={purInputStyle} value={props.value} onChange={(event) => props.onChange(event.target.value)}>
      {['sans-serif', 'serif', 'monospace', 'cursive'].map((family) => <option key={family} value={family}>{family}</option>)}
    </select>
  )
}

/** Parse a numeric input, falling back when empty or invalid. */
function numberValue(text: string, fallback: number): number {
  const value = Number(text)
  return Number.isFinite(value) ? value : fallback
}

/** One editable pin row list; the draft commits as `{id, label}` pairs. */
function PinList(props: { caption: string; pins: readonly { id: string; label: string }[]; onChange: (pins: { id: string; label: string }[]) => void }): JSX.Element {
  return (
    <div>
      <span style={purLabelStyle}>{props.caption}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {props.pins.map((pin, index) => (
          <div key={pin.id === '' ? `new-${index}` : pin.id} style={{ display: 'flex', gap: 8 }}>
            <input style={purInputStyle} value={pin.label} onChange={(event) => props.onChange(props.pins.map((other, i) => (i === index ? { ...other, label: event.target.value } : other)))} />
            <button type="button" className={css.dialogButton} onClick={() => props.onChange(props.pins.filter((_, i) => i !== index))}>×</button>
          </div>
        ))}
        <button type="button" className={css.dialogButton} onClick={() => props.onChange([...props.pins, { id: '', label: '' }])}>+</button>
      </div>
    </div>
  )
}

/**
 * The text / code-node editor: body, title and typography; code nodes also
 * edit pins and offer node deletion.
 * @param props - editor context.
 */
export function PurTextEditor(props: PurEditorProps): JSX.Element | null {
  const site = findElement(props.controller.state.elements, props.id)
  const element = site !== null && (site.element.type === 'text' || site.element.type === 'code-node') ? site.element : null
  const isCode = element?.type === 'code-node'
  const [title, setTitle] = useState(element?.title ?? '')
  const [body, setBody] = useState(element !== null && element.type === 'code-node' ? element.code ?? element.content : element?.content ?? '')
  const [color, setColor] = useState(element?.color ?? '#e0e0e0')
  const [fontSize, setFontSize] = useState(String(element?.fontSize ?? 14))
  const [fontFamily, setFontFamily] = useState(element?.fontFamily ?? 'sans-serif')
  const [inputs, setInputs] = useState(() => (element?.inputs ?? []).map((pin) => ({ id: pin.id, label: pin.label })))
  const [outputs, setOutputs] = useState(() => (element?.outputs ?? []).map((pin) => ({ id: pin.id, label: pin.label })))
  if (element === null) return null
  const commit = (): void => {
    props.run(props.controller.commitTextEdit(props.id, body, title.trim() === '' ? undefined : title.trim()))
    props.run(props.controller.updateElement(props.id, { color, fontSize: numberValue(fontSize, 14), fontFamily }))
    if (isCode) props.run(props.controller.commitCodeNode(props.id, { title: title.trim(), inputs, outputs }))
    props.onClose()
  }
  return (
    <PurEditorFrame title={element.title ?? props.t('pur.edit')} onCommit={commit} onDiscard={props.onClose} saveLabel={props.t('pur.save')} cancelLabel={props.t('pur.cancel')}>
      <Field label={props.t('pur.titleOptional')}><input style={purInputStyle} value={title} placeholder={props.t('pur.titleOptional')} onChange={(event) => setTitle(event.target.value)} /></Field>
      <Field label={props.t('pur.contentPlaceholder')}><textarea style={{ ...purInputStyle, resize: 'vertical' }} rows={isCode ? 10 : 5} value={body} placeholder={props.t('pur.contentPlaceholder')} onChange={(event) => setBody(event.target.value)} /></Field>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Field label={props.t('pur.textColor')}><input type="color" value={color} onChange={(event) => setColor(event.target.value)} /></Field>
        <Field label={props.t('pur.fontSize')}><input style={purInputStyle} type="number" min={8} max={100} value={fontSize} onChange={(event) => setFontSize(event.target.value)} /></Field>
        <Field label={props.t('pur.fontFamily')}><FontSelect value={fontFamily} onChange={setFontFamily} /></Field>
      </div>
      {isCode ? <PinList caption={props.t('pur.inputsTitle')} pins={inputs} onChange={setInputs} /> : null}
      {isCode ? <PinList caption={props.t('pur.outputsTitle')} pins={outputs} onChange={setOutputs} /> : null}
      {isCode ? (
        <button
          type="button"
          className={css.dialogButton}
          style={{ color: '#ff6b6b' }}
          onClick={() => {
            props.run(props.controller.deleteElement(props.id))
            props.onClose()
          }}
        >
          {props.t('pur.deleteNode')}
        </button>
      ) : null}
    </PurEditorFrame>
  )
}

/**
 * The group editor: label text, label colour and frame colour.
 * @param props - editor context.
 */
export function PurGroupEditor(props: PurEditorProps): JSX.Element | null {
  const site = findElement(props.controller.state.elements, props.id)
  const element = site !== null && site.element.type === 'group' ? site.element : null
  const [name, setName] = useState(element?.content ?? '')
  const [color, setColor] = useState(element?.color ?? '#e0e0e0')
  const [border, setBorder] = useState(element?.borderColor ?? '#969ab4')
  if (element === null) return null
  const commit = (): void => {
    props.run(props.controller.updateElement(props.id, { content: name.trim(), color, borderColor: border }))
    props.onClose()
  }
  return (
    <PurEditorFrame title={props.t('pur.editLabel')} onCommit={commit} onDiscard={props.onClose} saveLabel={props.t('pur.save')} cancelLabel={props.t('pur.cancel')}>
      <Field label={props.t('pur.groupNamePlaceholder')}><input style={purInputStyle} value={name} placeholder={props.t('pur.groupNamePlaceholder')} onChange={(event) => setName(event.target.value)} /></Field>
      <Field label={props.t('pur.textColor')}><input type="color" value={color} onChange={(event) => setColor(event.target.value)} /></Field>
      <Field label={props.t('pur.bgColor')}><input type="color" value={border} onChange={(event) => setBorder(event.target.value)} /></Field>
    </PurEditorFrame>
  )
}

/**
 * The line editor: label text plus stroke colour, routing and arrowhead.
 * @param props - editor context.
 */
export function PurLineEditor(props: PurEditorProps): JSX.Element | null {
  const site = findElement(props.controller.state.elements, props.id)
  const element = site !== null && site.element.type === 'line' ? site.element : null
  const [body, setBody] = useState(element?.content ?? '')
  const [color, setColor] = useState(element?.textColor ?? element?.color ?? '#e0e0e0')
  const [fontSize, setFontSize] = useState(String(element?.fontSize ?? 12))
  const [fontFamily, setFontFamily] = useState(element?.fontFamily ?? 'sans-serif')
  const [style, setStyle] = useState<PurLineStyle>(element?.style ?? 'curve')
  const [arrow, setArrow] = useState(element?.arrow !== false)
  if (element === null) return null
  const commit = (): void => {
    props.run(props.controller.updateElement(props.id, { content: body.trim(), color, textColor: color, fontSize: numberValue(fontSize, 12), fontFamily, style, arrow }))
    props.onClose()
  }
  return (
    <PurEditorFrame title={props.t('pur.editLine')} onCommit={commit} onDiscard={props.onClose} saveLabel={props.t('pur.save')} cancelLabel={props.t('pur.cancel')}>
      <Field label={props.t('pur.lineLabel')}><textarea style={{ ...purInputStyle, resize: 'vertical' }} rows={3} value={body} onChange={(event) => setBody(event.target.value)} /></Field>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Field label={props.t('pur.textColor')}><input type="color" value={color} onChange={(event) => setColor(event.target.value)} /></Field>
        <Field label={props.t('pur.fontSize')}><input style={purInputStyle} type="number" min={8} max={40} value={fontSize} onChange={(event) => setFontSize(event.target.value)} /></Field>
        <Field label={props.t('pur.fontFamily')}><FontSelect value={fontFamily} onChange={setFontFamily} /></Field>
      </div>
      <Field label={props.t('pur.lineStyle')}>
        <select style={purInputStyle} value={style} onChange={(event) => setStyle(event.target.value as PurLineStyle)}>
          <option value="curve">{props.t('pur.lineStyleCurve')}</option>
          <option value="straight">{props.t('pur.lineStyleStraight')}</option>
          <option value="rect">{props.t('pur.lineStyleRect')}</option>
        </select>
      </Field>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="checkbox" checked={arrow} onChange={(event) => setArrow(event.target.checked)} />
        <span style={purLabelStyle}>{props.t('pur.lineArrow')}</span>
      </label>
    </PurEditorFrame>
  )
}

/**
 * The note-link editor: secondary note text, its typography, the card colour
 * and the link target.
 * @param props - editor context.
 */
export function PurNoteLinkEditor(props: PurEditorProps): JSX.Element | null {
  const site = findElement(props.controller.state.elements, props.id)
  const element = site !== null && site.element.type === 'note-link' ? site.element : null
  const [note, setNote] = useState(element?.note ?? '')
  const [link, setLink] = useState(element?.link ?? '')
  const [fontSize, setFontSize] = useState(String(element?.noteFontSize ?? 12))
  const [fontFamily, setFontFamily] = useState(element?.noteFontFamily ?? 'sans-serif')
  const [cardColor, setCardColor] = useState(element?.cardColor ?? '#8a7ec8')
  if (element === null) return null
  const commit = (): void => {
    props.run(props.controller.updateElement(props.id, { note: note.trim(), link: link.trim(), noteFontSize: numberValue(fontSize, 12), noteFontFamily: fontFamily, cardColor }))
    props.onClose()
  }
  return (
    <PurEditorFrame title={props.t('pur.edit')} onCommit={commit} onDiscard={props.onClose} saveLabel={props.t('pur.save')} cancelLabel={props.t('pur.cancel')}>
      <Field label={props.t('pur.noteText')}><textarea style={{ ...purInputStyle, resize: 'vertical' }} rows={3} value={note} onChange={(event) => setNote(event.target.value)} /></Field>
      <Field label={props.t('pur.linkNote')}><input style={purInputStyle} value={link} onChange={(event) => setLink(event.target.value)} /></Field>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Field label={props.t('pur.noteFontSize')}><input style={purInputStyle} type="number" min={8} max={40} value={fontSize} onChange={(event) => setFontSize(event.target.value)} /></Field>
        <Field label={props.t('pur.noteFontFamily')}><FontSelect value={fontFamily} onChange={setFontFamily} /></Field>
        <Field label={props.t('pur.cardColor')}><input type="color" value={cardColor} onChange={(event) => setCardColor(event.target.value)} /></Field>
      </div>
    </PurEditorFrame>
  )
}
