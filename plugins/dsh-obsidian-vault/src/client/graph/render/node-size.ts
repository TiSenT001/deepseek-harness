/**
 * Node radius on screen is deliberately uniform: the degree-derived world
 * radius no longer changes the dot size, and the camera zoom only changes the
 * spacing between nodes. The renderer and hit test share this radius.
 * @module dsh-obsidian-vault/graph/render/node-size
 */

/** Screen radius used for every node, in CSS pixels at nodeScale 1. */
export const NODE_SCREEN_RADIUS = 4

/**
 * Radius for drawing and hit-testing one node.
 * @param _radius - degree-derived radius in world units; kept for callers that
 * still carry it, but intentionally not used for the dot size.
 * @param nodeScale - user's node size multiplier.
 * @param zoom - current camera zoom (screen pixels per world unit).
 * @returns radius in world units that renders at a fixed screen size.
 */
export function screenRadius(_radius: number, nodeScale: number, zoom: number): number {
  const screen = NODE_SCREEN_RADIUS * nodeScale
  if (zoom <= 0) return screen
  return screen / zoom
}