/**
 * Element editor overlays: five centred dialogs that edit a local draft and
 * commit once on close (outside click, Enter or the save button); Escape
 * discards. Fields map to `commitTextEdit` / `commitCodeNode` /
 * `updateElement` / `deleteElement` on the controller.
 * @module dsh-obsidian-vault/pur-obsidian/editors
 */
import { executeEffects, findElement } from '../pur-kernel/index.ts'
import type { PurPin } from '../pur-kernel/index.ts'
import { colorInput, field, fontSelect, numberInput, numberValue, openDialog, saveButton, textArea, textInput } from './editors-dom.ts'
import type { PurEditorHost } from './editors-dom.ts'

export type { PurEditorHost } from './editors-dom.ts'

const ROW_CSS = 'display:flex; gap:8px; align-items:center;'
const LABEL_CSS = 'font-size:11px; color:var(--text-muted, #999); display:block; margin-bottom:2px;'
const INPUT_CSS = 'width:100%; box-sizing:border-box; background:var(--background-secondary, #2a2a2a); color:var(--text-normal, #e0e0e0); border:1px solid var(--background-modifier-border, #444); border-radius:4px; padding:6px 8px; font-size:13px;'

/**
 * Open the text / code-node content editor: body, title and a few style
 * fields; code nodes also edit pins and offer deletion.
 * @param host - view hooks.
 * @param id - the element id.
 */
export function openPurTextEditor(host: PurEditorHost, id: string): void {
  const site = findElement(host.controller.state.elements, id)
  if (site === null || (site.element.type !== 'text' && site.element.type !== 'code-node')) return
  const element = site.element
  const isCode = element.type === 'code-node'
  openDialog(host, (root, close) => {
    const title = field(root, host.read('pur.titleOptional'), textInput(root, element.title ?? '', host.read('pur.titleOptional')))
    const body = field(root, host.read('pur.contentPlaceholder'), textArea(root, isCode ? element.code ?? element.content : element.content, host.read('pur.contentPlaceholder'), isCode ? 10 : 5))
    const styleRow = root.ownerDocument.createElement('div')
    styleRow.style.cssText = ROW_CSS
    const color = field(styleRow, host.read('pur.textColor'), colorInput(root, element.color ?? '#e0e0e0'))
    const size = field(styleRow, host.read('pur.fontSize'), numberInput(root, element.fontSize ?? 14, 8, 100))
    const font = field(styleRow, host.read('pur.fontFamily'), fontSelect(root, element.fontFamily ?? 'sans-serif'))
    root.appendChild(styleRow)
    const inputs = isCode ? pinList(host, root, host.read('pur.inputsTitle'), element.inputs ?? []) : null
    const outputs = isCode ? pinList(host, root, host.read('pur.outputsTitle'), element.outputs ?? []) : null
    if (isCode) {
      const del = root.ownerDocument.createElement('button')
      del.textContent = host.read('pur.deleteNode')
      del.style.color = '#ff6b6b'
      del.addEventListener('click', () => {
        executeEffects(host.controller.deleteElement(id), host.sink)
        close(false)
      })
      root.appendChild(del)
    }
    saveButton(host, root, close)
    setTimeout(() => body.focus(), 50)
    return () => {
      executeEffects(host.controller.commitTextEdit(id, body.value, title.value.trim() === '' ? undefined : title.value.trim()), host.sink)
      executeEffects(host.controller.updateElement(id, { color: color.value, fontSize: numberValue(size, 14), fontFamily: font.value }), host.sink)
      if (inputs !== null && outputs !== null) {
        executeEffects(host.controller.commitCodeNode(id, { title: title.value.trim(), inputs: inputs.value, outputs: outputs.value }), host.sink)
      }
    }
  })
}

/** Editable pin rows; `value` reads the committed list. */
function pinList(host: PurEditorHost, root: HTMLElement, caption: string, pins: readonly PurPin[]): { value: { id: string; label: string }[] } {
  const doc = root.ownerDocument
  const section = doc.createElement('div')
  const head = doc.createElement('span')
  head.style.cssText = LABEL_CSS
  head.textContent = caption
  section.appendChild(head)
  const list = doc.createElement('div')
  list.style.cssText = 'display:flex; flex-direction:column; gap:4px;'
  section.appendChild(list)
  const addRow = (pin: { id: string; label: string }): void => {
    const row = doc.createElement('div')
    row.style.cssText = ROW_CSS
    const input = textInput(root, pin.label, '')
    input.dataset['pinId'] = pin.id
    const remove = doc.createElement('button')
    remove.textContent = '×'
    remove.addEventListener('click', () => row.remove())
    row.append(input, remove)
    list.appendChild(row)
  }
  for (const pin of pins) addRow({ id: pin.id, label: pin.label })
  const add = doc.createElement('button')
  add.textContent = '+'
  add.addEventListener('click', () => addRow({ id: '', label: '' }))
  section.appendChild(add)
  root.appendChild(section)
  return {
    get value() {
      return [...list.querySelectorAll('input')].map((input) => ({ id: input.dataset['pinId'] ?? '', label: input.value }))
    },
  }
}

