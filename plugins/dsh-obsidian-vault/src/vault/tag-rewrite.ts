/**
 * Tag rewrite for the rename/merge command. Inline tags follow the same
 * scanner as the reader (code fences and inline code stay untouched), and the
 * frontmatter `tags` key is rewritten textually so unrelated YAML formatting
 * survives.
 * @module dsh-obsidian-vault/vault/tag-rewrite
 */
import { tagSpans } from './syntax.ts'

/** One rewrite result: the new source and how many tags changed. */
export interface TagRewrite {
  readonly source: string
  readonly count: number
}

/** Normalize a tag for comparison: no leading hash, trimmed. */
export function normalizeTag(tag: string): string {
  return tag.trim().replace(/^#+/, '')
}

/** Validate and normalize a destination tag. */
export function validTagName(tag: string): string | undefined {
  const name = normalizeTag(tag)
  return /^[\p{L}\p{N}_][\p{L}\p{N}_/-]*$/u.test(name) ? name : undefined
}

/**
 * Rewrite every matching inline tag and frontmatter tag.
 * @param source - complete note text.
 * @param from - tag to replace, with or without leading `#`.
 * @param to - replacement tag, with or without leading `#`.
 * @returns the new source and the number of changed tags.
 */
export function rewriteTag(source: string, from: string, to: string): TagRewrite {
  const oldTag = normalizeTag(from)
  const newTag = normalizeTag(to)
  if (oldTag.length === 0 || newTag.length === 0) return { source, count: 0 }
  const eol = source.includes('\r\n') ? '\r\n' : '\n'
  const lines = source.split(/\r?\n/)
  let count = 0

  const frontmatterEnd = lines[0]?.trim() === '---'
    ? lines.findIndex((line, index) => index > 0 && (line.trim() === '---' || line.trim() === '...'))
    : -1
  const bodyStart = frontmatterEnd === -1 ? 0 : frontmatterEnd + 1

  // Frontmatter tags stay inside their YAML block; only lines under `tags:`
  // are touched, so an unrelated `tags` key in the body is not a target.
  const frontmatter = frontmatterEnd === -1 ? [] : lines.slice(1, frontmatterEnd)
  const fm = rewriteFrontmatterTags(frontmatter, oldTag, newTag)
  count += fm.count
  if (frontmatterEnd !== -1) lines.splice(1, frontmatter.length, ...fm.lines)

  let fence: string | undefined
  for (let index = bodyStart; index < lines.length; index += 1) {
    const line = lines[index]!
    const fenceMatch = /^\s*(```+|~~~+)/.exec(line)
    if (fenceMatch !== null) {
      if (fence === undefined) fence = fenceMatch[1]![0]
      else if (fence === fenceMatch[1]![0]) fence = undefined
      continue
    }
    if (fence !== undefined) continue
    const spans = tagSpans(line)
    if (spans.length === 0) continue
    let next = ''
    let cursor = 0
    for (const span of spans) {
      if (normalizeTag(span.tag).toLocaleLowerCase() !== oldTag.toLocaleLowerCase()) continue
      next += line.slice(cursor, span.start) + `#${newTag}`
      cursor = span.end
      count += 1
    }
    if (cursor > 0) lines[index] = next + line.slice(cursor)
  }

  return { source: lines.join(eol), count }
}

interface FrontmatterRewrite {
  readonly lines: readonly string[]
  readonly count: number
}

function rewriteFrontmatterTags(lines: readonly string[], from: string, to: string): FrontmatterRewrite {
  const out = [...lines]
  let count = 0
  let block = false
  for (let index = 0; index < out.length; index += 1) {
    const line = out[index]!
    const key = /^(\s*tags\s*:\s*)(.*)$/i.exec(line)
    if (key !== null) {
      block = true
      const rest = key[2]!.trim()
      if (rest.startsWith('[') && rest.endsWith(']')) {
        const items = rest.slice(1, -1).split(',')
        const rewritten = items.map(item => rewriteScalarTag(item, from, to))
        const hits = rewritten.filter(item => item.hit).length
        if (hits > 0) {
          out[index] = `${key[1]}[${rewritten.map(item => item.text).join(', ')}]`
          count += hits
        }
      } else if (rest.length > 0) {
        const item = rewriteScalarTag(rest, from, to)
        if (item.hit) {
          out[index] = `${key[1]}${item.text}`
          count += 1
        }
      }
      continue
    }
    if (!block) continue
    const item = /^(\s*-\s*)(.*)$/.exec(line)
    if (item === null) {
      // A new top-level key closes the tags list.
      if (/^\S/.test(line) && !line.trimStart().startsWith('#')) block = false
      continue
    }
    const value = rewriteScalarTag(item[2]!, from, to)
    if (!value.hit) continue
    out[index] = `${item[1]}${value.text}`
    count += 1
  }
  return { lines: out, count }
}

function rewriteScalarTag(raw: string, from: string, to: string): { readonly text: string; readonly hit: boolean } {
  const quoted = /^(['"])(.*)\1$/.exec(raw.trim())
  const value = (quoted?.[2] ?? raw).trim()
  if (normalizeTag(value).toLocaleLowerCase() !== from.toLocaleLowerCase()) return { text: raw.trim(), hit: false }
  const prefix = raw.slice(0, raw.length - raw.trimStart().length)
  const suffix = raw.slice(raw.trimEnd().length)
  const quote = quoted?.[1] ?? ''
  return { text: `${prefix}${quote}${to}${quote}${suffix}`, hit: true }
}
