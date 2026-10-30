/**
 * Element-editing commands: alignment, uniform scaling, auto arrangement,
 * connection and deletion. Each mutates the state and returns the effects the
 * adapter must perform, in upstream order.
 * @module dsh-obsidian-vault/pur-kernel/controller-commands
 */
import { commit, getSelectedElements } from './controller-selection.ts'
import { fitToView } from './controller-view.ts'
import type { PurControllerEffect, PurControllerTools } from './controller-types.ts'
import type { PurElement } from './types.ts'

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
