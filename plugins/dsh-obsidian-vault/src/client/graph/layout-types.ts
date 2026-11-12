/**
 * Shared layout vocabulary: the node and edge shapes, the force set, the
 * seeding contract, and the energy constants both the seeder and the
 * simulation read.
 * @module dsh-obsidian-vault/client/graph/layout-types
 */
import { OBSIDIAN_GRAPH } from './obsidian-graph.ts'

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
/** Energy floor while continuous animation is on: slow drift, never frozen. */
export const ANIMATE_ALPHA = 0.015

/**
 * Tick cadence for one graph: a full frame budget is only realistic for small
 * graphs, and a 5000-node tick costs tens of milliseconds, so the simulation
 * slows down instead of freezing the page. Animation still runs continuously.
 * @param nodeCount - visible nodes in the graph.
 * @returns milliseconds between ticks.
 */
export function tickIntervalMs(nodeCount: number): number {
  if (nodeCount <= 600) return 1000 / 60
  if (nodeCount <= 1500) return 1000 / 40
  if (nodeCount <= 3000) return 1000 / 25
  return 1000 / 15
}
/** Per-tick approach toward the target energy: cools in ~300 ticks (d3). */
export const ALPHA_DECAY = OBSIDIAN_GRAPH.alphaDecay
/** Velocity retention per tick (d3/Obsidian velocityDecay). */
export const VELOCITY_DECAY = OBSIDIAN_GRAPH.velocityDecay
/** Energy injected by a force change or a drag (Obsidian posts alpha: .3). */
export const REHEAT_ALPHA = 0.3
