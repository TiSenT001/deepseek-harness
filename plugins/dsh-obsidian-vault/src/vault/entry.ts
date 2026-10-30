/**
 * One parsed note as the index stores it: metadata, tokens, and the body text
 * the vault's budget allows it to keep in memory.
 * @module dsh-obsidian-vault/vault/entry
 */
import type { HeadingDto } from '../protocol.ts'
import { parseFrontmatter } from './frontmatter.ts'
import { scanBlockIds, scanHeadings, scanTags, scanWikiLinks, type WikiLinkToken } from './syntax.ts'

const MARKDOWN = /\.md$/i

/** Everything the index derives from one note file. */
export interface NoteEntry {
  readonly key: string
  readonly title: string
  readonly aliases: readonly string[]
  readonly tags: readonly string[]
  readonly headings: readonly HeadingDto[]
  readonly links: readonly WikiLinkToken[]
  readonly lines: readonly string[]
  readonly content: string | null
  readonly size: number
  readonly mtime: number | undefined
  readonly blocks: Readonly<Record<string, number>>
  readonly frontmatter: Readonly<Record<string, unknown>>
}

/** Inputs for {@link parseNoteEntry}. */
export interface ParseEntryInput {
  /** Vault-relative path; its file name becomes a fallback title. */
  readonly path: string
  /** Filesystem identity plus size, used to skip re-parsing unchanged notes. */
  readonly key: string
  readonly size: number
  /** Remaining in-memory budget; the body is dropped when it does not fit. */
  readonly budget: number
  /** Notes larger than this are indexed by name only. */
  readonly maxFileBytes: number
  readonly mtime: number | undefined
  /** Reads the note text; the index supplies a filesystem call. */
  readonly read: () => Promise<string>
}

/**
 * Parse one note file into its index entry.
 * @param input - path, filesystem identity, limits, and the text reader.
 * @returns the entry; an oversized or unreadable note keeps empty metadata.
 */
export async function parseNoteEntry(input: ParseEntryInput): Promise<NoteEntry> {
  const { path, key, size, budget, maxFileBytes, mtime } = input
  const title = path.slice(path.lastIndexOf('/') + 1).replace(MARKDOWN, '')
  const empty: NoteEntry = {
    key, title, aliases: [], tags: [], headings: [], links: [], lines: [], content: null, size, mtime, blocks: {}, frontmatter: {},
  }
  if (size > maxFileBytes) return empty
  let content: string
  try {
    content = await input.read()
  } catch {
    return empty
  }
  const frontmatter = parseFrontmatter(content)
  const body = frontmatter.body
  const aliases = aliasList(frontmatter.values)
  const tags = new Set(scanTags(body))
  for (const tag of tagList(frontmatter.values)) tags.add(tag)
  return {
    key,
    title,
    aliases,
    tags: [...tags],
    headings: scanHeadings(body),
    links: scanWikiLinks(body),
    lines: body.split('\n'),
    content: budget >= content.length ? content : null,
    size,
    mtime,
    blocks: Object.fromEntries(scanBlockIds(body)),
    frontmatter: frontmatter.values,
  }
}

/** `aliases` or `alias` from frontmatter, as a non-empty string list. */
function aliasList(values: Readonly<Record<string, unknown>>): string[] {
  const raw = values['aliases'] ?? values['alias']
  if (Array.isArray(raw)) return raw.map(String).filter(value => value.length > 0)
  if (typeof raw === 'string' && raw.length > 0) return [raw]
  return []
}

/** `tags` or `tag` from frontmatter, without leading `#`. */
function tagList(values: Readonly<Record<string, unknown>>): string[] {
  const raw = values['tags'] ?? values['tag']
  const list = Array.isArray(raw) ? raw.map(String) : typeof raw === 'string' ? [raw] : []
  return list.map(tag => tag.replace(/^#/, '').trim()).filter(tag => tag.length > 0)
}
