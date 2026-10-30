/**
 * The frame's `app.metadataCache`. Path resolution answers synchronously from
 * the prefetched file cache. Per-file caches are synchronous in Obsidian but
 * cross the bridge asynchronously here, so the first read warms a background
 * fetch and answers Obsidian's "not indexed" state; later reads answer from the
 * warm entry.
 * @module dsh-obsidian-vault/shim/metadata
 */
import { TFile, type TAbstractFile } from './files.ts'
import { normalizePath } from './normalize.ts'
import type { BridgeTransport } from './transport.ts'
import type { ShimVault } from './vault.ts'

/** One cached tag entry, matching Obsidian's `TagCache` subset plugins read. */
export interface ShimTagCache {
  /** The tag including its `#` prefix. */
  readonly tag: string
}

/** The per-file cache subset served by the bridge. */
export interface ShimFileCache {
  readonly tags: readonly ShimTagCache[]
}

/** Obsidian's metadataCache facade. */
export class ShimMetadataCache {
  private readonly vault: ShimVault
  private readonly transport: BridgeTransport
  private readonly fileCaches = new Map<string, ShimFileCache | null>()
  private readonly loading = new Set<string>()

  /**
   * @param vault - the shim vault, for the file cache.
   * @param transport - the frame's bridge client, for per-file caches.
   */
  constructor(vault: ShimVault, transport: BridgeTransport) {
    this.vault = vault
    this.transport = transport
  }

  /**
   * Resolve a wikilink target the way Obsidian's shortest-path rule does:
   * exact vault path first (`.md` appended when missing), then a unique
   * basename match.
   * @param linkpath - the link target.
   * @param _sourcePath - the linking note's path.
   * @returns the resolved file, or null.
   */
  getFirstLinkpathDest(linkpath: string, _sourcePath: string): TFile | null {
    const target = normalizePath(linkpath)
    const files = this.vault.getFiles()
    const exact = files.find(file => file.path === target || file.path === `${target}.md`)
    if (exact !== undefined) return exact
    const base = target.slice(target.lastIndexOf('/') + 1).replace(/\.md$/i, '').toLowerCase()
    return files.find(file => file.basename.toLowerCase() === base) ?? null
  }

  /**
   * Per-file cache. A cold path starts a background fetch and answers null, the
   * state Obsidian reports before indexing; warm paths answer synchronously.
   * @param file - the file to read.
   */
  getFileCache(file: TAbstractFile): ShimFileCache | null {
    const path = file.path
    const warm = this.fileCaches.get(path)
    if (warm !== undefined) return warm
    if (this.loading.has(path)) return null
    this.loading.add(path)
    void this.transport.request('metadata.fileCache', { path })
      .then((value) => {
        this.fileCaches.set(path, toFileCache(value))
      })
      .catch(() => {
        // An unreachable host is the same degrade as "not indexed"; the entry
        // stays null so a later read retries through the map hit.
        this.fileCaches.set(path, null)
      })
      .finally(() => this.loading.delete(path))
    return null
  }

  /**
   * Backlink counts. Not served by the bridge yet; plugins reading
   * `?.keys()?.length || 0` degrade to 0.
   */
  getBacklinksForFile(_file: TFile): undefined {
    return undefined
  }
}

/**
 * Narrow a bridge result to the served cache subset.
 * @param value - the raw `metadata.fileCache` answer.
 * @returns the cache, or null when the host had none.
 */
function toFileCache(value: unknown): ShimFileCache | null {
  if (typeof value !== 'object' || value === null) return null
  const tags = (value as { readonly tags?: unknown }).tags
  if (!Array.isArray(tags)) return null
  const entries = tags.filter(
    (entry): entry is ShimTagCache =>
      typeof entry === 'object' && entry !== null && typeof (entry as { tag?: unknown }).tag === 'string',
  )
  return { tags: entries }
}
