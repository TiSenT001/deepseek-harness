/**
 * World-space geometry shared by the renderer and the pointer handlers: view
 * transforms, element lookup with parent offsets, grid spacing and pin
 * positions. Pure; no canvas, DOM or host APIs.
 * @module dsh-obsidian-vault/pur-kernel/geometry
 */
import type { PurElement, PurPin, PurViewState } from './types.ts'

/** World-space point. */
export interface PurPoint {
  /** Horizontal world coordinate. */
  x: number
  /** Vertical world coordinate. */
  y: number
}

/** Axis-aligned world-space rectangle. */
export interface PurRect {
  /** Left edge. */
  x: number
  /** Top edge. */
  y: number
  /** Width. */
  w: number
  /** Height. */
  h: number
}

/** An element together with the offset of its containing group chain. */
export interface PurElementSite {
  /** The element found. */
  element: PurElement
  /** Summed `x` of every enclosing group. */
  parentX: number
  /** Summed `y` of every enclosing group. */
  parentY: number
}

/** Element properties pin layout reads. */
export interface PurPinHost {
  /** Element width; upstream falls back to 100. */
  w?: number | undefined
  /** Element height; upstream falls back to 80. */
  h?: number | undefined
  /** Input pins, top to bottom. */
  inputs?: readonly PurPin[] | undefined
  /** Output pins, top to bottom. */
  outputs?: readonly PurPin[] | undefined
}

/** A located pin in world coordinates. */
export interface PurPinLocation extends PurPoint {
  /** Whether the pin is an input (left edge) rather than an output (right edge). */
  isInput: boolean
}

/** Width upstream aims for between grid lines, in screen pixels. */
const GRID_TARGET_PX = 50

/**
 * Find an element by id anywhere in the group tree.
 * @param elements - top-level elements.
 * @param id - element id to locate.
 * @returns the element and its enclosing-group offset, or null when absent.
 */
export function findElement(elements: readonly PurElement[], id: string): PurElementSite | null {
  for (const element of elements) {
    if (element.id === id) return { element, parentX: 0, parentY: 0 }
    if (element.type === 'group') {
      const found = findElement(element.children, id)
      if (found !== null) return { element: found.element, parentX: found.parentX + element.x, parentY: found.parentY + element.y }
    }
  }
  return null
}

/**
 * World-space rectangle of an element.
 * @param elements - top-level elements.
 * @param id - element id to locate.
 * @returns position and size, or null when the id is absent or names a line.
 */
export function worldRect(elements: readonly PurElement[], id: string): PurRect | null {
  const site = findElement(elements, id)
  if (site === null || site.element.type === 'line') return null
  return { x: site.element.x + site.parentX, y: site.element.y + site.parentY, w: site.element.w || 0, h: site.element.h || 0 }
}

/**
 * Convert canvas coordinates to world coordinates.
 * @param view - pan and zoom.
 * @param screenX - canvas x in pixels.
 * @param screenY - canvas y in pixels.
 * @returns the world point under that pixel.
 */
export function screenToWorld(view: PurViewState, screenX: number, screenY: number): PurPoint {
  return { x: (screenX - view.offsetX) / view.scale, y: (screenY - view.offsetY) / view.scale }
}

/**
 * Convert world coordinates to canvas coordinates.
 * @param view - pan and zoom.
 * @param worldX - world x.
 * @param worldY - world y.
 * @returns the pixel the world point lands on.
 */
export function worldToScreen(view: PurViewState, worldX: number, worldY: number): PurPoint {
  return { x: worldX * view.scale + view.offsetX, y: worldY * view.scale + view.offsetY }
}

/**
 * World rectangle currently visible in the canvas.
 * @param view - pan and zoom.
 * @param width - canvas width in pixels.
 * @param height - canvas height in pixels.
 * @returns the visible world rectangle; negative sizes when the canvas has none.
 */
export function worldViewport(view: PurViewState, width: number, height: number): PurRect {
  return { x: -view.offsetX / view.scale, y: -view.offsetY / view.scale, w: width / view.scale, h: height / view.scale }
}

/**
 * Pick the grid spacing that keeps screen lines near the upstream target:
 * the 1/2/5×10ⁿ step just above 50 screen pixels.
 * @param scale - zoom; screen pixels per world unit.
 * @returns spacing between grid lines in world units.
 */
export function gridStep(scale: number): number {
  const targetWorld = GRID_TARGET_PX / scale
  const magnitude = Math.pow(10, Math.floor(Math.log10(targetWorld)))
  const normalized = targetWorld / magnitude
  const snap = normalized <= 1.5 ? 1 : normalized <= 3.5 ? 2 : normalized <= 7.5 ? 5 : 10
  return snap * magnitude
}

/**
 * Tell whether two rectangles overlap, touching edges counting as overlap.
 * @param a - first rectangle.
 * @param b - second rectangle.
 * @returns true when the rectangles share any area.
 */
export function rectsIntersect(a: PurRect, b: PurRect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

/**
 * Pin position relative to the owning element's top-left corner.
 * @param node - element carrying pins.
 * @param isInput - true for the left edge, false for the right edge.
 * @param index - zero-based pin row.
 * @returns the offset from the element's top-left corner.
 */
export function pinPosition(node: PurPinHost, isInput: boolean, index: number): PurPoint {
  const inputs = node.inputs ?? []
  const outputs = node.outputs ?? []
  const rows = Math.max(inputs.length, outputs.length, 1)
  const w = node.w || 100
  const h = node.h || 80
  const startY = h * 0.15
  const endY = h * 0.85
  const y = rows === 1 ? h / 2 : startY + index * ((endY - startY) / Math.max(rows - 1, 1))
  return { x: isInput ? 0 : w, y }
}

/**
 * Pin position in world coordinates, inputs searched before outputs.
 * @param elements - top-level elements.
 * @param nodeId - element id owning the pin.
 * @param pinId - pin id.
 * @returns the world position and side, or null when the node or pin is absent.
 */
export function pinWorldPosition(elements: readonly PurElement[], nodeId: string, pinId: string): PurPinLocation | null {
  const site = findElement(elements, nodeId)
  if (site === null) return null
  const node = site.element
  if (node.type === 'line') return null
  const inputs = node.inputs ?? []
  const outputs = node.outputs ?? []
  if (inputs.length === 0 && outputs.length === 0) return null
  const worldX = node.x + site.parentX
  const worldY = node.y + site.parentY

  const inputIndex = inputs.findIndex((pin) => pin.id === pinId)
  if (inputIndex !== -1) {
    const offset = pinPosition(node, true, inputIndex)
    return { x: worldX + offset.x, y: worldY + offset.y, isInput: true }
  }
  const outputIndex = outputs.findIndex((pin) => pin.id === pinId)
  if (outputIndex !== -1) {
    const offset = pinPosition(node, false, outputIndex)
    return { x: worldX + offset.x, y: worldY + offset.y, isInput: false }
  }
  return null
}
