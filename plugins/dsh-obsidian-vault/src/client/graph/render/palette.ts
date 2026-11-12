/**
 * Canvas palette read from the theme tokens. Reading from `:root` matters: the
 * tokens are not redeclared on the graph pane, so a local read yields empty
 * strings and the graph falls back to grey.
 * @module dsh-obsidian-vault/graph/render/palette
 */

/** Colours the graph renderer needs. */
export interface Palette {
  readonly edge: string
  /** Edge colour while its hovered node is active. */
  readonly edgeActive: string
  readonly node: string
  readonly nodeActive: string
  /** Tag nodes. */
  readonly nodeTag: string
  /** Attachment nodes. */
  readonly nodeAttachment: string
  /** Arrowhead fill. */
  readonly arrow: string
  /** Ring stroke around the hovered node. */
  readonly ring: string
  readonly label: string
  readonly labelActive: string
}

/** Font used for node labels. */
export const LABEL_FONT = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

/**
 * Label font at a world-unit size; at zoom < 1 labels counter-scale so they
 * stay screen-sized, like Obsidian's renderer.
 * @param px - font size in world units.
 */
export function labelFont(px: number): string {
  return `${px.toFixed(1)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
}

/**
 * Read the current theme colours.
 * @returns the palette for this render.
 */
export function readPalette(): Palette {
  const style = getComputedStyle(document.documentElement)
  const token = (name: string, fallback: string): string => {
    const value = style.getPropertyValue(name).trim()
    return value.length === 0 ? fallback : value
  }
  return {
    edge: token('--dsw-alias-border-l2', '#3a3a42'),
    edgeActive: token('--dsw-alias-brand-primary', '#4d6bfe'),
    // Ordinary notes stay neutral so tags, attachments, groups, and the
    // hovered node read at a glance, mirroring Obsidian's defaults.
    node: token('--dsw-alias-label-tertiary', '#8b8b94'),
    nodeActive: token('--dsw-alias-brand-primary', '#4d6bfe'),
    nodeTag: token('--dsw-alias-state-success-primary', '#3fb950'),
    nodeAttachment: token('--dsw-alias-state-warning-primary', '#d29922'),
    arrow: token('--dsw-alias-label-secondary', '#b6b6bd'),
    ring: token('--dsw-alias-label-primary', '#e8e8ea'),
    label: token('--dsw-alias-label-secondary', '#b6b6bd'),
    labelActive: token('--dsw-alias-label-primary', '#e8e8ea'),
  }
}
