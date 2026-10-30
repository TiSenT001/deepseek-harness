/**
 * Creation and editor-commit commands: adding text blocks and code nodes, and
 * committing the code-node and text editors. Each mutates the state and returns
 * the effects the adapter must perform, in upstream order.
 * @module dsh-obsidian-vault/pur-kernel/controller-edits
 */
import { findElement } from './geometry.ts'
import { codeInputNames, codeOutputKeys } from './note-raw.ts'
import { codeNodeHeight } from './nodes.ts'
import { commit } from './controller-selection.ts'
import type { PurControllerEffect, PurControllerTools } from './controller-types.ts'
import type { PurCodeNodeElement, PurPin } from './types.ts'

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
