/**
 * Structural commands: selection queries, alignment, uniform scaling, auto
 * arrangement, connection, deletion, z-order, transforms, locking, opacity,
 * select-all and fit-to-view. Each mutates the state and returns the effects
 * the adapter must perform, in upstream order.
 * @module dsh-obsidian-vault/pur-kernel/controller-commands
 */
import { pushHistory } from './history.ts'
import type { PurControllerEffect, PurControllerState, PurControllerTools } from './controller-types.ts'
import type { PurElement } from './types.ts'

/**
 * Push a history snapshot and report the usual save-then-render tail.
 * @param tools - shared controller tools.
 * @returns the save and render effects.
 */
export function commit(tools: PurControllerTools): PurControllerEffect[] {
  pushHistory(tools.history, tools.state.elements)
  return [{ type: 'save' }, { type: 'render' }]
}

/**
 * Selected elements in tree order, including group children (upstream
 * `getSelectedElements`).
 * @param state - controller state.
 * @returns the selected elements.
 */
export function getSelectedElements(state: PurControllerState): PurElement[] {
  const result: PurElement[] = []
  const search = (elements: readonly PurElement[]): void => {
    for (const element of elements) {
      if (state.selectedIds.has(element.id)) result.push(element)
      if (element.type === 'group') search(element.children)
    }
  }
  search(state.elements)
  return result
}

/** Alignment and distribution modes upstream supports. */
export type PurAlignMode = 'left' | 'top' | 'center' | 'distribute-h'

/**
 * Align every selected element after the first to the first, or distribute
 * them horizontally with a 20-unit gap.
 * @param tools - shared controller tools.
 * @param type - the alignment mode.
 * @returns effects, empty when fewer than two elements are selected.
 */
export function alignElements(tools: PurControllerTools, type: PurAlignMode): PurControllerEffect[] {
  const sel = getSelectedElements(tools.state)
  const ref = sel[0]
  if (sel.length < 2 || ref === undefined) return []
  if (type === 'distribute-h') {
    sel.sort((a, b) => (a.x ?? 0) - (b.x ?? 0))
    let currentX = sel[0]?.x ?? 0
    for (const element of sel) { element.x = currentX; currentX += (element.w ?? 0) + 20 }
  } else {
    for (let index = 1; index < sel.length; index++) {
      const element = sel[index]
      if (element === undefined) continue
      if (type === 'left') element.x = ref.x ?? 0
      if (type === 'top') element.y = ref.y ?? 0
      if (type === 'center') {
        element.x = (ref.x ?? 0) + (ref.w ?? 0) / 2 - (element.w ?? 0) / 2
        element.y = (ref.y ?? 0) + (ref.h ?? 0) / 2 - (element.h ?? 0) / 2
      }
    }
  }
  return commit(tools)
}

/**
 * Scale every selected element after the first to the first's width or
 * height, keeping each element's aspect ratio.
 * @param tools - shared controller tools.
 * @param type - which dimension to match.
 * @returns effects, empty when fewer than two elements are selected.
 */
export function scaleElements(tools: PurControllerTools, type: 'width' | 'height'): PurControllerEffect[] {
  const sel = getSelectedElements(tools.state)
  const ref = sel[0]
  if (sel.length < 2 || ref === undefined) return []
  for (let index = 1; index < sel.length; index++) {
    const element = sel[index]
    if (element === undefined) continue
    if (type === 'width') {
      const ratio = (ref.w ?? 0) / (element.w ?? 1)
      element.w = ref.w ?? 0
      element.h = (element.h ?? 0) * ratio
    } else if (type === 'height') {
      const ratio = (ref.h ?? 0) / (element.h ?? 1)
      element.h = ref.h ?? 0
      element.w = (element.w ?? 0) * ratio
    }
  }
  return commit(tools)
}

/**
 * Pack the selected elements (or every top-level non-group non-line element)
 * into rows, tallest first, then fit the view.
 * @param tools - shared controller tools.
 * @returns effects, empty when fewer than two elements qualify.
 */
