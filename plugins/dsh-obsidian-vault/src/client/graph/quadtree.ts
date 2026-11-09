/**
 * Barnes-Hut quadtree forces, a faithful port of d3-force's manyBody and
 * collide. Positions carry velocities; both forces add into `vx`/`vy`.
 * @module dsh-obsidian-vault/client/graph/quadtree
 */

/** A point the quadtree forces can act on. */
export interface VelocityNode {
  x: number
  y: number
  vx: number
  vy: number
}

/** Barnes-Hut opening angle, squared (d3 default theta 0.9). */
const THETA2 = 0.81
/** Closest approach for the repulsion falloff, squared (Obsidian: 30). */
const DISTANCE_MIN2 = 30 * 30
/** Subdivision never goes deeper, so coincident points always terminate. */
const MAX_DEPTH = 32

/**
 * Deterministic jitter for coincident points, replacing d3's `jiggle(random)`.
 * @param seed - any stable number (loop index).
 * @returns a tiny offset in (-0.5e-6, 0.5e-6).
 */
function jiggle(seed: number): number {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return (value - Math.floor(value) - 0.5) * 1e-6
}

interface Quad {
  x0: number
  y0: number
  x1: number
  y1: number
  /** Leaf point bucket; empty while internal. */
  indices: number[]
  /** Four quadrants once subdivided; null while a leaf. */
  children: Quad[] | null
  /** Total charge of the subtree (Barnes-Hut). */
  value: number
  /** Charge centroid of the subtree. */
  cx: number
  cy: number
}

function makeQuad(x0: number, y0: number, x1: number, y1: number): Quad {
  return { x0, y0, x1, y1, indices: [], children: null, value: 0, cx: 0, cy: 0 }
}

/** One spatial bucket; built fresh each tick from current node positions. */
class Quadtree {
  private readonly root: Quad
  private readonly nodes: readonly VelocityNode[]

  constructor(nodes: readonly VelocityNode[]) {
    this.nodes = nodes
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const node of nodes) {
      minX = Math.min(minX, node.x)
      minY = Math.min(minY, node.y)
      maxX = Math.max(maxX, node.x)
      maxY = Math.max(maxY, node.y)
    }
    if (!Number.isFinite(minX)) {
      minX = 0
      minY = 0
      maxX = 1
      maxY = 1
    }
    // A square whose side is a power of two keeps subdivision boundaries
    // stable, so coincident points share buckets deterministically.
    const span = Math.max(maxX - minX, maxY - minY, 1)
    const side = 2 ** Math.ceil(Math.log2(span))
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2
    this.root = makeQuad(cx - side / 2, cy - side / 2, cx + side / 2, cy + side / 2)
    for (let index = 0; index < nodes.length; index += 1) this.insert(this.root, index, 0)
  }

  private insert(quad: Quad, index: number, depth: number): void {
    if (quad.children === null && (quad.indices.length === 0 || depth >= MAX_DEPTH)) {
      quad.indices.push(index)
      return
    }
    if (quad.children === null) {
      const mx = (quad.x0 + quad.x1) / 2
      const my = (quad.y0 + quad.y1) / 2
      quad.children = [
        makeQuad(quad.x0, quad.y0, mx, my),
        makeQuad(mx, quad.y0, quad.x1, my),
        makeQuad(quad.x0, my, mx, quad.y1),
        makeQuad(mx, my, quad.x1, quad.y1),
      ]
      const pending = quad.indices
      quad.indices = []
      for (const existing of pending) this.insert(quad, existing, depth)
    }
    const node = this.nodes[index]!
    const mx = (quad.x0 + quad.x1) / 2
    const my = (quad.y0 + quad.y1) / 2
    const quadrant = (node.x >= mx ? 1 : 0) + (node.y >= my ? 2 : 0)
    this.insert(quad.children[quadrant]!, index, depth + 1)
  }

  /** Post-order visit; internal quads see their children already processed. */
  visitAfter(callback: (quad: Quad) => void): void {
    const walk = (quad: Quad): void => {
      if (quad.children !== null) for (const child of quad.children) walk(child!)
      callback(quad)
    }
    walk(this.root)
  }

  /** Pre-order visit; the callback prunes the subtree by returning true. */
  visit(callback: (quad: Quad) => boolean): void {
    const walk = (quad: Quad): void => {
      if (callback(quad)) return
      if (quad.children !== null) for (const child of quad.children) walk(child!)
    }
    walk(this.root)
  }
}

/**
 * Repulsion via the Barnes-Hut approximation: far clusters act as one charge
 * at their centroid, near points act individually. Strength is negative.
 * @param nodes - points to push apart; velocities are mutated.
 * @param alpha - current simulation energy.
 * @param strength - per-node charge; negative repels.
 */
