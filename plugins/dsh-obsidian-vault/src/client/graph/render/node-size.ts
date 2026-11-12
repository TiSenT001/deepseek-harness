/**
 * Node radius on screen: the degree-derived world radius scaled by the display
 * preference and kept constant in screen pixels as the camera zooms. The
 * renderer and the hit test share this so clicking matches what is drawn.
 * @module dsh-obsidian-vault/graph/render/node-size
 */

/** Screen-size multiplier for the degree-derived radius. */
export const NODE_SCREEN_SCALE = 0.3

/**
 * Radius for drawing and hit-testing one node.
 * @param radius - degree-derived radius in world units at zoom 1.
 * @param nodeScale - user's node size multiplier.
 * @param zoom - current camera zoom (screen pixels per world unit).
 * @returns radius in world units that renders at a constant screen size.
 */
export function screenRadius(radius: number, nodeScale: number, zoom: number): number {
  if (zoom <= 0) return radius * nodeScale
  return (radius * nodeScale * NODE_SCREEN_SCALE) / zoom
}