/**
 * Open the group-label editor: name, label colour and frame colour.
 * @param host - view hooks.
 * @param id - the group id.
 */
export function openPurGroupEditor(host: PurEditorHost, id: string): void {
  const site = findElement(host.controller.state.elements, id)
  if (site === null || site.element.type !== 'group') return
  const element = site.element
  openDialog(host, (root, close) => {
    const name = field(root, host.read('pur.groupNamePlaceholder'), textInput(root, element.content ?? '', host.read('pur.groupNamePlaceholder')))
    const color = field(root, host.read('pur.textColor'), colorInput(root, element.color ?? '#e0e0e0'))
    const border = field(root, host.read('pur.bgColor'), colorInput(root, element.borderColor ?? '#969ab4'))
    saveButton(host, root, close)
    setTimeout(() => name.focus(), 50)
    return () => {
      executeEffects(host.controller.updateElement(id, { content: name.value.trim(), color: color.value, borderColor: border.value }), host.sink)
    }
  })
}

/**
 * Open the line-label editor: label text plus stroke, routing and arrow.
 * @param host - view hooks.
 * @param id - the line id.
 */
export function openPurLineEditor(host: PurEditorHost, id: string): void {
  const site = findElement(host.controller.state.elements, id)
  if (site === null || site.element.type !== 'line') return
  const element = site.element
  openDialog(host, (root, close) => {
    const body = field(root, host.read('pur.lineLabel'), textArea(root, element.content ?? '', host.read('pur.lineLabel'), 3))
    const row = root.ownerDocument.createElement('div')
    row.style.cssText = ROW_CSS
    const color = field(row, host.read('pur.textColor'), colorInput(root, element.textColor ?? element.color ?? '#e0e0e0'))
    const size = field(row, host.read('pur.fontSize'), numberInput(root, element.fontSize ?? 12, 8, 40))
    const font = field(row, host.read('pur.fontFamily'), fontSelect(root, element.fontFamily ?? 'sans-serif'))
    root.appendChild(row)
    const style = root.ownerDocument.createElement('select')
    style.style.cssText = INPUT_CSS
    const styles: readonly { value: 'curve' | 'straight' | 'rect'; key: string }[] = [
      { value: 'curve', key: 'pur.lineStyleCurve' },
      { value: 'straight', key: 'pur.lineStyleStraight' },
      { value: 'rect', key: 'pur.lineStyleRect' },
    ]
    for (const option of styles) {
      const node = root.ownerDocument.createElement('option')
      node.value = option.value
      node.textContent = host.read(option.key)
      style.appendChild(node)
    }
    style.value = element.style ?? 'curve'
    field(root, host.read('pur.lineStyle'), style)
    const arrow = root.ownerDocument.createElement('input')
    arrow.type = 'checkbox'
    arrow.checked = element.arrow !== false
    field(root, host.read('pur.lineArrow'), arrow)
    saveButton(host, root, close)
    setTimeout(() => body.focus(), 50)
    return () => {
      executeEffects(
        host.controller.updateElement(id, {
          content: body.value.trim(),
          color: color.value,
          textColor: color.value,
          fontSize: numberValue(size, 12),
          fontFamily: font.value,
          style: style.value as 'curve' | 'straight' | 'rect',
          arrow: arrow.checked,
        }),
        host.sink,
      )
    }
  })
}

/**
 * Open the note-link editor: secondary note text, its typography, the card
 * colour and the link target.
 * @param host - view hooks.
 * @param id - the note-link id.
 */
export function openPurNoteLinkEditor(host: PurEditorHost, id: string): void {
  const site = findElement(host.controller.state.elements, id)
  if (site === null || site.element.type !== 'note-link') return
  const element = site.element
  openDialog(host, (root, close) => {
    const note = field(root, host.read('pur.noteText'), textArea(root, element.note ?? '', host.read('pur.noteText'), 3))
    const link = field(root, host.read('pur.linkNote'), textInput(root, element.link, ''))
    const row = root.ownerDocument.createElement('div')
    row.style.cssText = ROW_CSS
    const size = field(row, host.read('pur.noteFontSize'), numberInput(root, element.noteFontSize ?? 12, 8, 40))
    const font = field(row, host.read('pur.noteFontFamily'), fontSelect(root, element.noteFontFamily ?? 'sans-serif'))
    const card = field(row, host.read('pur.cardColor'), colorInput(root, element.cardColor ?? '#8a7ec8'))
    root.appendChild(row)
    saveButton(host, root, close)
    setTimeout(() => note.focus(), 50)
    return () => {
      executeEffects(
        host.controller.updateElement(id, { note: note.value.trim(), link: link.value.trim(), noteFontSize: numberValue(size, 12), noteFontFamily: font.value, cardColor: card.value }),
        host.sink,
      )
    }
  })
}
