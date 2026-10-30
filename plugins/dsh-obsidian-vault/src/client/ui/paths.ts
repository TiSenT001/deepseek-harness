/**
 * Small path helpers for the vault workspace page.
 * @module dsh-obsidian-vault/client/ui/paths
 */
import type { TreeNodeDto } from '../../protocol.ts'

/**
 * Display name for the vault switcher: the root's basename.
 * @param root - vault root path, or undefined before status loads.
 */
export function vaultNameOf(root: string | undefined): string | undefined {
  if (root === undefined) return undefined
  const trimmed = root.replace(/[\\/]+$/, '')
  if (trimmed.length === 0) return undefined
  const index = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'))
  return index === -1 ? trimmed : trimmed.slice(index + 1)
}

/**
 * Every folder path in the tree plus the vault root.
 * @param nodes - tree level to walk.
 * @param prefix - the path the level roots at; `''` for the vault root.
 */
export function folderPaths(nodes: readonly TreeNodeDto[], prefix = ''): string[] {
  const out: string[] = [prefix]
  for (const node of nodes) {
    if (node.kind !== 'dir') continue
    out.push(...folderPaths(node.children ?? [], node.path))
  }
  return out
}
