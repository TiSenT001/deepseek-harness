/**
 * Write paths: create an empty note and replace one note's text under the
 * modification-time guard.
 * @module dsh-obsidian-vault/vault/index-write
 */
import type { VaultFiles } from './files.ts'
import type { FsLike, FsTargetLike, SaveNoteResult, VaultOptions } from './index-types.ts'

const MARKDOWN = /\.md$/i

/** What the write paths need from the index. */
export interface WriteContext {
  /** Host filesystem service. */
  readonly fs: FsLike
  /** The vault file helper bound to the current root. */
  readonly files: VaultFiles
  /** Resolved tunables. */
  readonly options: VaultOptions
  /** Scanned root target. */
  readonly root: FsTargetLike | undefined
  /** Whether the path is indexed. @param path - vault-relative path. @returns true when indexed. */
  hasNote(path: string): boolean
  /** Rescan after a write. @returns completion. */
  refresh(): Promise<void>
}

/**
 * Create an empty note when it does not exist yet.
 * @param ctx - index state and services.
 * @param path - vault-relative path ending in `.md`.
 * @returns true when the file now exists.
 */
export async function createNote(ctx: WriteContext, path: string): Promise<boolean> {
  if (ctx.hasNote(path)) return true
  if (!path.toLowerCase().endsWith('.md')) return false
  if (ctx.root !== undefined) {
    const separator = ctx.root.displayPath.endsWith('\\') ? '\\' : '/'
    try {
      const target = await ctx.fs.resolve(`${ctx.root.displayPath}${separator}${path.replace(/\//g, separator)}`)
      await ctx.fs.writeText(target, '', { kind: 'createIfAbsent' })
      await ctx.refresh()
      return true
    } catch {
      // The sandboxed filesystem refuses writes outside the workspace; the
      // vault is user data, so fall through to a direct, confined write.
    }
  }
  try {
    await ctx.files.writeNew(path, '')
    await ctx.refresh()
    return true
  } catch {
    return false
  }
}

/**
 * Replace one indexed note's text, refusing a write when the file changed on
 * disk since the caller read it.
 * @param ctx - index state and services.
 * @param path - vault-relative path.
 * @param content - complete new file text.
 * @param baseMtime - modification time the caller started from; omit to overwrite unconditionally.
 * @returns the fresh modification time, or the rejection the route reports.
 */
export async function saveNoteTo(
  ctx: WriteContext,
  path: string,
  content: string,
  baseMtime?: number,
): Promise<SaveNoteResult> {
  if (!MARKDOWN.test(path)) return { ok: false, status: 400, error: 'not a markdown note' }
  if (!ctx.hasNote(path)) return { ok: false, status: 404, error: 'note not found' }
  if (Buffer.byteLength(content, 'utf8') > ctx.options.maxFileBytes) {
    return { ok: false, status: 400, error: 'note exceeds the configured size limit' }
  }
  if (baseMtime !== undefined) {
    const current = await ctx.files.mtimeOf(path)
    // File timestamps pass through JSON as floats; a sub-millisecond drift is
    // not an edit, so compare at millisecond resolution.
    if (current !== undefined && Math.round(current) !== Math.round(baseMtime)) {
      return { ok: false, status: 409, error: 'note changed on disk', mtime: current }
    }
  }
  await ctx.files.writeText(path, content)
  const mtime = await ctx.files.mtimeOf(path)
  await ctx.refresh()
  return { ok: true, path, mtime: mtime ?? Date.now() }
}