export function arrangeElements(tools: PurControllerTools): PurControllerEffect[] {
  const state = tools.state
  const selected = state.selectedIds.size > 0 ? getSelectedElements(state) : state.elements.filter((el) => el.type !== 'group' && el.type !== 'line')
  if (selected.length < 2) return []
  selected.sort((a, b) => (b.h ?? 0) - (a.h ?? 0))
  const startX = Math.min(...selected.map((el) => el.x ?? 0))
  const startY = Math.min(...selected.map((el) => el.y ?? 0))
  const padding = 15
  const totalArea = selected.reduce((sum, el) => sum + ((el.w ?? 0) + padding) * ((el.h ?? 0) + padding), 0)
  const optimalWidth = Math.max(500, Math.ceil(Math.sqrt(totalArea) * 1.3))
  let currentX = startX
  let currentY = startY
  let currentRowHeight = 0
  for (const element of selected) {
    if (currentX + (element.w ?? 0) > startX + optimalWidth && currentX !== startX) {
      currentX = startX
      currentY += currentRowHeight + padding
      currentRowHeight = 0
    }
    element.x = currentX
    element.y = currentY
    currentX += (element.w ?? 0) + padding
    currentRowHeight = Math.max(currentRowHeight, element.h ?? 0)
  }
  return [...commit(tools), ...fitToView(tools)]
}

/**
 * Connect exactly two selected elements with a plain line, unless such a
 * line already exists in either direction.
 * @param tools - shared controller tools.
 * @returns effects; a notice when the selection is not a pair.
 */
export function connectSelected(tools: PurControllerTools): PurControllerEffect[] {
  const sel = getSelectedElements(tools.state)
  const first = sel[0]
  const second = sel[1]
  if (sel.length !== 2 || first === undefined || second === undefined) return [{ type: 'notice', text: tools.labels.connectNeedsTwo }]
  const existing = tools.state.elements.find(
    (el) => el.type === 'line' && ((el.from === first.id && el.to === second.id) || (el.from === second.id && el.to === first.id)),
  )
  if (existing !== undefined) return []
  tools.state.elements.push({ id: tools.env.createId(), type: 'line', from: first.id, to: second.id, color: 'rgba(150, 150, 150, 0.7)', width: 2 })
  return commit(tools)
}

/**
 * Delete every selected element, group subtrees included, plus every line
 * touching a deleted element, then clear the selection.
 * @param tools - shared controller tools.
 * @returns the commit effects.
 */
export function deleteSelected(tools: PurControllerTools): PurControllerEffect[] {
  const deleteIds = new Set<string>()
  const collectIds = (elements: readonly PurElement[]): void => {
    for (const element of elements) {
      if (tools.state.selectedIds.has(element.id)) {
        deleteIds.add(element.id)
        if (element.type === 'group') collectIds(element.children)
      } else if (element.type === 'group') {
        collectIds(element.children)
      }
    }
  }
  collectIds(tools.state.elements)
  const filterTree = (elements: readonly PurElement[]): PurElement[] =>
    elements.filter((element) => {
      if (deleteIds.has(element.id)) return false
      if (element.type === 'line' && (deleteIds.has(element.from) || deleteIds.has(element.to))) return false
      if (element.type === 'group') element.children = filterTree(element.children)
      return true
    })
  tools.state.elements = filterTree(tools.state.elements)
  tools.state.selectedIds.clear()
  return commit(tools)
}

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

/**
 * Select every top-level element, lines and groups included (upstream
 * Ctrl+A).
 * @param state - controller state.
 * @returns the render effect.
 */
export function selectAll(state: PurControllerState): PurControllerEffect[] {
  state.selectedIds.clear()
  for (const element of state.elements) state.selectedIds.add(element.id)
  return [{ type: 'render' }]
}

/**
 * Pan and zoom so the selected elements (or the whole canvas) fit the
 * canvas, capped at 5x with 40 units of padding.
 * @param tools - shared controller tools.
 * @returns the render effect, empty when there is nothing to fit.
 */
export function fitToView(tools: PurControllerTools): PurControllerEffect[] {
  const targets = tools.state.selectedIds.size > 0 ? getSelectedElements(tools.state) : tools.state.elements
  if (targets.length === 0) return []
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const element of targets) {
    const x = element.x ?? NaN
    const y = element.y ?? NaN
    const w = element.w ?? NaN
    const h = element.h ?? NaN
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x + w > maxX) maxX = x + w
    if (y + h > maxY) maxY = y + h
  }
  const pad = 40
  const worldW = maxX - minX + pad * 2
  const worldH = maxY - minY + pad * 2
  const sx = tools.env.canvasWidth / worldW
  const sy = tools.env.canvasHeight / worldH
  tools.state.view.scale = Math.min(sx, sy, 5)
  tools.state.view.offsetX = tools.env.canvasWidth / 2 - (minX + (maxX - minX) / 2) * tools.state.view.scale
  tools.state.view.offsetY = tools.env.canvasHeight / 2 - (minY + (maxY - minY) / 2) * tools.state.view.scale
  return [{ type: 'render' }]
}
