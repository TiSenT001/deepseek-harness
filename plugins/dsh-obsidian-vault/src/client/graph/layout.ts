/**
 * d3-force semantics for the link graph, matching Obsidian's sim.js: nodes
 * carry velocity and optional pin positions, `alpha` is the energy that decays
 * over ~300 ticks, and every data/force/drag change reheats instead of
 * restarting the layout. Deterministic: no randomness anywhere.
 * @module dsh-obsidian-vault/client/graph/layout
 */
import { collideForce, repelForce, repelForceNaive } from './quadtree.ts'

/** One node as the Host reports it. */
export interface GraphNodeInput {
  readonly path: string
  readonly title: string
  readonly depth: number
}

/** One undirected edge. */
export interface GraphEdgeInput {
  readonly source: string
  readonly target: string
}

/** One live node. The simulation mutates x/y/vx/vy in place. */
export interface SimNode extends GraphNodeInput {
  x: number
  y: number
  vx: number
  vy: number
  /** Pin position: while set, the node ignores forces (d3 fx/fy). */
  fx: number | null
  fy: number | null
  degree: number
  radius: number
}

/** Reference box for seeding scale only; nothing is fitted into it. */
export const WORLD = { width: 680, height: 600 } as const

/**
 * Forces in Obsidian's own units (its graph defaults: center 0.1, repel 10,
 * link 1, distance 250).
 */
export interface LayoutForces {
  /** Pull toward the centre, 0.1 = Obsidian default. */
  readonly center: number
  /** Node repulsion, 10 = Obsidian default. */
  readonly repel: number
  /** Spring strength multiplier, 1 = Obsidian default. */
  readonly link: number
  /** Resting edge length in world units, 250 = Obsidian default. */
  readonly linkDistance: number
}

/** Obsidian's graph defaults. */
export const DEFAULT_FORCES: LayoutForces = { center: 0.1, repel: 10, link: 1, linkDistance: 250 }

/** Positions to reuse when only part of the graph changed. */
export type LayoutSeed = ReadonlyMap<string, { readonly x: number; readonly y: number }>

/** Energy below which the simulation sleeps (d3 alphaMin). */
export const ALPHA_MIN = 0.001
/** Per-tick approach toward the target energy: cools in ~300 ticks (d3). */
export const ALPHA_DECAY = 1 - Math.pow(ALPHA_MIN, 1 / 300)
/** Velocity retention per tick (d3/Obsidian velocityDecay). */
export const VELOCITY_DECAY = 0.6
/** Energy injected by a force change or a drag (Obsidian posts alpha: .3). */
export const REHEAT_ALPHA = 0.3
/** Above this many nodes, repulsion switches to Barnes-Hut. */
const QUADTREE_THRESHOLD = 300
/** Collide disc radius and per-tick resolution strength (Obsidian sim.js). */
const COLLIDE_RADIUS = 60
const COLLIDE_STRENGTH = 0.5

/**
 * Deterministic jitter for coincident points, replacing d3's jiggle(random).
 * @param seed - any stable number (loop index).
 * @returns a tiny offset in (-0.5e-6, 0.5e-6).
 */
