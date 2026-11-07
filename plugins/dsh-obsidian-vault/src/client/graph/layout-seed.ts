/**
 * Deterministic seeding: place existing nodes at their previous spots, new
 * nodes beside already-placed neighbours, and the rest on a golden-angle ring.
 * @module dsh-obsidian-vault/client/graph/layout-seed
 */
import { WORLD } from './layout-types.ts'
import type { GraphEdgeInput, GraphNodeInput, LayoutSeed, SimNode } from './layout-types.ts'

/**
 * Deterministic jitter for coincident points, replacing d3's jiggle(random).
 * Shared with the simulation, which applies it to zero-length links.
 * @param seed - any stable number (loop index).
 * @returns a tiny offset in (-0.5e-6, 0.5e-6).
 */
export function jiggle(seed: number): number {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return (value - Math.floor(value) - 0.5) * 1e-6
}

/**
 * Reject a seed whose points are all in the same place: seeding every node at
 * the origin collapses the layout into a single point.
 * @param seed - candidate positions.
 * @returns the seed when it has real spread, otherwise undefined.
 */
function spreadSeed(seed: LayoutSeed): LayoutSeed | undefined {
  if (seed.size < 2) return undefined
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const point of seed.values()) {
    minX = Math.min(minX, point.x)
    maxX = Math.max(maxX, point.x)
    minY = Math.min(minY, point.y)
    maxY = Math.max(maxY, point.y)
  }
  return maxX - minX + (maxY - minY) < 1 ? undefined : seed
}

/**
 * Initial positions, deterministic: existing nodes keep their seeded spot, new
 * nodes land beside already-placed neighbours, and the rest bloom on a
 * golden-angle ring scaled to the graph size.
 * @param nodes - nodes with their hop distance from the centre.
 * @param edges - edges between node paths.
 * @param seed - positions of nodes that already existed.
 * @returns live nodes with zero velocity, degree, and degree-derived radius.
 */
export function seedPositions(
  nodes: readonly GraphNodeInput[],
  edges: readonly GraphEdgeInput[],
  seed?: LayoutSeed,
): SimNode[] {
  const k = Math.sqrt((WORLD.width * WORLD.height) / Math.max(1, nodes.length)) * 0.62
  const inbound = new Map<string, number>()
  const neighbours = new Map<string, string[]>()
  for (const edge of edges) {
    inbound.set(edge.target, (inbound.get(edge.target) ?? 0) + 1)
    neighbours.set(edge.source, [...(neighbours.get(edge.source) ?? []), edge.target])
    neighbours.set(edge.target, [...(neighbours.get(edge.target) ?? []), edge.source])
  }
  const centers = nodes.filter(node => node.depth === 0)
  const usableSeed = seed === undefined ? undefined : spreadSeed(seed)
  const placed = new Map<string, { x: number; y: number }>()
  return nodes.map((node, index) => {
    const degree = inbound.get(node.path) ?? 0
    // Radius grows with degree like Obsidian's hubs; tiny local graphs need
    // bigger dots or they read as empty.
    const radius = (nodes.length <= 10 ? 6.5 : 2.8) + Math.min(14, Math.pow(degree, 0.7) * 2.4)
    const place = (x: number, y: number): SimNode => {
      placed.set(node.path, { x, y })
      return { ...node, x, y, vx: 0, vy: 0, fx: null, fy: null, degree, radius }
    }
    const previous = usableSeed?.get(node.path)
    if (previous !== undefined) return place(previous.x, previous.y)
    // New nodes land beside the neighbours that are already placed.
    const anchors = (neighbours.get(node.path) ?? [])
      .map(path => placed.get(path))
      .filter((point): point is { x: number; y: number } => point !== undefined)
    if (anchors.length > 0) {
      const x = anchors.reduce((sum, point) => sum + point.x, 0) / anchors.length
      const y = anchors.reduce((sum, point) => sum + point.y, 0) / anchors.length
      const angle = index * 2.399963229728653
      return place(x + Math.cos(angle) * k * 0.35, y + Math.sin(angle) * k * 0.35)
    }
    if (centers.length === 1 && node.depth === 0) return place(0, 0)
    const ring = centers.length === 1 ? k * (0.6 + node.depth * 0.8) : k
    const angle = index * 2.399963229728653
    return place(Math.cos(angle) * ring, Math.sin(angle) * ring)
  })
}
