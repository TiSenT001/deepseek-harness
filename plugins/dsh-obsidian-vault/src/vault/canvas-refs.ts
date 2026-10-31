/**
 * Canvas-side references: which notes a `.PurStudio` document points at. The
 * canvas is a layout document, not markdown, so its links never reach the note
 * index on their own; extracting them here is what lets a note's backlinks panel
 * list the canvases that use it.
 *
 * Covered: the `link` field of every element that carries one (`note-link`,
 * `image`, `group`), group descendants, and `[[target]]` / `[[target|alias]]`
 * spans written in `text` and `code-node` content. Not covered: the cached body
 * of a `note-link` card (a copy of the target note's text, not authored on the
 * canvas), `line` labels, and image sources.
 * @module dsh-obsidian-vault/vault/canvas-refs
 */
import { scanWikiLinks } from './syntax.ts'

/** Canvas documents are JSON; larger files are skipped rather than parsed. */
export const CANVAS_MAX_BYTES = 4 * 1024 * 1024

/** One reference a canvas makes to another vault file. */
export interface CanvasReference {
  /** Target as authored: a vault path or a wiki target. */
  readonly target: string
  /** 1-based ordinal among the canvas's references, used as the reported line. */
  readonly ordinal: number
}

/**
 * Extract the note references of one canvas document.
 * @param text - `.PurStudio` file contents.
 * @returns one entry per element `link` and per wiki link in a text or code card.
 */
export function readCanvasReferences(text: string): readonly CanvasReference[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(text.replace(/^\uFEFF/, ''))
  } catch {
    return []
  }
  const root = typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : undefined
  const elements = root?.['elements']
  if (!Array.isArray(elements)) return []
  const references: CanvasReference[] = []
  const visit = (nodes: readonly unknown[]): void => {
    for (const node of nodes) {
      if (typeof node !== 'object' || node === null) continue
      const element = node as Record<string, unknown>
      const link = element['link']
      if (typeof link === 'string' && isNoteTarget(link)) addReference(references, link)
      const type = element['type']
      const content = element['content']
      if ((type === 'text' || type === 'code-node') && typeof content === 'string') {
        addWikiLinks(references, content)
      }
      const children = element['children']
      if (Array.isArray(children)) visit(children)
    }
  }
  visit(elements)
  return references
}

/**
 * Append one reference, numbering it in document order.
 * @param references - collected references, appended to.
 * @param target - authored target.
 */
function addReference(references: CanvasReference[], target: string): void {
  references.push({ target, ordinal: references.length + 1 })
}

/**
 * Append the wiki links written in one text or code card.
 * @param references - collected references, appended to.
 * @param content - the card body.
 */
function addWikiLinks(references: CanvasReference[], content: string): void {
  for (const token of scanWikiLinks(content)) {
    if (token.target.length === 0) continue
    if (/^[a-z][a-z0-9+.-]*:/i.test(token.target)) continue
    addReference(references, token.target)
  }
}

/**
 * Whether a `link` value points at a vault note.
 * @param target - the authored link.
 * @returns true for `.md` paths and `[[wiki]]` targets; URLs and asset ids are skipped.
 */
function isNoteTarget(target: string): boolean {
  const value = target.trim()
  if (value.length === 0) return false
  if (/^[a-z]+:/i.test(value)) return false
  return /\.md$/i.test(value) || !value.includes('/') || value.startsWith('[[')
}
