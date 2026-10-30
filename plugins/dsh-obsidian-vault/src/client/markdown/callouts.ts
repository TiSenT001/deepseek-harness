/**
 * Obsidian callouts: split a note body into plain Markdown runs and callout
 * blocks so each callout can render as its own component instead of a plain
 * blockquote.
 * @module dsh-obsidian-vault/client/markdown/callouts
 */

/** Callout kinds Obsidian ships; unknown kinds fall back to `note`. */
export const CALLOUT_TYPES = [
  'note', 'abstract', 'summary', 'tldr', 'info', 'todo', 'tip', 'hint', 'important',
  'success', 'check', 'done', 'question', 'help', 'faq', 'warning', 'caution', 'attention',
  'failure', 'fail', 'missing', 'danger', 'error', 'bug', 'example', 'quote', 'cite',
] as const

/** One recognized callout kind. */
export type CalloutType = (typeof CALLOUT_TYPES)[number]

/** A run of ordinary Markdown. */
export interface MarkdownSegment {
  readonly kind: 'markdown'
  readonly text: string
}

/** One callout block. */
export interface CalloutSegment {
  readonly kind: 'callout'
  readonly type: CalloutType
  readonly title: string
  readonly foldable: boolean
  readonly folded: boolean
  /** Callout body without the leading `>` markers. */
  readonly body: string
}

/** One rendering unit of a note body. */
export type Segment = MarkdownSegment | CalloutSegment

const HEADER = /^>\s*\[!([A-Za-z-]+)\]([+-]?)\s*(.*)$/
const FENCE = /^\s*(`{3,}|~{3,})/
const QUOTED = /^>\s?/
const KNOWN = new Set<string>(CALLOUT_TYPES)

/**
 * Split one note body into Markdown runs and callouts.
 * @param source - note body with frontmatter removed.
 * @returns segments in source order.
 */
export function splitCallouts(source: string): readonly Segment[] {
  const lines = source.split(/\r?\n/)
  const segments: Segment[] = []
  let buffer: string[] = []
  let fence: string | null = null

  const flush = (): void => {
    if (buffer.length === 0) return
    const text = buffer.join('\n')
    if (text.trim().length > 0) segments.push({ kind: 'markdown', text })
    buffer = []
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!
    const fenceMatch = FENCE.exec(line)
    if (fence !== null) {
      buffer.push(line)
      if (fenceMatch !== null && fenceMatch[1]![0] === fence[0]
        && fenceMatch[1]!.length >= fence.length) {
        fence = null
      }
      continue
    }
    if (fenceMatch !== null) {
      fence = fenceMatch[1]!
      buffer.push(line)
      continue
    }
    const header = HEADER.exec(line)
    if (header === null) {
      buffer.push(line)
      continue
    }
    const body: string[] = []
    let cursor = index + 1
    for (; cursor < lines.length; cursor += 1) {
      const next = lines[cursor]!
      if (!QUOTED.test(next)) break
      body.push(next.replace(QUOTED, ''))
    }
    const name = header[1]!.toLowerCase()
    flush()
    segments.push({
      kind: 'callout',
      type: (KNOWN.has(name) ? name : 'note') as CalloutType,
      title: header[3]!.trim(),
      foldable: header[2]!.length > 0,
      folded: header[2] === '-',
      body: body.join('\n'),
    })
    index = cursor - 1
  }
  flush()
  return segments
}
