/**
 * Editing commands: clipboard operations, grouping, element creation, pin
 * management and the editor-dialog commits. Each mutates the state and
 * returns the effects the adapter must perform, in upstream order.
 * @module dsh-obsidian-vault/pur-kernel/controller-edits
 */
import { findElement } from './geometry.ts'
import { pushHistory } from './history.ts'
import { codeInputNames, codeOutputKeys } from './note-raw.ts'
import { codeNodeHeight } from './nodes.ts'
import type { PurControllerEffect, PurControllerTools } from './controller-types.ts'
import type { PurCodeNodeElement, PurElement, PurLineStyle, PurPin } from './types.ts'

/**
 * Push a history snapshot and report the usual save-then-render tail.
 * @param tools - shared controller tools.
 * @returns the save and render effects.
 */
function commit(tools: PurControllerTools): PurControllerEffect[] {
  pushHistory(tools.history, tools.state.elements)
  return [{ type: 'save' }, { type: 'render' }]
}

/** Deep copy through JSON, like upstream's clipboard. */
function clone(element: PurElement): PurElement {
  return JSON.parse(JSON.stringify(element)) as PurElement
}

/**
 * Copy the selected elements into the internal clipboard and notice.
 * @param tools - shared controller tools.
 * @returns the notice effect.
 */
export function copySelected(tools: PurControllerTools): PurControllerEffect[] {
  const selected: PurElement[] = []
  const search = (elements: readonly PurElement[]): void => {
    for (const element of elements) {
      if (tools.state.selectedIds.has(element.id)) selected.push(element)
      if (element.type === 'group') search(element.children)
    }
  }
  search(tools.state.elements)
  tools.state.clipboard = selected.map(clone)
  return [{ type: 'notice', text: tools.labels.copiedElements(tools.state.clipboard.length) }]
}

/**
 * Paste the internal clipboard, offset by 50 units or placed at the given
 * world point, and select the copies.
 * @param tools - shared controller tools.
 * @param worldX - paste x; the offset position when omitted or zero.
 * @param worldY - paste y; the offset position when omitted or zero.
 * @returns effects, empty when the clipboard is empty.
 */
export function pasteClipboard(tools: PurControllerTools, worldX?: number, worldY?: number): PurControllerEffect[] {
  if (tools.state.clipboard.length === 0) return []
  const created = tools.state.clipboard.map((element) => ({
    ...element,
    id: tools.env.createId(),
    x: worldX ? worldX : (element.x ?? NaN) + 50,
    y: worldY ? worldY : (element.y ?? NaN) + 50,
  }))
  tools.state.elements.push(...created)
  tools.state.selectedIds.clear()
  for (const element of created) tools.state.selectedIds.add(element.id)
  return commit(tools)
}

/**
 * Duplicate the selected elements 30 units down-right and select the clones.
 * @param tools - shared controller tools.
 * @returns the commit effects plus the copy notice.
 */
export function duplicateSelected(tools: PurControllerTools): PurControllerEffect[] {
  const selected: PurElement[] = []
  const search = (elements: readonly PurElement[]): void => {
    for (const element of elements) {
      if (tools.state.selectedIds.has(element.id)) selected.push(element)
      if (element.type === 'group') search(element.children)
    }
  }
  search(tools.state.elements)
  const clones = selected.map((element) => ({ ...clone(element), id: tools.env.createId(), x: (element.x ?? NaN) + 30, y: (element.y ?? NaN) + 30 }))
  tools.state.elements.push(...clones)
  tools.state.selectedIds.clear()
  for (const element of clones) tools.state.selectedIds.add(element.id)
  return [...commit(tools), { type: 'notice', text: tools.labels.copiedElements(clones.length) }]
}

/**
 * Group the selected non-line elements into a new frame padded by 10 units,
 * converting the children to group-relative coordinates.
 * @param tools - shared controller tools.
 * @returns effects; a notice when fewer than two non-line elements qualify.
 */
