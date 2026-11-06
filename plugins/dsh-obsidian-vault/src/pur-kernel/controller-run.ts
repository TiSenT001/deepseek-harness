/**
 * Running a code node: collect the values its input pins receive from connected
 * upstream nodes, ask the adapter to evaluate the snippet, and store the outputs
 * back on the node so they can feed the next node.
 * @module dsh-obsidian-vault/pur-kernel/controller-run
 */
import type { PurControllerEffect, PurControllerTools } from './controller-types.ts'
import type { PurCodeNodeElement, PurLineElement, PurPin } from './types.ts'

/** Longest serialized value kept on a node, in characters. */
const MAX_VALUE_CHARS = 200

/** Longest error message kept on a node, in characters. */
const MAX_ERROR_CHARS = 200

/**
 * Find a code node by id.
 * @param tools - shared controller tools.
 * @param id - element id.
 * @returns the node, or null when the id names something else.
 */
function codeNodeOf(tools: PurControllerTools, id: string): PurCodeNodeElement | null {
  const element = tools.state.elements.find((candidate) => candidate.id === id)
  return element !== undefined && element.type === 'code-node' ? element : null
}

/**
 * The line that feeds one input pin of a node.
 * @param lines - every line in the document.
 * @param nodeId - the consumer.
 * @param pinId - the consumer's pin.
 * @returns the line, or null when the pin is unconnected.
 */
function lineInto(lines: readonly PurLineElement[], nodeId: string, pinId: string): PurLineElement | null {
  return lines.find((line) => line.to === nodeId && line.toPin === pinId) ?? null
}

/**
 * Read the value an upstream node published for one output pin.
 * @param tools - shared controller tools.
 * @param line - the incoming line.
 * @returns the parsed value, or null when the source has not run yet.
 */
function upstreamValue(tools: PurControllerTools, line: PurLineElement): unknown {
  if (line.fromPin === undefined) return null
  const source = tools.state.elements.find((element) => element.id === line.from)
  if (source === undefined || source.type !== 'code-node') return null
  const pin = source.outputs?.find((candidate) => candidate.id === line.fromPin)
  if (pin === undefined) return null
  const serialized = source.values?.[pin.label]
  if (serialized === undefined) return null
  try {
    return JSON.parse(serialized) as unknown
  } catch {
    return serialized
  }
}

/**
 * Build the `inputs` object a node's code receives, keyed by input pin label.
 * @param tools - shared controller tools.
 * @param node - the code node.
 * @returns one entry per input pin; unconnected pins receive null.
 */
export function collectNodeInputs(tools: PurControllerTools, node: PurCodeNodeElement): Record<string, unknown> {
  const lines: PurLineElement[] = []
  for (const element of tools.state.elements) if (element.type === 'line') lines.push(element)
  const inputs: Record<string, unknown> = {}
  for (const pin of node.inputs ?? []) {
    const line = lineInto(lines, node.id, pin.id)
    inputs[pin.label] = line === null ? null : upstreamValue(tools, line)
  }
  return inputs
}

/**
 * Ask the adapter to evaluate a node's snippet.
 * @param tools - shared controller tools.
 * @param id - the code node.
 * @returns the effect the adapter turns into an evaluation request, or a notice
 *   when there is nothing to run.
 */
export function runCodeNode(tools: PurControllerTools, id: string): PurControllerEffect[] {
  const node = codeNodeOf(tools, id)
  if (node === null) return []
  const code = (node.code ?? '').trim()
  if (code === '') {
    return [{ type: 'notice', text: tools.labels.codeNodeFallbackTitle }, { type: 'render' }]
  }
  return [{ type: 'run-code', id: node.id, code: node.code ?? '', inputs: collectNodeInputs(tools, node) }]
}

/**
 * Clamp a serialized value so one runaway result cannot bloat the document.
 * @param value - serialized value.
 * @returns the value, truncated when needed.
 */
function clamp(value: string): string {
  return value.length <= MAX_VALUE_CHARS ? value : `${value.slice(0, MAX_VALUE_CHARS - 1)}…`
}

/**
 * Serialize a result object into per-label values.
 * @param result - value returned by the snippet.
 * @returns one serialized string per key; a primitive becomes a single `result` key.
 */
export function serializeRunValues(result: unknown): Record<string, string> {
  if (result === null || typeof result !== 'object') {
    return { result: clamp(JSON.stringify(result) ?? 'null') }
  }
  const values: Record<string, string> = {}
  for (const [key, value] of Object.entries(result as Record<string, unknown>)) {
    values[key] = clamp(JSON.stringify(value) ?? 'null')
  }
  return values
}

/**
 * Store the evaluation result on the node and persist it.
 * @param tools - shared controller tools.
 * @param id - the code node that ran.
 * @param outcome - what the adapter observed.
 * @returns the save and render effects.
 */
