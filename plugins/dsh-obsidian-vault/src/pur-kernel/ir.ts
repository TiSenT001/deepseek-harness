/**
 * Turn a UAsset IR graph document into canvas groups: nodes become text cards
 * with pins, links become lines, one group per graph laid out side by side.
 * @module dsh-obsidian-vault/pur-kernel/ir
 */
import { PurDocumentError } from './errors.ts'
import { asRecord, numberOr, stringOr } from './guards.ts'
import type { PurElement, PurGroupElement, PurNodeElement, PurPin } from './types.ts'

/** Canvas width reserved for one graph column. */
const COLUMN_WIDTH = 1400

/** Width of every imported node card. */
const CARD_WIDTH = 300

/** Horizontal step between imported nodes when the IR declares no position. */
const CARD_STEP_X = 320

/** Adapter hooks {@link irToElements} needs to stay deterministic. */
export interface PurIrOptions {
  /** Allocate an element id. */
  createId: () => string
  /**
   * Compose the group label shown on the canvas.
   * @param name - graph name.
   * @param nodeCount - imported node count.
   * @param linkCount - imported line count.
   * @returns the label text.
   */
  formatLabel?: (name: string, nodeCount: number, linkCount: number) => string
}

/** Default English group label when the adapter supplies none. */
function defaultLabel(name: string, nodeCount: number, linkCount: number): string {
  return `📦 ${name} (${nodeCount} nodes, ${linkCount} links)`
}

/**
 * Convert an IR document into canvas groups.
 * @param ir - parsed IR text, of unknown provenance.
 * @param baseX - world x of the first graph column.
 * @param baseY - world y of the first graph row.
 * @param options - adapter hooks.
 * @returns one group per non-empty graph, or null when the document has none.
 * @throws {PurDocumentError} when the document is not an IR object.
 */
export function irToElements(ir: unknown, baseX: number, baseY: number, options: PurIrOptions): PurGroupElement[] | null {
  const root = asRecord(ir)
  if (root === undefined) throw new PurDocumentError('IR document is not an object')
  const formatLabel = options.formatLabel ?? defaultLabel

  const source = stringOr(root['source'], '').toLowerCase()
  const isMaterial = source.includes('material')
  const bgColor = isMaterial ? 'rgba(20,50,40,0.92)' : 'rgba(20,40,60,0.92)'
  const textColor = isMaterial ? '#c8ffe0' : '#c8e0ff'

  const graphs = graphsOf(root)
  if (!graphs.length) return null

  const groups: PurGroupElement[] = []
  let rowY = baseY
  graphs.forEach((graph, graphIndex) => {
    const irNodes = recordsOf(graph['nodes'])
    const irLinks = recordsOf(graph['links'])
    if (!irNodes.length) return

    const cards: PurNodeElement[] = []
    const idMap = new Map<string, string>()
    irNodes.forEach((node, nodeIndex) => {
      const inputs: PurPin[] = []
      const outputs: PurPin[] = []
      for (const pin of recordsOf(node['pins'])) {
        const definition = { id: stringOr(pin['name'], ''), label: stringOr(pin['display_name'], '') || stringOr(pin['label'], '') || stringOr(pin['name'], '') }
        const direction = pin['direction']
        if (direction === 'input') inputs.push(definition)
        else if (direction === 'output') outputs.push(definition)
      }

      const title = stringOr(node['title'], '') || stringOr(node['type'], '') || 'Node'
      let content = `// ${stringOr(node['type'], '')}`
      const fn = stringOr(node['function'], '')
      const event = stringOr(node['event'], '')
      if (fn !== '') content = `// ${fn}`
      if (event !== '') content = `// event: ${event}`

      const pinRows = Math.max(inputs.length, outputs.length, 1)
      const id = options.createId()
      idMap.set(stringOr(node['id'], ''), id)
      cards.push({
        id,
        type: 'text',
        title,
        content,
        inputs,
        outputs,
        x: numberOr(node['x'], nodeIndex * CARD_STEP_X + 20),
        y: Math.max(48, numberOr(node['y'], 48)),
        w: CARD_WIDTH,
        h: Math.max(90, 60 + pinRows * 28),
        bgColor,
        color: textColor,
        fontSize: 14,
        rotation: 0,
        opacity: 1,
      })
    })

    const lines: PurElement[] = []
    for (const link of irLinks) {
      const from = stringOr(link['from'], '')
      const to = stringOr(link['to'], '')
      const fromSplit = from.lastIndexOf('.')
      const toSplit = to.lastIndexOf('.')
      if (fromSplit < 0 || toSplit < 0) continue
      const fromNode = idMap.get(from.substring(0, fromSplit))
      const toNode = idMap.get(to.substring(0, toSplit))
      if (fromNode === undefined || toNode === undefined) continue
      lines.push({ id: options.createId(), type: 'line', from: fromNode, fromPin: from.substring(fromSplit + 1), to: toNode, toPin: to.substring(toSplit + 1), content: '' })
    }

    const maxX = Math.max(...cards.map((card) => card.x + card.w), 400)
    const maxY = Math.max(...cards.map((card) => card.y + card.h), 150)

    groups.push({
      id: options.createId(),
      type: 'group',
      x: baseX + (graphIndex % 2) * COLUMN_WIDTH,
      y: rowY,
      w: Math.min(maxX + 40, COLUMN_WIDTH - 40),
      h: maxY + 40,
      content: formatLabel(stringOr(graph['name'], '') || `Pipeline ${graphIndex + 1}`, cards.length, lines.length),
      children: [...cards, ...lines],
      rotation: 0,
      opacity: 1,
    })

    if (graphIndex % 2 === 1) rowY += maxY + 70
  })

  return groups
}

/**
 * Read the graph list, falling back to a single implicit graph.
 * @param root - IR root mapping.
 * @returns the graph mappings.
 */
function graphsOf(root: Record<string, unknown>): Record<string, unknown>[] {
  const declared = root['graphs']
  if (Array.isArray(declared)) return recordsOf(declared)
  const nodes = recordsOf(root['nodes'])
  if (nodes.length === 0) return []
  return [{ name: stringOr(root['source'], '') || 'Graph', nodes, links: root['links'] }]
}

/**
 * Read an array of mappings, dropping non-object entries.
 * @param value - raw value.
 * @returns the mappings.
 */
function recordsOf(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  const records: Record<string, unknown>[] = []
  for (const item of value) {
    const record = asRecord(item)
    if (record !== undefined) records.push(record)
  }
  return records
}
