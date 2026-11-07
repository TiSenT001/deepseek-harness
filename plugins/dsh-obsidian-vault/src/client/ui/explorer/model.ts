/**
 * Pure tree helpers for the explorer: ordering, query filtering, flattening,
 * path collection, and folder derivation. No React state lives here.
 * @module dsh-obsidian-vault/client/ui/explorer/model
 */
import type { TreeNodeDto } from '../../../protocol.ts'

/** One visible tree row. */
export interface Row {
  readonly node: TreeNodeDto
  readonly depth: number
}

/** Folders first, then names, recursively. */
export function sorted(nodes: readonly TreeNodeDto[]): readonly TreeNodeDto[] {
  const ordered = [...nodes].sort((left, right) => {
    if (left.kind !== right.kind) return left.kind === 'dir' ? -1 : 1
    return left.name.localeCompare(right.name, 'zh')
  })
  return ordered.map(node => node.children === undefined ? node : { ...node, children: sorted(node.children) })
}

/**
 * Keep the notes and folders whose name or path contains the query, along
 * with the folders that contain a match.
 * @param nodes - ordered tree.
 * @param query - case-insensitive substring; empty keeps everything.
 */
export function filterTree(nodes: readonly TreeNodeDto[], query: string): readonly TreeNodeDto[] {
  const needle = query.trim().toLowerCase()
  if (needle.length === 0) return nodes
  const keep: TreeNodeDto[] = []
  for (const node of nodes) {
    const label = node.kind === 'dir' ? node.name : node.name.replace(/\.md$/i, '')
    const hit = node.path.toLowerCase().includes(needle) || label.toLowerCase().includes(needle)
    const children = node.children === undefined ? undefined : filterTree(node.children, needle)
    const hasChildren = children !== undefined && children.length > 0
    if (!hit && !hasChildren) continue
    keep.push(children === undefined ? node : { ...node, children })
  }
  return keep
}

/** Flatten visible nodes, descending only into expanded folders. */
export function flatten(
  nodes: readonly TreeNodeDto[],
  depth: number,
  expanded: ReadonlySet<string>,
  out: Row[],
): void {
  for (const node of nodes) {
    out.push({ node, depth })
    if (node.kind === 'dir' && expanded.has(node.path) && node.children !== undefined) {
      flatten(node.children, depth + 1, expanded, out)
    }
  }
}

/**
 * Keep notes and the folders that still contain one, dropping attachments and
 * every folder left empty. Backs the explorer's "notes only" switch.
 * @param nodes - ordered tree.
 * @returns the pruned tree.
 */
export function pruneToNotes(nodes: readonly TreeNodeDto[]): readonly TreeNodeDto[] {
  const kept: TreeNodeDto[] = []
  for (const node of nodes) {
    if (node.kind === 'dir') {
      const children = node.children === undefined ? undefined : pruneToNotes(node.children)
      if (children !== undefined && children.length > 0) kept.push({ ...node, children })
      continue
    }
    if (/\.md$/i.test(node.name)) kept.push(node)
  }
  return kept
}

/** Collect every path in the tree into `out`. */
export function collectPaths(nodes: readonly TreeNodeDto[], out: Set<string>): void {
  for (const node of nodes) {
    out.add(node.path)
    if (node.children !== undefined) collectPaths(node.children, out)
  }
}

/** The containing folder of a vault path; `''` is the root. */
export function folderOf(path: string | undefined): string {
  if (path === undefined) return ''
  const slash = path.lastIndexOf('/')
  return slash === -1 ? '' : path.slice(0, slash)
}
