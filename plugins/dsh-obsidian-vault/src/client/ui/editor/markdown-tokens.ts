/**
 * Markdown source tokenizer for the editor's colour layer. It is line-based on
 * purpose: the editor paints a mirrored `<pre>` behind a transparent textarea, so
 * every token only changes colour and never glyph advance, keeping the caret and
 * the painted glyphs aligned. It is not a CommonMark parser; the reading view
 * owns rendering.
 * @module dsh-obsidian-vault/client/ui/editor/markdown-tokens
 */

/** Colours the editor distinguishes in Markdown source. */
export type MarkdownTokenKind =
  | 'frontmatter'
  | 'heading'
  | 'code'
  | 'quote'
  | 'list'
  | 'link'
  | 'tag'
  | 'bold'
  | 'italic'
  | 'inline-code'

/** One coloured range; ranges never overlap and stay inside the text. */
export interface MarkdownToken {
  readonly start: number
  readonly end: number
  readonly kind: MarkdownTokenKind
}

/** Opening or closing fence, with its marker run so a longer fence closes it. */
interface Fence {
  readonly marker: string
  readonly length: number
}

/** Inline patterns, matched in this order over one line's remainder. */
const INLINE: readonly { readonly re: RegExp; readonly kind: MarkdownTokenKind }[] = [
  { re: /`[^`\n]+`/g, kind: 'inline-code' },
  { re: /\[\[[^\]\n]+\]\]/g, kind: 'link' },
  { re: /\[[^\]\n]*\]\([^)\n]+\)/g, kind: 'link' },
  { re: /\*\*[^*\n]+\*\*/g, kind: 'bold' },
  { re: /__[^_\n]+__/g, kind: 'bold' },
  { re: /(^|[\s(])\*[^*\n]+\*/g, kind: 'italic' },
  { re: /(^|[\s(])_[^_\n]+_/g, kind: 'italic' },
  { re: /(^|[\s(])#[\w\u4e00-\u9fa5][\w\u4e00-\u9fa5/-]*/g, kind: 'tag' },
]

/**
 * Tokenize Markdown source into non-overlapping colour ranges.
 * @param text - the whole file.
 * @returns the ranges in ascending order.
 */
export function markdownTokens(text: string): MarkdownToken[] {
  const tokens: MarkdownToken[] = []
  let offset = 0
  let fence: Fence | null = null
  let frontmatter = false
  let first = true

  for (const line of text.split('\n')) {
    const end = offset + line.length
    const trimmed = line.trim()

    if (frontmatter) {
      tokens.push({ start: offset, end, kind: 'frontmatter' })
      if (trimmed === '---' && !first) frontmatter = false
      first = false
      offset = end + 1
      continue
    }

    if (fence !== null) {
      tokens.push({ start: offset, end, kind: 'code' })
      if (trimmed.startsWith(fence.marker.repeat(fence.length)) && trimmed.replace(/[`~]/g, '').trim() === '') fence = null
      offset = end + 1
      first = false
      continue
    }

    if (first && trimmed === '---') {
      frontmatter = true
      tokens.push({ start: offset, end, kind: 'frontmatter' })
      first = false
      offset = end + 1
      continue
    }
    first = false

    const opener = /^\s*(`{3,}|~{3,})/.exec(line)
    const run = opener?.[1]
    if (run !== undefined && run.length > 0) {
      fence = { marker: run[0] ?? '`', length: run.length }
      tokens.push({ start: offset, end, kind: 'code' })
      offset = end + 1
      continue
    }

    let contentStart = 0
    const heading = /^(#{1,6})\s+/.exec(line)
    if (heading !== null) {
      tokens.push({ start: offset, end: offset + heading[0].length, kind: 'heading' })
      contentStart = heading[0].length
    }
    const quote = /^\s*>\s?/.exec(line)
    if (quote !== null) tokens.push({ start: offset, end: offset + quote[0].length, kind: 'quote' })
    const list = /^\s*(?:[-*+]|\d+[.)])\s+/.exec(line)
    if (list !== null) tokens.push({ start: offset, end: offset + list[0].length, kind: 'list' })

    const inlineBase = offset + Math.max(contentStart, quote?.[0].length ?? 0, list?.[0].length ?? 0)
    const rest = text.slice(inlineBase, end)
    const found: MarkdownToken[] = []
    for (const { re, kind } of INLINE) {
      re.lastIndex = 0
      for (const match of rest.matchAll(re)) {
        if (match.index === undefined) continue
        // The tag and italic patterns capture a leading boundary character and
        // only the marker itself is coloured, so trim it off the range.
        const boundary = /[^#*_]/.test(match[1] ?? '') ? (match[1]?.length ?? 0) : 0
        found.push({ start: inlineBase + match.index + boundary, end: inlineBase + match.index + match[0].length, kind })
      }
    }
    found.sort((left, right) => left.start - right.start || right.end - left.end)
    let cursor = offset
    for (const token of found) {
      if (token.start < cursor) continue
      tokens.push(token)
      cursor = token.end
    }

    offset = end + 1
  }

  return tokens
}

/** Class name fragment for one token kind. */
export function tokenClass(kind: MarkdownTokenKind): string {
  return `ov-md-${kind}`
}
