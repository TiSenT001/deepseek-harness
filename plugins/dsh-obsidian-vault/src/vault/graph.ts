/**
 * Link-graph assembly: expand the note adjacency with synthetic nodes
 * (unresolved links, attachments, tags), then take a centered BFS or a ranked
 * global slice.
 * @module dsh-obsidian-vault/vault/graph
 */
import type { GraphDto, GraphEdgeDto, GraphNodeDto } from '../protocol.ts'
import { matchesQuery, parseQuery } from './query.ts'

/** Options for {@link buildGraph}. */
export interface GraphFilter {
  /** Search text; supports the same operators as note search. */
  readonly query?: string
  /** Keep only nodes carrying this tag. */
  readonly tag?: string
  /** Include links whose target note does not exist. Defaults to true. */
  readonly includeUnresolved?: boolean
  /** Include embedded attachments. Defaults to true. */
  readonly includeAttachments?: boolean
  /** Render tags as nodes. Defaults to false. */
  readonly includeTags?: boolean
}

/** What graph assembly needs from the index. */
export interface GraphInput {
  readonly notes: ReadonlyMap<string, { readonly title: string; readonly tags: readonly string[] }>
  readonly adjacency: ReadonlyMap<string, ReadonlySet<string>>
  readonly linksByNote: ReadonlyMap<string, readonly { readonly target: string; readonly status: string }[]>
  readonly attachments: ReadonlySet<string>
}

/** Request parameters. */
export interface GraphRequest {
  readonly center?: string
  readonly depth: number
  readonly limit: number
  readonly filter: GraphFilter
}

/**
 * Build one graph.
 * @param input - index state the graph is derived from.
 * @param request - center, depth, cap, and filters.
 */
export function buildGraph(input: GraphInput, request: GraphRequest): GraphDto {
  const { filter } = request
  const expanded = expandedGraph(input, {
    includeUnresolved: filter.includeUnresolved !== false,
    includeAttachments: filter.includeAttachments !== false,
    includeTags: filter.includeTags === true,
  })
  const query = (filter.query ?? '').trim()
  const parsed = parseQuery(query)
  const matches = query.length === 0
    ? (): boolean => true
    : (node: GraphNodeDto): boolean => matchesQuery(parsed, {
      path: node.path,
      title: node.title,
      content: '',
      tags: node.tags ?? [],
    })
  const tag = filter.tag
  const allowed = (node: GraphNodeDto): boolean => {
    if (node.path === request.center) return true
    if (tag !== undefined && tag.length > 0) {
      if (node.kind === 'tag') {
        if (node.tags?.[0] !== tag) return false
      } else if (!(node.tags ?? []).includes(tag)) {
        return false
      }
    }
    return matches(node)
  }
  const edges = [...expanded.adjacency].flatMap(([source, targets]) =>
    [...targets].map(target => ({ source, target })))
  const included = new Set<string>()

  if (request.center !== undefined && expanded.nodes.has(request.center)) {
    included.add(request.center)
    let frontier = [request.center]
    for (let hop = 1; hop <= request.depth; hop += 1) {
      const next: string[] = []
      for (const path of frontier) {
        for (const neighbor of expanded.adjacency.get(path) ?? []) {
          if (included.has(neighbor)) continue
          const node = expanded.nodes.get(neighbor)
          if (node === undefined || !allowed(node)) continue
          included.add(neighbor)
          next.push(neighbor)
        }
      }
      frontier = next
    }
  } else {
    const ranked = [...expanded.nodes.values()]
      .filter(allowed)
      .sort((left, right) =>
        (expanded.adjacency.get(right.path)?.size ?? 0) - (expanded.adjacency.get(left.path)?.size ?? 0))
      .slice(0, request.limit)
    for (const node of ranked) included.add(node.path)
  }

  const nodes: GraphNodeDto[] = []
  for (const path of included) {
    const node = expanded.nodes.get(path)
    if (node === undefined) continue
    nodes.push({
      ...node,
      depth: path === request.center ? 0 : centeredDepth(path, request.center, expanded.adjacency),
    })
  }
  return { nodes, edges: edges.filter(edge => included.has(edge.source) && included.has(edge.target)) }
}

