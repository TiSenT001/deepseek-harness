/**
 * Viewport commands: select-all and fit-to-view. Both only touch selection and
 * the shared view transform, so they stay out of the element-editing commands.
 * @module dsh-obsidian-vault/pur-kernel/controller-view
 */
import { getSelectedElements } from './controller-selection.ts'
import type { PurControllerEffect, PurControllerState, PurControllerTools } from './controller-types.ts'

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
