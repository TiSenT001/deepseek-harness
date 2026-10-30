/**
 * Explorer tree assembly: turn a flat path set into nested nodes, directories
 * first and names sorted with Chinese collation.
 * @module dsh-obsidian-vault/vault/tree
 */
import type { TreeNodeDto } from '../protocol.ts'

/** Per-file metadata the tree exposes. */
export interface TreeFileMeta {
  readonly mtime?: number
  readonly size?: number
}

interface MutableNode {
  readonly name: string
  readonly path: string
  readonly kind: 'dir' | 'file'
  readonly children: Map<string, MutableNode>
  readonly mtime?: number
  readonly size?: number
}

function insert(root: MutableNode, path: string, meta?: TreeFileMeta, dir = false): void {
  const parts = path.split('/')
  let node = root
  for (let index = 0; index < parts.length; index += 1) {
    const name = parts[index]!
    const childPath = parts.slice(0, index + 1).join('/')
    const file = index === parts.length - 1 && !dir
    let child = node.children.get(name)
    if (child === undefined) {
      child = {
        name,
        path: childPath,
        kind: file ? 'file' : 'dir',
        children: new Map(),
        ...(file && meta?.mtime !== undefined ? { mtime: meta.mtime } : {}),
        ...(file && meta?.size !== undefined ? { size: meta.size } : {}),
      }
      node.children.set(name, child)
    }
    node = child
  }
}

function finish(node: MutableNode): TreeNodeDto {
  const children = [...node.children.values()]
    .sort((left, right) => {
      if (left.kind !== right.kind) return left.kind === 'dir' ? -1 : 1
      return left.name.localeCompare(right.name, 'zh')
    })
    .map(child => finish(child))
  return {
    name: node.name,
    path: node.path,
    kind: node.kind,
    ...(node.mtime === undefined ? {} : { mtime: node.mtime }),
    ...(node.size === undefined ? {} : { size: node.size }),
    ...(children.length === 0 ? {} : { children }),
  }
}

/**
 * Last segment of a vault-relative path.
 * @param path - path with `/` separators.
 */
export function baseName(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1)
}

/**
 * Build the nested explorer tree.
 * @param files - vault-relative path to its metadata.
 * @param dirs - vault-relative directories, including empty ones no file mentions.
 * @returns the root level nodes.
 */
export function buildTree(
  files: Iterable<readonly [string, TreeFileMeta]>,
  dirs: Iterable<string> = [],
): readonly TreeNodeDto[] {
  const root: MutableNode = { name: '', path: '', kind: 'dir', children: new Map() }
  for (const path of dirs) insert(root, path, undefined, true)
  for (const [path, meta] of files) insert(root, path, meta)
  return finish(root).children ?? []
}
