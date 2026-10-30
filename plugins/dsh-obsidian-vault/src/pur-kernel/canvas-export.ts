/**
 * Export Pur elements as a JSON Canvas document. The `__pur` sidecar keeps
 * Pur-only properties, so the document reimports with the same pins, code and
 * colours.
 * @module dsh-obsidian-vault/pur-kernel/canvas-export
 */
import type { PurCanvasDocument, PurCanvasEdge, PurCanvasNode } from './canvas-types.ts'
import { PUR_META } from './canvas-types.ts'
import type { PurElement, PurLineElement, PurNodeElement } from './types.ts'

/** Link targets upstream exports as JSON Canvas `link` nodes. */
const WEB_LINK = /^https?:/i

/** Element properties the wire format stores at the node level instead. */
const WIRE_KEYS = ['id', 'x', 'y', 'w', 'h', 'children']

/**
 * Export elements as a JSON Canvas document.
 * @param elements - top-level elements; groups recurse into their children.
 * @returns nodes and edges positioned in absolute canvas coordinates.
 */
export function elementsToJsonCanvas(elements: readonly PurElement[]): PurCanvasDocument {
  const nodes: PurCanvasNode[] = []
  const edges: PurCanvasEdge[] = []

  const walk = (list: readonly PurElement[], parentX: number, parentY: number, parentId: string | undefined): void => {
    for (const element of list) {
      if (element.type === 'line') {
        edges.push(edgeOf(element))
        continue
      }
      const x = element.x + parentX
      const y = element.y + parentY
      const extra = purBag(element)
      if (parentId !== undefined) extra['parentGroupId'] = parentId
      nodes.push(nodeOf(element, x, y, extra))
      if (element.type === 'group') walk(element.children, x, y, element.id)
    }
  }

  walk(elements, 0, 0, undefined)
  return { nodes, edges }
}

/**
 * Copy element properties into the `__pur` sidecar, dropping the ones the
 * wire format carries itself.
 * @param element - the element being exported.
 * @returns a plain record safe to embed in a node or edge.
 */
function purBag(element: PurElement): Record<string, unknown> {
  const bag: Record<string, unknown> = { ...element }
  for (const key of WIRE_KEYS) delete bag[key]
  return bag
}

/**
 * Build the wire node for a positioned element.
 * @param element - the element; already narrowed away from lines.
 * @param x - absolute left edge.
 * @param y - absolute top edge.
 * @param extra - `__pur` sidecar.
 * @returns the node.
 */
function nodeOf(element: PurNodeElement, x: number, y: number, extra: Record<string, unknown>): PurCanvasNode {
  switch (element.type) {
    case 'group':
      return {
        id: element.id,
        type: 'group',
        x,
        y,
        width: element.w || 0,
        height: element.h || 0,
        label: element.content || '',
        ...(element.color === undefined ? {} : { color: element.color }),
        [PUR_META]: extra,
      }
    case 'image':
      return { id: element.id, type: 'file', x, y, width: element.w || 0, height: element.h || 0, file: element.original || '', [PUR_META]: extra }
    case 'note-link': {
      const isUrl = WEB_LINK.test(element.link)
      const node: PurCanvasNode = { id: element.id, type: isUrl ? 'link' : 'file', x, y, width: element.w || 0, height: element.h || 0, [PUR_META]: extra }
      if (isUrl) node.url = element.link || ''
      else node.file = element.link || ''
      return node
    }
    case 'code-node':
      return { id: element.id, type: 'text', x, y, width: element.w || 0, height: element.h || 0, text: `\`\`\`javascript\n${element.code || element.content || ''}\n\`\`\``, [PUR_META]: extra }
    case 'text':
      return { id: element.id, type: 'text', x, y, width: element.w || 0, height: element.h || 0, text: element.content || '', [PUR_META]: extra }
  }
}

/**
 * Build the wire edge for a line.
 * @param line - the line element.
 * @returns the edge.
 */
function edgeOf(line: PurLineElement): PurCanvasEdge {
  const extra: Record<string, unknown> = {}
  if (line.fromPin !== undefined) extra['fromPin'] = line.fromPin
  if (line.toPin !== undefined) extra['toPin'] = line.toPin
  if (line.style !== undefined) extra['style'] = line.style
  if (line.arrow !== undefined) extra['arrow'] = line.arrow
  if (line.arrowSize !== undefined) extra['arrowSize'] = line.arrowSize
  const edge: PurCanvasEdge = {
    id: line.id,
    fromNode: line.from || '',
    toNode: line.to || '',
    fromSide: line.fromSide || 'right',
    toSide: line.toSide || 'left',
    label: line.content || '',
    [PUR_META]: extra,
  }
  if (line.color !== undefined) edge.color = line.color
  return edge
}
