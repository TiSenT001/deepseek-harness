/**
 * Note-view preferences that survive reloads. Today that is one flag: whether
 * the reading view appends the in-document backlinks section, Obsidian's
 * "backlinks in document".
 * @module dsh-obsidian-vault/client/ui/notePrefs
 */

/** localStorage key holding the in-document backlinks flag. */
export const INLINE_BACKLINKS_KEY = 'ov.note.inlineBacklinks.v1'

/** Shown by default, matching Obsidian's default setting. */
export const DEFAULT_INLINE_BACKLINKS = true

/**
 * Read the stored flag.
 * @param raw - the stored value, or null when absent.
 * @returns whether the reader wants the section; the default when unset.
 */
export function parseInlineBacklinks(raw: string | null): boolean {
  if (raw === null) return DEFAULT_INLINE_BACKLINKS
  return raw !== '0'
}

/**
 * Serialize the flag for storage.
 * @param value - the current choice.
 * @returns the stored form.
 */
export function serializeInlineBacklinks(value: boolean): string {
  return value ? '1' : '0'
}
