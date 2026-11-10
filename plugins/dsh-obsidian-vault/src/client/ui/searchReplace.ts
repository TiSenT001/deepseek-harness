/**
 * Search-panel replacement helpers: build the pattern from the palette query
 * and toggles, count matches, and rewrite one note body.
 * @module dsh-obsidian-vault/client/ui/searchReplace
 */
import type { SearchHitDto } from '../../protocol.ts'
import type { SearchOptions } from './searchPrefs.ts'

/** Field operators the Host understands; replacing them as text would be wrong. */
const OPERATOR = /(^|\s)(file|path|content|tag|line|block|section|task|task-todo|task-done):/i

/**
 * Whether a query is plain text that can be replaced literally.
 * @param query - typed search text.
 * @returns false when field operators are present.
 */
export function isReplaceableQuery(query: string): boolean {
  return query.trim().length > 0 && !OPERATOR.test(query)
}

/**
 * Build the replacement pattern from the query and toggles.
 * @param query - typed search text.
 * @param options - case and regex toggles.
 * @returns a global regular expression, or undefined when invalid.
 */
export function buildReplacePattern(query: string, options: SearchOptions): RegExp | undefined {
  const text = query.trim()
  if (text.length === 0) return undefined
  try {
    const source = options.regex ? text : text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(source, options.matchCase ? 'g' : 'gi')
  } catch {
    // An unfinished regex simply disables replacement until it parses.
    return undefined
  }
}

/**
 * Count non-overlapping matches.
 * @param text - note body.
 * @param pattern - global pattern from {@link buildReplacePattern}.
 * @returns the match count.
 */
export function countMatches(text: string, pattern: RegExp): number {
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`
  return [...text.matchAll(new RegExp(pattern.source, flags))].length
}

/**
 * Replace every match in one body.
 * @param text - note body.
 * @param pattern - global pattern.
 * @param replacement - replacement text, with normal `$1` semantics.
 * @returns the next body and how many matches changed.
 */
export function replaceMatches(
  text: string,
  pattern: RegExp,
  replacement: string,
): { readonly text: string; readonly count: number } {
  const count = countMatches(text, pattern)
  return { text: text.replace(pattern, replacement), count }
}

/**
 * Unique notes with content hits, preserving the Host's ranking order.
 * @param hits - search hits.
 * @returns vault paths of notes whose body matched.
 */
export function contentHitPaths(hits: readonly SearchHitDto[]): string[] {
  const paths: string[] = []
  const seen = new Set<string>()
  for (const hit of hits) {
    if (hit.kind !== 'content' || seen.has(hit.path)) continue
    seen.add(hit.path)
    paths.push(hit.path)
  }
  return paths
}
