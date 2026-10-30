/**
 * Unlinked mentions: notes that name a note's title or alias in prose, outside
 * of a wikilink.
 * @module dsh-obsidian-vault/vault/mentions
 */
import type { BacklinkDto } from '../protocol.ts'
import type { NoteEntry } from './entry.ts'

/**
 * Find prose mentions of one note.
 * @param notes - vault-relative path to its parsed entry.
 * @param path - the note whose title and aliases are searched for.
 * @param limit - maximum mentions; one hit per mentioning note.
 * @returns matches in index order, each with its first matching line.
 */
export function unlinkedMentionsOf(
  notes: ReadonlyMap<string, NoteEntry>,
  path: string,
  limit = 20,
): readonly BacklinkDto[] {
  const entry = notes.get(path)
  if (entry === undefined) return []
  const needles = [entry.title, ...entry.aliases]
    .map(value => value.trim().toLowerCase())
    .filter(value => value.length >= 2)
  if (needles.length === 0) return []
  const hits: BacklinkDto[] = []
  for (const [otherPath, other] of notes) {
    if (otherPath === path) continue
    for (let index = 0; index < other.lines.length; index += 1) {
      const line = other.lines[index] ?? ''
      if (line.trim().length === 0) continue
      const lower = line.toLowerCase()
      let matched = false
      for (const needle of needles) {
        const at = lower.indexOf(needle)
        if (at === -1) continue
        if (insideWikiLink(line, at)) continue
        matched = true
        break
      }
      if (!matched) continue
      hits.push({ path: otherPath, title: other.title, line: index + 1, context: line.trim().slice(0, 180) })
      break
    }
    if (hits.length >= limit) break
  }
  return hits
}

/** Whether a position sits inside a `[[…]]` span on its line. */
function insideWikiLink(line: string, index: number): boolean {
  const open = line.lastIndexOf('[[', index)
  if (open === -1) return false
  return line.lastIndexOf(']]', index) < open
}
