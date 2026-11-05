/**
 * Drag geometry: a card follows the world point under the pointer, so the
 * position is always derived from the pointer and the current view instead of
 * accumulating deltas. That derivation is what keeps a card under the cursor when
 * edge auto-pan moves the view without moving the pointer.
 * @module dsh-obsidian-vault/pur-kernel/controller-drag
 */
import { findElement } from './geometry.ts'
import type { PurControllerTools } from './controller-types.ts'

/**
 * Place every dragged card where the pointer currently is.
 * @param tools - shared controller tools.
 * @returns true when a drag was in flight.
 */
export function applyDragToPointer(tools: PurControllerTools): boolean {
  const { state } = tools
  const drag = state.dragStart
  if (drag === null || !state.dragging) return false
  const worldX = (state.lastLocal.x - state.view.offsetX) / state.view.scale
  const worldY = (state.lastLocal.y - state.view.offsetY) / state.view.scale
  const dx = worldX - drag.pointerWorldX
  const dy = worldY - drag.pointerWorldY
  for (const entry of drag.elements) {
    if (entry === null) continue
    const site = findElement(state.elements, entry.id)
    if (site === null || site.element.type === 'line') continue
    site.element.x = entry.x + dx - entry.parentX
    site.element.y = entry.y + dy - entry.parentY
  }
  return true
}
