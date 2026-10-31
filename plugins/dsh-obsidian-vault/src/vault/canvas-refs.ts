/**
 * Canvas-side references: which notes a `.PurStudio` document points at. The
 * canvas is a layout document, not markdown, so its links never reach the note
 * index on their own; extracting them here is what lets a note's backlinks panel
 * list the canvases that use it.
 * @module dsh-obsidian-vault/vault/canvas-refs
 */

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
 * @returns one entry per `link` field that names a vault path or a wiki target.
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
      if (typeof link === 'string' && isNoteTarget(link)) {
        references.push({ target: link, ordinal: references.length + 1 })
      }
      const children = element['children']
      if (Array.isArray(children)) visit(children)
    }
  }
  visit(elements)
  return references
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
