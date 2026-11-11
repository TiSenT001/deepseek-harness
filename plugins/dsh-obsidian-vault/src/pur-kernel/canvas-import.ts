/**
 * Import a JSON Canvas document into Pur elements. A `__pur` sidecar restores
 * Pur-only element kinds; a canvas written by another tool imports with
 * upstream's default sizes and colours.
 * @module dsh-obsidian-vault/pur-kernel/canvas-import
 */
import { PUR_META } from './canvas-types.ts'
import { PurDocumentError } from './errors.ts'
import { asRecord, nonZeroNumberOr, numberOr, sideOr, stringOr } from './guards.ts'
import { createElementId } from './ids.ts'
import { mergeExtras } from './merge.ts'
import { readPins } from './pins.ts'
import type { PurElement, PurGroupElement, PurLineElement, PurNodeElement } from './types.ts'

/** File spellings upstream treats as images rather than notes. */
const IMAGE_FILE = /\.(png|jpe?g|gif|webp|svg|bmp)$/i

/** Element kinds whose `__pur` sidecar restores a node (groups are read separately). */
type PurNodeElementKind = Exclude<PurNodeElement['type'], 'group'>

/** Element kinds that arrive on a canvas *node* (lines arrive as edges). */
const NODE_TYPES: readonly PurNodeElementKind[] = ['text', 'image', 'note-link', 'code-node']

/**
 * Import a JSON Canvas document.
 * @param document - parsed `.canvas` contents, of unknown provenance.
 * @returns top-level elements in document order, groups owning their children.
 * @throws {PurDocumentError} when the document is not a JSON Canvas object.
 */
export function jsonCanvasToElements(document: unknown): PurElement[] {
  const root = asRecord(document)
  if (root === undefined) throw new PurDocumentError('JSON Canvas document is not an object')
  const nodes = recordArray(root['nodes'], 'nodes')
  const edges = recordArray(root['edges'], 'edges')

  const elements: PurElement[] = []
  const groups = new Map<string, PurGroupElement>()
  for (const node of nodes) {
    if (node['type'] !== 'group') continue
    const group = groupFromNode(node)
    elements.push(group)
    groups.set(group.id, group)
  }
  for (const node of nodes) {
    if (node['type'] === 'group') continue
    const element = nodeFromRecord(node)
    const parent = groups.get(parentGroupIdOf(node) ?? '')
    if (parent === undefined) {
      elements.push(element)
      continue
    }
    element.x = numberOr(node['x'], 0) - parent.x
    element.y = numberOr(node['y'], 0) - parent.y
    parent.children.push(element)
  }
  for (const edge of edges) elements.push(lineFromEdge(edge))
  return elements
}

/**
 * Read a wire array of objects.
 * @param value - raw `nodes` or `edges` value.
 * @param field - document field named in a failure message.
 * @returns the records, empty when the field is absent.
 */
function recordArray(value: unknown, field: string): Record<string, unknown>[] {
  if (value === undefined) return []
  if (!Array.isArray(value)) throw new PurDocumentError(`JSON Canvas ${field} is not an array`)
  return value.map((item, index) => {
    const record = asRecord(item)
    if (record === undefined) throw new PurDocumentError(`JSON Canvas ${field}[${index}] is not an object`)
    return record
  })
}

/**
 * Element id from a wire node, generated when the node has none.
 * @param node - the wire node record.
 * @returns the id.
 */
function identityOf(node: Record<string, unknown>): string {
  return stringOr(node['id'], '') || createElementId()
}

/**
 * Read the `__pur` sidecar.
 * @param record - the wire node or edge.
 * @returns the sidecar, empty when absent or malformed.
 */
function purMetaOf(record: Record<string, unknown>): Record<string, unknown> {
  return asRecord(record[PUR_META]) ?? {}
}

/**
 * Read the parent group id a nested node was exported under.
 * @param node - the wire node.
 * @returns the id, or undefined when the node is top level.
 */
function parentGroupIdOf(node: Record<string, unknown>): string | undefined {
  const value = purMetaOf(node)['parentGroupId']
  return typeof value === 'string' && value !== '' ? value : undefined
}

/**
 * Copy a sidecar without the nesting marker, which element bodies never keep.
 * @param extra - the `__pur` sidecar.
 * @returns a copy that can be merged onto an element.
 */
function withoutParent(extra: Record<string, unknown>): Record<string, unknown> {
  const copy: Record<string, unknown> = { ...extra }
  delete copy['parentGroupId']
  return copy
}

/**
 * Rebuild a group node, including its (still empty) child list.
 * @param node - the wire node.
 * @returns the group element.
 */
