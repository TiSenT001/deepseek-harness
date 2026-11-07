/**
 * Pure formatting for the `@笔记` composer references: candidate mapping and the
 * bounded Markdown block a submitted note reference turns into. No plugin API
 * here, so the behaviour is unit-testable without a browser.
 * @module dsh-obsidian-vault/client/composer/note-reference
 */

/** Characters of note Markdown carried into one submitted reference. */
export const MAX_NOTE_CHARS = 8000

/** One search hit from the vault index. */
export interface SearchHit {
  readonly path: string
  readonly title: string
  readonly snippet?: string
}

/** Candidate shape accepted by the conversation input-trigger menu. */
export interface TriggerCandidate {
  readonly name: string
  readonly label?: string
  readonly description?: string
  readonly icon?: 'file' | 'folder' | 'session'
  readonly value?: string
}

/**
 * Map vault search hits to composer candidates.
 * @param hits - search results, already ordered.
 * @returns the candidates, at most twelve.
 */
export function noteCandidates(hits: readonly SearchHit[]): readonly TriggerCandidate[] {
  return hits.slice(0, 12).map(hit => ({
    name: hit.path,
    label: hit.title,
    description: hit.path.includes('/') ? hit.path.slice(0, hit.path.lastIndexOf('/')) : undefined,
    icon: 'file',
    value: hit.path,
  }))
}

/**
 * Format one note as the model text carried by its reference.
 * @param input - path, title, vault root, Markdown, and the char budget.
 * @returns a bounded `<obsidian-note>` block, saying so when truncated.
 */
export function formatNoteReference(input: {
  readonly path: string
  readonly title: string
  readonly vault: string
  readonly text: string
  readonly maxChars?: number
}): string {
  const limit = input.maxChars ?? MAX_NOTE_CHARS
  const text = input.text.trimEnd()
  const body = text.length > limit
    ? `${text.slice(0, limit)}\n…（已截断：共 ${text.length} 字符，完整内容在 ${input.vault}\\${input.path}）`
    : text
  return [
    `<obsidian-note path="${input.path}" title="${input.title}" vault="${input.vault}">`,
    body,
    '</obsidian-note>',
  ].join('\n')
}
