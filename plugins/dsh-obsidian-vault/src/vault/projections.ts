/**
 * Read-only projections over indexed state: the status report, the explorer
 * tree and the tag counts. Pure functions so the index class only forwards.
 * @module dsh-obsidian-vault/vault/projections
 */
import type { StatusDto, TagCountDto, TreeNodeDto } from '../protocol.ts'
import type { NoteEntry } from './entry.ts'
import { buildTree, type TreeFileMeta } from './tree.ts'

/** Inputs the status report needs. */
export interface StatusInput {
  /** Whether the index holds at least one note. */
  readonly ready: boolean
  /** Absolute vault root. */
  readonly root: string
  /** Indexed note count. */
  readonly notes: number
  /** Current revision. */
  readonly version: number
  /** Last scan failure, when one is outstanding. */
  readonly failure: string | undefined
}

/**
 * Build the status report the page shell renders.
 * @param input - the current snapshot fields.
 * @returns the status DTO.
 */
export function statusOf(input: StatusInput): StatusDto {
  return {
    ready: input.ready,
    root: input.root,
    notes: input.notes,
    version: input.version,
    ...(input.failure === undefined ? {} : { error: input.failure }),
  }
}

/** Inputs the explorer tree needs. */
export interface TreeInput {
  /** Indexed notes. */
  readonly notes: ReadonlyMap<string, NoteEntry>
  /** Indexed attachment paths. */
  readonly attachments: ReadonlySet<string>
  /** Attachment metadata, by path. */
  readonly attachmentMeta: ReadonlyMap<string, { readonly size?: number }>
  /** Every scanned directory path. */
  readonly dirPaths: readonly string[]
}

/**
 * Build the explorer tree over notes, attachments and scanned directories.
 * @param input - the indexed collections.
 * @returns the tree nodes.
 */
export function treeOf(input: TreeInput): readonly TreeNodeDto[] {
  const files: Array<readonly [string, TreeFileMeta]> = [...input.notes].map(([path, entry]) => [
    path,
    entry.mtime === undefined ? { size: entry.size } : { size: entry.size, mtime: entry.mtime },
  ] as const)
  for (const path of input.attachments) files.push([path, input.attachmentMeta.get(path) ?? {}] as const)
  return buildTree(files, input.dirPaths)
}

/**
 * Tags with note counts, most frequent first.
 * @param tagCounts - tag to note count.
 * @returns the sorted tag counts.
 */
export function tagsOf(tagCounts: ReadonlyMap<string, number>): readonly TagCountDto[] {
  return [...tagCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((left, right) => right.count - left.count || left.tag.localeCompare(right.tag))
}
