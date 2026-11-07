/**
 * Explorer display preferences that survive reloads: whether the tree hides
 * attachments and keeps only Markdown notes.
 * @module dsh-obsidian-vault/client/ui/explorer/prefs
 */

/** localStorage key holding the notes-only flag. */
export const NOTES_ONLY_KEY = 'ov.explorer.notesOnly.v1'

/**
 * Read the stored flag.
 * @returns whether the tree keeps notes only; `false` when unset or blocked.
 */
export function readNotesOnly(): boolean {
  try {
    return window.localStorage.getItem(NOTES_ONLY_KEY) === '1'
  } catch {
    // Private mode or a blocked store means "show everything".
    return false
  }
}

/**
 * Persist the flag.
 * @param value - whether the tree keeps notes only.
 */
export function writeNotesOnly(value: boolean): void {
  try {
    window.localStorage.setItem(NOTES_ONLY_KEY, value ? '1' : '0')
  } catch {
    // A failed write leaves the current session choice intact.
  }
}
