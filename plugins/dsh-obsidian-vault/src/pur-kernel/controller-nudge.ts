/**
 * Keyboard nudge: the arrow keys move the selection, one canvas unit at a time or
 * ten with Shift. A burst of presses collapses into one history step, so a long
 * nudge undoes in one go instead of key by key.
 * @module dsh-obsidian-vault/pur-kernel/controller-nudge
 */
import { findElement } from './geometry.ts'
import { pushHistory } from './history.ts'
import type { PurControllerEffect, PurControllerTools } from './controller-types.ts'

/** Presses closer together than this share one history step, in milliseconds. */
export const NUDGE_COALESCE_MS = 500

/** Distance one key press moves the selection, in canvas units. */
export const NUDGE_STEP = 1

/** Distance a Shift press moves the selection, in canvas units. */
export const NUDGE_STEP_LARGE = 10

/**
 * Move every selected element.
 * @param tools - shared controller tools.
 * @param dx - world x delta.
 * @param dy - world y delta.
 * @returns the effects; a locked-only selection reports instead of moving.
 */
export function nudgeSelection(tools: PurControllerTools, dx: number, dy: number): PurControllerEffect[] {
  const { state, labels } = tools
  if (state.selectedIds.size === 0) return []
  let moved = 0
  let locked = 0
  for (const id of state.selectedIds) {
    const site = findElement(state.elements, id)
    if (site === null || site.element.type === 'line') continue
    if (site.element.locked === true) {
      locked += 1
      continue
    }
    site.element.x = (site.element.x ?? 0) + dx
    site.element.y = (site.element.y ?? 0) + dy
    moved += 1
  }
  if (moved === 0) return locked > 0 ? [{ type: 'notice', text: labels.lockedNotice }] : []
  const now = tools.env.now()
  const coalesced = state.nudgeAt !== null && now - state.nudgeAt <= NUDGE_COALESCE_MS
  state.nudgeAt = now
  if (!coalesced) pushHistory(tools.history, state.elements)
  return [{ type: 'render' }, { type: 'save' }]
}