export function repelForce(nodes: VelocityNode[], alpha: number, strength: number): void {
  if (nodes.length === 0) return
  const tree = new Quadtree(nodes)
  // Accumulate charge bottom-up: leaves hold one strength unit per point.
  tree.visitAfter((quad) => {
    let value = quad.indices.length * strength
    let weightX = 0
    let weightY = 0
    for (const index of quad.indices) {
      const node = nodes[index]!
      weightX += node.x * strength
      weightY += node.y * strength
    }
    if (quad.children !== null) {
      for (const child of quad.children) {
        if (child === null || child.value === 0) continue
        value += child.value
        weightX += child.cx * child.value
        weightY += child.cy * child.value
      }
    }
    quad.value = value
    if (value !== 0) {
      quad.cx = weightX / value
      quad.cy = weightY / value
    }
  })
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index]!
    tree.visit((quad) => {
      if (quad.value === 0) return true
      let x = quad.cx - node.x
      let y = quad.cy - node.y
      const width = quad.x1 - quad.x0
      let distance2 = x * x + y * y
      if (quad.children !== null) {
        // Barnes-Hut: the cluster counts when it is far relative to its width.
        if (width * width * THETA2 < distance2) {
          if (x === 0) {
            x = jiggle(index)
            distance2 += x * x
          }
          if (y === 0) {
            y = jiggle(index + 0.5)
            distance2 += y * y
          }
          if (distance2 < DISTANCE_MIN2) distance2 = Math.sqrt(DISTANCE_MIN2 * distance2)
          node.vx += (x * quad.value * alpha) / distance2
          node.vy += (y * quad.value * alpha) / distance2
          return true
        }
        return false
      }
      // Leaf: every other point in the bucket acts individually.
      for (const other of quad.indices) {
        if (other === index) continue
        const point = nodes[other]!
        x = point.x - node.x
        y = point.y - node.y
        if (x === 0) x = jiggle(index)
        if (y === 0) y = jiggle(other)
        distance2 = x * x + y * y
        if (distance2 < DISTANCE_MIN2) distance2 = Math.sqrt(DISTANCE_MIN2 * distance2)
        node.vx += (x * strength * alpha) / distance2
        node.vy += (y * strength * alpha) / distance2
      }
      return true
    })
  }
}

/**
 * Pairwise repulsion with the exact same math as {@link repelForce}; used for
 * small graphs where tree overhead dominates, and as the test oracle.
 * @param nodes - points to push apart; velocities are mutated.
 * @param alpha - current simulation energy.
 * @param strength - per-node charge; negative repels.
 */
export function repelForceNaive(nodes: VelocityNode[], alpha: number, strength: number): void {
  for (let left = 0; left < nodes.length; left += 1) {
    for (let right = left + 1; right < nodes.length; right += 1) {
      const a = nodes[left]!
      const b = nodes[right]!
      let x = b.x - a.x
      let y = b.y - a.y
      if (x === 0) x = jiggle(left)
      if (y === 0) y = jiggle(right)
      let distance2 = x * x + y * y
      if (distance2 < DISTANCE_MIN2) distance2 = Math.sqrt(DISTANCE_MIN2 * distance2)
      const weight = (strength * alpha) / distance2
      a.vx += x * weight
      a.vy += y * weight
      b.vx -= x * weight
      b.vy -= y * weight
    }
  }
}

/**
 * Keep node discs from overlapping (d3 forceCollide): pairs closer than 2r
 * get their *velocities* nudged apart, evaluated at predicted positions
 * (x + vx), with no alpha factor. Each pair is visited once (higher index
 * against lower).
 * @param nodes - points to separate; velocities are mutated.
 * @param radius - disc radius, constant for all nodes.
 * @param strength - fraction of the overlap resolved per tick (Obsidian: 0.5).
 */
export function collideForce(nodes: VelocityNode[], radius: number, strength: number): void {
  if (nodes.length === 0) return
  // d3 builds the tree on predicted positions (x + vx); a disposable view
  // keeps the quadtree implementation unchanged.
  const predicted = nodes.map(node => ({ x: node.x + node.vx, y: node.y + node.vy, vx: 0, vy: 0 }))
  const tree = new Quadtree(predicted)
  const reach = radius * 2
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index]!
    const xi = node.x + node.vx
    const yi = node.y + node.vy
    tree.visit((quad) => {
      if (quad.children !== null) {
        // Skip quadrants entirely out of reach of this node.
        return quad.x0 > xi + reach || quad.x1 < xi - reach
          || quad.y0 > yi + reach || quad.y1 < yi - reach
      }
      for (const other of quad.indices) {
        if (other <= index) continue
        const point = nodes[other]!
        let x = xi - point.x - point.vx
        let y = yi - point.y - point.vy
        if (x === 0) x = jiggle(index)
        if (y === 0) y = jiggle(other)
        const distance = Math.sqrt(x * x + y * y)
        if (distance >= reach) continue
        // Equal radii split the correction evenly (d3's k = rj²/(ri²+rj²)).
        const shift = ((reach - distance) / distance) * strength * 0.5
        node.vx += x * shift
        node.vy += y * shift
        point.vx -= x * shift
        point.vy -= y * shift
      }
      return true
    })
  }
}
