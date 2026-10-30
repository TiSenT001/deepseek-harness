/**
 * Search palette options: whether the query is matched case-sensitively or
 * treated as a regular expression, and the query text those options produce.
 * The options map onto the Host's own query syntax (`match-case:(…)`, `/…/`),
 * so the server needs no extra parameters.
 * @module dsh-obsidian-vault/client/ui/searchPrefs
 */

/** Stored options. */
export interface SearchOptions {
  readonly matchCase: boolean
  readonly regex: boolean
}

/** localStorage key holding the JSON options. */
export const SEARCH_OPTIONS_KEY = 'ov.search.options.v1'

/** Both off, matching Obsidian's default search. */
export const DEFAULT_SEARCH_OPTIONS: SearchOptions = { matchCase: false, regex: false }

/**
 * Read the stored options.
 * @param raw - the stored JSON, or null when absent.
 * @returns the options, falling back per field.
 */
export function parseSearchOptions(raw: string | null): SearchOptions {
  if (raw === null) return DEFAULT_SEARCH_OPTIONS
  try {
    const parsed = JSON.parse(raw) as { readonly matchCase?: unknown; readonly regex?: unknown }
    return {
      matchCase: parsed.matchCase === true,
      regex: parsed.regex === true,
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
  return JSON.stringify({ matchCase: options.matchCase, regex: options.regex })
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
