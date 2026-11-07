/**
 * Group matching for graph colours: Obsidian's group queries support plain
 * substrings plus `path:` / `file:` / `tag:` prefixes. The panel writes those
 * prefixed queries itself, so matching them literally would leave every group
 * inert; this resolves each prefix against the node it is colouring.
 * @module dsh-obsidian-vault/graph/render/group-color
 */
import type { GraphSettings } from '../settings.ts'

/**
 * First group whose query matches a node, in declaration order.
 * @param settings - current graph settings.
 * @param title - note title.
 * @param path - vault-relative path.
 * @param tags - note tags, without the leading `#`.
 * @returns the group colour, or undefined when no group matches.
 */
export function groupColorOf(
  settings: GraphSettings,
  title: string,
  path: string,
  tags: readonly string[] = [],
): string | undefined {
  const lowerPath = path.toLowerCase()
  const haystack = `${title}\n${path}`.toLowerCase()
  for (const group of settings.groups) {
    const query = group.query.trim()
    if (query.length === 0) continue
    const scoped = /^(path|file|tag):(.*)$/i.exec(query)
    if (scoped !== null) {
      const kind = scoped[1]!.toLowerCase()
      const value = unquote(scoped[2]!.trim())
      if (value.length === 0) continue
      const needle = value.toLowerCase().replace(/^#/, '')
      if (kind === 'path') {
        if (lowerPath.includes(needle)) return group.color
      } else if (kind === 'file') {
        const name = lowerPath.slice(lowerPath.lastIndexOf('/') + 1)
        if (name.includes(needle)) return group.color
      } else if (tags.some(tag => tag.toLowerCase().replace(/^#/, '').includes(needle))) {
        return group.color
      }
      continue
    }
    if (haystack.includes(query.toLowerCase())) return group.color
  }
  return undefined
}

/**
 * Strip one pair of surrounding quotes from a group query value.
 * @param value - raw text after the colon.
 * @returns the unquoted value.
 */
function unquote(value: string): string {
  const match = /^["'](.*)["']$/.exec(value)
  return match === null ? value : (match[1] ?? '')
}
