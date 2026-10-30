/**
 * Wikilink parsing: split `[[target#anchor|alias]]` bodies into their parts and
 * find the tokens on one line while skipping inline code.
 * @module dsh-obsidian-vault/vault/syntax-links
 */
import { FENCE } from './syntax-shared.ts'
import type { WikiLinkToken } from './syntax-shared.ts'

/**
 * Split one `[[...]]` body into its parts.
 * @param inner - text between the brackets.
 * @param meta - occurrence metadata carried through verbatim.
 * @returns the parsed token, or undefined when the body holds no target.
 */
export function parseWikiTarget(
  inner: string,
  meta: { raw: string; embed: boolean; line: number },
): WikiLinkToken | undefined {
  const pipe = inner.indexOf('|')
  const alias = pipe === -1 ? undefined : inner.slice(pipe + 1).trim()
  const head = (pipe === -1 ? inner : inner.slice(0, pipe)).trim()
  if (head.includes('[') || head.includes(']')) return undefined
  if (head.length === 0 && alias === undefined) return undefined
  const hash = head.indexOf('#')
  const beforeHash = hash === -1 ? head : head.slice(0, hash)
  const afterHash = hash === -1 ? '' : head.slice(hash + 1)
  const caret = afterHash.indexOf('^')
  const anchor = caret === -1 ? afterHash.trim() : afterHash.slice(0, caret).trim()
  const block = caret === -1 ? undefined : afterHash.slice(caret + 1).trim()
  const target = beforeHash.trim().replace(/\.md$/i, '')
  if (target.length === 0 && anchor.length === 0 && block === undefined) return undefined
  return trim(meta, {
    target,
    ...(alias === undefined || alias.length === 0 ? {} : { alias }),
    ...(anchor.length === 0 ? {} : { anchor }),
    ...(block === undefined || block.length === 0 ? {} : { block }),
  })
}

function trim(
  meta: { raw: string; embed: boolean; line: number },
  parts: { target: string; alias?: string; anchor?: string; block?: string },
): WikiLinkToken {
  return {
    raw: meta.raw,
    embed: meta.embed,
    line: meta.line,
    target: parts.target,
    ...(parts.alias === undefined ? {} : { alias: parts.alias }),
    ...(parts.anchor === undefined ? {} : { anchor: parts.anchor }),
    ...(parts.block === undefined ? {} : { block: parts.block }),
  }
}

/**
 * Scan every wikilink the source authors, skipping fenced code.
 * @param source - complete note text.
 * @returns links in source order.
 */
export function scanWikiLinks(source: string): WikiLinkToken[] {
  const out: WikiLinkToken[] = []
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
    scanLine(line, index + 1, out)
  }
  return out
}

function scanLine(text: string, lineNo: number, out: WikiLinkToken[]): void {
  for (const found of tokensOfLine(text, lineNo)) out.push(found.token)
}

/** One token with the character range it occupies. */
export interface FoundToken {
  readonly token: WikiLinkToken
  readonly start: number
  readonly end: number
}

/**
 * Find every wikilink on one line, skipping inline code spans.
 * @param text - one source line.
 * @param lineNo - 1-based line number stored on each token.
 * @returns the tokens with their ranges.
 */
export function tokensOfLine(text: string, lineNo: number): FoundToken[] {
  const found: FoundToken[] = []
  let index = 0
  while (index < text.length) {
    const char = text[index]!
    if (char === '`') {
      let run = 1
      while (text[index + run] === '`') run += 1
      const close = text.indexOf('`'.repeat(run), index + run)
      if (close === -1) {
        index += run
        continue
      }
      index = close + run
      continue
    }
    const embed = char === '!' && text[index + 1] === '['
    const open = embed ? index + 1 : index
    if (text[open] === '[' && text[open + 1] === '[') {
      const close = text.indexOf(']]', open + 2)
      if (close !== -1) {
        const token = parseWikiTarget(text.slice(open + 2, close), {
          raw: text.slice(index, close + 2),
          embed,
          line: lineNo,
        })
        if (token !== undefined) {
          found.push({ token, start: index, end: close + 2 })
          index = close + 2
          continue
        }
      }
    }
    index += 1
  }
  return found
}
