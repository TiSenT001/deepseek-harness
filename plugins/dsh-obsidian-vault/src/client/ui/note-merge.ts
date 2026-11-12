/**
 * Pure helpers for Note composer-style merging: flatten the explorer tree into
 * Markdown paths and append one note body under a heading in another.
 * @module dsh-obsidian-vault/client/ui/note-merge
 */
import type { TreeNodeDto } from '../../protocol.ts'

/** One note body merged under a heading. */
export interface MergeSource {
  /** Display title used for the section heading. */
  readonly title: string
  /** Raw Markdown body. */
  readonly content: string
}

/**
 * Append a source note to the target body under a level-two heading.
 * @param target - current note body.
 * @param source - note being merged in.
 * @returns the merged body with a trailing newline.
 */
export function mergeNoteBodies(target: string, source: MergeSource): string {
  const heading = source.title.trim() || 'Merged note'
  const body = source.content.trim()
  const head = target.trim()
  const section = body.length === 0 ? `## ${heading}` : `## ${heading}\n\n${body}`
  return head.length === 0 ? `${section}\n` : `${head}\n\n${section}\n`
}

/**
 * Every Markdown file in the explorer tree, excluding one path.
 * @param nodes - explorer roots.
 * @param exclude - path to omit, usually the target note.
 * @returns sorted vault-relative paths.
 */
export function markdownPaths(nodes: readonly TreeNodeDto[], exclude: string): string[] {
  const out: string[] = []
  const walk = (list: readonly TreeNodeDto[]): void => {
    for (const node of list) {
      if (node.kind === 'file' && node.path.toLowerCase().endsWith('.md') && node.path !== exclude) out.push(node.path)
      if (node.children !== undefined) walk(node.children)
    }
  }
  walk(nodes)
  return out.sort((left, right) => left.localeCompare(right))
}
