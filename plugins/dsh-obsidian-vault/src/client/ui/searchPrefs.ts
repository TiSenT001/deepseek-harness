/**
 * Search palette options: case sensitivity, regular-expression mode, result
 * order and the compact (snippetless) list. The query toggles map onto the
 * Host's own query syntax (`match-case:(…)`, `/…/`), so the server needs no
 * extra parameters; ordering and density are client-side presentation.
 * @module dsh-obsidian-vault/client/ui/searchPrefs
 */
import type { SearchHitDto } from '../../protocol.ts'

/** How the palette orders hits. */
export type SearchSort = 'relevance' | 'name'

/** Stored options. */
export interface SearchOptions {
  /** Match case-sensitively. */
  readonly matchCase: boolean
  /** Treat the input as a regular expression. */
  readonly regex: boolean
  /** Result order: the Host's ranking, or alphabetical by title. */
  readonly sort: SearchSort
  /** Hide the context snippet under each hit. */
  readonly compact: boolean
}

/** localStorage key holding the JSON options. */
export const SEARCH_OPTIONS_KEY = 'ov.search.options.v1'

/** Obsidian-like defaults: case-insensitive, no regex, ranked, snippets shown. */
export const DEFAULT_SEARCH_OPTIONS: SearchOptions = { matchCase: false, regex: false, sort: 'relevance', compact: false }

/**
 * Read the stored options.
 * @param raw - the stored JSON, or null when absent.
 * @returns the options, falling back per field.
 */
export function parseSearchOptions(raw: string | null): SearchOptions {
  if (raw === null) return DEFAULT_SEARCH_OPTIONS
  try {
    const parsed = JSON.parse(raw) as {
      readonly matchCase?: unknown
      readonly regex?: unknown
      readonly sort?: unknown
      readonly compact?: unknown
    }
    return {
      matchCase: parsed.matchCase === true,
      regex: parsed.regex === true,
      sort: parsed.sort === 'name' ? 'name' : 'relevance',
      compact: parsed.compact === true,
    }
  } catch {
    // A truncated or hand-edited entry must not break the palette.
    return DEFAULT_SEARCH_OPTIONS
  }
}

/**
 * Serialize the options for storage.
 * @param options - the current options.
 * @returns the stored form.
 */
export function serializeSearchOptions(options: SearchOptions): string {
  return JSON.stringify({
    matchCase: options.matchCase,
    regex: options.regex,
    sort: options.sort,
    compact: options.compact,
  })
}

/**
 * Build the query the Host parses from the typed text plus the toggles.
 * `match-case:(…)` wraps the whole group so multi-term queries stay wrapped;
 * a regex toggle turns the text into `/pattern/`.
 * @param text - what the user typed.
 * @param options - the active toggles.
 * @returns the query to send, or an empty string when nothing was typed.
 */
export function buildSearchQuery(text: string, options: SearchOptions): string {
  const trimmed = text.trim()
  if (trimmed.length === 0) return ''
  const base = options.regex ? `/${trimmed}/` : trimmed
  return options.matchCase ? `match-case:(${base})` : base
}

/**
 * Order hits for display.
 * @param hits - the Host's ranked hits.
 * @param sort - `relevance` keeps that order, `name` sorts by title.
 * @returns the ordered hits.
 */
export function orderSearchHits(hits: readonly SearchHitDto[], sort: SearchSort): readonly SearchHitDto[] {
  if (sort !== 'name') return hits
  return [...hits].sort((left, right) => left.title.localeCompare(right.title, 'zh'))
}
