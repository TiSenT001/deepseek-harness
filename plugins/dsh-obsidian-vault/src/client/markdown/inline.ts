/**
 * Obsidian's inline extras that GFM has no syntax for: `%%comments%%` and
 * `==highlights==`. Comments are removed before rendering; highlights are
 * split out for the DOM pass that wraps them in `<mark>`.
 * @module dsh-obsidian-vault/client/markdown/inline
 */

/** One run of text, marked when it was authored as `==highlight==`. */
export interface InlineRun {
  readonly text: string
  readonly highlight: boolean
}

const FENCE = /^\s*(`{3,}|~{3,})/

/**
 * Remove `%%comments%%`, including multi-line ones, outside fenced code.
 * @param source - markdown source.
 * @returns the source without comments.
 */
export function stripComments(source: string): string {
  const lines = source.split(/\r?\n/)
  const out: string[] = []
  let fence: string | null = null
  let comment = false
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
    let visible = ''
    let index = 0
    while (index < line.length) {
      if (comment) {
        const close = line.indexOf('%%', index)
        if (close === -1) {
          index = line.length
          break
        }
        comment = false
        index = close + 2
        continue
      }
      const open = line.indexOf('%%', index)
      if (open === -1) {
        visible += line.slice(index)
        break
      }
      visible += line.slice(index, open)
      comment = true
      index = open + 2
    }
    out.push(visible)
  }
  return out.join('\n')
}

/**
 * Split one text run into plain and highlighted segments.
 * @param text - text content of one DOM node.
 * @returns runs in order; no highlight runs when the text holds no `==`.
 */
export function splitHighlights(text: string): readonly InlineRun[] {
  if (!text.includes('==')) return [{ text, highlight: false }]
  const runs: InlineRun[] = []
  const pattern = /==([^=\n]+)==/g
  let cursor = 0
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0
    if (start > cursor) runs.push({ text: text.slice(cursor, start), highlight: false })
    runs.push({ text: match[1]!, highlight: true })
    cursor = start + match[0].length
  }
  if (cursor < text.length) runs.push({ text: text.slice(cursor), highlight: false })
  return runs
}
