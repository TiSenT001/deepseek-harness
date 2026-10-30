/**
 * Hit testing against the rendered nodes, in world space.
 * @module dsh-obsidian-vault/graph/render/hit
 */
import type { SimNode } from '../layout.ts'

/**
 * Find the node under one world-space point.
 * @param nodes - settled nodes.
 * @param point - world-space point.
 * @param zoom - camera scale, used to keep the target finger-sized on screen.
 * @param nodeScale - node size multiplier from the display settings.
 * @returns the closest matching node, if any.
 */
export function hitTest(
  nodes: readonly SimNode[],
  point: { readonly x: number; readonly y: number },
  zoom: number,
  nodeScale: number,
): SimNode | undefined {
  const tolerance = 6 / zoom
  let best: SimNode | undefined
  let bestDistance = Number.POSITIVE_INFINITY
  for (const node of nodes) {
    const radius = node.radius * nodeScale + tolerance
    const distance = Math.hypot(node.x - point.x, node.y - point.y)
    if (distance <= radius && distance < bestDistance) {
      best = node
      bestDistance = distance
    }
  }
  return best
}
