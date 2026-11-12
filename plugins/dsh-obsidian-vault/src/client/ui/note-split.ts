/**
 * Pure Note composer-style split planning: slice a note at headings, name the
 * new notes without collisions, and build the index body with wikilinks.
 * @module dsh-obsidian-vault/client/ui/note-split
 */

/** Heading level a split can use. */
export type SplitLevel = 2 | 3

/** One note created by a split. */
export interface SplitNote {
  /** Vault-relative path of the new note. */
  readonly path: string
  /** Complete Markdown body for the new note. */
  readonly content: string
}

/** The source note rewrite plus the notes it points at. */
export interface SplitPlan {
  /** Rewritten source note: intro plus one wikilink section per split note. */
  readonly index: string
  readonly notes: readonly SplitNote[]
}

const INVALID_FILE = /[\\/:*?"<>|#^[\]]/g

/**
 * Turn a heading into a filesystem-safe base name.
 * @param title - raw heading text.
 * @returns a non-empty base name without an extension.
 */
function safeTitle(title: string): string {
  const clean = title.replace(INVALID_FILE, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
  return clean.length === 0 ? 'Section' : clean
}

/**
 * Pick an unused Markdown path in the source folder.
 * @param folder - folder prefix ending in `/`, or empty.
 * @param title - base name candidate.
 * @param used - paths already taken, mutated with the chosen path.
 * @returns the chosen path.
 */
function uniquePath(folder: string, title: string, used: Set<string>): string {
  const base = safeTitle(title)
  let candidate = `${folder}${base}.md`
  let index = 2
  while (used.has(candidate.toLowerCase())) {
    candidate = `${folder}${base} ${index}.md`
    index += 1
  }
  used.add(candidate.toLowerCase())
  return candidate
}

/**
 * Plan a split at one heading level. Only headings exactly at that level split;
 * deeper headings stay inside their section.
 * @param path - current note path, which decides the target folder.
 * @param content - current note body.
 * @param level - heading level to split at.
 * @param existing - every note path already in the vault.
 * @returns the index body and the new notes; `notes` is empty when no heading matches.
 */
export function planSplit(path: string, content: string, level: SplitLevel, existing: readonly string[]): SplitPlan {
  const slash = path.lastIndexOf('/')
  const folder = slash === -1 ? '' : path.slice(0, slash + 1)
  const marker = level === 2 ? '##' : '###'
  const pattern = new RegExp(`^${marker}[ \\t]+(.+?)[ \\t]*$`, 'gm')
  const matches = [...content.matchAll(pattern)]
  if (matches.length === 0) return { index: content, notes: [] }
  const used = new Set(existing.map(item => item.toLowerCase()))
  used.add(path.toLowerCase())
  const notes: SplitNote[] = []
  const links: string[] = []
  for (let index = 0; index < matches.length; index++) {
    const match = matches[index]
    if (match === undefined || match.index === undefined) continue
    const title = (match[1] ?? '').replace(/\s+#+\s*$/, '').trim()
    const start = match.index + match[0].length
    const end = matches[index + 1]?.index ?? content.length
    const body = content.slice(start, end).trim()
    const target = uniquePath(folder, title, used)
    notes.push({ path: target, content: body.length === 0 ? `# ${title}\n` : `# ${title}\n\n${body}\n` })
    const link = target.replace(/\.md$/i, '')
    links.push(`## [[${link}|${title.replace(/\|/g, ' ')}]]`)
  }
  const intro = content.slice(0, matches[0]?.index ?? 0).trimEnd()
  const index = [intro, links.join('\n\n')].filter(part => part.length > 0).join('\n\n')
  return { index: `${index}\n`, notes }
}
