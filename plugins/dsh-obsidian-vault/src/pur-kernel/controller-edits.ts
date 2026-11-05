/**
 * Creation and editor-commit commands: adding text blocks and code nodes, and
 * committing the code-node and text editors. Each mutates the state and returns
 * the effects the adapter must perform, in upstream order.
 * @module dsh-obsidian-vault/pur-kernel/controller-edits
 */
import { findElement } from './geometry.ts'
import { codeInputNames, codeOutputKeys } from './note-raw.ts'
import { codeNodeMinHeight } from './code-node-layout.ts'
import { codeNodeHeight } from './nodes.ts'
import { commit } from './controller-selection.ts'
import type { PurControllerEffect, PurControllerTools } from './controller-types.ts'
import type { PurCodeNodeElement, PurElement, PurPin } from './types.ts'

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

/** The fields the code-node editor commits. */
export interface PurCodeNodeCommit {
  /** Code to store; defaults to the element's own body. */
  readonly code?: string
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
  // A node that gained pins needs room for them; growing the card is less
  // surprising than letting rows squeeze together.
  const rows = Math.max(node.inputs.length, node.outputs.length, 1)
  node.h = Math.max(node.h ?? 80, codeNodeMinHeight(rows))
  return [...commit(tools), { type: 'notice', text: tools.labels.nodeUpdated }]
}

/**
 * Give any pin-capable card a fresh pin list. Text cards and note links draw pins
 * without a header, so they stay text cards; only a code node needs the height
 * guarantee that comes with its header band.
 * @param tools - shared controller tools.
 * @param elementId - the card to update.
 * @param draft - input and output pins.
 * @returns the commit effects; empty for lines and missing cards.
 */
export function setElementPins(tools: PurControllerTools, elementId: string, draft: { inputs: readonly { id: string; label: string }[]; outputs: readonly { id: string; label: string }[] }): PurControllerEffect[] {
  const site = findElement(tools.state.elements, elementId)
  if (site === null || site.element.type === 'line') return []
  const element = site.element
  element.inputs = draft.inputs.map((pin) => ({ id: pin.id || tools.env.createId(), label: pin.label ? pin.label.trim() : '' }))
  element.outputs = draft.outputs.map((pin) => ({ id: pin.id || tools.env.createId(), label: pin.label ? pin.label.trim() : '' }))
  if (element.type === 'code-node') {
    const rows = Math.max(element.inputs.length, element.outputs.length, 1)
    element.h = Math.max(element.h ?? 80, codeNodeMinHeight(rows))
  }
  return commit(tools)
}

/**
 * Turn a text card into a code node in place, keeping its position, size, colours
 * and body. The body becomes the node's code, so text written with the text tool
 * can be promoted to a reusable node without losing its place on the canvas.
 * @param tools - shared controller tools.
 * @param elementId - the text card to convert.
 * @param draft - title and pins to apply.
 * @returns the commit effects plus the update notice; empty for a non-text card.
 */
export function convertTextToCode(tools: PurControllerTools, elementId: string, draft: PurCodeNodeCommit): PurControllerEffect[] {
  const site = findElement(tools.state.elements, elementId)
  if (site === null || site.element.type !== 'text') return []
  const text = site.element
  const code = draft.code ?? text.content
  const node: PurCodeNodeElement = {
    ...text,
    type: 'code-node',
    content: code,
    code,
    title: draft.title.trim() || tools.labels.codeNodeFallbackTitle,
    inputs: draft.inputs.map((pin) => ({ id: pin.id || tools.env.createId(), label: pin.label ? pin.label.trim() : '' })),
    outputs: draft.outputs.map((pin) => ({ id: pin.id || tools.env.createId(), label: pin.label ? pin.label.trim() : '' })),
  }
  const rows = Math.max(node.inputs?.length ?? 0, node.outputs?.length ?? 0, 1)
  node.h = Math.max(node.h ?? 80, codeNodeMinHeight(rows))
  const replaceIn = (list: PurElement[]): boolean => {
    for (let index = 0; index < list.length; index++) {
      const candidate = list[index]
      if (candidate === undefined) continue
      if (candidate.id === elementId) {
        list[index] = node
        return true
      }
      if (candidate.type === 'group' && replaceIn(candidate.children)) return true
    }
    return false
  }
  replaceIn(tools.state.elements)
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
