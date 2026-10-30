/**
 * `.PurStudio` documents: a JSON object holding the element tree and the
 * viewport, written by upstream as `{ elements, viewState }` with 2-space
 * indentation.
 * @module dsh-obsidian-vault/pur-kernel/studio-file
 */
import { PurDocumentError } from './errors.ts'
import { asRecord, isElementType, numberOr, sideOr, stringOr } from './guards.ts'
import { createElementId } from './ids.ts'
import { mergeExtras } from './merge.ts'
import { readPins } from './pins.ts'
import type { PurElement, PurElementBase, PurStudioDocument, PurViewState } from './types.ts'

/**
 * Serialise a document the way upstream saves it.
 * @param document - elements and viewport.
 * @returns indented JSON, byte-compatible with upstream output.
 */
export function serializeStudioDocument(document: PurStudioDocument): string {
  return JSON.stringify({ elements: document.elements, viewState: document.viewState }, null, 2)
}

/**
 * Read a `.PurStudio` document.
 * @param text - file contents.
 * @returns the element tree and viewport.
 * @throws {PurDocumentError} when the text is not a Pur Studio document.
 */
export function parseStudioDocument(text: string): PurStudioDocument {
  const parsed = parseJson(text)
  const root = asRecord(parsed)
  if (root === undefined) throw new PurDocumentError('Pur Studio document is not an object')
  return { elements: readElements(root['elements']), viewState: readViewState(root['viewState']) }
}

/**
 * Parse JSON, reporting failures as a document error.
 * @param text - file contents.
 * @returns the parsed value.
 */
function parseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch (error) {
    throw new PurDocumentError('Pur Studio document is not valid JSON', { cause: error })
  }
}

/**
 * Read the top-level element list.
 * @param value - raw `elements` value.
 * @returns the elements, empty when the field is absent.
 */
function readElements(value: unknown): PurElement[] {
  if (value === undefined) return []
  if (!Array.isArray(value)) throw new PurDocumentError('elements is not an array')
  return value.map((item, index) => readElement(item, `elements[${index}]`))
}

/**
 * Read one element, normalising the properties the kernel relies on.
 * @param value - raw element value.
 * @param path - document path named in failure messages.
 * @returns the element.
 */
function readElement(value: unknown, path: string): PurElement {
  const record = asRecord(value)
  if (record === undefined) throw new PurDocumentError(`${path} is not an object`)
  const type = record['type']
  if (!isElementType(type)) throw new PurDocumentError(`${path} has no valid type`)
  const id = stringOr(record['id'], '') || createElementId()
  if (type === 'line') {
    const line = {
      id,
      type: 'line' as const,
      from: stringOr(record['from'], ''),
      to: stringOr(record['to'], ''),
      fromSide: sideOr(record['fromSide'], 'right'),
      toSide: sideOr(record['toSide'], 'left'),
    }
    return mergeExtras(line, record)
  }
  const base: PurElementBase = { id, x: numberOr(record['x'], 0), y: numberOr(record['y'], 0), w: numberOr(record['w'], 0), h: numberOr(record['h'], 0) }
  switch (type) {
    case 'group': {
      const children = readChildren(record['children'], `${path}.children`)
      return mergeExtras({ ...base, type: 'group', content: stringOr(record['content'], ''), children }, record)
    }
    case 'text':
      return mergeExtras({ ...base, type: 'text', content: stringOr(record['content'], '') }, record)
    case 'image':
      return mergeExtras({ ...base, type: 'image', original: stringOr(record['original'], '') }, record)
    case 'note-link':
      return mergeExtras({ ...base, type: 'note-link', content: stringOr(record['content'], ''), link: stringOr(record['link'], '') }, record)
    case 'code-node': {
      const inputs = readPins(record['inputs'], `${path}.inputs`)
      const outputs = readPins(record['outputs'], `${path}.outputs`)
      const element = {
        ...base,
        type: 'code-node' as const,
        content: stringOr(record['content'], ''),
        ...(inputs === undefined ? {} : { inputs }),
        ...(outputs === undefined ? {} : { outputs }),
      }
      return mergeExtras(element, record)
    }
  }
}

/**
 * Read a group's child list.
 * @param value - raw `children` value.
 * @param path - document path named in failure messages.
 * @returns the children, empty when the field is absent.
 */
function readChildren(value: unknown, path: string): PurElement[] {
  if (value === undefined) return []
  if (!Array.isArray(value)) throw new PurDocumentError(`${path} is not an array`)
  return value.map((child, index) => readElement(child, `${path}[${index}]`))
}

/**
 * Read the viewport.
 * @param value - raw `viewState` value.
 * @returns the viewport, with upstream defaults for missing keys.
 */
function readViewState(value: unknown): PurViewState {
  const record = asRecord(value) ?? {}
  return { offsetX: numberOr(record['offsetX'], 0), offsetY: numberOr(record['offsetY'], 0), scale: numberOr(record['scale'], 1) }
}