function expandedGraph(
  input: GraphInput,
  options: {
    readonly includeUnresolved: boolean
    readonly includeAttachments: boolean
    readonly includeTags: boolean
  },
): { nodes: Map<string, GraphNodeDto>; adjacency: Map<string, Set<string>> } {
  const nodes = new Map<string, GraphNodeDto>()
  const adjacency = new Map<string, Set<string>>()
  const addNode = (node: GraphNodeDto): void => {
    if (!nodes.has(node.path)) nodes.set(node.path, node)
  }
  const link = (left: string, right: string): void => {
    addEdge(adjacency, left, right)
    addEdge(adjacency, right, left)
  }

  for (const [path, entry] of input.notes) {
    addNode({ path, title: entry.title, depth: 0, kind: 'note', tags: entry.tags })
  }
  for (const [source, targets] of input.adjacency) {
    for (const target of targets) link(source, target)
  }

  if (options.includeUnresolved) {
    for (const [path, links] of input.linksByNote) {
      for (const linkDto of links) {
        if (linkDto.status === 'resolved' || linkDto.target.length === 0) continue
        const ghost = `unresolved:${linkDto.target}`
        addNode({ path: ghost, title: linkDto.target, depth: 0, kind: 'unresolved' })
        link(path, ghost)
      }
    }
  }

  // A canvas is an attachment that references notes through element fields, so it
  // never appears as a note link. Add any attachment that adjacency already
  // connects, or the graph would drop it.
  if (options.includeAttachments) {
    for (const [source, targets] of input.adjacency) {
      for (const target of targets) {
        for (const candidate of [source, target]) {
          if (!input.attachments.has(candidate)) continue
          addNode({
            path: candidate,
            title: candidate.slice(candidate.lastIndexOf('/') + 1),
            depth: 0,
            kind: 'attachment',
            tags: [],
          })
        }
      }
    }
  }
  if (options.includeAttachments && input.attachments.size > 0) {
    const byName = new Map<string, string>()
    for (const attachment of input.attachments) {
      byName.set(attachment.slice(attachment.lastIndexOf('/') + 1).toLowerCase(), attachment)
    }
    for (const [path, links] of input.linksByNote) {
      for (const linkDto of links) {
        const name = linkDto.target.toLowerCase()
        if (!/\.[a-z0-9]+$/.test(name)) continue
        const file = byName.get(name)
        if (file === undefined) continue
        const id = `attachment:${file}`
        addNode({ path: id, title: file.slice(file.lastIndexOf('/') + 1), depth: 0, kind: 'attachment' })
        link(path, id)
      }
    }
  }

  if (options.includeTags) {
    for (const [path, entry] of input.notes) {
      for (const tag of entry.tags) {
        const id = `tag:${tag}`
        addNode({ path: id, title: `#${tag}`, depth: 0, kind: 'tag', tags: [tag] })
        link(path, id)
      }
    }
  }

  return { nodes, adjacency }
}

function addEdge(adjacency: Map<string, Set<string>>, from: string, to: string): void {
  const set = adjacency.get(from)
  if (set === undefined) adjacency.set(from, new Set([to]))
  else set.add(to)
}

function centeredDepth(
  path: string,
  center: string | undefined,
  adjacency: ReadonlyMap<string, Set<string>>,
  cap = 3,
): number {
  if (center === undefined || path === center) return 0
  const seen = new Set<string>([center])
  let frontier = [center]
  for (let hop = 1; hop <= cap; hop += 1) {
    const next: string[] = []
    for (const current of frontier) {
      for (const neighbor of adjacency.get(current) ?? []) {
        if (seen.has(neighbor)) continue
        if (neighbor === path) return hop
        seen.add(neighbor)
        next.push(neighbor)
      }
    }
    frontier = next
  }
  return cap
}

/** Re-exported so callers can type edges without importing the protocol. */
export type { GraphEdgeDto }
