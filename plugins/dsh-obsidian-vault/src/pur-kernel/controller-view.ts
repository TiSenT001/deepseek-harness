/**
 * Viewport commands: select-all and fit-to-view. Both only touch selection and
 * the shared view transform, so they stay out of the element-editing commands.
 * @module dsh-obsidian-vault/pur-kernel/controller-view
 */
import { elementBounds, selectedBounds } from './view-bounds.ts'
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
  // A selected child of a group stores a position relative to its parent, so the
  // selection is framed through the tree walk rather than measured on its own.
  const bounds = tools.state.selectedIds.size > 0
    ? selectedBounds(tools.state.elements, tools.state.selectedIds)
    : elementBounds(tools.state.elements)
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

/** Smallest and largest zoom the controls produce, matching the wheel. */
const ZOOM_MIN = 0.05
const ZOOM_MAX = 10

/**
 * Zoom around the canvas centre.
 * @param tools - shared controller tools.
 * @param factor - multiplier applied to the current scale.
 * @returns the render effect.
 */
export function zoomByStep(tools: PurControllerTools, factor: number): PurControllerEffect[] {
  const { state, env } = tools
  const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, state.view.scale * factor))
  const centreX = env.canvasWidth / 2
  const centreY = env.canvasHeight / 2
  // Keep the world point under the canvas centre where it is.
  const worldX = (centreX - state.view.offsetX) / state.view.scale
  const worldY = (centreY - state.view.offsetY) / state.view.scale
  state.view.scale = next
  state.view.offsetX = centreX - worldX * next
  state.view.offsetY = centreY - worldY * next
  state.showZoomUntil = env.now() + 800
  return [{ type: 'render' }]
}

/**
 * Return to 100% around the canvas centre.
 * @param tools - shared controller tools.
 * @returns the render effect.
 */
export function resetZoom(tools: PurControllerTools): PurControllerEffect[] {
  const { state, env } = tools
  const centreX = env.canvasWidth / 2
  const centreY = env.canvasHeight / 2
  const worldX = (centreX - state.view.offsetX) / state.view.scale
  const worldY = (centreY - state.view.offsetY) / state.view.scale
  state.view.scale = 1
  state.view.offsetX = centreX - worldX
  state.view.offsetY = centreY - worldY
  state.showZoomUntil = env.now() + 800
  return [{ type: 'render' }]
}
