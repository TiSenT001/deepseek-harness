/**
 * The vault index: walks the vault, parses note metadata once, resolves every
 * link, and answers explorer, reading, backlink, tag, search, and graph
 * queries. Content stays in memory only while the vault fits the configured
 * budget; larger notes are read on demand.
 * @module dsh-obsidian-vault/vault/index
 */
import type {
  BacklinkDto, FileDto, GraphDto, NoteDto, NoteLinkDto,
  SearchHitDto, StatusDto, TagCountDto, TreeNodeDto,
} from '../protocol.ts'
import { extensionOf, fileTypeOf } from '../filetypes.ts'
import { parseFrontmatter } from './frontmatter.ts'
import { deriveIndex } from './derive.ts'
import { parseNoteEntry, type NoteEntry } from './entry.ts'
import { VaultFiles } from './files.ts'
import { buildGraph, type GraphFilter } from './graph.ts'
import { unlinkedMentionsOf } from './mentions.ts'
import { moveEntry, type MoveOutcome } from './move.ts'
import { scanVault } from './scan.ts'
import { searchNotes } from './search.ts'
import { baseName } from './tree.ts'
import { buildTree, type TreeFileMeta } from './tree.ts'
import { LinkResolver } from './resolver.ts'

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

const MARKDOWN = /\.md$/i
/** Text the file view may carry to the browser; longer files arrive truncated. */
const MAX_TEXT_BYTES = 1024 * 1024

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

