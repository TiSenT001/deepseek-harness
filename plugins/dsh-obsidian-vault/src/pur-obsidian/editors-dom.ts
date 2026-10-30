/**
 * DOM scaffolding shared by the element editor overlays: the dialog shell
 * with its close semantics (outside click and save commit, Escape discards)
 * plus the small labelled-control builders the five editors compose.
 * @module dsh-obsidian-vault/pur-obsidian/editors-dom
 */

/** What an editor dialog needs from the view. */
export interface PurEditorHost {
  /** The canvas controller. */
  controller: import('../pur-kernel/index.ts').PurController
  /** Effect sink the commits drain into. */
  sink: import('../pur-kernel/index.ts').PurEffectSink
  /** Dictionary reader for dialog copy. */
  read: (key: string) => string
  /** Element the dialog is appended to. */
  parentEl: HTMLElement
  /** Called when a dialog opens, for `hasOpenDialog`. */
  dialogOpened(): void
  /** Called when a dialog closes. */
  dialogClosed(): void
  /** Refocus the canvas after close. */
  focusCanvas(): void
}

/** The commit callback a dialog builder returns; run once on close. */
export type Commit = () => void

const DIALOG_ID = 'pur-editor-dialog'
const DIALOG_CSS =
  'position:absolute; left:calc(50% - 170px); top:22%; width:340px; z-index:100000; display:flex; flex-direction:column; gap:8px; background:var(--background-primary, #1e1e1e); border:1px solid var(--background-modifier-border, #444); border-radius:8px; padding:12px; box-shadow:0 8px 24px rgba(0,0,0,0.5); box-sizing:border-box;'
const INPUT_CSS = 'width:100%; box-sizing:border-box; background:var(--background-secondary, #2a2a2a); color:var(--text-normal, #e0e0e0); border:1px solid var(--background-modifier-border, #444); border-radius:4px; padding:6px 8px; font-size:13px;'
const LABEL_CSS = 'font-size:11px; color:var(--text-muted, #999); display:block; margin-bottom:2px;'
const ROW_CSS = 'display:flex; gap:8px; align-items:center;'

/**
 * Open a dialog, wiring close semantics: outside click and the save button
 * commit, Escape discards.
 * @param host - view hooks.
 * @param build - fills the dialog and returns its commit callback.
 */
export function openDialog(host: PurEditorHost, build: (root: HTMLElement, close: (commit: boolean) => void) => Commit): void {
  const doc = host.parentEl.ownerDocument
  doc.getElementById(DIALOG_ID)?.remove()
  host.dialogOpened()
  const root = doc.createElement('div')
  root.id = DIALOG_ID
  root.style.cssText = DIALOG_CSS
  const close = (commit: boolean): void => {
    if (!root.isConnected) return
    root.remove()
    doc.removeEventListener('mousedown', outside)
    host.dialogClosed()
    if (commit) commitDraft()
    host.focusCanvas()
  }
  const commitDraft = build(root, close)
  host.parentEl.appendChild(root)
  root.addEventListener('mousedown', (event) => event.stopPropagation())
  root.addEventListener('keydown', (event) => {
    event.stopPropagation()
    if (event.key === 'Escape') close(false)
    if (event.key === 'Enter' && event.target instanceof HTMLInputElement) close(true)
  })
  const outside = (event: MouseEvent): void => {
    if (!root.contains(event.target as Node)) close(true)
  }
  setTimeout(() => doc.addEventListener('mousedown', outside), 50)
}

/**
 * Append a labelled control row.
 * @param root - the dialog root.
 * @param label - the caption text.
 * @param control - the control to wrap.
 * @returns the input element.
 */
export function field<T extends HTMLElement>(root: HTMLElement, label: string, control: T): T {
  const doc = root.ownerDocument
  const wrapper = doc.createElement('label')
  wrapper.style.cssText = 'display:block;'
  const caption = doc.createElement('span')
  caption.style.cssText = LABEL_CSS
  caption.textContent = label
  wrapper.append(caption, control)
  root.appendChild(wrapper)
  return control
}

/**
 * A single-line text input.
 * @param root - the dialog root.
 * @param value - the initial value.
 * @param placeholder - the placeholder text.
 * @returns the input.
 */
export function textInput(root: HTMLElement, value: string, placeholder: string): HTMLInputElement {
  const input = root.ownerDocument.createElement('input')
  input.type = 'text'
  input.value = value
  input.placeholder = placeholder
  input.style.cssText = INPUT_CSS
  return input
}

/**
 * A multi-line body editor.
 * @param root - the dialog root.
 * @param value - the initial value.
 * @param placeholder - the placeholder text.
 * @param rows - the visible row count.
 * @returns the textarea.
 */
export function textArea(root: HTMLElement, value: string, placeholder: string, rows: number): HTMLTextAreaElement {
  const area = root.ownerDocument.createElement('textarea')
  area.value = value
  area.placeholder = placeholder
  area.rows = rows
  area.style.cssText = INPUT_CSS + ' resize:vertical;'
  return area
}

/**
 * A colour picker.
 * @param root - the dialog root.
 * @param value - the initial `#rrggbb` value.
 * @returns the input.
 */
export function colorInput(root: HTMLElement, value: string): HTMLInputElement {
  const input = root.ownerDocument.createElement('input')
  input.type = 'color'
  input.value = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#e0e0e0'
  return input
}

/**
 * A number input with a range.
 * @param root - the dialog root.
 * @param value - the initial value.
 * @param min - the minimum.
 * @param max - the maximum.
 * @returns the input.
 */
export function numberInput(root: HTMLElement, value: number, min: number, max: number): HTMLInputElement {
  const input = root.ownerDocument.createElement('input')
  input.type = 'number'
  input.min = String(min)
  input.max = String(max)
  input.value = String(value)
  input.style.cssText = INPUT_CSS
  return input
}

/**
 * A font-family select of generic CSS families.
 * @param root - the dialog root.
 * @param value - the initial family.
 * @returns the select.
 */
export function fontSelect(root: HTMLElement, value: string): HTMLSelectElement {
  const select = root.ownerDocument.createElement('select')
  select.style.cssText = INPUT_CSS
  for (const family of ['sans-serif', 'serif', 'monospace', 'cursive']) {
    const option = root.ownerDocument.createElement('option')
    option.value = family
    option.textContent = family
    select.appendChild(option)
  }
  select.value = ['sans-serif', 'serif', 'monospace', 'cursive'].includes(value) ? value : 'sans-serif'
  return select
}

/**
 * Append a save button row that commits the dialog.
 * @param host - view hooks.
 * @param root - the dialog root.
 * @param close - the dialog's close callback.
 */
export function saveButton(host: PurEditorHost, root: HTMLElement, close: (commit: boolean) => void): void {
  const row = root.ownerDocument.createElement('div')
  row.style.cssText = ROW_CSS + ' justify-content:flex-end;'
  const button = root.ownerDocument.createElement('button')
  button.textContent = host.read('pur.save')
  button.addEventListener('click', () => close(true))
  row.appendChild(button)
  root.appendChild(row)
}

/**
 * The parsed numeric value of an input, or a fallback.
 * @param input - the number input.
 * @param fallback - used when the value is not finite.
 * @returns the parsed number.
 */
export function numberValue(input: HTMLInputElement, fallback: number): number {
  const value = Number(input.value)
  return Number.isFinite(value) ? value : fallback
}
