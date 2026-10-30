/**
 * Flatten elements into an executable pipeline: which elements act as code
 * nodes, the pin connections between them, a cycle-safe topological order and
 * the identifiers the generated code declares.
 * @module dsh-obsidian-vault/pur-kernel/pipeline
 */
import type { PurElement, PurPin } from './types.ts'

/** One node of the generated pipeline, in execution order. */
export interface PurPipelineNode {
  /** Element id. */
  id: string
  /** Generated variable name, `node_<index>_<title>`. */
  safeName: string
  /** Display title; empty when the element declares none. */
  title: string
  /** Input pins, in declaration order. */
  inputs: PurPin[]
  /** Output pins, in declaration order. */
  outputs: PurPin[]
  /** Element text content. */
  content: string
  /** Element code, when the element kind carries one. */
  code: string
  /** Code read from a linked note, when the adapter resolved it. */
  linkedCode: string | undefined
}

/** Where an input pin's value comes from. */
export interface PurInputSource {
  /** Producing element id. */
  fromNode: string
  /** Producing pin id. */
  fromPin: string
}

/** A pin connection between two pipeline nodes. */
export interface PurPipelineEdge extends PurInputSource {
  /** Consuming element id. */
  toNode: string
  /** Consuming pin id. */
  toPin: string
}

/** Executable pipeline in topological order. */
export interface PurPipeline {
  /** Code nodes in execution order. */
  nodes: PurPipelineNode[]
  /** Pin connections that survived the code-node filter. */
  edges: PurPipelineEdge[]
  /** Connections keyed by consumer id, then pin id. */
  inputMap: Map<string, Map<string, PurInputSource>>
}

/** Why a pipeline could not be built. */
export type PurPipelineFailure = 'no-code-nodes' | 'cycle'

/** Result of {@link buildPipeline}. */
export type PurPipelineResult = { ok: true; pipeline: PurPipeline } | { ok: false; reason: PurPipelineFailure }

/** Adapter hooks {@link buildPipeline} cannot perform itself. */
export interface PurPipelineOptions {
  /**
   * Read the code a note link points at. Called only for note links whose
   * content does not already define `function`.
   * @param element - the note link.
   * @returns extracted code, or undefined when unreadable.
   */
  resolveLinkedCode?: (element: PurElement) => string | undefined
}

/**
 * Build the executable pipeline for the given elements.
 * @param elements - top-level elements; groups are flattened.
 * @param options - adapter hooks.
 * @returns the pipeline, or the reason it could not be built.
 */
export function buildPipeline(elements: readonly PurElement[], options: PurPipelineOptions = {}): PurPipelineResult {
  const flat = flatten(elements)
  const codeNodes = flat.filter(isCodeSource)
  if (codeNodes.length === 0) return { ok: false, reason: 'no-code-nodes' }

  const ids = new Set(codeNodes.map((node) => node.id))
  const edges: PurPipelineEdge[] = []
  for (const element of flat) {
    if (element.type !== 'line') continue
    if (!ids.has(element.from) || !ids.has(element.to)) continue
    if (!element.fromPin || !element.toPin) continue
    edges.push({ fromNode: element.from, fromPin: element.fromPin, toNode: element.to, toPin: element.toPin })
  }

  const order = topologicalOrder(codeNodes, edges)
  if (order === null) return { ok: false, reason: 'cycle' }

  const byId = new Map(codeNodes.map((node) => [node.id, node]))
  const nodes: PurPipelineNode[] = []
  order.forEach((id, index) => {
    const element = byId.get(id)
    if (element === undefined || element.type === 'line') return
    const title = element.type === 'code-node' || element.type === 'text' ? (element.title ?? '') : ''
    const safeName = `node_${index}_${(title || 'node').replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '')}`
    nodes.push({
      id,
      safeName,
      title,
      inputs: element.inputs ?? [],
      outputs: element.outputs ?? [],
      content: element.type === 'image' ? '' : (element.content ?? ''),
      code: element.type === 'code-node' ? (element.code ?? '') : '',
      linkedCode: linkedCodeOf(element, options),
    })
  })

  const inputMap = new Map<string, Map<string, PurInputSource>>()
  for (const node of nodes) inputMap.set(node.id, new Map())
  for (const edge of edges) {
    const pins = inputMap.get(edge.toNode)
    if (pins === undefined) continue
    pins.set(edge.toPin, { fromNode: edge.fromNode, fromPin: edge.fromPin })
  }

  return { ok: true, pipeline: { nodes, edges, inputMap } }
}

/**
 * Flatten groups into their leaf elements, document order preserved.
 * @param elements - top-level elements.
 * @returns leaf elements, groups removed.
 */
function flatten(elements: readonly PurElement[]): PurElement[] {
  const flat: PurElement[] = []
  for (const element of elements) {
    if (element.type === 'group') flat.push(...flatten(element.children))
    else flat.push(element)
  }
  return flat
}

/**
 * Tell whether an element renders as a code node.
 * @param element - leaf element.
 * @returns true for code nodes, and for text and note links that declare pins.
 */
function isCodeSource(element: PurElement): boolean {
  if (element.type === 'code-node') return true
  if (element.type !== 'text' && element.type !== 'note-link') return false
  return (element.inputs?.length ?? 0) > 0 || (element.outputs?.length ?? 0) > 0
}

/**
 * Kahn topological sort in insertion order.
 * @param nodes - code nodes.
 * @param edges - pin connections between them.
 * @returns ids in execution order, or null when the graph has a cycle.
 */
function topologicalOrder(nodes: readonly PurElement[], edges: readonly PurPipelineEdge[]): string[] | null {
  const inDegree = new Map<string, number>()
  const outgoing = new Map<string, string[]>()
  for (const node of nodes) {
    inDegree.set(node.id, 0)
    outgoing.set(node.id, [])
  }
  for (const edge of edges) {
    const targets = outgoing.get(edge.fromNode)
    if (targets === undefined) continue
    targets.push(edge.toNode)
    inDegree.set(edge.toNode, (inDegree.get(edge.toNode) ?? 0) + 1)
  }
  const queue: string[] = []
  for (const [id, degree] of inDegree) if (degree === 0) queue.push(id)
  const order: string[] = []
  while (queue.length > 0) {
    const id = queue.shift()
    if (id === undefined) break
    order.push(id)
    for (const target of outgoing.get(id) ?? []) {
      const degree = (inDegree.get(target) ?? 0) - 1
      inDegree.set(target, degree)
      if (degree === 0) queue.push(target)
    }
  }
  return order.length === nodes.length ? order : null
}

/**
 * Code a note link points at, when its own content does not define `function`.
 * @param element - code source element.
 * @param options - adapter hooks.
 * @returns resolved code, or undefined.
 */
function linkedCodeOf(element: PurElement, options: PurPipelineOptions): string | undefined {
  if (element.type !== 'note-link') return undefined
  if (!element.link) return undefined
  if (element.content !== '' && element.content.includes('function')) return undefined
  return options.resolveLinkedCode?.(element)
}
