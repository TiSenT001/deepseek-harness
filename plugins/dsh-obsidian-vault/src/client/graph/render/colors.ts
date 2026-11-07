/**
 * Node colours for the graph when the user has not defined explicit groups:
 * a stable hue per folder or per first tag, so clusters read before any
 * configuration. Hues are derived from a string hash, so the same folder keeps
 * the same colour across sessions and vaults.
 * @module dsh-obsidian-vault/graph/render/colors
 */

/** How ordinary note nodes are tinted when no group matches. */
export type GraphColorBy = 'folder' | 'tag' | 'uniform'

/**
 * Deterministic 32-bit string hash (FNV-1a).
 * @param text - input string.
 * @returns unsigned hash.
 */
export function hashColor(text: string): number {
  let hash = 0x811c9dc5
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/**
 * Hue in degrees for a key.
 * @param key - folder or tag text.
 * @returns 0–359.
 */
export function hueOf(key: string): number {
  return hashColor(key) % 360
}

/**
 * Colour for a folder key: a saturated but not neon hue at a lightness that
 * stays legible on both the dark and the light theme.
 * @param folder - top-level folder name, or a root marker.
 * @returns CSS colour.
 */
export function folderColor(folder: string): string {
  return `hsl(${hueOf(folder)} 58% 58%)`
}

/**
 * Colour for a tag key.
 * @param tag - tag text without the leading `#`.
 * @returns CSS colour.
 */
export function tagColor(tag: string): string {
  return `hsl(${(hueOf(tag) + 24) % 360} 52% 56%)`
}

/**
 * Resolve the tint for one node.
 * @param mode - configured colour mode.
 * @param path - node's vault path.
 * @param tags - node tags, when the graph carries them.
 * @param fallback - palette colour used by `uniform` and empty keys.
 * @returns CSS colour.
 */
export function colorByKey(mode: GraphColorBy, path: string, tags: readonly string[] | undefined, fallback: string): string {
  if (mode === 'uniform') return fallback
  if (mode === 'tag') {
    const tag = tags?.[0]
    return tag === undefined || tag.length === 0 ? folderColor(folderOf(path)) : tagColor(tag)
  }
  return folderColor(folderOf(path))
}

/**
 * Top-level segment of a vault path; root files group under a stable marker.
 * @param path - vault-relative path.
 * @returns folder key.
 */
export function folderOf(path: string): string {
  const slash = path.indexOf('/')
  return slash === -1 ? '(root)' : path.slice(0, slash)
}