function jiggle(seed: number): number {
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
    const radius = (nodes.length <= 10 ? 6.5 : 2.8) + Math.min(13, Math.sqrt(degree) * 2.1)
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

interface Link {
  readonly source: SimNode
  readonly target: SimNode
  readonly bias: number
  /** d3 strength before the slider multiplier: 1 / min(degree). */
  readonly baseStrength: number
  /** Live strength including the slider multiplier. */
  strength: number
  distance: number
}

/**
 * One continuous force simulation. It never "finishes"; it cools below
 * {@link ALPHA_MIN} and sleeps until a change reheats it.
 */
export class Simulation {
  /** Live nodes; mutated in place every tick. */
  readonly nodes: SimNode[]
  /** Current energy; 1 on start, decaying toward `alphaTarget`. */
  alpha = 1
  private alphaTarget = 0
  private readonly links: Link[]
  private readonly byPath: Map<string, SimNode>
  private forces: LayoutForces

  /**
   * @param nodes - pre-seeded live nodes (from {@link seedPositions}); owned.
   * @param edges - edges between node paths.
   * @param forces - forces in Obsidian units.
   */
  constructor(nodes: SimNode[], edges: readonly GraphEdgeInput[], forces: LayoutForces = DEFAULT_FORCES) {
    this.nodes = nodes
    this.forces = forces
    this.byPath = new Map(nodes.map(node => [node.path, node]))
    const linkDegree = new Map<string, number>()
    for (const edge of edges) {
      linkDegree.set(edge.source, (linkDegree.get(edge.source) ?? 0) + 1)
      linkDegree.set(edge.target, (linkDegree.get(edge.target) ?? 0) + 1)
    }
    this.links = []
    for (const edge of edges) {
      const source = this.byPath.get(edge.source)
      const target = this.byPath.get(edge.target)
      if (source === undefined || target === undefined) continue
      const sourceDegree = linkDegree.get(edge.source) ?? 1
      const targetDegree = linkDegree.get(edge.target) ?? 1
      this.links.push({
        source,
        target,
        bias: sourceDegree / (sourceDegree + targetDegree),
        baseStrength: 1 / Math.min(sourceDegree, targetDegree),
        strength: 0,
        distance: forces.linkDistance,
      })
    }
    this.applyForces()
  }

  /** True once the energy has decayed below the sleep threshold. */
  get cooled(): boolean {
    return this.alpha < ALPHA_MIN
  }

  /**
   * Advance one tick: apply forces to velocities, resolve collisions against
   * positions, then integrate with velocity decay.
   */
  tick(): void {
    this.alpha += (this.alphaTarget - this.alpha) * ALPHA_DECAY
    const alpha = this.alpha
    const nodes = this.nodes
    const forces = this.forces

    if (forces.center !== 0) {
      for (const node of nodes) {
        node.vx -= node.x * forces.center * alpha
        node.vy -= node.y * forces.center * alpha
      }
    }
    for (let index = 0; index < this.links.length; index += 1) {
      const link = this.links[index]!
      const source = link.source
      const target = link.target
      let x = target.x + target.vx - source.x - source.vx
      let y = target.y + target.vy - source.y - source.vy
      if (x === 0) x = jiggle(index)
      if (y === 0) y = jiggle(index + 0.5)
      const length = Math.sqrt(x * x + y * y)
      const pull = ((length - link.distance) / length) * alpha * link.strength
      x *= pull
      y *= pull
      target.vx -= x * link.bias
      target.vy -= y * link.bias
      source.vx += x * (1 - link.bias)
      source.vy += y * (1 - link.bias)
    }
    const repel = -forces.repel
    if (repel !== 0) {
      if (nodes.length > QUADTREE_THRESHOLD) repelForce(nodes, alpha, repel)
      else repelForceNaive(nodes, alpha, repel)
    }
    collideForce(nodes, COLLIDE_RADIUS, COLLIDE_STRENGTH)

    for (const node of nodes) {
      if (node.fx === null) {
        node.vx *= VELOCITY_DECAY
        node.x += node.vx
      } else {
        node.x = node.fx
        node.vx = 0
      }
      if (node.fy === null) {
        node.vy *= VELOCITY_DECAY
        node.y += node.vy
      } else {
        node.y = node.fy
        node.vy = 0
      }
    }
  }

  /** Recompute link strength/distance and reheat, Obsidian's `{forces}` message. */
  setForces(forces: LayoutForces): void {
    this.forces = forces
    this.applyForces()
    this.alpha = REHEAT_ALPHA
  }

  /**
   * Pin a node at its current spot and hold the simulation warm for the drag.
   * @param path - node to pin.
   * @param x - world position to hold.
   * @param y - world position to hold.
   */
  pin(path: string, x: number, y: number): void {
    const node = this.byPath.get(path)
    if (node === undefined) return
    node.fx = x
    node.fy = y
    this.alpha = REHEAT_ALPHA
    this.alphaTarget = REHEAT_ALPHA
  }

  /** Move the pinned node with the pointer. */
  movePin(path: string, x: number, y: number): void {
    const node = this.byPath.get(path)
    if (node === undefined) return
    node.fx = x
    node.fy = y
  }

  /** Release the node: forces take over again and the energy decays to sleep. */
  unpin(path: string): void {
    const node = this.byPath.get(path)
    if (node === undefined) return
    node.fx = null
    node.fy = null
    this.alphaTarget = 0
  }

  private applyForces(): void {
    for (const link of this.links) {
      link.strength = link.baseStrength * this.forces.link
      link.distance = this.forces.linkDistance
    }
  }
}