/** Live vault index. One instance per plugin fiber. */
export class VaultIndex {
  private notes = new Map<string, NoteEntry>()
  private attachments = new Set<string>()
  private attachmentMeta = new Map<string, { readonly size?: number }>()
  private rootTarget: FsTargetLike | undefined
  private directories: FsTargetLike[] = []
  private dirPaths: readonly string[] = []
  private resolver: LinkResolver | undefined
  private linkIndex = new Map<string, readonly NoteLinkDto[]>()
  private backlinks = new Map<string, BacklinkDto[]>()
  private tagCounts = new Map<string, number>()
  private adjacency = new Map<string, Set<string>>()
  private revision = 0
  private scanChain: Promise<void> = Promise.resolve()
  private failure: string | undefined
  private signature: string | undefined
  private readonly fs: FsLike
  private readonly options: VaultOptions
  private files: VaultFiles
  private rootPath: string

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
   * Point the index at another vault directory. Parsed entries and every
   * derived index belong to the old root, so they are dropped before the next
   * refresh; the revision bump tells the page its cached views are stale.
   * @param root - absolute directory of the new vault.
   */
  rebind(root: string): void {
    this.rootPath = root
    this.files = new VaultFiles(root)
    this.notes = new Map()
    this.attachments = new Set()
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
   * Rename one entry in place, rewriting links like a same-folder move so
   * existing `[[links]]` keep resolving. Conflicts reject instead of
   * overwriting the target.
   * @param path - vault-relative path.
   * @param name - new file name (no separators).
   */
  async rename(path: string, name: string): Promise<void> {
    const trimmed = name.trim()
    if (trimmed.length === 0 || trimmed === '.' || trimmed === '..'
      || trimmed.includes('/') || trimmed.includes('\\')) {
      throw new Error(`invalid name: ${name}`)
    }
    const slash = path.lastIndexOf('/')
    const to = slash === -1 ? trimmed : `${path.slice(0, slash)}/${trimmed}`
    if (to === path) return
    await this.move(path, to)
  }

  /**
   * Move one entry to `.trash`, then rescan.
   * @param path - vault-relative path.
   * @returns the trash path.
   */
  async remove(path: string): Promise<string> {
    const trashed = await this.files.moveToTrash(path)
    await this.refresh()
    return trashed
  }

  /**
   * Move a note or folder, rewriting links that pointed at the old path. A
   * folder move rewrites links to every descendant note as well.
   * @param from - current vault-relative path.
   * @param to - destination vault-relative path.
   * @returns the moved path, rewritten notes, and the trash backup.
   */
  async move(from: string, to: string): Promise<MoveOutcome> {
    const outcome = await moveEntry({
      files: this.files,
      notes: this.notes,
      backlinks: this.backlinks,
      resolver: this.resolver,
    }, from, to)
    await this.refresh()
    return outcome
  }

  /**
   * Create a folder, then rescan.
   * @param path - vault-relative folder path.
   */
  async makeFolder(path: string): Promise<void> {
    await this.files.mkdir(path)
    await this.refresh()
  }

  /** Vault-relative paths of every indexed note, sorted. */
  get paths(): readonly string[] {
    return [...this.notes.keys()].sort()
  }

  /** Root target once the first scan resolved it. */
  get root(): FsTargetLike | undefined {
    return this.rootTarget
  }

  /** Directories whose change can invalidate the index. */
  get watchedDirectories(): readonly FsTargetLike[] {
    return this.directories
  }

  /** Index revision; changes after every rescan. */
  get version(): number {
    return this.revision
  }

  /**
   * Rescan the vault, reusing parsed entries whose filesystem version did not move.
   * Scans run one at a time in call order, so a scan that read the vault before
   * a write cannot publish its older snapshot after a scan that saw the write.
   * @returns nothing; failures land on the status report.
   */
  async refresh(): Promise<void> {
    const run = this.scanChain.then(() => this.scan())
    this.scanChain = run.catch(() => undefined)
    await run
  }

  private async scan(): Promise<void> {
    let result
    try {
      result = await scanVault(this.fs, this.rootPath, this.options, this.notes,
        (target, path, key, size, budget) => this.parse(target, path, key, size, budget))
    } catch (error) {
      this.failure = messageOf(error)
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
    this.reindex()
    this.revision += 1
    this.failure = undefined
  }

  /** Status report for the page shell. */
  status(): StatusDto {
    return {
      ready: this.notes.size > 0,
      root: this.rootPath,
      notes: this.notes.size,
      version: this.revision,
      ...(this.failure === undefined ? {} : { error: this.failure }),
    }
  }

  /** Explorer tree over notes, attachments, and every scanned directory. */
  tree(): readonly TreeNodeDto[] {
    const files: Array<readonly [string, TreeFileMeta]> = [...this.notes].map(([path, entry]) => [
      path,
      entry.mtime === undefined ? { size: entry.size } : { size: entry.size, mtime: entry.mtime },
    ] as const)
    for (const path of this.attachments) files.push([path, this.attachmentMeta.get(path) ?? {}] as const)
    return buildTree(files, this.dirPaths)
  }

  /**
   * Read one note into its display form.
   * @param path - vault-relative path.
   * @returns the note, or undefined when it is not indexed.
   */
  async note(path: string): Promise<NoteDto | undefined> {
    const entry = this.notes.get(path)
    if (entry === undefined) return undefined
    let content = entry.content
    if (content === null && this.rootTarget !== undefined) {
      try {
        content = await this.readText(path)
      } catch {
        content = ''
      }
    }
    const frontmatter = parseFrontmatter(content ?? '').values
    return {
      path,
      title: entry.title,
      content: stripFrontmatter(content ?? ''),
      frontmatter,
      tags: entry.tags,
      headings: entry.headings,
      links: this.linkIndex.get(path) ?? [],
      blocks: entry.blocks,
    }
  }

  /**
   * Notes that link to this path.
   * @param path - vault-relative path.
   */
  backlinksOf(path: string): readonly BacklinkDto[] {
    return this.backlinks.get(path) ?? []
  }

  /**
   * Mentions of this note's title or an alias that are not wikilinks.
   * @param path - vault-relative path.
   * @param limit - maximum mentions.
   */
  unlinkedMentions(path: string, limit = 20): readonly BacklinkDto[] {
    return unlinkedMentionsOf(this.notes, path, limit)
  }

  /** Tags with note counts, most frequent first. */
  tags(): readonly TagCountDto[] {
    return [...this.tagCounts.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((left, right) => right.count - left.count || left.tag.localeCompare(right.tag))
  }

  /**
   * Rank notes by title, alias, tag, path, then content; operator queries use
   * the shared parser.
   * @param query - raw query text.
   * @param limit - maximum hits.
   */
  search(query: string, limit = 40): readonly SearchHitDto[] {
    return searchNotes(this.notes, query, limit)
  }

  /**
   * Link graph around one note, or the whole vault when no center is given.
   * @param center - vault-relative path to center on.
   * @param depth - hop limit for a centered graph.
   * @param limit - node cap for a global graph.
   * @param filter - query text, tag, and which synthetic node kinds to include.
   */
  graph(
    center: string | undefined,
    depth = 2,
    limit = 400,
    filter: GraphFilter = {},
  ): GraphDto {
    return buildGraph({
      notes: this.notes,
      adjacency: this.adjacency,
      linksByNote: this.linkIndex,
      attachments: this.attachments,
    }, { center, depth, limit, filter })
  }

  /**
   * Create an empty note when it does not exist yet.
   * @param path - vault-relative path ending in `.md`.
   * @returns true when the file now exists.
   */
  async create(path: string): Promise<boolean> {
    if (this.notes.has(path)) return true
    if (!path.toLowerCase().endsWith('.md')) return false
    if (this.rootTarget !== undefined) {
      const separator = this.rootTarget.displayPath.endsWith('\\') ? '\\' : '/'
      try {
        const target = await this.fs.resolve(`${this.rootTarget.displayPath}${separator}${path.replace(/\//g, separator)}`)
        await this.fs.writeText(target, '', { kind: 'createIfAbsent' })
        await this.refresh()
        return true
      } catch {
        // The sandboxed filesystem refuses writes outside the workspace; the
        // vault is user data, so fall through to a direct, confined write.
      }
    }
    try {
      await this.files.writeNew(path, '')
      await this.refresh()
      return true
    } catch {
      return false
    }
  }

  /**
   * Replace one indexed note's text, refusing a write when the file changed on
   * disk since the caller read it.
   * @param path - vault-relative path.
   * @param content - complete new file text.
   * @param baseMtime - modification time the caller started from; omit to overwrite unconditionally.
   * @returns the fresh modification time, or the rejection the route reports.
   */
  async saveNote(path: string, content: string, baseMtime?: number): Promise<SaveNoteResult> {
    if (!MARKDOWN.test(path)) return { ok: false, status: 400, error: 'not a markdown note' }
    if (!this.notes.has(path)) return { ok: false, status: 404, error: 'note not found' }
    if (Buffer.byteLength(content, 'utf8') > this.options.maxFileBytes) {
      return { ok: false, status: 400, error: 'note exceeds the configured size limit' }
    }
    if (baseMtime !== undefined) {
      const current = await this.files.mtimeOf(path)
      // File timestamps pass through JSON as floats; a sub-millisecond drift is
      // not an edit, so compare at millisecond resolution.
      if (current !== undefined && Math.round(current) !== Math.round(baseMtime)) {
        return { ok: false, status: 409, error: 'note changed on disk', mtime: current }
      }
    }
    await this.files.writeText(path, content)
    const mtime = await this.files.mtimeOf(path)
    await this.refresh()
    return { ok: true, path, mtime: mtime ?? Date.now() }
  }

  /**
   * Read one vault file for the file viewer. Markdown and whitelisted text
   * files carry a prefix of their content; images, PDFs, and binaries carry
   * metadata only and stream through the asset route.
   * @param path - vault-relative path.
   * @returns the file, or undefined when it is absent or a directory.
   */
  async file(path: string): Promise<FileDto | undefined> {
    const info = await this.files.info(path)
    if (info === undefined) return undefined
    const spec = fileTypeOf(path)
    const base: FileDto = {
      path,
      name: baseName(path),
      ext: extensionOf(path),
      kind: spec.kind,
      mime: spec.mime,
      size: info.size,
      mtime: info.mtime,
      truncated: false,
      ...(spec.language === undefined ? {} : { language: spec.language }),
    }
    if (spec.kind !== 'markdown' && spec.kind !== 'code') return base
    try {
      const prefix = await this.files.readPrefix(path, MAX_TEXT_BYTES)
      return { ...base, size: prefix.size, text: prefix.text, truncated: prefix.truncated }
    } catch {
      // An unreadable text file still answers with its metadata.
      return base
    }
  }

  /**
   * Read one attachment inside the vault.
   * @param path - vault-relative path.
   * @param maxBytes - inclusive cap.
   * @returns the bytes, or undefined when the file is absent, outside the vault, or unreadable.
   */
  async readAsset(path: string, maxBytes = 32 * 1024 * 1024): Promise<Uint8Array | undefined> {
    const root = this.rootTarget
    const readBytes = this.fs.readBytes
    if (root === undefined || readBytes === undefined) return undefined
    if (!this.attachments.has(path)) return undefined
    try {
      const target = await this.resolveRelative(path)
      if (this.fs.contains !== undefined && !this.fs.contains(root, target)) return undefined
      return await readBytes.call(this.fs, target, undefined, maxBytes)
    } catch {
      return undefined
    }
  }

  private async resolveRelative(path: string): Promise<FsTargetLike> {
    const root = this.rootTarget
    if (root === undefined) throw new Error('vault root is not resolved yet')
    const separator = root.displayPath.endsWith('\\') ? '\\' : '/'
    return this.fs.resolve(`${root.displayPath}${separator}${path.replace(/\//g, separator)}`)
  }

  private async readText(path: string): Promise<string> {
    if (this.rootTarget === undefined) return ''
    return this.fs.readText(await this.resolveRelative(path))
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

  private reindex(): void {
    const derived = deriveIndex(this.notes, this.attachments)
    this.resolver = derived.resolver
    this.linkIndex = new Map(derived.linkIndex)
    this.backlinks = new Map(derived.backlinks)
    this.tagCounts = new Map(derived.tagCounts)
    this.adjacency = new Map(derived.adjacency)
  }
}

/** The note body without its frontmatter block. */
function stripFrontmatter(content: string): string {
  return parseFrontmatter(content).body
}

/** Message text of a thrown value. */
function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
