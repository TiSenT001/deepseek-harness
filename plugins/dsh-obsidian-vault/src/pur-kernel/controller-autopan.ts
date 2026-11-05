/**
 * Edge auto-pan: while a drag or a rubber band is in flight, holding the pointer
 * near the canvas edge keeps the view moving, so a card can be carried past the
 * visible area without letting go.
 * @module dsh-obsidian-vault/pur-kernel/controller-autopan
 */
import { findElement } from './geometry.ts'
import type { PurControllerEffect, PurControllerTools } from './controller-types.ts'

/** How deep the edge zone is, in canvas pixels. */
export const AUTOPAN_ZONE = 32

/** Fastest pan, in canvas pixels per frame. */
export const AUTOPAN_MAX_SPEED = 12

/**
 * Change in the view offset for one axis. Moving the offset up shows the world to
 * the left of the current view, so the left edge adds to the offset and the right
 * edge subtracts from it.
 * @param position - pointer position on the axis, canvas pixels.
 * @param size - canvas size on the axis.
 * @returns offset change per frame, zero outside the edge zone.
 */
export function autoPanSpeed(position: number, size: number): number {
  if (position < AUTOPAN_ZONE) {
    const depth = Math.min(AUTOPAN_ZONE, AUTOPAN_ZONE - Math.max(0, position))
    return Math.ceil((depth / AUTOPAN_ZONE) * AUTOPAN_MAX_SPEED)
  }
  const distance = size - position
  if (distance < AUTOPAN_ZONE) {
    const depth = Math.min(AUTOPAN_ZONE, AUTOPAN_ZONE - Math.max(0, distance))
    return -Math.ceil((depth / AUTOPAN_ZONE) * AUTOPAN_MAX_SPEED)
  }
  return 0
}

/**
 * Advance one auto-pan frame for the active gesture.
 * @param tools - shared controller tools.
 * @returns the render effect, empty when no gesture is moving the view.
 */
export function autoPanStep(tools: PurControllerTools): PurControllerEffect[] {
  const { state, env } = tools
  if (!state.dragging && !state.selecting) return []
  const dx = autoPanSpeed(state.lastLocal.x, env.canvasWidth)
  const dy = autoPanSpeed(state.lastLocal.y, env.canvasHeight)
  if (dx === 0 && dy === 0) return []
  state.view.offsetX += dx
  state.view.offsetY += dy
  if (state.dragging && state.dragStart !== null) {
    const drag = state.dragStart
    // The pointer did not move, so the world point under it does: a positive offset
    // change pulls the world back, which means the carried cards move the other way.
    for (const entry of drag.elements) {
      if (entry === null) continue
      const site = findElement(state.elements, entry.id)
      if (site === null || site.element.type === 'line') continue
      site.element.x = (site.element.x ?? 0) - dx / state.view.scale
      site.element.y = (site.element.y ?? 0) - dy / state.view.scale
    }
  }
  return [{ type: 'render' }]
}
