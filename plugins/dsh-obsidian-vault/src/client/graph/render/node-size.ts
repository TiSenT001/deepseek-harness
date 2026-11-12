/**
 * Node radius on screen: the degree-derived world radius scales with zoom, so
 * zooming in enlarges dots and zooming out shrinks them. A small screen floor
 * keeps leaves visible at the full-vault fit.
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