/**
 * Bookmark storage shared with Obsidian's `bookmarks.json`. Only file entries
 * are surfaced here; folder and group entries are preserved untouched so a
 * round-trip through this plugin never drops the user's other bookmarks.
 * @module dsh-obsidian-vault/client/ui/bookmarks
 */

/** The `.obsidian` file that stores bookmarks. */
export const BOOKMARKS_CONFIG = 'bookmarks'

/** One bookmarked file. */
export interface BookmarkEntry {
  readonly path: string
  /** Stored label; absent when the entry only names a path. */
  readonly title?: string
}

/** A plain object, or `undefined` for arrays, `null`, and primitives. */
function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}

/** The `items` entries that are objects, in stored order. */
function itemsOf(value: unknown): Array<Record<string, unknown>> {
  const items = record(value)?.['items']
  if (!Array.isArray(items)) return []
  return items.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
}

/** True when an item points at a file rather than a folder or group. */
function isFileItem(item: Record<string, unknown>): boolean {
  return item['type'] !== 'folder' && item['type'] !== 'group'
}

/**
 * Read the bookmarked files.
 * @param value - the parsed `bookmarks.json`, or `undefined` when absent.
 * @returns one entry per distinct file path, in stored order.
 */
export function bookmarkEntries(value: unknown): readonly BookmarkEntry[] {
  const seen = new Set<string>()
  const entries: BookmarkEntry[] = []
  for (const item of itemsOf(value)) {
    if (!isFileItem(item)) continue
    const path = item['path']
    if (typeof path !== 'string' || path.length === 0 || seen.has(path)) continue
    seen.add(path)
    const title = item['title']
    entries.push({
      path,
      ...(typeof title === 'string' && title.trim().length > 0 ? { title } : {}),
    })
  }
  return entries
}

/**
 * Add or remove one file bookmark.
 * @param value - the parsed `bookmarks.json`, or `undefined` when absent.
 * @param path - vault-relative file path.
 * @param add - true to bookmark the file, false to unbookmark it.
 * @returns the document to write; unrelated keys and items stay as they were.
 */
export function withBookmark(value: unknown, path: string, add: boolean): Record<string, unknown> {
  const base = record(value) ?? {}
  const items = itemsOf(value)
  const present = items.some(item => isFileItem(item) && item['path'] === path)
  if (present === add) return { ...base, items }
  const next = add
    ? [...items, { type: 'file', path }]
    : items.filter(item => !(isFileItem(item) && item['path'] === path))
  return { ...base, items: next }
}
