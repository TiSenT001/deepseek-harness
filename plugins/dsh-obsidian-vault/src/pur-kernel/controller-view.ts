/**
 * Viewport commands: select-all and fit-to-view. Both only touch selection and
 * the shared view transform, so they stay out of the element-editing commands.
 * @module dsh-obsidian-vault/pur-kernel/controller-view
 */
import { getSelectedElements } from './controller-selection.ts'
import { elementBounds } from './view-bounds.ts'
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
  const bounds = elementBounds(targets)
  if (bounds === undefined) return []
  const pad = 40
  const worldW = bounds.maxX - bounds.minX + pad * 2
  const worldH = bounds.maxY - bounds.minY + pad * 2
  if (!Number.isFinite(worldW) || !Number.isFinite(worldH) || worldW <= 0 || worldH <= 0) return []
  const sx = tools.env.canvasWidth / worldW
  const sy = tools.env.canvasHeight / worldH
  const scale = Math.min(sx, sy, 5)
  if (!Number.isFinite(scale) || scale <= 0) return []
  tools.state.view.scale = scale
  tools.state.view.offsetX = tools.env.canvasWidth / 2 - ((bounds.minX + bounds.maxX) / 2) * scale
  tools.state.view.offsetY = tools.env.canvasHeight / 2 - ((bounds.minY + bounds.maxY) / 2) * scale
  return [{ type: 'render' }]
}
