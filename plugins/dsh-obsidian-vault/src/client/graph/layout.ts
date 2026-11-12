/**
 * d3-force semantics for the link graph, matching Obsidian's sim.js: nodes
 * carry velocity and optional pin positions, `alpha` is the energy that decays
 * over ~300 ticks, and every data/force/drag change reheats instead of
 * restarting the layout. Deterministic: no randomness anywhere.
 *
 * Node/force vocabulary lives in `layout-types`, seeding in `layout-seed`.
 * @module dsh-obsidian-vault/client/graph/layout
 */
import { collideForce, repelForce, repelForceNaive } from './quadtree.ts'
import { jiggle } from './layout-seed.ts'
import { ALPHA_DECAY, ALPHA_MIN, ANIMATE_ALPHA, DEFAULT_FORCES, REHEAT_ALPHA, VELOCITY_DECAY } from './layout-types.ts'
import { OBSIDIAN_GRAPH, obsidianCharge, obsidianLinkBias, obsidianLinkStrength, obsidianSliderForce } from './obsidian-graph.ts'
import type { GraphEdgeInput, LayoutForces, SimNode } from './layout-types.ts'

export * from './layout-types.ts'
export * from './layout-seed.ts'

/** Above this many nodes, repulsion switches to Barnes-Hut. */
const QUADTREE_THRESHOLD = 300
/** Collide disc radius and per-tick resolution strength (Obsidian sim.js). */
const COLLIDE_RADIUS = OBSIDIAN_GRAPH.collideRadius
const COLLIDE_STRENGTH = OBSIDIAN_GRAPH.collideStrength
/** Base per-tick speed cap at the maximum charge (20³). */
const MAX_SPEED = 60

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
  /** Keep the simulation warm forever; the graph never settles into a still frame. */
  animate = false
  private alphaTarget = 0
  private readonly links: Link[]
  private readonly byPath: Map<string, SimNode>
  private forces: LayoutForces
  private centerStrength = 0
  private chargeStrength = 0

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
        bias: obsidianLinkBias(sourceDegree, targetDegree),
        baseStrength: obsidianLinkStrength(sourceDegree, targetDegree),
        strength: 0,
        distance: forces.linkDistance,
      })
    }
    this.applyForces()
  }

  /** True once the energy has decayed below the sleep threshold. */
  get cooled(): boolean {
    return !this.animate && this.alpha < ALPHA_MIN
  }

  /**
   * Turn continuous animation on or off. Turning it on wakes a cooled session.
   * @param on - whether the simulation should stay warm.
   */
  setAnimate(on: boolean): void {
    this.animate = on
    if (on && this.alpha < ANIMATE_ALPHA) this.alpha = ANIMATE_ALPHA
  }

  /**
   * Advance one tick: apply forces to velocities, resolve collisions against
   * positions, then integrate with velocity decay.
   */
  tick(): void {
    this.alpha += (this.alphaTarget - this.alpha) * ALPHA_DECAY
    // A floor just above the sleep threshold keeps the graph in slow motion
    // instead of freezing; the forces still resolve at this energy.
    if (this.animate && this.alpha < ANIMATE_ALPHA) this.alpha = ANIMATE_ALPHA
    const alpha = this.alpha
    const nodes = this.nodes
    const forces = this.forces

    if (this.centerStrength !== 0) {
      for (const node of nodes) {
        node.vx -= node.x * this.centerStrength * alpha
        node.vy -= node.y * this.centerStrength * alpha
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
    if (this.chargeStrength !== 0) {
      if (nodes.length > QUADTREE_THRESHOLD) repelForce(nodes, alpha, this.chargeStrength)
      else repelForceNaive(nodes, alpha, this.chargeStrength)
    }
    collideForce(nodes, COLLIDE_RADIUS, COLLIDE_STRENGTH)
    const speedCap = MAX_SPEED * Math.pow(Math.max(1, this.forces.repel) / 20, 0.2)
    for (const node of nodes) {
      const speed = Math.hypot(node.vx, node.vy)
      if (speed > speedCap) {
        node.vx = (node.vx / speed) * speedCap
        node.vy = (node.vy / speed) * speedCap
      }
    }

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
    this.centerStrength = this.forces.center === 0 ? 0 : obsidianSliderForce(this.forces.center)
    this.chargeStrength = this.forces.repel === 0 ? 0 : -obsidianCharge(this.forces.repel)
    const linkForce = this.forces.link === 0 ? 0 : obsidianSliderForce(this.forces.link)
    for (const link of this.links) {
      link.strength = link.baseStrength * linkForce
      link.distance = this.forces.linkDistance
    }
  }
}










