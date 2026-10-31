/**
 * The vault index state: owned collections, the serialized scan cycle, and the
 * parse step. `VaultIndex` is the public facade over one store instance.
 * @module dsh-obsidian-vault/vault/store
 */
import { deriveIndex } from './derive.ts'
import { parseNoteEntry, type NoteEntry } from './entry.ts'
import { VaultFiles } from './files.ts'
import { CANVAS_MAX_BYTES, readCanvasReferences, type CanvasReference } from './canvas-refs.ts'
import { scanVault } from './scan.ts'
import { resolveInVault } from './index-read.ts'
import type { BacklinkDto, NoteLinkDto } from '../protocol.ts'
import type { FsLike, FsTargetLike, VaultOptions } from './index-types.ts'
import type { LinkResolver } from './resolver.ts'

/** Live vault state: parsed notes, derived indexes and the scan chain. */
export class VaultStore {
  /** Parsed notes by vault-relative path. */
  notes = new Map<string, NoteEntry>()
  /** Attachment paths. */
  attachments = new Set<string>()
  /** Canvas documents that reference notes, keyed by canvas path. */
  canvasRefs = new Map<string, readonly CanvasReference[]>()
  /** Attachment metadata by path. */
  attachmentMeta = new Map<string, { readonly size?: number }>()
  /** Root target once the first scan resolved it. */
  rootTarget: FsTargetLike | undefined
  /** Directories whose change can invalidate the index. */
  directories: FsTargetLike[] = []
  /** Every scanned directory path. */
  dirPaths: readonly string[] = []
  /** Link resolver built by the last reindex. */
  resolver: LinkResolver | undefined
  /** Outgoing links by note path. */
  linkIndex = new Map<string, readonly NoteLinkDto[]>()
  /** Incoming links by note path. */
  backlinks = new Map<string, BacklinkDto[]>()
  /** Tag counts from the last reindex. */
  tagCounts = new Map<string, number>()
  /** Link adjacency from the last reindex. */
  adjacency = new Map<string, Set<string>>()
  /** Bumped after every published scan. */
  revision = 0
  /** Last scan failure, cleared by the next successful scan. */
  failure: string | undefined
  /** Signature of the last published scan. */
  signature: string | undefined
  /** The vault file helper bound to the current root. */
  files: VaultFiles
  /** Absolute root currently indexed. */
  rootPath: string
  /** Host filesystem service. */
  readonly fs: FsLike
  /** Resolved tunables. */
  readonly options: VaultOptions
  private scanChain: Promise<void> = Promise.resolve()

  /**
   * @param fs - Host filesystem service.
   * @param options - resolved tunables.
   */
  constructor(fs: FsLike, options: VaultOptions) {
    this.fs = fs
    this.options = options
    this.rootPath = options.root
    this.files = new VaultFiles(options.root)
  }

  /**
   * Point the store at another vault directory and drop everything derived
   * from the old root; the revision bump tells the page its cached views are
   * stale.
   * @param root - absolute directory of the new vault.
   */
  rebind(root: string): void {
    this.rootPath = root
    this.files = new VaultFiles(root)
    this.notes = new Map()
    this.attachments = new Set()
    this.canvasRefs = new Map()
    this.attachmentMeta = new Map()
    this.rootTarget = undefined
    this.directories = []
    this.dirPaths = []
    this.resolver = undefined
    this.linkIndex = new Map()
    this.backlinks = new Map()
    this.tagCounts = new Map()
    this.adjacency = new Map()
    this.failure = undefined
    this.signature = undefined
    this.revision += 1
  }

  /**
   * Rescan the vault, reusing parsed entries whose filesystem version did not
   * move. Scans run one at a time in call order, so a scan that read the vault
   * before a write cannot publish its older snapshot after a scan that saw the
   * write.
   * @returns nothing; failures land on the failure field.
   */
  async refresh(): Promise<void> {
    const run = this.scanChain.then(() => this.scan())
    this.scanChain = run.catch(() => undefined)
    await run
  }

  /**
   * Read one indexed note body from disk.
   * @param path - vault-relative path.
   * @returns the file text, or an empty string before the root resolves.
   */
  async readText(path: string): Promise<string> {
    if (this.rootTarget === undefined) return ''
    return this.fs.readText(await resolveInVault(this.fs, this.rootTarget, path))
  }

  private async scan(): Promise<void> {
    let result
    try {
      result = await scanVault(this.fs, this.rootPath, this.options, this.notes,
        (target, path, key, size, budget) => this.parse(target, path, key, size, budget))
    } catch (error) {
      this.failure = error instanceof Error ? error.message : String(error)
      return
    }
    if (this.signature === result.signature) {
      this.failure = undefined
      return
    }
    this.signature = result.signature
    this.notes = result.notes
    this.attachments = result.attachments
    this.attachmentMeta = result.attachmentMeta
    this.directories = result.directories
    // Both notes and attachments join the tree, so every scanned directory is
    // either populated or genuinely empty (freshly created) and stays visible.
    this.dirPaths = result.dirPaths
    this.rootTarget = result.root
    await this.collectCanvasRefs()
    this.reindex()
    this.revision += 1
    this.failure = undefined
  }

  private parse(
    target: FsTargetLike,
    path: string,
    key: string,
    size: number,
    budget: number,
  ): Promise<NoteEntry> {
    return this.files.mtimeOf(path).then(mtime => parseNoteEntry({
      path,
      key,
      size,
      budget,
      maxFileBytes: this.options.maxFileBytes,
      mtime,
      read: () => this.fs.readText(target),
    }))
  }

  /**
   * Read every canvas document once per scan and keep the note references it
   * makes. Canvases are attachments to the note index, so their links have to be
   * collected separately for the backlink pass.
   */
  private async collectCanvasRefs(): Promise<void> {
    const refs = new Map<string, readonly CanvasReference[]>()
    for (const path of this.attachments) {
      if (!/\.PurStudio$/i.test(path)) continue
      const size = this.attachmentMeta.get(path)?.size ?? 0
      if (size > CANVAS_MAX_BYTES) continue
      const target = await resolveInVault(this.fs, this.rootTarget, path).catch(() => undefined)
      if (target === undefined) continue
      const text = await this.fs.readText(target).catch(() => undefined)
      if (text === undefined) continue
      const found = readCanvasReferences(text)
      if (found.length > 0) refs.set(path, found)
    }
    this.canvasRefs = refs
  }
  private reindex(): void {
    const derived = deriveIndex(this.notes, this.attachments, this.canvasRefs)
    this.resolver = derived.resolver
    this.linkIndex = new Map(derived.linkIndex)
    this.backlinks = new Map(derived.backlinks)
    this.tagCounts = new Map(derived.tagCounts)
    this.adjacency = new Map(derived.adjacency)
  }
}