function groupFromNode(node: Record<string, unknown>): PurGroupElement {
  const base: PurGroupElement = {
    id: identityOf(node),
    type: 'group',
    x: numberOr(node['x'], 0),
    y: numberOr(node['y'], 0),
    w: numberOr(node['width'], 0),
    h: numberOr(node['height'], 0),
    content: stringOr(node['label'], ''),
    rotation: 0,
    opacity: 1,
    children: [],
    ...(node['collapsed'] === true ? { collapsed: true } : {}),
  }
  return mergeExtras(base, withoutParent(purMetaOf(node)))
}

/**
 * Rebuild a node element, preferring the `__pur` sidecar when it names a kind.
 * @param node - the wire node.
 * @returns the element.
 */
function nodeFromRecord(node: Record<string, unknown>): PurNodeElement {
  const extra = purMetaOf(node)
  const type = extra['type']
  if (isNodeElementKind(type)) return purElement(type, node, extra)
  return foreignElement(node)
}

/**
 * Tell whether a `__pur` sidecar names an element kind restored from a node.
 * @param value - candidate.
 * @returns true for text, image, note-link and code-node.
 */
function isNodeElementKind(value: unknown): value is PurNodeElementKind {
  return typeof value === 'string' && (NODE_TYPES as readonly string[]).includes(value)
}

/**
 * Rebuild a node from its `__pur` sidecar, normalising the shared properties.
 * @param type - the sidecar's element kind.
 * @param node - the wire node.
 * @param extra - the `__pur` sidecar.
 * @returns the element.
 */
function purElement(type: PurNodeElementKind, node: Record<string, unknown>, extra: Record<string, unknown>): PurNodeElement {
  const base = {
    id: identityOf(node),
    x: numberOr(node['x'], 0),
    y: numberOr(node['y'], 0),
    w: numberOr(node['width'], 0),
    h: numberOr(node['height'], 0),
  }
  const rest = withoutParent(extra)
  switch (type) {
    case 'text':
      return mergeExtras({ ...base, type: 'text', content: stringOr(extra['content'], '') }, rest)
    case 'image':
      return mergeExtras({ ...base, type: 'image', original: stringOr(extra['original'], '') }, rest)
    case 'note-link':
      return mergeExtras({ ...base, type: 'note-link', content: stringOr(extra['content'], ''), link: stringOr(extra['link'], '') }, rest)
    case 'code-node': {
      const inputs = readPins(extra['inputs'], 'code-node.inputs')
      const outputs = readPins(extra['outputs'], 'code-node.outputs')
      const element: PurNodeElement = {
        ...base,
        type: 'code-node',
        content: stringOr(extra['content'], ''),
        ...(inputs === undefined ? {} : { inputs }),
        ...(outputs === undefined ? {} : { outputs }),
      }
      return mergeExtras(element, rest)
    }
  }
}

/**
 * Rebuild a node that carries no `__pur` sidecar, applying JSON Canvas defaults.
 * @param node - the wire node.
 * @returns the element.
 */
function foreignElement(node: Record<string, unknown>): PurNodeElement {
  const id = identityOf(node)
  const x = numberOr(node['x'], 0)
  const y = numberOr(node['y'], 0)
  if (node['type'] === 'file') {
    const file = stringOr(node['file'], '')
    if (IMAGE_FILE.test(file)) {
      return { id, type: 'image', x, y, w: nonZeroNumberOr(node['width'], 300), h: nonZeroNumberOr(node['height'], 200), original: file, rotation: 0, opacity: 1 }
    }
    return { id, type: 'note-link', x, y, w: nonZeroNumberOr(node['width'], 280), h: nonZeroNumberOr(node['height'], 80), content: file, link: file, rotation: 0, opacity: 1 }
  }
  if (node['type'] === 'link') {
    const url = stringOr(node['url'], '')
    return { id, type: 'note-link', x, y, w: nonZeroNumberOr(node['width'], 280), h: nonZeroNumberOr(node['height'], 80), content: url, link: url, rotation: 0, opacity: 1 }
  }
  return { id, type: 'text', x, y, w: nonZeroNumberOr(node['width'], 250), h: nonZeroNumberOr(node['height'], 60), content: stringOr(node['text'], ''), bgColor: 'rgba(30,30,30,0.8)', color: stringOr(node['color'], '#e0e0e0'), fontSize: 14, rotation: 0, opacity: 1 }
}

/**
 * Rebuild a line from a wire edge.
 * @param edge - the wire edge.
 * @returns the line element.
 */
function lineFromEdge(edge: Record<string, unknown>): PurLineElement {
  const base: PurLineElement = {
    id: identityOf(edge),
    type: 'line',
    from: stringOr(edge['fromNode'], ''),
    to: stringOr(edge['toNode'], ''),
    fromSide: sideOr(edge['fromSide'], 'right'),
    toSide: sideOr(edge['toSide'], 'left'),
    width: 2,
    content: stringOr(edge['label'], ''),
  }
  const color = edge['color']
  if (typeof color === 'string') base.color = color
  return mergeExtras(base, purMetaOf(edge))
}
