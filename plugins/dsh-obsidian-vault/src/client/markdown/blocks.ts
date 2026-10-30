/**
 * Reading-view document helpers: heading-scoped transclusion slices,
 * `^block-id` markers rendered as anchors Obsidian can link to, and image
 * embed sizes restored from their alt marker.
 * @module dsh-obsidian-vault/client/markdown/blocks
 */
import type { NoteDto } from '../../protocol.ts'
import { headingAnchor } from '../../vault/syntax.ts'
import { SIZE_MARK } from './rewrite.ts'

const BLOCK_TAIL = /\s*\^([A-Za-z0-9][A-Za-z0-9-]*)\s*$/
const BLOCK_ELEMENTS = 'p, li, blockquote, td, th'
const SIZE_TAIL = new RegExp(`\\s*${SIZE_MARK}(\\d+)(?:x(\\d+))?$`)

/**
 * Slice a note from one heading up to the next heading of the same or higher
 * level. Used by `![[note#Heading]]`.
 * @param note - the embedded note.
 * @param anchor - authored heading text.
 * @returns the section body, or undefined when the heading is absent.
 */
export function sliceSection(note: NoteDto, anchor: string): string | undefined {
  const wanted = headingAnchor(anchor)
  const index = note.headings.findIndex(heading => headingAnchor(heading.text) === wanted)
  if (index === -1) return undefined
  const start = note.headings[index]!
  const lines = note.content.split(/\r?\n/)
  let end = lines.length
  for (let next = index + 1; next < note.headings.length; next += 1) {
    const heading = note.headings[next]!
    if (heading.level <= start.level) {
      end = heading.line - 1
      break
    }
  }
  return lines.slice(start.line - 1, end).join('\n')
}

/**
 * Slice one paragraph carrying `^block-id`, used by `![[note#^id]]`.
 * @param note - the embedded note.
 * @param id - block id without the caret.
 * @returns the block text, or undefined when the id is absent.
 */
export function sliceBlock(note: NoteDto, id: string): string | undefined {
  const line = note.blocks?.[id]
  if (line === undefined) return undefined
  const lines = note.content.split(/\r?\n/)
  let end = line
  while (end < lines.length && lines[end]!.trim().length > 0) end += 1
  return lines.slice(line - 1, end).join('\n')
}

/**
 * Turn trailing `^block-id` markers into `data-block-id` anchors and remove the
 * marker text, which Obsidian does not display.
 * @param container - the rendered note body.
 */
export function annotateBlocks(container: HTMLElement): void {
  for (const block of container.querySelectorAll<HTMLElement>(BLOCK_ELEMENTS)) {
    if (block.closest('[data-block-id]') !== null) continue
    const text = (block.textContent ?? '').trimEnd()
    const match = BLOCK_TAIL.exec(text)
    if (match === null) continue
    stripMarker(block)
    block.setAttribute('data-block-id', match[1]!)
  }
}

/**
 * Find the rendered element carrying one block id.
 * @param container - the rendered note body.
 * @param id - block id without the caret.
 */
export function findBlock(container: HTMLElement, id: string): HTMLElement | undefined {
  return container.querySelector<HTMLElement>(`[data-block-id="${id}"]`) ?? undefined
}

/**
 * Restore `![[img|300]]` / `![[img|300x200]]` sizes from the alt marker the
 * rewrite step emitted, then strip the marker so the alt reads clean.
 * @param container - the rendered note body.
 */
export function annotateImages(container: HTMLElement): void {
  for (const image of container.querySelectorAll('img[alt]')) {
    const alt = image.getAttribute('alt') ?? ''
    const match = SIZE_TAIL.exec(alt)
    if (match === null) continue
    image.setAttribute('width', match[1]!)
    if (match[2] !== undefined) image.setAttribute('height', match[2])
    image.setAttribute('alt', alt.slice(0, match.index).trimEnd())
  }
}

function stripMarker(element: HTMLElement): void {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  let last: Text | null = null
  while (walker.nextNode()) last = walker.currentNode as Text
  if (last === null) return
  last.nodeValue = (last.nodeValue ?? '').replace(BLOCK_TAIL, '')
}
