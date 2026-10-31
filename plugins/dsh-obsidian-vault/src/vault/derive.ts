/**
 * Derived indexes for one parsed note set: link resolution, per-note links,
 * backlinks, tag counts, and the undirected adjacency the graph walks.
 * @module dsh-obsidian-vault/vault/derive
 */
import type { BacklinkDto, NoteLinkDto } from '../protocol.ts'
import type { NoteEntry } from './entry.ts'
import type { CanvasReference } from './canvas-refs.ts'
import { LinkResolver, type NoteIdentity } from './resolver.ts'

/** Indexes rebuilt after every successful scan. */
export interface DerivedIndex {
  readonly resolver: LinkResolver
  readonly linkIndex: ReadonlyMap<string, readonly NoteLinkDto[]>
  readonly backlinks: ReadonlyMap<string, BacklinkDto[]>
  readonly tagCounts: ReadonlyMap<string, number>
  readonly adjacency: ReadonlyMap<string, Set<string>>
}

/**
 * Resolve every note's links and collect the derived indexes.
 * @param notes - vault-relative path to its parsed entry.
 * @param attachments - vault-relative paths of non-note files, so `![[img.png]]` resolves.
 * @returns the indexes; a link that resolves to itself or an attachment adds no backlink or edge.
 */
export function deriveIndex(
  notes: ReadonlyMap<string, NoteEntry>,
  attachments: ReadonlySet<string>,
  canvasRefs: ReadonlyMap<string, readonly CanvasReference[]> = new Map(),
): DerivedIndex {
  const identities: NoteIdentity[] = []
  for (const [path, entry] of notes) {
    identities.push({ path, title: entry.title, aliases: entry.aliases })
  }
  for (const path of attachments) {
    identities.push({ path, title: path.slice(path.lastIndexOf('/') + 1), aliases: [] })
  }
  const resolver = new LinkResolver(identities)
  const linkIndex = new Map<string, NoteLinkDto[]>()
  const backlinks = new Map<string, BacklinkDto[]>()
  const tags = new Map<string, number>()
  const adjacency = new Map<string, Set<string>>()
  for (const [path, entry] of notes) {
    const links: NoteLinkDto[] = []
    for (const token of entry.links) {
      const resolution = resolver.resolve(token.target, path)
      links.push({
        raw: token.raw,
        target: token.target,
        ...(token.alias === undefined ? {} : { alias: token.alias }),
        ...(token.anchor === undefined ? {} : { anchor: token.anchor }),
        ...(token.block === undefined ? {} : { block: token.block }),
        embed: token.embed,
        line: token.line,
        status: resolution.status,
        ...(resolution.path === undefined ? {} : { path: resolution.path }),
        ...(resolution.candidates === undefined ? {} : { candidates: resolution.candidates }),
      })
      if (resolution.status !== 'resolved' || resolution.path === undefined) continue
      if (resolution.path === path || attachments.has(resolution.path)) continue
      const context = (entry.lines[token.line - 1] ?? '').trim()
      const list = backlinks.get(resolution.path)
      const item: BacklinkDto = { path, title: entry.title, line: token.line, context }
      if (list === undefined) backlinks.set(resolution.path, [item])
      else list.push(item)
      connect(adjacency, path, resolution.path)
    }
    linkIndex.set(path, links)
    for (const tag of entry.tags) tags.set(tag, (tags.get(tag) ?? 0) + 1)
  }
  // A canvas links to notes through element fields, not markdown syntax, so its
  // references are merged into the backlink index here.
  for (const [canvasPath, references] of canvasRefs) {
    const title = canvasPath.slice(canvasPath.lastIndexOf('/') + 1).replace(/\.PurStudio$/i, '')
    for (const reference of references) {
      const resolution = resolver.resolve(reference.target, canvasPath)
      const target = resolution.path
      if (target === undefined || target === canvasPath) continue
      if (!notes.has(target)) continue
      const list = backlinks.get(target)
      const item: BacklinkDto = { path: canvasPath, title, line: reference.ordinal, context: '画布引用', source: 'canvas' }
      if (list === undefined) backlinks.set(target, [item])
      else list.push(item)
      connect(adjacency, canvasPath, target)
    }
  }
  return { resolver, linkIndex, backlinks, tagCounts: tags, adjacency }
}

function connect(adjacency: Map<string, Set<string>>, left: string, right: string): void {
  add(adjacency, left, right)
  add(adjacency, right, left)
}

function add(adjacency: Map<string, Set<string>>, from: string, to: string): void {
  const set = adjacency.get(from)
  if (set === undefined) adjacency.set(from, new Set([to]))
  else set.add(to)
}
