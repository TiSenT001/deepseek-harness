/**
 * Node radius on screen: the pre-Obsidian degree radius in world units. The
 * canvas transform multiplies it by zoom, so dots grow when zooming in and
 * shrink when zooming out. No screen-space floor is applied.
 * @module dsh-obsidian-vault/graph/render/node-size
 */

/**
 * Radius for drawing and hit-testing one node.
 * @param radius - degree-derived radius in world units.
 * @param nodeScale - user's node size multiplier.
 * @param zoom - current camera zoom; kept for the shared renderer/hit signature.
 * @returns radius in world units.
 */
export function screenRadius(radius: number, nodeScale: number, zoom: number): number {
  void zoom
  return radius * nodeScale
}