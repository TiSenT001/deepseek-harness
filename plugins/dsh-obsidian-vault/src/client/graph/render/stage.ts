/**
 * Per-frame render state: every visible node and edge carries damped values
 * (entrance fade, hover dim, label lift, tint, edge alpha) so hover and data
 * changes glide instead of snapping. The scene mutates this once per frame;
 * nothing here is reactive.
 * @module dsh-obsidian-vault/graph/render/stage
 */
import { damp, dampColor, settled } from './anim.ts'

/** Animated state of one node. */
export interface NodeAnim {
  /** Entrance fade, 0 → 1. */
  fade: number
  /** Hover dim: 1 fully visible, 0.2 background while another node is hovered. */
  dim: number
  /** Label sink below the node while hovered, in world units. */
  lift: number
  /** Current fill colour, channel-interpolated toward its target. */
  tint: string
}

/** Per-frame targets for one node. */
export interface NodeTarget {
  readonly dim: number
  readonly lift: number
  readonly tint: string
}

/**
 * The mutable animation state of the graph scene. One instance lives as long
 * as the canvas; node and edge entries are created lazily and pruned when the
 * graph shrinks.
 */
export class GraphStage {
  private readonly nodes = new Map<string, NodeAnim>()
  private readonly edges = new Map<string, number>()
  private fg = 0
  private bg = 0.65
  /** Whether any damped value changed since {@link beginFrame}. */
  private moved = false

  /**
   * Mark the start of a frame. Pair with {@link frameMoved} so the render
   * loop can tell animating frames from still ones.
   */
  beginFrame(): void {
    this.moved = false
  }

  /**
   * Whether any node, edge, or hover pass moved since {@link beginFrame}.
   * @returns true while animations are still converging.
   */
  frameMoved(): boolean {
    return this.moved
  }

  /**
   * Advance one node's animation by a frame.
   * @param path - node id.
   * @param target - this frame's goals.
   * @returns the damped values to draw with.
   */
  node(path: string, target: NodeTarget): NodeAnim {
    let anim = this.nodes.get(path)
    if (anim === undefined) {
      anim = { fade: 0, dim: 1, lift: 0, tint: target.tint }
      this.nodes.set(path, anim)
      this.moved = true
    }
    const fade = snap(anim.fade, 1)
    const dim = snap(anim.dim, target.dim)
    const lift = snap(anim.lift, target.lift)
    const tint = dampColor(anim.tint, target.tint)
    if (fade !== anim.fade || dim !== anim.dim || lift !== anim.lift || tint !== anim.tint) {
      this.moved = true
    }
    anim.fade = fade
    anim.dim = dim
    anim.lift = lift
    anim.tint = tint
    return anim
  }

  /**
   * Advance one edge's alpha by a frame.
   * @param key - `source\ntarget`.
   * @param target - alpha goal for this frame.
   * @returns the damped alpha.
   */
  edge(key: string, target: number): number {
    const current = this.edges.get(key) ?? target
    const next = snap(current, target)
    if (next !== current) this.moved = true
    this.edges.set(key, next)
    return next
  }

  /**
   * Advance the two batched hover passes (used above the per-edge budget).
   * @param hovering - whether any node is hovered.
   * @returns foreground (highlight) and background (rest) pass alphas.
   */
  passes(hovering: boolean): { readonly fg: number; readonly bg: number } {
    const fg = snap(this.fg, hovering ? 0.85 : 0)
    const bg = snap(this.bg, hovering ? 0.06 : 0.65)
    if (fg !== this.fg || bg !== this.bg) this.moved = true
    this.fg = fg
    this.bg = bg
    return { fg, bg }
  }

  /**
   * Drop entries for nodes and edges that left the graph, once the maps are
   * clearly larger than the visible set.
   * @param paths - currently visible node ids.
   * @param edgeKeys - currently visible edge keys.
   */
  prune(paths: ReadonlySet<string>, edgeKeys: ReadonlySet<string>): void {
    if (this.nodes.size > Math.max(64, paths.size * 4)) {
      for (const key of this.nodes.keys()) {
        if (!paths.has(key)) this.nodes.delete(key)
      }
    }
    if (this.edges.size > Math.max(256, edgeKeys.size * 4)) {
      for (const key of this.edges.keys()) {
        if (!edgeKeys.has(key)) this.edges.delete(key)
      }
    }
  }
}

/** Damp one frame and snap when close enough to stop sub-pixel churn. */
function snap(current: number, target: number): number {
  const next = damp(current, target)
  return settled(next, target) ? target : next
}
