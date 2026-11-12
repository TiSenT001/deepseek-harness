/**
 * Node radius on screen: degree-derived world radius mapped to a small
 * screen-pixel band, then divided by zoom so the dots keep that pixel size at
 * every camera scale. Hubs read larger than leaves without growing on zoom.
 * @module dsh-obsidian-vault/graph/render/node-size
 */

/** Screen radius for the least-connected node, at nodeScale 1. */
export const MIN_NODE_SCREEN_PX = 1.5
/** Screen radius for the most-connected node, at nodeScale 1. */
export const MAX_NODE_SCREEN_PX = 4
/** `obsidianNodeRadius` clamps degree radius into this world range. */
const MIN_WORLD_RADIUS = 8
const MAX_WORLD_RADIUS = 30

/**
 * Radius for drawing and hit-testing one node.
 * @param radius - degree-derived radius in world units (8…30).
 * @param nodeScale - user's node size multiplier.
 * @param zoom - current camera zoom (screen pixels per world unit).
 * @returns radius in world units that renders at a fixed screen size.
 */
export function screenRadius(radius: number, nodeScale: number, zoom: number): number {
  const t = Math.min(1, Math.max(0, (radius - MIN_WORLD_RADIUS) / (MAX_WORLD_RADIUS - MIN_WORLD_RADIUS)))
  const screen = (MIN_NODE_SCREEN_PX + (MAX_NODE_SCREEN_PX - MIN_NODE_SCREEN_PX) * t) * nodeScale
  if (zoom <= 0) return screen
  return screen / zoom
}