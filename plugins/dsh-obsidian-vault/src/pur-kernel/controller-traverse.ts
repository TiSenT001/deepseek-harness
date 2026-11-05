/**
 * Keyboard traversal: Tab moves the selection through the board so the canvas can
 * be inspected and edited without a pointer. Group children are visited after the
 * group itself, matching the drawing order.
 * @module dsh-obsidian-vault/pur-kernel/controller-traverse
 */
import { findElement } from './geometry.ts'
import type { PurControllerEffect, PurControllerTools } from './controller-types.ts'
import type { PurElement } from './types.ts'

/**
 * Every element that keyboard traversal may select, in drawing order.
 * @param elements - element tree.
 * @returns the flattened list, lines included.
 */
export function traversalOrder(elements: readonly PurElement[]): PurElement[] {
  const order: PurElement[] = []
  const walk = (nodes: readonly PurElement[]): void => {
    for (const node of nodes) {
      order.push(node)
      if (node.type === 'group') walk(node.children)
    }
  }
  walk(elements)
  return order
}

/**
 * Select the next or previous element.
 * @param tools - shared controller tools.
 * @param backwards - true for Shift+Tab.
 * @returns the render effect, empty when the canvas has no elements.
 */
export function cycleSelection(tools: PurControllerTools, backwards: boolean): PurControllerEffect[] {
  const order = traversalOrder(tools.state.elements)
  if (order.length === 0) return []
  const current = order.findIndex((element) => tools.state.selectedIds.has(element.id))
  const step = backwards ? -1 : 1
  const next = current < 0 ? (backwards ? order.length - 1 : 0) : (current + step + order.length) % order.length
  const target = order[next]
  if (target === undefined) return []
  tools.state.selectedIds = new Set([target.id])
  revealElement(tools, target.id)
  return [{ type: 'render' }]
}

/**
 * Centre an element that keyboard traversal just picked, so the selection is never
 * somewhere the user cannot see.
 * @param tools - shared controller tools.
 * @param id - the element to reveal.
 */
function revealElement(tools: PurControllerTools, id: string): void {
  const { state, env } = tools
  const site = findElement(state.elements, id)
  if (site === null) return
  const { element, parentX, parentY } = site
  const centreX = ((element.x ?? 0) + parentX + (element.w ?? 0) / 2) * state.view.scale
  const centreY = ((element.y ?? 0) + parentY + (element.h ?? 0) / 2) * state.view.scale
  const screenX = centreX + state.view.offsetX
  const screenY = centreY + state.view.offsetY
  // A card whose centre is already on screen is considered reachable; only one the
  // user cannot see at all is worth moving the view for.
  if (screenX >= 0 && screenY >= 0 && screenX <= env.canvasWidth && screenY <= env.canvasHeight) return
  state.view.offsetX = env.canvasWidth / 2 - centreX
  state.view.offsetY = env.canvasHeight / 2 - centreY
}
