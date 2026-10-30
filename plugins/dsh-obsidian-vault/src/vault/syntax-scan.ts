/**
 * Syntax scanners: fenced-code-aware scan passes for `^block-id` markers,
 * headings, inline `#tags` and tag spans.
 * @module dsh-obsidian-vault/vault/syntax-scan
 */
import { FENCE } from './syntax-shared.ts'
import { tokensOfLine } from './syntax-links.ts'
import type { HeadingToken, TagSpan } from './syntax-shared.ts'

const BLOCK_ID = /(?:^|\s)\^([A-Za-z0-9][A-Za-z0-9-]*)\s*$/
const HEADING = /^\s{0,3}(#{1,6})[ \t]+(.*?)[ \t]*#*[ \t]*$/
const TAG = /(^|[^\p{L}\p{N}_/\\#])#([\p{L}\p{N}_][\p{L}\p{N}_/-]*)/gu

/**
 * Find `^block-id` markers and the 1-based line each one ends.
 * @param body - note body without frontmatter.
 * @returns block id to line number.
 */
export function scanBlockIds(body: string): ReadonlyMap<string, number> {
  const found = new Map<string, number>()
  let fence: string | null = null
  const lines = body.split(/\r?\n/)
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!
    const fenceMatch = FENCE.exec(line)
    if (fence !== null) {
      if (fenceMatch !== null && fenceMatch[1]![0] === fence[0]) fence = null
      continue
    }
    if (fenceMatch !== null) {
      fence = fenceMatch[1]!
      continue
    }
    const match = BLOCK_ID.exec(line)
    if (match !== null) found.set(match[1]!, index + 1)
  }
  return found
}

/**
 * Scan headings outside fenced code.
 * @param source - complete note text.
 * @returns headings in source order.
 */
export function scanHeadings(source: string): HeadingToken[] {
  const out: HeadingToken[] = []
  const lines = source.split(/\r?\n/)
  let fence: string | null = null
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? ''
    const fenceMatch = FENCE.exec(line)
    if (fence !== null) {
      if (fenceMatch !== null && fenceMatch[1]![0] === fence[0]
        && fenceMatch[1]!.length >= fence.length) {
        fence = null
      }
      continue
    }
    if (fenceMatch !== null) {
      fence = fenceMatch[1]!
      continue
    }
    const match = HEADING.exec(line)
    if (match === null) continue
    const text = match[2]!.trim()
    if (text.length === 0) continue
    out.push({ level: match[1]!.length, text, line: index + 1 })
  }
  return out
}

/**
 * Scan inline `#tags` outside fenced code and inline code.
 * @param source - complete note text.
 * @returns unique tag names without the leading `#`, in source order.
 */
export function scanTags(source: string): string[] {
  const seen = new Set<string>()
  const lines = source.split(/\r?\n/)
  let fence: string | null = null
  for (const line of lines) {
    const fenceMatch = FENCE.exec(line)
    if (fence !== null) {
      if (fenceMatch !== null && fenceMatch[1]![0] === fence[0]
        && fenceMatch[1]!.length >= fence.length) {
        fence = null
      }
      continue
    }
    if (fenceMatch !== null) {
      fence = fenceMatch[1]!
      continue
    }
    const visible = stripInlineCode(maskWikiLinks(line))
    for (const match of visible.matchAll(TAG)) {
      const tag = match[2]!.replace(/\/+$/, '')
      if (tag.length === 0) continue
      seen.add(tag)
    }
  }
  return [...seen]
}

/**
 * Locate inline tags on one line, skipping inline code and wikilinks.
 * @param line - one source line.
 * @returns tag spans in source order.
 */
export function tagSpans(line: string): TagSpan[] {
  const masked = stripInlineCode(maskWikiLinks(line))
  const spans: TagSpan[] = []
  for (const match of masked.matchAll(TAG)) {
    const name = (match[2] ?? '').replace(/\/+$/, '')
    if (name.length === 0) continue
    const start = (match.index ?? 0) + (match[1]?.length ?? 0)
    spans.push({ tag: name, start, end: start + 1 + name.length })
  }
  return spans
}

function maskWikiLinks(text: string): string {
  const found = tokensOfLine(text, 0)
  if (found.length === 0) return text
  let out = ''
  let cursor = 0
  for (const item of found) {
    out += text.slice(cursor, item.start) + ' '.repeat(item.end - item.start)
    cursor = item.end
  }
  return out + text.slice(cursor)
}

function stripInlineCode(line: string): string {
  let out = ''
  let index = 0
  while (index < line.length) {
    if (line[index] !== '`') {
      out += line[index]
      index += 1
      continue
    }
    let run = 1
    while (line[index + run] === '`') run += 1
    const close = line.indexOf('`'.repeat(run), index + run)
    if (close === -1) {
      out += line.slice(index)
      break
    }
    out += ' '.repeat(close + run - index)
    index = close + run
  }
  return out
}
