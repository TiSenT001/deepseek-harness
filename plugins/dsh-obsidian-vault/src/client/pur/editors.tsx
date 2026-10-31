/**
 * Element editors: text and code nodes, groups, connectors and note links. All
 * four render inside one {@link PurEditorFrame} with the same sections, field
 * rhythm and commit model, so switching between them never changes the layout.
 * @module dsh-obsidian-vault/client/pur/editors
 */
import { useState } from 'react'
import { findElement } from '../../pur-kernel/index.ts'
import type { PurController, PurControllerEffect, PurLineStyle } from '../../pur-kernel/index.ts'
import type { Translate } from '../i18n.ts'
import { BodyArea, Field, FontSelect, numberValue, PurEditorFrame, purInputStyle, purLabelStyle, Section } from './editor-frame.tsx'

export { purInputStyle, purLabelStyle }

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

/** One editable pin row list; the draft commits as `{id, label}` pairs. */
function PinList(props: { caption: string; pins: readonly { id: string; label: string }[]; onChange: (pins: { id: string; label: string }[]) => void }): JSX.Element {
  return (
    <div>
      <span style={purLabelStyle}>{props.caption}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {props.pins.map((pin, index) => (
          <div key={pin.id === '' ? `new-${index}` : pin.id} style={{ display: 'flex', gap: 8 }}>
            <input
              style={purInputStyle}
              value={pin.label}
              onChange={(event) => props.onChange(props.pins.map((other, i) => (i === index ? { ...other, label: event.target.value } : other)))}
            />
            <button type="button" className="ov-button" onClick={() => props.onChange(props.pins.filter((_, i) => i !== index))}>×</button>
          </div>
        ))}
        <button type="button" className="ov-button" onClick={() => props.onChange([...props.pins, { id: '', label: '' }])}>+</button>
      </div>
    </div>
  )
}

/**
 * The text / code-node editor. Both kinds share one form: a title, a body, the
 * typography row, and — for code nodes only — the pin lists and node deletion.
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
    if (isCode) props.run(props.controller.updateElement(props.id, { code: body }))
    else props.run(props.controller.commitTextEdit(props.id, body, title.trim() === '' ? undefined : title.trim()))
    props.run(props.controller.updateElement(props.id, { color, fontSize: numberValue(fontSize, 14), fontFamily }))
    if (isCode) props.run(props.controller.commitCodeNode(props.id, { title: title.trim(), inputs, outputs }))
    props.onClose()
  }
  return (
    <PurEditorFrame
      title={isCode ? props.t('pur.edit') : element.title ?? props.t('pur.edit')}
      onCommit={commit}
      onDiscard={props.onClose}
      saveLabel={props.t('pur.save')}
      cancelLabel={props.t('pur.cancel')}
    >
      <Section title={props.t('pur.sectionContent')}>
        <Field label={props.t('pur.titleOptional')}>
          <input style={purInputStyle} value={title} placeholder={props.t('pur.titleOptional')} onChange={(event) => setTitle(event.target.value)} />
        </Field>
        <BodyArea
          label={isCode === true ? props.t('pur.contentPlaceholder') : props.t('pur.contentPlaceholder')}
          value={body}
          onChange={setBody}
          rows={isCode === true ? 10 : 6}
          code={isCode === true}
        />
      </Section>
      <Section title={props.t('pur.sectionStyle')} columns={3}>
        <Field label={props.t('pur.textColor')}>
          <input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
        </Field>
        <Field label={props.t('pur.fontSize')}>
          <input style={purInputStyle} type="number" min={8} max={100} value={fontSize} onChange={(event) => setFontSize(event.target.value)} />
        </Field>
        <Field label={props.t('pur.fontFamily')}>
          <FontSelect value={fontFamily} onChange={setFontFamily} />
        </Field>
      </Section>
      {isCode === true ? (
        <Section title={props.t('pur.sectionPins')} columns={2}>
          <PinList caption={props.t('pur.inputsTitle')} pins={inputs} onChange={setInputs} />
          <PinList caption={props.t('pur.outputsTitle')} pins={outputs} onChange={setOutputs} />
        </Section>
      ) : null}
      {isCode === true ? (
        <button
          type="button"
          className="ov-button"
          style={{ color: '#ff6b6b', alignSelf: 'flex-start' }}
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
      <Section title={props.t('pur.sectionContent')}>
        <Field label={props.t('pur.groupNamePlaceholder')}>
          <input style={purInputStyle} value={name} placeholder={props.t('pur.groupNamePlaceholder')} onChange={(event) => setName(event.target.value)} />
        </Field>
      </Section>
      <Section title={props.t('pur.sectionStyle')} columns={2}>
        <Field label={props.t('pur.textColor')}>
          <input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
        </Field>
        <Field label={props.t('pur.bgColor')}>
          <input type="color" value={border} onChange={(event) => setBorder(event.target.value)} />
        </Field>
      </Section>
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
      <Section title={props.t('pur.sectionContent')}>
        <BodyArea label={props.t('pur.lineLabel')} value={body} onChange={setBody} rows={3} code={false} />
      </Section>
      <Section title={props.t('pur.sectionStyle')} columns={3}>
        <Field label={props.t('pur.textColor')}>
          <input type="color" value={color} onChange={(event) => setColor(event.target.value)} />
        </Field>
        <Field label={props.t('pur.fontSize')}>
          <input style={purInputStyle} type="number" min={8} max={40} value={fontSize} onChange={(event) => setFontSize(event.target.value)} />
        </Field>
        <Field label={props.t('pur.fontFamily')}>
          <FontSelect value={fontFamily} onChange={setFontFamily} />
        </Field>
      </Section>
      <Section title={props.t('pur.sectionLine')}>
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
      </Section>
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
      <Section title={props.t('pur.sectionContent')}>
        <Field label={props.t('pur.linkNote')}>
          <input style={purInputStyle} value={link} onChange={(event) => setLink(event.target.value)} />
        </Field>
        <BodyArea label={props.t('pur.noteText')} value={note} onChange={setNote} rows={3} code={false} />
      </Section>
      <Section title={props.t('pur.sectionStyle')} columns={3}>
        <Field label={props.t('pur.noteFontSize')}>
          <input style={purInputStyle} type="number" min={8} max={40} value={fontSize} onChange={(event) => setFontSize(event.target.value)} />
        </Field>
        <Field label={props.t('pur.noteFontFamily')}>
          <FontSelect value={fontFamily} onChange={setFontFamily} />
        </Field>
        <Field label={props.t('pur.bgColor')}>
          <input type="color" value={cardColor} onChange={(event) => setCardColor(event.target.value)} />
        </Field>
      </Section>
    </PurEditorFrame>
  )
}
