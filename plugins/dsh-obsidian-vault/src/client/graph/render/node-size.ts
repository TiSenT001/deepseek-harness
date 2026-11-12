/**
 * Node radius on screen: the pre-Obsidian degree radius in world units, with a
 * 2px screen floor so leaves remain visible at the full-vault fit. Above the
 * floor the canvas zoom makes dots grow and shrink normally.
 * @module dsh-obsidian-vault/graph/render/node-size
 */

/** Minimum dot radius on screen, in CSS pixels at nodeScale 1. */
export const MIN_NODE_SCREEN_PX = 2

/**
 * Radius for drawing and hit-testing one node.
 * @param radius - degree-derived radius in world units.
 * @param nodeScale - user's node size multiplier.
 * @param zoom - current camera zoom (screen pixels per world unit).
 * @returns radius in world units for the current camera.
 */
export function screenRadius(radius: number, nodeScale: number, zoom: number): number {
  if (zoom <= 0) return radius * nodeScale
  return Math.max(radius * nodeScale, MIN_NODE_SCREEN_PX * nodeScale / zoom)
}