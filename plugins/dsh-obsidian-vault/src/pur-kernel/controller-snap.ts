/**
 * Snapping: while cards are dragged, their edges and centres latch onto the
 * edges and centres of everything else within a small radius. The snap emits the
 * line that matched so the renderer can show why the card stopped there.
 * @module dsh-obsidian-vault/pur-kernel/controller-snap
 */
import { findElement } from './geometry.ts'
import type { PurControllerState } from './controller-types.ts'
import type { PurResizeHandle } from './resize-handles.ts'
import type { PurElement } from './types.ts'

/** Snap radius in screen pixels; converted to world units by the current zoom. */
export const SNAP_RADIUS = 8

/** One axis of a snap decision. */
export interface SnapAxis {
  /** World offset the drag has to take to latch. */
  readonly delta: number
  /** World coordinate of the line that matched. */
  readonly guide: number
}

/** Snap decision for both axes. */
export interface SnapResult {
  /** Horizontal correction, zero when nothing matched. */
  readonly x: SnapAxis | null
  /** Vertical correction. */
  readonly y: SnapAxis | null
}

/** World rectangle used for snapping. */
interface SnapRect {
  readonly left: number
  readonly right: number
  readonly top: number
  readonly bottom: number
}

/**
 * Collect the ids being dragged, including their descendants, so a card never
 * snaps to itself or to something travelling with it.
 * @param elements - element tree.
 * @param ids - dragged ids.
 * @returns the excluded id set.
 */
function excludedIds(elements: readonly PurElement[], ids: readonly string[]): Set<string> {
  const excluded = new Set<string>(ids)
  const walk = (nodes: readonly PurElement[]): void => {
    for (const node of nodes) {
      if (excluded.has(node.id) && node.type === 'group') {
        for (const child of node.children) excluded.add(child.id)
      }
      if (node.type === 'group') walk(node.children)
    }
  }
  walk(elements)
  return excluded
}

/**
 * World rectangles of everything a drag could snap to.
 * @param elements - element tree.
 * @param excluded - ids travelling with the drag.
 * @returns the candidate rectangles.
 */
function targetRects(elements: readonly PurElement[], excluded: ReadonlySet<string>): SnapRect[] {
  const rects: SnapRect[] = []
  const walk = (nodes: readonly PurElement[], parentX: number, parentY: number): void => {
    for (const node of nodes) {
      const x = parentX + (node.x ?? 0)
      const y = parentY + (node.y ?? 0)
      if (node.type === 'group') {
        walk(node.children, x, y)
        continue
      }
      if (node.type === 'line' || excluded.has(node.id)) continue
      rects.push({ left: x, right: x + (node.w ?? 0), top: y, bottom: y + (node.h ?? 0) })
    }
  }
  walk(elements, 0, 0)
  return rects
}

/**
 * Pick the closest matching line on one axis.
 * @param lines - dragged lines, in world coordinates.
 * @param targetLines - candidate lines.
 * @param radius - snap radius in world units.
 * @returns the chosen axis, or null when nothing is within the radius.
 */
function bestAxis(lines: readonly number[], targetLines: readonly number[], radius: number): SnapAxis | null {
  let best: SnapAxis | null = null
  for (const line of lines) {
    for (const target of targetLines) {
      const delta = target - line
      if (Math.abs(delta) > radius) continue
      if (best === null || Math.abs(delta) < Math.abs(best.delta)) best = { delta, guide: target }
    }
  }
  return best
}

/**
 * Decide how a dragged card should latch onto the rest of the board.
 * @param state - controller state, holding the elements and the drag snapshots.
 * @param primaryId - the card the snap is measured from.
 * @returns the correction for both axes; nulls when nothing matched.
 */
export function snapDrag(state: PurControllerState, primaryId: string): SnapResult {
  const site = findElement(state.elements, primaryId)
  if (site === null || site.element.type === 'line') return { x: null, y: null }
  const draggedIds = state.dragStart === null
    ? [primaryId]
    : state.dragStart.elements.filter((entry) => entry !== null).map((entry) => entry.id)
  const excluded = excludedIds(state.elements, draggedIds)
  const rect: SnapRect = {
    left: (site.element.x ?? 0) + site.parentX,
    top: (site.element.y ?? 0) + site.parentY,
    right: (site.element.x ?? 0) + site.parentX + (site.element.w ?? 0),
    bottom: (site.element.y ?? 0) + site.parentY + (site.element.h ?? 0),
  }
  const targets = targetRects(state.elements, excluded)
  if (targets.length === 0) return { x: null, y: null }
  const radius = SNAP_RADIUS / state.view.scale
  const x = bestAxis(
    [rect.left, (rect.left + rect.right) / 2, rect.right],
    targets.flatMap((target) => [target.left, (target.left + target.right) / 2, target.right]),
    radius,
  )
  const y = bestAxis(
    [rect.top, (rect.top + rect.bottom) / 2, rect.bottom],
    targets.flatMap((target) => [target.top, (target.top + target.bottom) / 2, target.bottom]),
    radius,
  )
  return { x, y }
}

/**
 * Which edges a resize handle moves.
 * @param handle - the grabbed handle.
 * @returns the moving edges.
 */
function movingEdges(handle: PurResizeHandle): { left: boolean; right: boolean; top: boolean; bottom: boolean } {
  return {
    left: handle === 'w' || handle === 'nw' || handle === 'sw',
    right: handle === 'e' || handle === 'ne' || handle === 'se',
    top: handle === 'n' || handle === 'nw' || handle === 'ne',
    bottom: handle === 's' || handle === 'sw' || handle === 'se',
  }
}

/**
 * Snap the edges a resize is dragging onto the neighbours.
 * @param state - controller state.
 * @param resizedId - the element being resized.
 * @param rect - the rectangle the drag produced, in world coordinates.
 * @param handle - the grabbed handle.
 * @returns the correction per axis; nulls when nothing matched.
 */
export function snapResize(
  state: PurControllerState,
  resizedId: string,
  rect: { x: number; y: number; w: number; h: number },
  handle: PurResizeHandle,
): SnapResult {
  const excluded = excludedIds(state.elements, [resizedId])
  const targets = targetRects(state.elements, excluded)
  if (targets.length === 0) return { x: null, y: null }
  const radius = SNAP_RADIUS / state.view.scale
  const edges = movingEdges(handle)
  const xLines: number[] = []
  if (edges.left) xLines.push(rect.x)
  if (edges.right) xLines.push(rect.x + rect.w)
  const yLines: number[] = []
  if (edges.top) yLines.push(rect.y)
  if (edges.bottom) yLines.push(rect.y + rect.h)
  const x = xLines.length === 0 ? null : bestAxis(xLines, targets.flatMap((target) => [target.left, (target.left + target.right) / 2, target.right]), radius)
  const y = yLines.length === 0 ? null : bestAxis(yLines, targets.flatMap((target) => [target.top, (target.top + target.bottom) / 2, target.bottom]), radius)
  return { x, y }
}