export function groupSelected(tools: PurControllerTools): PurControllerEffect[] {
  if (tools.state.selectedIds.size < 2) return []
  const selected: PurElement[] = []
  const search = (elements: readonly PurElement[]): void => {
    for (const element of elements) {
      if (tools.state.selectedIds.has(element.id)) selected.push(element)
      if (element.type === 'group') search(element.children)
    }
  }
  search(tools.state.elements)
  const nodes = selected.filter((element) => element.type !== 'line')
  if (nodes.length < 2) return [{ type: 'notice', text: tools.labels.selectTwoToGroup }]
  const minX = Math.min(...nodes.map((el) => el.x ?? 0))
  const minY = Math.min(...nodes.map((el) => el.y ?? 0))
  const maxX = Math.max(...nodes.map((el) => (el.x ?? 0) + (el.w ?? 0)))
  const maxY = Math.max(...nodes.map((el) => (el.y ?? 0) + (el.h ?? 0)))
  const groupId = tools.env.createId()
  tools.state.elements = tools.state.elements.filter((el) => !tools.state.selectedIds.has(el.id))
  tools.state.elements.push({
    id: groupId,
    type: 'group',
    x: minX - 10,
    y: minY - 10,
    w: maxX - minX + 20,
    h: maxY - minY + 20,
    children: nodes.map((el) => ({ ...el, x: (el.x ?? 0) - minX + 10, y: (el.y ?? 0) - minY + 10 }) as PurElement),
    rotation: 0,
    opacity: 1,
  })
  tools.state.selectedIds.clear()
  tools.state.selectedIds.add(groupId)
  return commit(tools)
}

/**
 * Dissolve every selected top-level group, lifting its children to absolute
 * coordinates at the group's position in the list.
 * @param tools - shared controller tools.
 * @returns effects, empty when no top-level group is selected.
 */
export function ungroupSelected(tools: PurControllerTools): PurControllerEffect[] {
  const groups = tools.state.elements.filter((el) => tools.state.selectedIds.has(el.id) && el.type === 'group')
  if (groups.length === 0) return []
  for (const group of groups) {
    if (group.type !== 'group') continue
    const index = tools.state.elements.indexOf(group)
    if (index > -1) {
      tools.state.elements.splice(index, 1, ...group.children.map((child) => ({ ...child, x: (child.x ?? 0) + group.x, y: (child.y ?? 0) + group.y }) as PurElement))
    }
  }
  tools.state.selectedIds.clear()
  return commit(tools)
}

/**
 * Add a 200x60 text block with the locale placeholder as its body.
 * @param tools - shared controller tools.
 * @param worldX - left edge in world coordinates.
 * @param worldY - top edge in world coordinates.
 * @returns the commit effects.
 */
export function addTextBlock(tools: PurControllerTools, worldX: number, worldY: number): PurControllerEffect[] {
  tools.state.elements.push({
    id: tools.env.createId(),
    type: 'text',
    x: worldX,
    y: worldY,
    w: 200,
    h: 60,
    content: tools.labels.textPlaceholder,
    bgColor: 'rgba(30,30,30,0.8)',
    color: '#e0e0e0',
    fontSize: 14,
    rotation: 0,
    opacity: 1,
  })
  return commit(tools)
}

/** The preset fields a code node is created from; the adapter localizes `title`. */
export interface PurCodeNodeDraft {
  /** Input pin labels, in order. */
  inputs?: readonly string[]
  /** Output pin labels, in order. */
  outputs?: readonly string[]
  /** Body of `function process(inputs)`; a stub when omitted. */
  code?: string
  /** Localized node title; the fallback label when omitted. */
  title?: string
}

/**
 * Add a code node sized to its pins, with the code mirrored into `content`.
 * @param tools - shared controller tools.
 * @param worldX - left edge in world coordinates.
 * @param worldY - top edge in world coordinates.
 * @param draft - the preset fields.
 * @returns the commit effects.
 */
export function addCodeNode(tools: PurControllerTools, worldX: number, worldY: number, draft: PurCodeNodeDraft): PurControllerEffect[] {
  const inputs = (draft.inputs ?? []).map((label): PurPin => ({ id: tools.env.createId(), label }))
  const outputs = (draft.outputs ?? []).map((label): PurPin => ({ id: tools.env.createId(), label }))
  const code = draft.code ?? 'function process() {\n  return {};\n}'
  tools.state.elements.push({
    id: tools.env.createId(),
    type: 'code-node',
    title: draft.title ?? tools.labels.codeNodeFallbackTitle,
    x: worldX,
    y: worldY,
    w: 260,
    h: codeNodeHeight({ inputs, outputs }),
    inputs,
    outputs,
    code,
    content: code,
    bgColor: 'rgba(32, 34, 38, 0.92)',
    color: '#ffffff',
    fontSize: 13,
    rotation: 0,
    opacity: 1,
  })
  return commit(tools)
}

