/**
 * Resize geometry: the eight handles a selected card offers and the rectangle a
 * drag produces. Images keep their aspect ratio on corner handles, because
 * stretching a reference picture is never what the user wants; text, code and
 * note cards resize freely on every handle.
 * @module dsh-obsidian-vault/pur-kernel/resize-handles
 */

/** Which handle a resize drag started from. */
export type PurResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

/** All handles in drawing order (corners and edge midpoints). */
export const RESIZE_HANDLES: readonly PurResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

/** Smallest edge a resize may produce, in world units. */
export const MIN_RESIZE = 30

/** A card rectangle in world coordinates. */
export interface ResizeRect {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
}

/**
 * World position of every handle around one rectangle.
 * @param rect - the card rectangle.
 * @returns one point per handle, in world coordinates.
 */
export function handlePositions(rect: ResizeRect): Readonly<Record<PurResizeHandle, { x: number; y: number }>> {
  const { x, y, w, h } = rect
  const cx = x + w / 2
  const cy = y + h / 2
  return {
    nw: { x, y },
    n: { x: cx, y },
    ne: { x: x + w, y },
    e: { x: x + w, y: cy },
    se: { x: x + w, y: y + h },
    s: { x: cx, y: y + h },
    sw: { x, y: y + h },
    w: { x, y: cy },
  }
}

/**
 * Whether a handle moves both axes.
 * @param handle - the handle.
 * @returns true for the four corners.
 */
export function isCorner(handle: PurResizeHandle): boolean {
  return handle.length === 2
}

/**
 * Apply one drag delta to a rectangle.
 * @param handle - the handle the drag started from.
 * @param start - rectangle at drag start.
 * @param dx - world delta x.
 * @param dy - world delta y.
 * @param aspect - width / height to preserve on corner handles; omit to resize freely.
 * @returns the clamped rectangle.
 */
export function resizeRect(
  handle: PurResizeHandle,
  start: ResizeRect,
  dx: number,
  dy: number,
  aspect?: number,
): ResizeRect {
  let { x, y, w, h } = start
  const west = handle.includes('w')
  const east = handle.includes('e')
  const north = handle.includes('n')
  const south = handle.includes('s')

  if (east) w = Math.max(MIN_RESIZE, start.w + dx)
  if (south) h = Math.max(MIN_RESIZE, start.h + dy)
  if (west) {
    const nextW = Math.max(MIN_RESIZE, start.w - dx)
    x = start.x + (start.w - nextW)
    w = nextW
  }
  if (north) {
    const nextH = Math.max(MIN_RESIZE, start.h - dy)
    y = start.y + (start.h - nextH)
    h = nextH
  }

  // Corner drags on an image keep the starting ratio: the dragged edge wins and
  // the other follows, anchored at the opposite corner.
  if (aspect !== undefined && isCorner(handle) && aspect > 0) {
    if (Math.abs(dx) >= Math.abs(dy)) h = Math.max(MIN_RESIZE, w / aspect)
    else w = Math.max(MIN_RESIZE, h * aspect)
    if (west) x = start.x + start.w - w
    if (north) y = start.y + start.h - h
  }

  return {
    x: Number(x.toFixed(1)),
    y: Number(y.toFixed(1)),
    w: Number(w.toFixed(1)),
    h: Number(h.toFixed(1)),
  }
}
