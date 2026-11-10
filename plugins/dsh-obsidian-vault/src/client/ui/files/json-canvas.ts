/**
 * JSON Canvas reader: the Obsidian `.canvas` document format (nodes and edges
 * with world coordinates). Read-only; unknown fields are ignored.
 * @module dsh-obsidian-vault/client/ui/files/json-canvas
 */

/** Canvas node kinds the viewer knows. */
export type JsonCanvasNodeType = 'text' | 'file' | 'link' | 'group'

/** One node from a `.canvas` file. */
export interface JsonCanvasNode {
  readonly id: string
  readonly type: JsonCanvasNodeType
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly text?: string
  readonly file?: string
  readonly subpath?: string
  readonly label?: string
  readonly url?: string
  /** Obsidian colour number 1–6, kept as a string. */
  readonly color?: string
}

/** One edge between two nodes. */
export interface JsonCanvasEdge {
  readonly id: string
  readonly fromNode: string
  readonly toNode: string
  readonly fromSide?: 'top' | 'right' | 'bottom' | 'left'
  readonly toSide?: 'top' | 'right' | 'bottom' | 'left'
  readonly label?: string
  readonly color?: string
}

/** Parsed document or a readable failure. */
export type JsonCanvasParse =
  | { readonly ok: true; readonly nodes: readonly JsonCanvasNode[]; readonly edges: readonly JsonCanvasEdge[] }
  | { readonly ok: false; readonly error: string }

const NODE_TYPES = new Set<JsonCanvasNodeType>(['text', 'file', 'link', 'group'])
const SIDES = new Set(['top', 'right', 'bottom', 'left'])

/**
 * Parse one `.canvas` document.
 * @param source - raw JSON text.
 * @returns the nodes and edges, or an error message.
 */
export function parseJsonCanvas(source: string): JsonCanvasParse {
  let parsed: unknown
  try {
    parsed = JSON.parse(source)
  } catch {
    return { ok: false, error: 'invalid JSON' }
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return { ok: false, error: 'not an object' }
  const input = parsed as { readonly nodes?: unknown; readonly edges?: unknown }
  const nodes: JsonCanvasNode[] = []
  if (input.nodes !== undefined) {
    if (!Array.isArray(input.nodes)) return { ok: false, error: 'nodes is not an array' }
    for (const value of input.nodes) {
      const node = nodeOf(value)
      if (node !== undefined) nodes.push(node)
    }
  }
  const edges: JsonCanvasEdge[] = []
  if (input.edges !== undefined) {
    if (!Array.isArray(input.edges)) return { ok: false, error: 'edges is not an array' }
    for (const value of input.edges) {
      const edge = edgeOf(value)
      if (edge !== undefined) edges.push(edge)
    }
  }
  return { ok: true, nodes, edges }
}

function nodeOf(value: unknown): JsonCanvasNode | undefined {
  if (value === null || typeof value !== 'object') return undefined
  const input = value as Record<string, unknown>
  if (typeof input['id'] !== 'string' || typeof input['type'] !== 'string') return undefined
  if (!NODE_TYPES.has(input['type'] as JsonCanvasNodeType)) return undefined
  const x = number(input['x'])
  const y = number(input['y'])
  const width = number(input['width'])
  const height = number(input['height'])
  if (x === undefined || y === undefined || width === undefined || height === undefined) return undefined
  const string = (key: string): string | undefined => (typeof input[key] === 'string' ? input[key] as string : undefined)
  const node: JsonCanvasNode = {
    id: input['id'],
    type: input['type'] as JsonCanvasNodeType,
    x,
    y,
    width: Math.max(1, width),
    height: Math.max(1, height),
    ...(string('text') === undefined ? {} : { text: string('text')! }),
    ...(string('file') === undefined ? {} : { file: string('file')! }),
    ...(string('subpath') === undefined ? {} : { subpath: string('subpath')! }),
    ...(string('label') === undefined ? {} : { label: string('label')! }),
    ...(string('url') === undefined ? {} : { url: string('url')! }),
    ...(string('color') === undefined ? {} : { color: string('color')! }),
  }
  return node
}

function edgeOf(value: unknown): JsonCanvasEdge | undefined {
  if (value === null || typeof value !== 'object') return undefined
  const input = value as Record<string, unknown>
  if (typeof input['id'] !== 'string') return undefined
  if (typeof input['fromNode'] !== 'string' || typeof input['toNode'] !== 'string') return undefined
  const side = (key: string): JsonCanvasEdge['fromSide'] =>
    typeof input[key] === 'string' && SIDES.has(input[key] as string)
      ? input[key] as JsonCanvasEdge['fromSide']
      : undefined
  const label = typeof input['label'] === 'string' ? input['label'] : undefined
  const color = typeof input['color'] === 'string' ? input['color'] : undefined
  return {
    id: input['id'],
    fromNode: input['fromNode'],
    toNode: input['toNode'],
    ...(side('fromSide') === undefined ? {} : { fromSide: side('fromSide')! }),
    ...(side('toSide') === undefined ? {} : { toSide: side('toSide')! }),
    ...(label === undefined ? {} : { label }),
    ...(color === undefined ? {} : { color }),
  }
}

function number(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}