/** The code text pin extraction reads: `content`, falling back to `code`. */
function editableCode(element: PurElement): string {
  if (element.type === 'line' || element.type === 'group' || element.type === 'image') return ''
  if (element.content !== '') return element.content
  return element.type === 'code-node' ? element.code ?? '' : ''
}

/**
 * Append an input pin named after the first destructured input the element
 * does not map yet, or an empty label when all are mapped.
 * @param tools - shared controller tools.
 * @param elementId - the element to extend.
 * @returns effects, empty when the element is absent or a line/group.
 */
export function addInputPin(tools: PurControllerTools, elementId: string): PurControllerEffect[] {
  const site = findElement(tools.state.elements, elementId)
  if (site === null || site.element.type === 'line' || site.element.type === 'group') return []
  const element = site.element
  element.inputs ??= []
  const used = element.inputs.map((pin) => pin.label).filter(Boolean)
  const unmapped = (codeInputNames(editableCode(element)) ?? []).filter((name) => !used.includes(name))
  element.inputs.push({ id: tools.env.createId(), label: unmapped[0] ?? '' })
  return commit(tools)
}

/**
 * Append an output pin named after the first return key the element does not
 * map yet, or an empty label when all are mapped.
 * @param tools - shared controller tools.
 * @param elementId - the element to extend.
 * @returns effects, empty when the element is absent or a line/group.
 */
export function addOutputPin(tools: PurControllerTools, elementId: string): PurControllerEffect[] {
  const site = findElement(tools.state.elements, elementId)
  if (site === null || site.element.type === 'line' || site.element.type === 'group') return []
  const element = site.element
  element.outputs ??= []
  const used = element.outputs.map((pin) => pin.label).filter(Boolean)
  const unmapped = (codeOutputKeys(editableCode(element)) ?? []).filter((key) => !used.includes(key))
  element.outputs.push({ id: tools.env.createId(), label: unmapped[0] ?? '' })
  return commit(tools)
}

/**
 * Remove an input pin and every top-level line arriving at it.
 * @param tools - shared controller tools.
 * @param elementId - the element owning the pin.
 * @param pinId - the pin to remove.
 * @returns the commit effects.
 */
export function removeInputPin(tools: PurControllerTools, elementId: string, pinId: string): PurControllerEffect[] {
  const site = findElement(tools.state.elements, elementId)
  if (site === null || site.element.type === 'line' || site.element.type === 'group') return []
  const element = site.element
  const index = (element.inputs ?? []).findIndex((pin) => pin.id === pinId)
  if (index > -1) element.inputs?.splice(index, 1)
  tools.state.elements = tools.state.elements.filter((el) => !(el.type === 'line' && el.to === elementId && el.toPin === pinId))
  return commit(tools)
}

/**
 * Remove an output pin and every top-level line leaving it.
 * @param tools - shared controller tools.
 * @param elementId - the element owning the pin.
 * @param pinId - the pin to remove.
 * @returns the commit effects.
 */
export function removeOutputPin(tools: PurControllerTools, elementId: string, pinId: string): PurControllerEffect[] {
  const site = findElement(tools.state.elements, elementId)
  if (site === null || site.element.type === 'line' || site.element.type === 'group') return []
  const element = site.element
  const index = (element.outputs ?? []).findIndex((pin) => pin.id === pinId)
  if (index > -1) element.outputs?.splice(index, 1)
  tools.state.elements = tools.state.elements.filter((el) => !(el.type === 'line' && el.from === elementId && el.fromPin === pinId))
  return commit(tools)
}

/** The fields the code-node editor commits. */
export interface PurCodeNodeCommit {
  /** Raw title input; trimmed, with the fallback label when empty. */
  title: string
  /** Edited input pins; empty ids are regenerated. */
  inputs: readonly { id: string; label: string }[]
  /** Edited output pins; empty ids are regenerated. */
  outputs: readonly { id: string; label: string }[]
}

