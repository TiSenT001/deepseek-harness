/**
 * Build the `https://pur.studio/<canvas>/<file>` references the embed command
 * appends to a note. Shared by the exporter and the embed action so both write
 * the same reference the reader resolves.
 * @module dsh-obsidian-vault/pur-kernel/embed-note
 */
import type { PurElement } from './types.ts'

/**
 * Reference one canvas image, matching the exporter's template.
 * @param canvas - canvas title, without extension.
 * @param fileName - image file name.
 * @returns the markdown image reference.
 */
export function purImageReference(canvas: string, fileName: string): string {
  return `![${fileName}](https://pur.studio/${encodeURIComponent(canvas)}/${encodeURIComponent(fileName)})`
}

/**
 * References for every selected image element, in canvas order.
 * @param elements - the canvas element tree.
 * @param selectedIds - ids the user selected.
 * @param canvas - canvas title, without extension.
 * @returns one markdown reference per selected image; empty when none is selected.
 */
export function selectedImageReferences(
  elements: readonly PurElement[],
  selectedIds: ReadonlySet<string>,
  canvas: string,
): readonly string[] {
  const references: string[] = []
  const walk = (nodes: readonly PurElement[]): void => {
    for (const element of nodes) {
      if (element.type === 'group') {
        walk(element.children)
        continue
      }
      if (element.type !== 'image' || !selectedIds.has(element.id)) continue
      const name = element.original.split(/[\\/]/).pop() ?? ''
      references.push(purImageReference(canvas, name.length === 0 ? 'image' : name))
    }
  }
  walk(elements)
  return references
}

/**
 * Append references to a note body, keeping one blank line between blocks.
 * @param content - current note body.
 * @param references - references to append.
 * @returns the new body.
 */
export function appendReferences(content: string, references: readonly string[]): string {
  if (references.length === 0) return content
  const body = content.replace(/\s*$/, '')
  const head = body.length === 0 ? '' : `${body}\n\n`
  return `${head}${references.join('\n\n')}\n`
}
