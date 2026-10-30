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
}

export interface LabelOptions {
  /** Current camera zoom. */
  readonly zoom: number
  /** Node hover path, if any. */
  readonly hover?: string
  /** Text-fade threshold from display settings (0 … 0.9). */
  readonly textFade?: number
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
  const { zoom, hover, textFade = 0, labelScale = 1 } = options
  // Below threshold we only show the hovered node's label.
  if (zoom <= labelThreshold(textFade)) {
    if (hover === undefined) return []
    const node = nodes.find(n => n.path === hover)
    if (node === undefined) return []
    const text = node.title.length > 18 ? `${node.title.slice(0, 17)}…` : node.title
    return [{ path: node.path, title: text, x: node.x, y: node.y, radius: node.radius }]
  }

  const budget = nodes.length > 200 ? 26 : nodes.length > 120 ? 60 : Number.POSITIVE_INFINITY
  const minWidth = 20 * labelScale
  const maxWidth = 140 * labelScale
  const ranked = [...nodes].sort((left, right) => right.degree - left.degree)
  const taken: Array<{ x1: number; x2: number; y1: number; y2: number }> = []
  const labels: LabelBox[] = []
  // Ensure the hovered node is drawn even if it overlaps, by reserving its
  // slot first. Obsidian always shows the hovered label.
  if (hover !== undefined) {
    const node = nodes.find(n => n.path === hover)
    if (node !== undefined) {
      const text = node.title.length > 18 ? `${node.title.slice(0, 17)}…` : node.title
      const width = Math.min(maxWidth, Math.max(minWidth, measure(text)))
      taken.push({
        x1: node.x - width / 2,
        x2: node.x + width / 2,
        y1: node.y + node.radius + 2 * labelScale,
        y2: node.y + node.radius + 14 * labelScale,
      })
      labels.push({ path: node.path, title: text, x: node.x, y: node.y, radius: node.radius })
    }
  }
  for (const node of ranked) {
    if (labels.length >= budget) break
    if (node.path === hover) continue
    const text = node.title.length > 18 ? `${node.title.slice(0, 17)}…` : node.title
    const width = Math.min(maxWidth, Math.max(minWidth, measure(text)))
    const box = {
      x1: node.x - width / 2,
      x2: node.x + width / 2,
      y1: node.y + node.radius + 2 * labelScale,
      y2: node.y + node.radius + 14 * labelScale,
    }
    const overlaps = taken.some(other =>
      !(box.x2 < other.x1 || box.x1 > other.x2 || box.y2 < other.y1 || box.y1 > other.y2))
    if (overlaps) continue
    taken.push(box)
    labels.push({ path: node.path, title: text, x: node.x, y: node.y, radius: node.radius })
  }
  return labels
}
