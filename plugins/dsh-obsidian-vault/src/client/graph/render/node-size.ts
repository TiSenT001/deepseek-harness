/**
 * Node radius on screen: the degree-derived world radius scaled by the display
 * preference, clamped so hubs stay visible when the camera is zoomed out. The
 * renderer and the hit test share this so clicking matches what is drawn.
 * @module dsh-obsidian-vault/graph/render/node-size
 */

/** Smallest radius a node may occupy on screen, in CSS pixels. */
export const MIN_NODE_SCREEN_PX = 2.2

/**
 * Radius for drawing and hit-testing one node.
 * @param radius - degree-derived radius in world units.
 * @param nodeScale - user's node size multiplier.
 * @param zoom - current camera zoom (screen pixels per world unit).
 * @returns radius in world units, never below the screen-space minimum.
 */
export function screenRadius(radius: number, nodeScale: number, zoom: number): number {
  if (zoom <= 0) return radius * nodeScale
  return Math.max(radius * nodeScale, MIN_NODE_SCREEN_PX / zoom)
}
