/**
 * Note search: plain ranked search plus the operator query path, both over one
 * in-memory index. Snippets come from the first matching line.
 * @module dsh-obsidian-vault/vault/search
 */
import type { HeadingDto, SearchHitDto } from '../protocol.ts'
import { matchesQuery, parseQuery } from './query.ts'

/** The note fields search reads. */
export interface SearchNote {
  readonly title: string
  readonly aliases: readonly string[]
  readonly tags: readonly string[]
  readonly lines: readonly string[]
  readonly content: string | null
  readonly frontmatter: Readonly<Record<string, unknown>>
  readonly headings: readonly HeadingDto[]
}

const RANK: Readonly<Record<SearchHitDto['kind'], number>> = { title: 0, alias: 1, tag: 2, path: 3, content: 4 }

/**
 * Rank notes by title, alias, tag, path, then content; operator queries run
 * through the shared parser instead.
 * @param notes - vault-relative path to the note's fields.
 * @param query - raw query text.
 * @param limit - maximum hits.
 */
export function searchNotes(
  notes: ReadonlyMap<string, SearchNote>,
  query: string,
  limit = 40,
): readonly SearchHitDto[] {
  const parsed = parseQuery(query)
  if (parsed.kind === 'tree') {
    const hits: SearchHitDto[] = []
    for (const [path, note] of notes) {
      if (hits.length >= limit) break
      const doc = {
        path,
        title: note.title,
        content: note.content ?? note.lines.join('\n'),
        tags: note.tags,
        frontmatter: note.frontmatter,
        headings: note.headings,
      }
      if (!matchesQuery(parsed, doc)) continue
      hits.push({ path, title: note.title, kind: 'content', snippet: querySnippet(note, query) })
    }
    return hits.sort((left, right) => left.title.localeCompare(right.title, 'zh'))
  }

  const needle = parsed.text.toLowerCase()
  if (needle.length === 0) return []
  const hits = new Map<string, SearchHitDto>()
  const keep = (hit: SearchHitDto): void => {
    if (hits.size >= limit || hits.has(hit.path)) return
    hits.set(hit.path, hit)
  }
  for (const [path, note] of notes) {
    const title = note.title.toLowerCase()
    if (title === needle || title.startsWith(needle)) {
      keep({ path, title: note.title, kind: 'title', snippet: openingLine(note) })
    } else if (note.aliases.some(alias => alias.toLowerCase().includes(needle))) {
      keep({ path, title: note.title, kind: 'alias', snippet: openingLine(note) })
    } else if (note.tags.some(tag => tag.toLowerCase().includes(needle))) {
      keep({ path, title: note.title, kind: 'tag', snippet: openingLine(note) })
    } else if (path.toLowerCase().includes(needle)) {
      keep({ path, title: note.title, kind: 'path', snippet: openingLine(note) })
    }
  }
  if (hits.size < limit) {
    for (const [path, note] of notes) {
      if (hits.size >= limit) break
      if (hits.has(path) || note.content === null) continue
      const index = note.content.toLowerCase().indexOf(needle)
      if (index === -1) continue
      keep({ path, title: note.title, kind: 'content', snippet: snippetOf(note.content, index, needle.length) })
    }
  }
  return [...hits.values()].sort((left, right) =>
    RANK[left.kind] - RANK[right.kind] || left.title.localeCompare(right.title, 'zh'))
}

function snippetOf(content: string, index: number, length: number): string {
  const start = Math.max(0, content.lastIndexOf('\n', index) + 1)
  const end = content.indexOf('\n', index + length)
  const line = content.slice(start, end === -1 ? content.length : end).trim()
  return line.length > 160 ? `${line.slice(0, 160)}…` : line
}

function openingLine(note: SearchNote): string | undefined {
  for (const line of note.lines) {
    const text = line.trim()
    if (text.length > 0 && !text.startsWith('---') && !text.startsWith('```')) {
      return text.replace(/^#{1,6}\s+/, '').slice(0, 120)
    }
  }
  return undefined
}

/**
 * Snippet for an operator query: the first line containing any bare term.
 * @param note - the matched note.
 * @param query - the raw query text.
 */
function querySnippet(note: SearchNote, query: string): string | undefined {
  const words = query
    .replace(/"[^"]*"/g, ' ')
    .split(/[\s()]+/)
    .map(word => word.replace(/^-/, '').replace(/^[a-z-]+:/i, ''))
    .filter(word => word.length > 1 && word.toUpperCase() !== 'OR')
  if (words.length === 0) return openingLine(note)
  for (const line of note.lines) {
    const text = line.trim()
    if (text.length === 0) continue
    const lower = text.toLowerCase()
    if (words.some(word => lower.includes(word.toLowerCase()))) {
      return text.replace(/^#{1,6}\s+/, '').slice(0, 120)
    }
  }
  return openingLine(note)
}
