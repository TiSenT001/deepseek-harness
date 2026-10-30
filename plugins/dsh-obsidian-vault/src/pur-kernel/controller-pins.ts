/**
 * Pin commands: append or remove the input/output pins a code element exposes,
 * resyncing labels from the code's own markers.
 * @module dsh-obsidian-vault/pur-kernel/controller-pins
 */
import { findElement } from './geometry.ts'
import { codeInputNames, codeOutputKeys } from './note-raw.ts'
import { commit } from './controller-selection.ts'
import type { PurControllerEffect, PurControllerTools } from './controller-types.ts'
import type { PurElement } from './types.ts'

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
