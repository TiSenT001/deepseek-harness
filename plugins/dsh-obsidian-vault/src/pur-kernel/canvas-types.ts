/**
 * JSON Canvas wire format (the shape stored in `.canvas` files). Pur keeps its
 * own properties under {@link PUR_META}; everything else is standard JSON
 * Canvas so other tools can open the same file.
 * @module dsh-obsidian-vault/pur-kernel/canvas-types
 */

/** Key holding Pur's extra node or edge properties inside a JSON Canvas file. */
export const PUR_META = '__pur'

/** JSON Canvas node kinds. */
export type PurCanvasNodeType = 'text' | 'file' | 'link' | 'group'

/** One JSON Canvas node. */
export interface PurCanvasNode {
  /** Node id, matching the Pur element id when produced here. */
  id: string
  /** Node kind; Pur's `code-node` becomes `text` and `image` becomes `file`. */
  type: PurCanvasNodeType
  /** Left edge in canvas coordinates. */
  x: number
  /** Top edge in canvas coordinates. */
  y: number
  /** Width. */
  width: number
  /** Height. */
  height: number
  /** Text body of a `text` node. */
  text?: string
  /** Vault path of a `file` node. */
  file?: string
  /** External URL of a `link` node. */
  url?: string
  /** Label of a `group` node. */
  label?: string
  /** Hex colour, used by `group` nodes. */
  color?: string
  /** Pur-only properties, restored on import. */
  [PUR_META]?: Record<string, unknown>
}

/** One JSON Canvas edge (Pur line). */
export interface PurCanvasEdge {
  /** Edge id, matching the Pur line id. */
  id: string
  /** Source node id, empty while unbound. */
  fromNode: string
  /** Target node id, empty while unbound. */
  toNode: string
  /** Source edge used for routing. */
  fromSide?: string
  /** Target edge used for routing. */
  toSide?: string
  /** Hex stroke colour. */
  color?: string
  /** Label drawn along the edge. */
  label?: string
  /** Pur-only properties, restored on import. */
  [PUR_META]?: Record<string, unknown>
}

/** A whole JSON Canvas file. */
export interface PurCanvasDocument {
  /** Nodes, including nested group children as flat entries. */
  nodes: PurCanvasNode[]
  /** Lines. */
  edges: PurCanvasEdge[]
}
