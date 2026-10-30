/**
 * Obsidian syntax scanning: `[[wikilinks]]`, `![[embeds]]`, `#tags`, headings,
 * and `^block-id` markers. One implementation serves the Host index (metadata)
 * and the browser preprocessor (rendering), so both halves agree on what counts
 * as syntax. Fenced code blocks, inline code spans, and HTML comments are opaque.
 * @module dsh-obsidian-vault/vault/syntax
 */

const BLOCK_ID = /(?:^|\s)\^([A-Za-z0-9][A-Za-z0-9-]*)\s*$/

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

/** One `[[target#anchor|alias]]` occurrence in a note. */
export interface WikiLinkToken {
  /** Authored text, including the brackets and a leading `!` for embeds. */
  readonly raw: string
  /** Link target with alias, anchor, block reference, and `.md` removed. */
  readonly target: string
  readonly alias?: string
  readonly anchor?: string
  readonly block?: string
  readonly embed: boolean
  /** 1-based source line. */
  readonly line: number
}

/** One heading. */
export interface HeadingToken {
  readonly level: number
  readonly text: string
  /** 1-based source line. */
  readonly line: number
}

const FENCE = /^\s*(`{3,}|~{3,})/
const HEADING = /^\s{0,3}(#{1,6})[ \t]+(.*?)[ \t]*#*[ \t]*$/
const TAG = /(^|[^\p{L}\p{N}_/\\#])#([\p{L}\p{N}_][\p{L}\p{N}_/-]*)/gu

/**
 * Scan every wikilink the source authors.
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

/** One inline tag occurrence on a line. */
export interface TagSpan {
  readonly tag: string
  /** Index of the leading `#`. */
  readonly start: number
  /** Index just past the tag name. */
  readonly end: number
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

/**
 * Rewrite a heading into the anchor form links use.
 * @param text - heading text.
 * @returns normalized anchor.
 */export function headingAnchor(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, '-')
}

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

function scanLine(text: string, lineNo: number, out: WikiLinkToken[]): void {
  for (const found of tokensOfLine(text, lineNo)) out.push(found.token)
}

interface FoundToken {
  readonly token: WikiLinkToken
  readonly start: number
  readonly end: number
}

function tokensOfLine(text: string, lineNo: number): FoundToken[] {
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
