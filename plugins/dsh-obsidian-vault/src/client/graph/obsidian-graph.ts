/**
 * Relationship-graph constants and formulas derived from Obsidian's shipped
 * graph worker and renderer (`resources/obsidian.asar` → `sim.js` and
 * `app.js`). The worker uses a WebAssembly path with the same force set; these
 * values are the JavaScript fallback's source of truth.
 * @module dsh-obsidian-vault/client/graph/obsidian-graph
 */

/** Force and integration constants observed in Obsidian's graph worker. */
export const OBSIDIAN_GRAPH = {
  /** d3 alpha starts at 1 and decays toward 0. */
  startAlpha: 1,
  /** `1 - 0.001^(1/300)`: cools in ~300 ticks. */
  alphaDecay: 1 - Math.pow(0.001, 1 / 300),
  /** d3 velocityDecay used by the fallback simulator. */
  velocityDecay: 0.6,
  /** forceX/forceY strength at the neutral graph setting. */
  centerStrength: 0.1,
  /** forceLink strength multiplier at the neutral graph setting. */
  linkStrength: 1,
  /** forceLink resting distance at the neutral graph setting. */
  linkDistance: 250,
  /** Base edge opacity (Q in the renderer). */
  linkAlpha: 0.2,
  /** Edge opacity while a hovered node is active. */
  linkHighlightAlpha: 1,
  /** forceManyBody charge at the worker default. */
  chargeStrength: -1000,
  /** forceManyBody distanceMin. */
  distanceMin: 30,
  /** Barnes-Hut opening angle. */
  theta: 0.9,
  /** forceCollide radius. */
  collideRadius: 60,
  /** forceCollide strength. */
  collideStrength: 0.5,
  /** Worker tick timer: 1000 / 60 ms. */
  tickMs: 1000 / 60,
} as const

/**
 * Node radius in world units, from Obsidian's graph node
 * `getSize()`: `max(8, min(3 * sqrt(weight + 1), 30))`.
 * @param weight - related-node count, degree in this plugin.
 * @returns the world radius.
 */
export function obsidianNodeRadius(weight: number): number {
  return Math.max(8, Math.min(3 * Math.sqrt(weight + 1), 30))
}

/**
 * d3's degree-based link strength before the slider multiplier.
 * @param sourceDegree - degree of the source node.
 * @param targetDegree - degree of the target node.
 * @returns `1 / min(sourceDegree, targetDegree)`.
 */
export function obsidianLinkStrength(sourceDegree: number, targetDegree: number): number {
  return 1 / Math.min(sourceDegree, targetDegree)
}

/**
 * d3's link bias, which splits the correction between endpoints.
 * @param sourceDegree - degree of the source node.
 * @param targetDegree - degree of the target node.
 * @returns source share of the correction.
 */
export function obsidianLinkBias(sourceDegree: number, targetDegree: number): number {
  return sourceDegree / (sourceDegree + targetDegree)
}

/**
 * Label opacity from Obsidian's renderer.
 * @param zoom - current camera zoom.
 * @param textFade - display text-fade multiplier.
 * @returns opacity in `[0, 1]`.
 */
export function obsidianLabelAlpha(zoom: number, textFade: number): number {
  return Math.max(0, Math.min(1, Math.log2(zoom) + 1 - textFade))
}
/**
 * Arrow opacity from Obsidian's renderer: the edge alpha multiplied by
 * `clamp(2 * (zoom - 0.3), 0, 1)`, so arrows disappear when zoomed out.
 * @param linkAlpha - current edge opacity.
 * @param zoom - camera zoom.
 * @returns arrow opacity in `[0, 1]`.
 */
export function obsidianArrowAlpha(linkAlpha: number, zoom: number): number {
  return linkAlpha * Math.max(0, Math.min(1, 2 * (zoom - 0.3)))
}

/**
 * Arrow size factor from Obsidian's renderer: `2 * sqrt(lineSize) / zoom`.
 * @param linkWidth - display link-size multiplier.
 * @param zoom - camera zoom.
 * @returns world-space multiplier for the arrow polygon.
 */
export function obsidianArrowScale(linkWidth: number, zoom: number): number {
  return (2 * Math.sqrt(linkWidth)) / zoom
}
