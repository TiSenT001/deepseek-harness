/**
 * Layering and per-element property commands: z-order, transform reset, lock
 * and opacity. They all operate through the selection query and end in the
 * shared save/render tail.
 * @module dsh-obsidian-vault/pur-kernel/controller-layers
 */
import { pushHistory } from './history.ts'
import { commit, getSelectedElements } from './controller-selection.ts'
import type { PurControllerEffect, PurControllerTools } from './controller-types.ts'

/**
 * Move selected top-level elements to the end of the element list.
 * @param tools - shared controller tools.
 * @returns the commit effects.
 */
export function bringToFront(tools: PurControllerTools): PurControllerEffect[] {
  for (const element of getSelectedElements(tools.state)) {
    const index = tools.state.elements.indexOf(element)
    if (index > -1) { tools.state.elements.splice(index, 1); tools.state.elements.push(element) }
  }
  return commit(tools)
}

/**
 * Move selected top-level elements to the front of the element list,
 * iterating the selection in reverse like upstream.
 * @param tools - shared controller tools.
 * @returns the commit effects.
 */
export function sendToBack(tools: PurControllerTools): PurControllerEffect[] {
  const sel = getSelectedElements(tools.state)
  for (let index = sel.length - 1; index >= 0; index--) {
    const element = sel[index]
    if (element === undefined) continue
    const at = tools.state.elements.indexOf(element)
    if (at > -1) { tools.state.elements.splice(at, 1); tools.state.elements.unshift(element) }
  }
  return commit(tools)
}

/**
 * Swap each selected top-level element with the one above it.
 * @param tools - shared controller tools.
 * @returns the commit effects.
 */
export function bringForward(tools: PurControllerTools): PurControllerEffect[] {
  for (const element of getSelectedElements(tools.state)) {
    const index = tools.state.elements.indexOf(element)
    if (index > -1 && index < tools.state.elements.length - 1) {
      tools.state.elements.splice(index, 1)
      tools.state.elements.splice(index + 1, 0, element)
    }
  }
  return commit(tools)
}

/**
 * Swap each selected top-level element with the one below it, iterating the
 * selection in reverse like upstream.
 * @param tools - shared controller tools.
 * @returns the commit effects.
 */
export function sendBackward(tools: PurControllerTools): PurControllerEffect[] {
  const sel = getSelectedElements(tools.state)
  for (let index = sel.length - 1; index >= 0; index--) {
    const element = sel[index]
    if (element === undefined) continue
    const at = tools.state.elements.indexOf(element)
    if (at > 0) {
      tools.state.elements.splice(at, 1)
      tools.state.elements.splice(at - 1, 0, element)
    }
  }
  return commit(tools)
}

/**
 * Reset rotation and both flips on every selected element.
 * @param tools - shared controller tools.
 * @returns the commit effects.
 */
export function resetTransform(tools: PurControllerTools): PurControllerEffect[] {
  for (const element of getSelectedElements(tools.state)) {
    element.rotation = 0
    element.flipH = false
    element.flipV = false
  }
  return commit(tools)
}

/**
 * Toggle `locked` on each selected element individually; newly locked
 * elements join the badge-pulse set.
 * @param tools - shared controller tools.
 * @returns the commit effects.
 */
export function toggleLock(tools: PurControllerTools): PurControllerEffect[] {
  for (const element of getSelectedElements(tools.state)) {
    element.locked = !element.locked
    if (element.locked) {
      element._lockTime = tools.env.now()
      tools.state.lockPulseIds.add(element.id)
    }
  }
  return commit(tools)
}

/**
 * Set every selected non-line element's lock to the same value, the context
 * menu's behaviour (no render, upstream saves only).
 * @param tools - shared controller tools.
 * @param locked - the lock state to apply to all.
 * @returns the save effect only.
 */
export function setSelectionLocked(tools: PurControllerTools, locked: boolean): PurControllerEffect[] {
  for (const element of getSelectedElements(tools.state)) {
    if (element.type === 'line') continue
    element.locked = locked
    if (locked) {
      element._lockTime = tools.env.now()
      tools.state.lockPulseIds.add(element.id)
    }
  }
  pushHistory(tools.history, tools.state.elements)
  return [{ type: 'save' }]
}

/**
 * Set the opacity of every selected element; preview renders without a
 * history entry, commit records one and saves without rendering.
 * @param tools - shared controller tools.
 * @param value - the opacity, 0–1.
 * @param mode - `preview` while the slider drags, `commit` on release.
 * @returns the effects for the chosen mode.
 */
export function setSelectionOpacity(tools: PurControllerTools, value: number, mode: 'preview' | 'commit'): PurControllerEffect[] {
  for (const element of getSelectedElements(tools.state)) element.opacity = value
  if (mode === 'preview') return [{ type: 'render' }]
  pushHistory(tools.history, tools.state.elements)
  return [{ type: 'save' }]
}
