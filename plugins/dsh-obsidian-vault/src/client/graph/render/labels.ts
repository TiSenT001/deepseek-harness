/**
 * Label layout: pick which node titles to draw so they do not overlap.
 * @module dsh-obsidian-vault/graph/render/labels
 */
import type { SimNode } from '../layout.ts'

/** One label ready to draw. */
export interface LabelBox {
  readonly path: string
  readonly title: string
  readonly x: number
  readonly y: number
  /** Node radius in world units, so the scene can anchor the label below it. */
  readonly radius: number
  /** True for the hub labels drawn below the normal text-fade threshold. */
  readonly always?: boolean
}

export interface LabelOptions {
  /** Current camera zoom. */
  readonly zoom: number
  /** Node hover path, if any. */
  readonly hover?: string
  /** Text-fade threshold from display settings (0 … 0.9). */
  readonly textFade?: number
  /** Neighbours of the hovered node, so focus reveals their names too. */
  readonly neighbours?: ReadonlySet<string>
  /**
   * World-units per screen-pixel factor the label font is drawn with; at
   * zoom < 1 the font counter-scales (Obsidian keeps labels screen-sized), so
   * the overlap boxes must grow by the same factor.
   */
  readonly labelScale?: number
}

/** Zoom at and below which non-hovered labels have faded out completely. */
export function labelThreshold(textFade: number): number {
  return Math.pow(2, textFade - 1)
}

/**
 * Label opacity, Obsidian's formula: `clamp(log2(zoom) + 1 - textFade, 0, 1)`.
 * With the default textFade 0 labels are fully visible at zoom ≥ 1 and fade
 * out across 0.5–1.
 */
export function labelAlpha(zoom: number, textFade: number): number {
  return Math.max(0, Math.min(1, Math.log2(zoom) + 1 - textFade))
}

/**
 * Choose labels for the current camera.
 * @param nodes - settled nodes.
 * @param measure - text width measurer bound to the active context and font.
 * @param options - zoom, hover, and display settings.
 * @returns the labels to draw, highest degree first.
 */
export function layoutLabels(
  nodes: readonly SimNode[],
  measure: (text: string) => number,
  options: LabelOptions,
): readonly LabelBox[] {
  const { zoom, hover, textFade = 0, labelScale = 1, neighbours } = options
  // Below the fade threshold, keep the hovered label plus a handful of hubs so
  // a zoomed-out graph still names its structure instead of becoming dots.
  const lowZoom = zoom <= labelThreshold(textFade)

  const budget = lowZoom ? 18 : nodes.length > 200 ? 26 : nodes.length > 120 ? 60 : Number.POSITIVE_INFINITY
  const minWidth = 20 * labelScale
  const maxWidth = 140 * labelScale
  const ranked = [...nodes].sort((left, right) => right.degree - left.degree)
  // Neighbours of the hovered node jump the queue so a hover explains the
  // whole neighbourhood, not just the node under the pointer.
  const focused = neighbours === undefined
    ? ranked
    : [...ranked].sort((left, right) =>
      Number(neighbours.has(right.path)) - Number(neighbours.has(left.path))
      || right.degree - left.degree)
  const taken: Array<{ x1: number; x2: number; y1: number; y2: number }> = []
  const labels: LabelBox[] = []
  // A few hub names bypass overlap rejection at low zoom; otherwise a dense
  // graph would show only the hovered label.
  const forced = 0
  // Ensure the hovered node is drawn even if it overlaps, by reserving its
  // slot first. Obsidian always shows the hovered label.
  if (hover !== undefined) {
    const node = nodes.find(n => n.path === hover)
    if (node !== undefined) {
      const text = node.title.length > 18 ? `${node.title.slice(0, 17)}…` : node.title
      const width = Math.min(maxWidth, Math.max(minWidth, measure(text))) + 4 * labelScale
      taken.push({
        x1: node.x - width / 2,
        x2: node.x + width / 2,
        y1: node.y + node.radius + 2 * labelScale,
        y2: node.y + node.radius + 14 * labelScale,
      })
      labels.push({ path: node.path, title: text, x: node.x, y: node.y, radius: node.radius })
    }
  }
  for (const node of focused) {
    if (labels.length >= budget) break
    if (node.path === hover) continue
    const text = node.title.length > 18 ? `${node.title.slice(0, 17)}…` : node.title
    const width = Math.min(maxWidth, Math.max(minWidth, measure(text))) + 4 * labelScale
    const box = {
      x1: node.x - width / 2,
      x2: node.x + width / 2,
      y1: node.y + node.radius + 2 * labelScale,
      y2: node.y + node.radius + 14 * labelScale,
    }
    const overlaps = taken.some(other =>
      !(box.x2 < other.x1 || box.x1 > other.x2 || box.y2 < other.y1 || box.y1 > other.y2))
    if (overlaps && labels.length >= forced) continue
    taken.push(box)
    labels.push({
      path: node.path,
      title: text,
      x: node.x,
      y: node.y,
      radius: node.radius,
      ...(lowZoom ? { always: true } : {}),
    })
  }
  return labels
}