/**
 * Commit the code-node editor: title, trimmed pins and the update notice.
 * @param tools - shared controller tools.
 * @param nodeId - the node being edited.
 * @param draft - the committed fields.
 * @returns the commit effects plus the notice, empty when the node is absent.
 */
export function commitCodeNode(tools: PurControllerTools, nodeId: string, draft: PurCodeNodeCommit): PurControllerEffect[] {
  const site = findElement(tools.state.elements, nodeId)
  if (site === null || site.element.type !== 'code-node') return []
  const node: PurCodeNodeElement = site.element
  node.title = draft.title.trim() || tools.labels.codeNodeFallbackTitle
  node.inputs = draft.inputs.map((pin) => ({ id: pin.id || tools.env.createId(), label: pin.label ? pin.label.trim() : '' }))
  node.outputs = draft.outputs.map((pin) => ({ id: pin.id || tools.env.createId(), label: pin.label ? pin.label.trim() : '' }))
  return [...commit(tools), { type: 'notice', text: tools.labels.nodeUpdated }]
}

/**
 * Delete a top-level element and every line touching it, as the code-node
 * editor's delete button does.
 * @param tools - shared controller tools.
 * @param elementId - the element to delete.
 * @returns the commit effects plus the notice.
 */
export function deleteElementWithLines(tools: PurControllerTools, elementId: string): PurControllerEffect[] {
  tools.state.elements = tools.state.elements.filter((el) => {
    if (el.id === elementId) return false
    if (el.type === 'line' && (el.from === elementId || el.to === elementId)) return false
    return true
  })
  return [...commit(tools), { type: 'notice', text: tools.labels.nodeDeleted }]
}

/**
 * Apply an editor text input: store the content, resync pins from the code
 * markers, grow the card to the pin minimum, and render when pins changed.
 * @param tools - shared controller tools.
 * @param elementId - the element being edited.
 * @param value - the new content.
 * @returns the render effect when the pins changed, otherwise none.
 */
export function applyTextInput(tools: PurControllerTools, elementId: string, value: string): PurControllerEffect[] {
  const site = findElement(tools.state.elements, elementId)
  if (site === null || site.element.type === 'line' || site.element.type === 'group' || site.element.type === 'image') return []
  const element = site.element
  element.content = value
  let changed = false
  const oldInputs = new Map((element.inputs ?? []).filter((pin) => pin.label !== '').map((pin) => [pin.label, pin.id]))
  const oldOutputs = new Map((element.outputs ?? []).filter((pin) => pin.label !== '').map((pin) => [pin.label, pin.id]))
  const inputNames = codeInputNames(value)
  if (inputNames !== undefined) {
    element.inputs = inputNames.map((name) => ({ id: oldInputs.get(name) ?? tools.env.createId(), label: name }))
    changed = true
  } else if (!value.includes('inputs')) {
    element.inputs = []
    changed = true
  }
  const outputKeys = codeOutputKeys(value)
  if (outputKeys !== undefined) {
    element.outputs = outputKeys.map((key) => ({ id: oldOutputs.get(key) ?? tools.env.createId(), label: key }))
    changed = true
  } else if (!value.includes('return')) {
    element.outputs = []
    changed = true
  }
  if (!changed) return []
  const minH = 60 + Math.max(element.inputs?.length ?? 0, element.outputs?.length ?? 0, 1) * 28 + 20
  if (element.h < minH) element.h = minH
  return [{ type: 'render' }]
}

/**
 * Commit the text editor: content and trimmed title, then save and render.
 * Upstream saves history even when the editor cancels.
 * @param tools - shared controller tools.
 * @param elementId - the element being edited.
 * @param content - the committed body.
 * @param title - the committed title, when the element kind carries one.
 * @returns the commit effects.
 */
export function commitTextEdit(tools: PurControllerTools, elementId: string, content: string, title?: string): PurControllerEffect[] {
  const site = findElement(tools.state.elements, elementId)
  if (site !== null && (site.element.type === 'text' || site.element.type === 'code-node')) {
    site.element.content = content
    if (title !== undefined) site.element.title = title.trim()
  }
  return commit(tools)
}

