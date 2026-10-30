/**
 * Obsidian syntax: `[[wikilinks]]`, `![[embeds]]`, `#tags`, headings, and
 * `^block-id` markers. One implementation serves the Host index (metadata) and
 * the browser preprocessor (rendering), so both halves agree on what counts as
 * syntax. Fenced code blocks, inline code spans, and HTML comments are opaque.
 *
 * The scanners, the link parser and the shared token shapes live in
 * `syntax-scan`, `syntax-links` and `syntax-shared`; this module keeps the
 * rewrite pass and re-exports them for callers that want one import.
 * @module dsh-obsidian-vault/vault/syntax
 */
import { FENCE } from './syntax-shared.ts'
import { tokensOfLine } from './syntax-links.ts'
import type { WikiLinkToken } from './syntax-shared.ts'

export * from './syntax-shared.ts'
export * from './syntax-links.ts'
export * from './syntax-scan.ts'

/**
 * Rewrite a heading into the anchor form links use.
 * @param text - heading text.
 * @returns normalized anchor.
 */
export function headingAnchor(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, '-')
}

/**
 * Rewrite every wikilink outside fenced and inline code, leaving all other
 * source text unchanged.
 * @param source - markdown source.
 * @param replace - replacement markdown for one token.
 * @returns the rewritten source.
 */
export function replaceWikiLinks(source: string, replace: (token: WikiLinkToken) => string): string {
  const lines = source.split(/\r?\n/)
  let fence: string | null = null
  const out: string[] = []
  for (const line of lines) {
    const fenceMatch = FENCE.exec(line)
    if (fence !== null) {
      out.push(line)
      if (fenceMatch !== null && fenceMatch[1]![0] === fence[0]
        && fenceMatch[1]!.length >= fence.length) {
        fence = null
      }
      continue
    }
    if (fenceMatch !== null) {
      fence = fenceMatch[1]!
      out.push(line)
      continue
    }
    out.push(replaceLine(line, replace))
  }
  return out.join('\n')
}

function replaceLine(text: string, replace: (token: WikiLinkToken) => string): string {
  const found = tokensOfLine(text, 0)
  if (found.length === 0) return text
  let out = ''
  let cursor = 0
  for (const item of found) {
    out += text.slice(cursor, item.start)
    out += replace(item.token)
    cursor = item.end
  }
  return out + text.slice(cursor)
}
