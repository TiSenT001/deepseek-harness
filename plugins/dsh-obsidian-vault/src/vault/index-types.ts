/**
 * Structural contracts the vault index consumes and returns: the Host
 * filesystem views it is handed, its tunables, and the save outcome the route
 * reports.
 * @module dsh-obsidian-vault/vault/index-types
 */

/** Structural view of the Host filesystem service this index consumes. */
export interface FsTargetLike {
  readonly targetKey: string
  readonly displayPath: string
}

/** Structural view of one directory entry. */
export interface FsEntryLike {
  readonly name: string
  readonly type: 'file' | 'directory' | 'other'
  readonly target: FsTargetLike
  readonly version?: unknown
  readonly size?: number
}

/** The filesystem operations the index needs. */
export interface FsLike {
  resolve(path: string, opts?: { readonly signal?: AbortSignal }): Promise<FsTargetLike>
  listDir(target: FsTargetLike, signal?: AbortSignal): Promise<readonly FsEntryLike[]>
  readText(target: FsTargetLike, signal?: AbortSignal): Promise<string>
  writeText(
    target: FsTargetLike,
    content: string,
    expected?: { readonly kind: 'createIfAbsent' },
    signal?: AbortSignal,
  ): Promise<unknown>
  readBytes?(target: FsTargetLike, signal: AbortSignal | undefined, maxBytes: number): Promise<Uint8Array>
  contains?(parent: FsTargetLike, child: FsTargetLike): boolean
  watch?(
    target: FsTargetLike,
    changed: (error?: Error) => void,
    signal: AbortSignal,
  ): Promise<() => Promise<void>>
}

/** Tunables the plugin configuration supplies. */
export interface VaultOptions {
  readonly root: string
  readonly ignore: readonly string[]
  readonly maxFileBytes: number
  readonly maxIndexBytes: number
  readonly maxDepth: number
}

/**
 * Outcome of one note save. Rejections carry the HTTP status the route reports
 * so the browser can tell a stale editor (409) from a missing or invalid note.
 */
export type SaveNoteResult =
  | { readonly ok: true; readonly path: string; readonly mtime: number }
  | {
    readonly ok: false
    readonly status: 400 | 404 | 409
    readonly error: string
    /** Current modification time, present on a conflict. */
    readonly mtime?: number
  }
