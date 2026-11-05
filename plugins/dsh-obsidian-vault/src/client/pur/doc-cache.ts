/**
 * Small cache of parsed canvas documents, keyed by path and validated by the
 * file's own size and modification time. Reopening a tab otherwise re-reads and
 * re-parses a document that can be ten megabytes.
 * @module dsh-obsidian-vault/client/pur/doc-cache
 */

/** File metadata a cached document is validated against. */
export interface DocumentStamp {
  /** Size in bytes. */
  readonly size: number
  /** Modification time in epoch milliseconds. */
  readonly mtime: number
}

/** One cached entry. */
interface Entry<T> {
  readonly stamp: DocumentStamp
  readonly document: T
}

/** How many documents the cache keeps before dropping the oldest. */
export const DOCUMENT_CACHE_LIMIT = 3

/**
 * Bounded path → document cache that only answers when the stamp still matches.
 */
export class DocumentCache<T> {
  private readonly entries = new Map<string, Entry<T>>()
  private readonly limit: number

  /**
   * @param limit - how many documents to keep.
   */
  constructor(limit: number = DOCUMENT_CACHE_LIMIT) {
    this.limit = limit
  }

  /**
   * The cached document for one path, when the file has not changed.
   * @param path - vault-relative path.
   * @param stamp - current file metadata from the host.
   * @returns the document, or undefined on a miss or a changed file.
   */
  get(path: string, stamp: DocumentStamp): T | undefined {
    const entry = this.entries.get(path)
    if (entry === undefined) return undefined
    // The modification time is the identity of a version; a size that disagrees
    // means the file was rewritten in the same millisecond, so both are checked.
    if (entry.stamp.mtime !== stamp.mtime) {
      this.entries.delete(path)
      return undefined
    }
    // Refresh recency: re-inserting moves the entry to the end of the map.
    this.entries.delete(path)
    this.entries.set(path, entry)
    return entry.document
  }

  /**
   * The version stamped on the cached entry, when one is held.
   * @param path - vault-relative path.
   * @returns the modification time, or undefined when the path is not cached.
   */
  mtimeOf(path: string): number | undefined {
    return this.entries.get(path)?.stamp.mtime
  }

  /**
   * Remember one parsed document.
   * @param path - vault-relative path.
   * @param stamp - the metadata it was read at.
   * @param document - the parsed document.
   */
  set(path: string, stamp: DocumentStamp, document: T): void {
    this.entries.delete(path)
    this.entries.set(path, { stamp, document })
    while (this.entries.size > this.limit) {
      const oldest = this.entries.keys().next()
      if (oldest.done === true) return
      this.entries.delete(oldest.value)
    }
  }

  /**
   * Forget one path, after this client wrote it.
   * @param path - vault-relative path.
   */
  delete(path: string): void {
    this.entries.delete(path)
  }

  /** Drop everything. */
  clear(): void {
    this.entries.clear()
  }

  /** @returns how many documents are held. */
  get size(): number {
    return this.entries.size
  }
}
