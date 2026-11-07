/**
 * Legend buckets for the graph: one entry per top-level folder, or per first
 * tag, with the colour the nodes actually use (an explicit group overrides the
 * automatic hue). Kept pure so the grouping and ordering are testable.
 * @module dsh-obsidian-vault/graph/legend
 */
import type { GraphNodeDto } from '../../protocol.ts'
import type { GraphSettings } from './settings.ts'
import { folderColor, folderOf, tagColor } from './render/colors.ts'
import { groupColorOf } from './render/group-color.ts'

/** One legend bucket; `key` doubles as the filter value. */
export interface GraphLegendEntry {
  readonly key: string
  readonly color: string
  readonly count: number
}

/**
 * Group visible note nodes into legend buckets, largest first.
 * @param nodes - graph nodes in the current view.
 * @param settings - graph settings, for explicit group colours.
 * @returns every bucket, sorted by count then key; root files are omitted.
 */
export function legendEntries(nodes: readonly GraphNodeDto[], settings: GraphSettings): readonly GraphLegendEntry[] {
  const mode = settings.display.colorBy
  if (mode === 'uniform') return []
  const buckets = new Map<string, { count: number; color: string }>()
  for (const node of nodes) {
    if (node.kind !== 'note') continue
    // Tag mode falls back to the folder for untagged notes, matching the colour
    // the node itself receives.
    const key = mode === 'tag' ? (node.tags?.[0] ?? folderOf(node.path)) : folderOf(node.path)
    if (key === undefined || key.length === 0 || key === '(root)') continue
    const current = buckets.get(key)
    if (current === undefined) {
      const override = groupColorOf(settings, node.title, node.path, node.tags ?? [])
      buckets.set(key, { count: 1, color: override ?? (mode === 'tag' ? tagColor(key) : folderColor(key)) })
    } else {
      current.count += 1
    }
  }
  return [...buckets.entries()]
    .sort((left, right) => right[1].count - left[1].count || left[0].localeCompare(right[0]))
    .map(([key, bucket]) => ({ key, count: bucket.count, color: bucket.color }))
}
