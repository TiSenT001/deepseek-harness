/**
 * Bounding boxes for fit-to-view. Elements inside groups carry positions
 * relative to their parent, and text/code cards may lack a height, so a naive
 * `x + w` sweep can produce `NaN` and send the viewport to nowhere.
 * @module dsh-obsidian-vault/pur-kernel/view-bounds
 */
import type { PurElement } from './types.ts'

/** Absolute bounds of one element set, in world coordinates. */
export interface WorldBounds {
  readonly minX: number
  readonly minY: number
  readonly maxX: number
  readonly maxY: number
}

/** Fallback size for cards without stored dimensions. */
const DEFAULT_W = 100
const DEFAULT_H = 60

/**
 * Union of the absolute bounds of every element, groups included.
 * @param elements - the element tree.
 * @returns the bounds, or undefined when nothing has finite coordinates.
 */
export function elementBounds(elements: readonly PurElement[]): WorldBounds | undefined {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  const visit = (nodes: readonly PurElement[], parentX: number, parentY: number): void => {
    for (const element of nodes) {
      // Lines carry no box: pulling them into the union would stretch the view
      // to the connector endpoints and, before the guards, produce NaN.
      if (element.type === 'line') continue
      const x = parentX + finite(element.x, 0)
      const y = parentY + finite(element.y, 0)
      const w = finite(element.w, DEFAULT_W)
      const h = finite(element.h, DEFAULT_H)
      if (Number.isFinite(x) && Number.isFinite(y)) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x + w > maxX) maxX = x + w
        if (y + h > maxY) maxY = y + h
      }
      if (element.type === 'group' && element.collapsed !== true) visit(element.children, x, y)
    }
  }
  visit(elements, 0, 0)
  if (!Number.isFinite(minX) || !Number.isFinite(maxX)) return undefined
  return { minX, minY, maxX, maxY }
}

/** Replace a missing or non-finite number with a fallback. @param value - candidate. @param fallback - used when the value is unusable. */
function finite(value: number | undefined, fallback: number): number {
  return value === undefined || !Number.isFinite(value) ? fallback : value
}

/**
 * Union of the absolute bounds of the selected elements. A child of a group stores
 * its position relative to the parent, so the walk has to carry the accumulated
 * offset; measuring the child on its own would frame the wrong part of the board.
 * @param elements - the element tree.
 * @param selectedIds - ids to frame; a selected group brings its children along.
 * @returns the bounds, or undefined when the selection is empty or unusable.
 */
export function selectedBounds(elements: readonly PurElement[], selectedIds: ReadonlySet<string>): WorldBounds | undefined {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  const visit = (nodes: readonly PurElement[], parentX: number, parentY: number, insideSelection: boolean): void => {
    for (const element of nodes) {
      const x = parentX + finite(element.x, 0)
      const y = parentY + finite(element.y, 0)
      const selected = insideSelection || selectedIds.has(element.id)
      if (selected && element.type !== 'line') {
        const w = finite(element.w, DEFAULT_W)
        const h = finite(element.h, DEFAULT_H)
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x + w > maxX) maxX = x + w
        if (y + h > maxY) maxY = y + h
      }
      if (element.type === 'group' && element.collapsed !== true) visit(element.children, x, y, selected)
    }
  }
  visit(elements, 0, 0, false)
  if (!Number.isFinite(minX) || !Number.isFinite(maxX)) return undefined
  return { minX, minY, maxX, maxY }
}
