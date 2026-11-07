/**
 * Frontmatter editing for the properties panel: replace or add one top-level key
 * inside the leading `---` block while leaving every other line — comments and
 * formatting included — byte-identical. Values are kept as the raw YAML the user
 * typed, so `true`, `42`, `[a, b]` and plain strings keep their types.
 * @module dsh-obsidian-vault/client/markdown/frontmatter-edit
 */

/** Result of a property edit: the new text and the value that was written. */
export interface PropertyEdit {
  readonly text: string
  /** Raw YAML value; null when the key was removed. */
  readonly value: string | null
}

/**
 * Set one frontmatter property.
 * @param source - complete note text.
 * @param key - top-level key to write.
 * @param rawValue - YAML text for the value; an empty string removes the key.
 * @returns the edited note text and the written value.
 */
export function setFrontmatterProperty(source: string, key: string, rawValue: string): PropertyEdit {
  const value = rawValue.trim()
  const text = source.startsWith('\uFEFF') ? source.slice(1) : source
  const lines = text.split('\n')
  const hasBlock = (lines[0] ?? '').trim() === '---'
  let end = -1
  if (hasBlock) {
    for (let index = 1; index < lines.length; index += 1) {
      const line = (lines[index] ?? '').trim()
      if (line === '---' || line === '...') {
        end = index
        break
      }
    }
  }

  if (!hasBlock || end === -1) {
    if (value.length === 0) return { text: source, value: null }
    return { text: `---\n${key}: ${value}\n---\n${text}`, value }
  }

  const inner = lines.slice(1, end)
  const pattern = new RegExp(`^${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:`)
  const index = inner.findIndex(line => pattern.test(line))
  if (value.length === 0) {
    if (index !== -1) inner.splice(index, 1)
  } else if (index === -1) {
    inner.push(`${key}: ${value}`)
  } else {
    inner[index] = `${key}: ${value}`
  }

  const body = lines.slice(end + 1)
  const rebuilt = inner.length === 0
    ? body.join('\n')
    : ['---', ...inner, '---', ...body].join('\n')
  return { text: rebuilt, value: value.length === 0 ? null : value }
}

/**
 * Render one parsed value back to YAML text for the editor input.
 * @param value - parsed frontmatter value.
 * @returns YAML-ish text the user can edit.
 */
export function yamlTextOf(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) return `[${value.map(item => String(item)).join(', ')}]`
  if (typeof value === 'boolean' || typeof value === 'number') return String(value)
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
