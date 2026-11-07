/**
 * Mapping between the vault's `.obsidian/graph.json` and the panel's
 * {@link GraphSettings}. Reading fills only the keys Obsidian stores, so a
 * graph.json that Obsidian owns survives; writing emits only those keys, so
 * keys this plugin does not model survive the merge.
 * @module dsh-obsidian-vault/client/graph/graph-json
 */
import type { GraphGroup, GraphSettings, GraphSettingsPatch } from './settings.ts'

/**
 * graph.json stores Obsidian's `centerStrength`, whose neutral value is
 * 0.518713248970312, while the layout uses d3's `forceCenter` strength (0.1 at
 * the same neutral point). The ratio keeps a default round trip stable.
 */
const CENTER_PER_UNIT = 5.18713248970312

/** A settings section while it is being filled; {@link GraphSettings} is readonly. */
type MutableSection<K extends 'filters' | 'display' | 'forces'> = {
  -readonly [P in keyof GraphSettings[K]]?: GraphSettings[K][P]
}

/**
 * Translate a parsed graph.json into a settings patch.
 * @param document - parsed `graph.json`, of unknown provenance.
 * @returns the settings the document specifies; absent keys stay unset.
 */
export function settingsPatchFromGraphJson(document: unknown): GraphSettingsPatch {
  if (typeof document !== 'object' || document === null || Array.isArray(document)) return {}
  const json = document as Record<string, unknown>

  const filters: MutableSection<'filters'> = {}
  const search = textOf(json['search'])
  if (search !== undefined) filters.query = search
  const hideUnresolved = booleanOf(json['hideUnresolved'])
  if (hideUnresolved !== undefined) filters.existingOnly = !hideUnresolved
  const showTags = booleanOf(json['showTags'])
  if (showTags !== undefined) filters.showTags = showTags
  const showAttachments = booleanOf(json['showAttachments'])
  if (showAttachments !== undefined) filters.showAttachments = showAttachments
  const showOrphans = booleanOf(json['showOrphans'])
  if (showOrphans !== undefined) filters.showOrphans = showOrphans

  const display: MutableSection<'display'> = {}
  const arrows = booleanOf(json['showArrow'])
  if (arrows !== undefined) display.arrows = arrows
  const textFade = numberOf(json['textFadeMultiplier'])
  if (textFade !== undefined) display.textFade = textFade
  const nodeScale = numberOf(json['nodeSizeMultiplier'])
  if (nodeScale !== undefined) display.nodeScale = nodeScale
  const linkWidth = numberOf(json['lineSizeMultiplier'])
  if (linkWidth !== undefined) display.linkWidth = linkWidth
  // Plugin-owned key: Obsidian ignores it, and keeping it here means the choice
  // survives a reload rather than falling back to the default.
  const colorBy = textOf(json['dshColorBy'])
  if (colorBy === 'folder' || colorBy === 'tag' || colorBy === 'uniform') display.colorBy = colorBy

  const forces: MutableSection<'forces'> = {}
  const centerStrength = numberOf(json['centerStrength'])
  if (centerStrength !== undefined) forces.center = centerStrength / CENTER_PER_UNIT
  const repelStrength = numberOf(json['repelStrength'])
  if (repelStrength !== undefined) forces.repel = repelStrength
  const linkStrength = numberOf(json['linkStrength'])
  if (linkStrength !== undefined) forces.link = linkStrength
  const linkDistance = numberOf(json['linkDistance'])
  if (linkDistance !== undefined) forces.linkDistance = linkDistance

  const groups = groupsOf(json['colorGroups'])
  return {
    ...(Object.keys(filters).length === 0 ? {} : { filters }),
    ...(groups === undefined ? {} : { groups }),
    ...(Object.keys(display).length === 0 ? {} : { display }),
    ...(Object.keys(forces).length === 0 ? {} : { forces }),
  }
}

/**
 * Translate settings into the graph.json keys this plugin owns.
 * @param settings - current panel values.
 * @returns a patch for {@link writeObsidianConfig}, colours as Obsidian packs them.
 */
export function graphJsonPatch(settings: GraphSettings): Record<string, unknown> {
  return {
    search: settings.filters.query,
    showTags: settings.filters.showTags,
    showAttachments: settings.filters.showAttachments,
    hideUnresolved: !settings.filters.existingOnly,
    showOrphans: settings.filters.showOrphans,
    colorGroups: settings.groups.map(group => ({
      query: group.query,
      color: { a: 1, rgb: hexToRgb(group.color) ?? 0 },
    })),
    showArrow: settings.display.arrows,
    textFadeMultiplier: settings.display.textFade,
    nodeSizeMultiplier: settings.display.nodeScale,
    lineSizeMultiplier: settings.display.linkWidth,
    dshColorBy: settings.display.colorBy,
    centerStrength: settings.forces.center * CENTER_PER_UNIT,
    repelStrength: settings.forces.repel,
    linkStrength: settings.forces.link,
    linkDistance: settings.forces.linkDistance,
  }
}

/**
 * Pack `#RRGGBB` into Obsidian's integer colour.
 * @param hex - hex colour with or without `#`.
 * @returns the 24-bit integer, or undefined when the text is not a colour.
 */
export function hexToRgb(hex: string): number | undefined {
  const text = hex.trim().replace(/^#/, '')
  if (!/^[0-9a-f]{6}$/i.test(text)) return undefined
  return Number.parseInt(text, 16)
}

/**
 * Unpack Obsidian's integer colour into `#RRGGBB`.
 * @param rgb - 24-bit integer.
 * @returns the hex colour.
 */
export function rgbToHex(rgb: number): string {
  return `#${(rgb & 0xffffff).toString(16).padStart(6, '0')}`
}

function groupsOf(value: unknown): readonly GraphGroup[] | undefined {
  if (!Array.isArray(value)) return undefined
  return value.flatMap((item: unknown): GraphGroup[] => {
    if (typeof item !== 'object' || item === null) return []
    const record = item as Record<string, unknown>
    const query = textOf(record['query'])
    const color = record['color']
    const rgb = typeof color === 'object' && color !== null
      ? numberOf((color as Record<string, unknown>)['rgb'])
      : undefined
    if (query === undefined || query.trim().length === 0 || rgb === undefined) return []
    return [{ query, color: rgbToHex(rgb) }]
  })
}

function textOf(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function booleanOf(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function numberOf(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}
