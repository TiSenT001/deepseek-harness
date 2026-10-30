/**
 * Entry lifecycle operations: rename, trash, move and folder creation. Each
 * mutates the vault through {@link VaultFiles} and rescans afterwards.
 * @module dsh-obsidian-vault/vault/index-ops
 */
import type { BacklinkDto } from '../protocol.ts'
import type { NoteEntry } from './entry.ts'
import type { VaultFiles } from './files.ts'
import { moveEntry, type MoveOutcome } from './move.ts'
import type { LinkResolver } from './resolver.ts'

/** What the entry operations need from the index. */
export interface OpsContext {
  /** The vault file helper bound to the current root. */
  readonly files: VaultFiles
  /** Indexed notes. */
  readonly notes: Map<string, NoteEntry>
  /** Backlink index, rewritten by moves. */
  readonly backlinks: Map<string, BacklinkDto[]>
  /** Link resolver, rewritten by moves. */
  readonly resolver: LinkResolver | undefined
  /** Rescan after the operation. @returns completion. */
  refresh(): Promise<void>
}

/**
 * Rename one entry in place, rewriting links like a same-folder move so
 * existing `[[links]]` keep resolving. Conflicts reject instead of overwriting
 * the target.
 * @param ctx - index state and services.
 * @param path - vault-relative path.
 * @param name - new file name (no separators).
 */
export async function renameEntry(ctx: OpsContext, path: string, name: string): Promise<void> {
  const trimmed = name.trim()
  if (trimmed.length === 0 || trimmed === '.' || trimmed === '..'
    || trimmed.includes('/') || trimmed.includes('\\')) {
    throw new Error(`invalid name: ${name}`)
  }
  const slash = path.lastIndexOf('/')
  const to = slash === -1 ? trimmed : `${path.slice(0, slash)}/${trimmed}`
  if (to === path) return
  await moveEntryTo(ctx, path, to)
}

/**
 * Move one entry to `.trash`, then rescan.
 * @param ctx - index state and services.
 * @param path - vault-relative path.
 * @returns the trash path.
 */
export async function removeEntry(ctx: OpsContext, path: string): Promise<string> {
  const trashed = await ctx.files.moveToTrash(path)
  await ctx.refresh()
  return trashed
}

/**
 * Move a note or folder, rewriting links that pointed at the old path. A folder
 * move rewrites links to every descendant note as well.
 * @param ctx - index state and services.
 * @param from - current vault-relative path.
 * @param to - destination vault-relative path.
 * @returns the moved path, rewritten notes, and the trash backup.
 */
export async function moveEntryTo(ctx: OpsContext, from: string, to: string): Promise<MoveOutcome> {
  const outcome = await moveEntry({
    files: ctx.files,
    notes: ctx.notes,
    backlinks: ctx.backlinks,
    resolver: ctx.resolver,
  }, from, to)
  await ctx.refresh()
  return outcome
}

/**
 * Create a folder, then rescan.
 * @param ctx - index state and services.
 * @param path - vault-relative folder path.
 */
export async function makeFolderIn(ctx: OpsContext, path: string): Promise<void> {
  await ctx.files.mkdir(path)
  await ctx.refresh()
}
