/**
 * Export-as-text document builders: the selected-only plain text/code dump and
 * the full-canvas Markdown outline, byte-compatible with upstream
 * `exportAsText`. Persisting and naming the file is the adapter's job.
 * @module dsh-obsidian-vault/pur-kernel/export-text
 */
import type { PurElement } from './types.ts'

/** Display copy the outline interpolates, supplied by the adapter locale. */
export interface PurExportTextLabels {
  /** Header title when the document has no name (`Pur Studio 导出`). */
  fallbackTitle: string
  /**
   * Timestamp line under the header.
   * @param time - locale-formatted export time.
   * @returns the line, e.g. `> 导出时间：…`.
   */
  exportedAt: (time: string) => string
  /** Group label when the group declares no content (`群组`). */
  groupFallback: string
  /** Image URL bucket when the document has no name (`附件图管理`). */
  imageBucket: string
}

/** Inputs for {@link buildExportOutline}. */
export interface PurExportOutlineOptions {
  /** Document title, typically the file basename; the label fallback applies when absent. */
  title?: string
  /** Locale-formatted export time. */
  time: string
  /** Copy bundle. */
  labels: PurExportTextLabels
}

/**
 * Build the selected-only export: text bodies and code-node fenced blocks of
 * the selected elements in document order, joined by `---` rules.
 * @param elements - top-level elements; groups are searched recursively.
 * @param selectedIds - the selection.
 * @returns the document, or null when nothing selected carries text or code.
 */
export function buildSelectedTextExport(elements: readonly PurElement[], selectedIds: ReadonlySet<string>): string | null {
  const parts: string[] = []
  const search = (list: readonly PurElement[]): void => {
    for (const element of list) {
      if (selectedIds.has(element.id)) {
        if (element.type === 'code-node') parts.push('```javascript\n' + (element.content || element.code || '') + '\n```')
        else if (element.type === 'text') parts.push(element.content)
      }
      if (element.type === 'group') search(element.children)
    }
  }
  search(elements)
  const kept = parts.filter((text) => text.trim() !== '')
  return kept.length === 0 ? null : kept.join('\n\n---\n\n')
}

/**
 * Build the full-canvas Markdown outline, in upstream's element order.
 * @param elements - top-level elements.
 * @param options - title, time and copy.
 * @returns the outline document.
 */
export function buildExportOutline(elements: readonly PurElement[], options: PurExportOutlineOptions): string {
  const title = options.title !== undefined && options.title.trim() !== '' ? options.title : undefined
  const lines = ['# ' + (title ?? options.labels.fallbackTitle), options.labels.exportedAt(options.time), '', '---', '']
  let index = 1
  const exportElement = (element: PurElement, depth: number): void => {
    if (element.type === 'group') {
      const noteLink = element.link !== undefined ? ' → [[' + element.link.replace('.md', '') + ']]' : ''
      const label = (element.content || options.labels.groupFallback).replace(/^📦\s*/, '')
      lines.push((depth === 0 ? '## ' : '### ') + index + '. 📦 ' + label + noteLink)
      lines.push('')
      index++
      for (const child of element.children) exportElement(child, depth + 1)
      return
    }
    if (element.type === 'line') return
    if (element.type === 'image') {
      const fileName = (element.original || 'image').split(/[\\/]/).pop() ?? 'image'
      lines.push(`![${fileName}](https://pur.studio/${encodeURIComponent(title ?? options.labels.imageBucket)}/${encodeURIComponent(fileName)})`)
      lines.push('')
      index++
      return
    }
    if (element.type === 'text') {
      if (element.content !== '' && !/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(element.content.trim())) {
        lines.push(element.content)
        lines.push('')
      }
      index++
      return
    }
    if (element.type === 'note-link' && element.link !== '') {
      lines.push(`[[${element.link.replace('.md', '')}]]`)
      lines.push('')
      index++
    }
  }
  for (const element of elements) exportElement(element, 0)
  return lines.join('\n')
}
