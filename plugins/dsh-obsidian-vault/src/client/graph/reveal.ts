/**
 * Replay reveal plan: each node gets a staggered start time derived from its
 * graph distance to the centre (or the strongest hub), so a replay reads as a
 * wave spreading out instead of sorted batches popping in. The plan is pure and
 * deterministic; the scene evaluates it per frame.
 * @module dsh-obsidian-vault/graph/reveal
 */
import type { GraphEdgeInput, SimNode } from './layout.ts'

/** Fraction of the reveal timeline used to stagger node starts. */
const STAGGER_SPREAD = 0.78
/** Share of the timeline one node spends fading and scaling in. */
const NODE_WINDOW = 0.22
/** Hard bounds for the whole replay, in milliseconds. */
const MIN_DURATION = 1200
const MAX_DURATION = 2600

/** One replay's schedule. */
export interface RevealPlan {
  /** Start of each node's entrance, in the [0, 0.78] timeline range. */
  readonly thresholds: ReadonlyMap<string, number>
  /** Overall replay duration in milliseconds. */
  readonly duration: number
}

/** Empty plan used before the first graph arrives. */
export const EMPTY_PLAN: RevealPlan = { thresholds: new Map(), duration: MIN_DURATION }

/**
 * Deterministic per-path jitter in [0, 1).
 * @param path - node id.
 * @returns a stable pseudo-random fraction.
 */
function hashFraction(path: string): number {
  let hash = 2166136261
  for (let index = 0; index < path.length; index += 1) {
    hash ^= path.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) / 4294967296
}

/** Build undirected adjacency with unique neighbours. */
function adjacencyOf(nodes: readonly SimNode[], edges: readonly GraphEdgeInput[]): Map<string, string[]> {
  const adjacency = new Map<string, string[]>(nodes.map(node => [node.path, []]))
  for (const edge of edges) {
    if (edge.source === edge.target) continue
    adjacency.get(edge.source)?.push(edge.target)
    adjacency.get(edge.target)?.push(edge.source)
  }
  return adjacency
}

/**
 * Breadth-first hops from the centre node(s); disconnected islands restart from
 * their own strongest node so every component still reveals.
 * @param nodes - graph nodes.
 * @param edges - graph edges.
 * @returns hop distance per node path.
 */
function hopDistances(nodes: readonly SimNode[], edges: readonly GraphEdgeInput[]): Map<string, number> {
  const adjacency = adjacencyOf(nodes, edges)
  const byDegree = [...nodes].sort((left, right) => right.degree - left.degree)
  const hops = new Map<string, number>()
  const seed = (path: string): void => {
    if (hops.has(path)) return
    hops.set(path, 0)
    const queue = [path]
    for (let index = 0; index < queue.length; index += 1) {
      const current = queue[index]!
      const distance = hops.get(current)!
      for (const next of adjacency.get(current) ?? []) {
        if (hops.has(next)) continue
        hops.set(next, distance + 1)
        queue.push(next)
      }
    }
  }
  // The local graph has one depth-0 centre; the global graph falls back to hubs.
  const centres = nodes.filter(node => node.depth === 0)
  for (const node of centres.length > 0 ? centres : byDegree.slice(0, 1)) seed(node.path)
  for (const node of byDegree) seed(node.path)
  return hops
}

/**
 * Build the staggered reveal schedule for one graph.
 * @param nodes - graph nodes with degree and depth.
 * @param edges - graph edges.
 * @param reducedMotion - skip the stagger entirely.
 * @returns thresholds and the overall duration.
 */
export function buildRevealPlan(
  nodes: readonly SimNode[],
  edges: readonly GraphEdgeInput[],
  reducedMotion = false,
): RevealPlan {
  if (nodes.length === 0) return EMPTY_PLAN
  const duration = Math.min(MAX_DURATION, Math.max(MIN_DURATION, Math.round(900 + 70 * Math.sqrt(nodes.length))))
  if (reducedMotion) {
    return { thresholds: new Map(nodes.map(node => [node.path, 0])), duration: 0 }
  }
  const hops = hopDistances(nodes, edges)
  const maxDegree = Math.max(1, ...nodes.map(node => node.degree))
  const ranked = [...nodes].sort((left, right) => {
    const leftScore = (hops.get(left.path) ?? 0) + (1 - left.degree / maxDegree) * 0.2 + hashFraction(left.path) * 0.45
    const rightScore = (hops.get(right.path) ?? 0) + (1 - right.degree / maxDegree) * 0.2 + hashFraction(right.path) * 0.45
    return leftScore - rightScore
  })
  const last = Math.max(1, ranked.length - 1)
  const thresholds = new Map<string, number>()
  ranked.forEach((node, rank) => thresholds.set(node.path, (rank / last) * STAGGER_SPREAD))
  return { thresholds, duration }
}

/**
 * Linear entrance progress of one node, before easing.
 * @param reveal - overall progress in [0, 1].
 * @param threshold - node start from {@link RevealPlan.thresholds}.
 * @returns progress in [0, 1]; 0 before the node starts.
 */
export function revealLocal(reveal: number, threshold: number): number {
  if (reveal >= 1) return 1
  return Math.min(1, Math.max(0, (reveal - threshold) / NODE_WINDOW))
}

/**
 * Entrance progress of one node at a given replay time.
 * @param reveal - overall progress in [0, 1].
 * @param threshold - node start from {@link RevealPlan.thresholds}.
 * @returns eased progress in [0, 1]; 0 before the node starts.
 */
export function revealEntrance(reveal: number, threshold: number): number {
  const local = revealLocal(reveal, threshold)
  // Fast start, soft landing: a dot that grows in is less mechanical than a
  // linear fade.
  return 1 - (1 - local) ** 3
}

/**
 * Combined entrance of an edge: it follows the later of its two endpoints.
 * @param reveal - overall progress.
 * @param sourceThreshold - source node start.
 * @param targetThreshold - target node start.
 * @returns eased progress in [0, 1].
 */
export function edgeEntrance(reveal: number, sourceThreshold: number, targetThreshold: number): number {
  return Math.min(revealEntrance(reveal, sourceThreshold), revealEntrance(reveal, targetThreshold))
}

/** Start radius of a node that is just appearing, as a share of its final one. */
const GROW_FROM = 0.55
/** Overshoot strength of the ease-out-back curve. */
const OVERSHOOT = 2.1

/**
 * Node radius multiplier during the entrance: grows from {@link GROW_FROM} to 1
 * and passes slightly above 1 before settling, which reads as a small elastic
 * settle rather than a bounce.
 * @param local - linear progress from {@link revealLocal}.
 * @returns the radius multiplier, briefly around 1.05 near the end.
 */
export function entranceScale(local: number): number {
  if (local <= 0) return GROW_FROM
  if (local >= 1) return 1
  const c1 = OVERSHOOT
  const c3 = c1 + 1
  const shifted = local - 1
  return GROW_FROM + (1 - GROW_FROM) * (1 + c3 * shifted ** 3 + c1 * shifted ** 2)
}