export function applyRunResult(
  tools: PurControllerTools,
  id: string,
  outcome: { ok: boolean; values?: Record<string, string>; error?: string; ms: number },
): PurControllerEffect[] {
  const node = codeNodeOf(tools, id)
  if (node === null) return []
  const values: Record<string, string> = {}
  for (const [label, value] of Object.entries(outcome.values ?? {})) values[label] = clamp(value)
  node.values = values
  node.run = {
    ok: outcome.ok,
    ms: Math.max(0, Math.round(outcome.ms)),
    ...(outcome.error === undefined ? {} : { error: outcome.error.slice(0, MAX_ERROR_CHARS) }),
  }
  return [{ type: 'save' }, { type: 'render' }]
}

/**
 * Format a pin's stored value for the card.
 * @param node - the code node.
 * @param pin - the pin.
 * @returns a short suffix such as `= 42`, or an empty string.
 */
export function pinValueText(node: PurCodeNodeElement, pin: PurPin): string {
  const value = node.values?.[pin.label]
  if (value === undefined) return ''
  return ` = ${value}`
}

/** The order a run-all pass would execute, or why it cannot. */
export interface PurRunPlan {
  /** Code-node ids in dependency order; empty when the graph has a cycle. */
  order: string[]
  /** True when the connections between code nodes contain a cycle. */
  cycle: boolean
}

/**
 * Order every code node so upstream nodes run before the nodes they feed.
 * Nodes without a dependency keep their document order.
 * @param tools - shared controller tools.
 * @returns the execution order, or a cycle marker.
 */
export function planRunAll(tools: PurControllerTools): PurRunPlan {
  const nodes: PurCodeNodeElement[] = []
  for (const element of tools.state.elements) if (element.type === 'code-node') nodes.push(element)
  const ids = new Set(nodes.map((node) => node.id))
  const edges = new Set<string>()
  const outgoing = new Map<string, string[]>()
  for (const element of tools.state.elements) {
    if (element.type !== 'line') continue
    if (!ids.has(element.from) || !ids.has(element.to) || element.from === element.to) continue
    const key = `${element.from}>${element.to}`
    if (edges.has(key)) continue
    edges.add(key)
    const list = outgoing.get(element.from) ?? []
    list.push(element.to)
    outgoing.set(element.from, list)
  }
  const indegree = new Map<string, number>()
  for (const node of nodes) indegree.set(node.id, 0)
  for (const key of edges) {
    const to = key.slice(key.indexOf('>') + 1)
    indegree.set(to, (indegree.get(to) ?? 0) + 1)
  }
  const order: string[] = []
  const done = new Set<string>()
  while (true) {
    // Always take the ready node that comes first in the document, so the order is
    // deterministic and independent nodes run in the order the user sees.
    const next = nodes.find((node) => !done.has(node.id) && (indegree.get(node.id) ?? 0) === 0)
    if (next === undefined) break
    done.add(next.id)
    order.push(next.id)
    for (const target of outgoing.get(next.id) ?? []) {
      indegree.set(target, (indegree.get(target) ?? 0) - 1)
    }
  }
  return { order: order.length === nodes.length ? order : [], cycle: order.length !== nodes.length }
}

/**
 * Store a value the user typed for one output pin, so a node can act as a constant.
 * The text is parsed as JSON when it is valid JSON; otherwise it is stored as a
 * string. An empty text clears the value.
 * @param tools - shared controller tools.
 * @param id - the code node.
 * @param label - output pin label.
 * @param text - typed text.
 * @returns the save and render effects, empty when the pin does not exist.
 */
export function setNodeValue(tools: PurControllerTools, id: string, label: string, text: string): PurControllerEffect[] {
  const node = codeNodeOf(tools, id)
  if (node === null) return []
  if (!(node.outputs ?? []).some((pin) => pin.label === label)) return []
  const trimmed = text.trim()
  if (trimmed === '') {
    if (node.values !== undefined) {
      delete node.values[label]
      if (Object.keys(node.values).length === 0) delete node.values
    }
    return [{ type: 'save' }, { type: 'render' }]
  }
  let serialized: string
  try {
    serialized = JSON.stringify(JSON.parse(trimmed) as unknown) ?? 'null'
  } catch {
    serialized = JSON.stringify(trimmed)
  }
  node.values = { ...(node.values ?? {}), [label]: serialized.length <= MAX_VALUE_CHARS ? serialized : serialized.slice(0, MAX_VALUE_CHARS - 1) + '…' }
  return [{ type: 'save' }, { type: 'render' }]
}

/**
 * Turn a stored value into the text an editor shows.
 * @param serialized - stored JSON text.
 * @returns the display text, or an empty string when there is no value.
 */
export function displayRunValue(serialized: string | undefined): string {
  if (serialized === undefined) return ''
  try {
    const parsed = JSON.parse(serialized) as unknown
    return typeof parsed === 'string' ? parsed : (JSON.stringify(parsed) ?? '')
  } catch {
    return serialized
  }
}
