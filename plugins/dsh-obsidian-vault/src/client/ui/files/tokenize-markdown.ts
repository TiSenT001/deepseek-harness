/**
 * Markdown source highlighting: fenced blocks as strings, headings as
 * keywords, quotes as comments, and inline code / wikilinks / bold / links
 * picked out per line.
 * @module dsh-obsidian-vault/client/ui/files/tokenize-markdown
 */
import type { Token } from './tokenize.ts'

/**
 * Tokenize Markdown source line by line.
 * @param source - Markdown text.
 * @returns the tokens in source order, newlines included.
 */
export function tokenizeMarkdown(source: string): Token[] {
  const out: Token[] = []
  let fence: string | undefined
  for (const line of source.split('\n')) {
    const trimmed = line.trimStart()
    const fenceMatch = /^(`{3,}|~{3,})/.exec(trimmed)
    if (fence !== undefined) {
      out.push({ kind: 'string', text: line })
      if (fenceMatch !== null && fenceMatch[1]![0] === fence[0]) fence = undefined
      out.push({ kind: 'plain', text: '\n' })
      continue
    }
    if (fenceMatch !== null) {
      fence = fenceMatch[1]!
      out.push({ kind: 'punct', text: line.slice(0, line.length - trimmed.length) + fence })
      out.push({ kind: 'plain', text: trimmed.slice(fence.length) })
      out.push({ kind: 'plain', text: '\n' })
      continue
    }
    if (/^#{1,6}\s/.test(trimmed)) {
      out.push({ kind: 'keyword', text: line })
      out.push({ kind: 'plain', text: '\n' })
      continue
    }
    if (/^>\s?/.test(trimmed)) {
      out.push({ kind: 'comment', text: line })
      out.push({ kind: 'plain', text: '\n' })
      continue
    }
    out.push(...scanInlineMarkdown(line))
    out.push({ kind: 'plain', text: '\n' })
  }
  return out
}

function scanInlineMarkdown(line: string): Token[] {
  const out: Token[] = []
  const pattern = /(`[^`]*`|!?\[\[[^\]]*\]\]|\*\*[^*]+\*\*|\[[^\]]*\]\([^)]*\))/g
  let cursor = 0
  for (const match of line.matchAll(pattern)) {
    const start = match.index ?? 0
    if (start > cursor) out.push({ kind: 'plain', text: line.slice(cursor, start) })
    const text = match[0]
    out.push({
      kind: text.startsWith('`') ? 'string' : text.includes('[[') ? 'attr' : 'keyword',
      text,
    })
    cursor = start + text.length
  }
  if (cursor < line.length) out.push({ kind: 'plain', text: line.slice(cursor) })
  return out
}
