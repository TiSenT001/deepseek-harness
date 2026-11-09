/**
 * Node radius on screen: the degree-derived world radius scaled by the display
 * preference, clamped so hubs stay visible when the camera is zoomed out. The
 * renderer and the hit test share this so clicking matches what is drawn.
 * @module dsh-obsidian-vault/graph/render/node-size
 */

/** Smallest radius a node may occupy on screen, in CSS pixels. */
export const MIN_NODE_SCREEN_PX = 3

/**
 * Radius for drawing and hit-testing one node. Degree still drives the world
 * radius; when the camera is zoomed out, a screen-space floor keeps hubs
 * readable instead of collapsing every node to the same dot.
 * @param radius - degree-derived radius in world units.
 * @param nodeScale - user's node size multiplier.
 * @param zoom - current camera zoom (screen pixels per world unit).
 * @returns radius in world units, never below the screen-space minimum.
 */
export function screenRadius(radius: number, nodeScale: number, zoom: number): number {
  if (zoom <= 0) return radius * nodeScale
  const natural = radius * nodeScale * zoom
  // Hubs keep a larger floor than leaves, so a zoomed-out graph still shows a
  // size hierarchy; the boost saturates so it never dwarfs a close-up view.
  const hubFloor = 3 + Math.min(5, radius * 0.28)
  const screen = Math.max(natural, MIN_NODE_SCREEN_PX, hubFloor)
  return screen / zoom
}
