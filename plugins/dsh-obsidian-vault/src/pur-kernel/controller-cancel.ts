/**
 * Escape handling: back out of whatever the canvas is in the middle of. A gesture
 * in flight is rolled back to the state it started from; otherwise the selection
 * is dropped. Rolling back never writes history, so Escape cannot be undone into a
 * half-cancelled state.
 * @module dsh-obsidian-vault/pur-kernel/controller-cancel
 */
import { findElement } from './geometry.ts'
import type { PurControllerEffect, PurControllerTools } from './controller-types.ts'

/**
 * Cancel the active gesture or clear the selection.
 * @param tools - shared controller tools.
 * @returns the effects, or undefined when there was nothing to cancel.
 */
export function cancelGesture(tools: PurControllerTools): PurControllerEffect[] | undefined {
  const { state } = tools
  if (state.pinDrop !== null) {
    state.pinDrop = null
    return [{ type: 'render' }]
  }
  if (state.pinDrag !== null) {
    state.pinDrag = null
    state.hoverPin = null
    return [{ type: 'render' }]
  }
  if (state.resizing) {
    const resize = state.resize
    if (resize !== null) {
      const site = findElement(state.elements, resize.elementId)
      if (site !== null && site.element.type !== 'line') {
        site.element.x = resize.x
        site.element.y = resize.y
        site.element.w = resize.w
        site.element.h = resize.h
      }
    }
    state.resizing = false
    state.resize = null
    return [{ type: 'render' }]
  }
  if (state.dragging) {
    if (state.dragStart !== null) {
      for (const entry of state.dragStart.elements) {
        if (entry === null) continue
        const site = findElement(state.elements, entry.id)
        if (site === null) continue
        if (site.element.type === 'line' && (site.element.from !== '' || site.element.to !== '')) continue
        // Snapshots hold world coordinates; the element stores them relative to
        // its group, so the parent offset comes back off.
        site.element.x = entry.x - entry.parentX
        site.element.y = entry.y - entry.parentY
      }
    }
    state.dragging = false
    state.dragStart = null
    state.snapGuides = { x: null, y: null }
    return [{ type: 'render' }]
  }
  if (state.selecting) {
    if (state.selectionBefore !== null) {
      state.selectedIds = new Set(state.selectionBefore)
    }
    state.selecting = false
    state.selectionRect = null
    state.selectionBefore = null
    return [{ type: 'render' }]
  }
  if (state.panning) {
    if (state.panStart !== null) {
      state.view.offsetX = state.panStart.x
      state.view.offsetY = state.panStart.y
    }
    state.panning = false
    state.panStart = null
    state.panVel = { x: 0, y: 0 }
    return [{ type: 'render' }]
  }
  if (state.selectedIds.size > 0) {
    state.selectedIds.clear()
    return [{ type: 'render' }]
  }
  return undefined
}