/**
 * The fields the adapter's editor dialogs may patch, all optional. Each
 * element kind applies only the fields its own model carries; the rest are
 * ignored, so one dialog draft can be passed whole.
 */
export interface PurElementPatch {
  /** Body or label text. */
  content?: string
  /** Card heading. */
  title?: string
  /** Element colour. */
  color?: string
  /** Card fill. */
  bgColor?: string
  /** Label colour, for lines. */
  textColor?: string
  /** Text size in px. */
  fontSize?: number
  /** CSS font family. */
  fontFamily?: string
  /** Bold body, for text cards. */
  bold?: boolean
  /** Body fill alpha, for text cards. */
  bgOpacity?: number
  /** Secondary note text, for note-link cards. */
  note?: string
  /** Note text size in px, for note-link cards. */
  noteFontSize?: number
  /** Note text font family, for note-link cards. */
  noteFontFamily?: string
  /** Card fill, for note-link cards. */
  cardColor?: string
  /** Vault path or URL the element opens. */
  link?: string
  /** Frame stroke, for groups. */
  borderColor?: string
  /** Stroke pattern, for lines. */
  style?: PurLineStyle
  /** Arrowhead toggle, for lines. */
  arrow?: boolean
}

/**
 * Apply an editor dialog's committed fields to one element, restricted to the
 * fields its kind carries, then save history and report save and render.
 * @param tools - shared controller tools.
 * @param elementId - the element being patched.
 * @param patch - the committed fields.
 * @returns the commit effects, empty when the element is absent.
 */
export function updateElementProps(tools: PurControllerTools, elementId: string, patch: PurElementPatch): PurControllerEffect[] {
  const site = findElement(tools.state.elements, elementId)
  if (site === null) return []
  const element = site.element
  switch (element.type) {
    case 'text':
      if (patch.content !== undefined) element.content = patch.content
      if (patch.title !== undefined) element.title = patch.title
      if (patch.color !== undefined) element.color = patch.color
      if (patch.bgColor !== undefined) element.bgColor = patch.bgColor
      if (patch.fontSize !== undefined) element.fontSize = patch.fontSize
      if (patch.fontFamily !== undefined) element.fontFamily = patch.fontFamily
      if (patch.bold !== undefined) element.bold = patch.bold
      if (patch.bgOpacity !== undefined) element.bgOpacity = patch.bgOpacity
      break
    case 'code-node':
      if (patch.content !== undefined) element.content = patch.content
      if (patch.title !== undefined) element.title = patch.title
      if (patch.color !== undefined) element.color = patch.color
      if (patch.bgColor !== undefined) element.bgColor = patch.bgColor
      if (patch.fontSize !== undefined) element.fontSize = patch.fontSize
      if (patch.fontFamily !== undefined) element.fontFamily = patch.fontFamily
      break
    case 'note-link':
      if (patch.note !== undefined) element.note = patch.note
      if (patch.noteFontSize !== undefined) element.noteFontSize = patch.noteFontSize
      if (patch.noteFontFamily !== undefined) element.noteFontFamily = patch.noteFontFamily
      if (patch.cardColor !== undefined) element.cardColor = patch.cardColor
      if (patch.link !== undefined) element.link = patch.link
      break
    case 'group':
      if (patch.content !== undefined) element.content = patch.content
      if (patch.color !== undefined) element.color = patch.color
      if (patch.borderColor !== undefined) element.borderColor = patch.borderColor
      if (patch.fontSize !== undefined) element.fontSize = patch.fontSize
      if (patch.fontFamily !== undefined) element.fontFamily = patch.fontFamily
      if (patch.link !== undefined) element.link = patch.link
      break
    case 'line':
      if (patch.content !== undefined) element.content = patch.content
      if (patch.color !== undefined) element.color = patch.color
      if (patch.textColor !== undefined) element.textColor = patch.textColor
      if (patch.fontSize !== undefined) element.fontSize = patch.fontSize
      if (patch.fontFamily !== undefined) element.fontFamily = patch.fontFamily
      if (patch.style !== undefined) element.style = patch.style
      if (patch.arrow !== undefined) element.arrow = patch.arrow
      break
    case 'image':
      if (patch.link !== undefined) element.link = patch.link
      break
  }
  return commit(tools)
}
