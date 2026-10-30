/**
 * The vault index: walks the vault, parses note metadata once, resolves every
 * link, and answers explorer, reading, backlink, tag, search, and graph
 * queries. Content stays in memory only while the vault fits the configured
 * budget; larger notes are read on demand.
 *
 * State and the scan cycle live in `VaultStore`; projections, file reads,
 * entry operations and write paths live in their own modules. This class is
 * the facade the plugin and the routes talk to.
 * @module dsh-obsidian-vault/vault/index
 */
import type {
  BacklinkDto, FileDto, GraphDto, NoteDto, SearchHitDto,
  StatusDto, TagCountDto, TreeNodeDto,
} from '../protocol.ts'
import { parseFrontmatter } from './frontmatter.ts'
import { buildGraph, type GraphFilter } from './graph.ts'
import { unlinkedMentionsOf } from './mentions.ts'
import { searchNotes } from './search.ts'
import { VaultStore } from './store.ts'
import { statusOf, tagsOf, treeOf } from './projections.ts'
import { fileOf, readAssetOf } from './index-read.ts'
import { makeFolderIn, moveEntryTo, removeEntry, renameEntry, type OpsContext } from './index-ops.ts'
import { createNote, saveNoteTo, type WriteContext } from './index-write.ts'
import type { FsLike, FsTargetLike, SaveNoteResult, VaultOptions } from './index-types.ts'
import type { MoveOutcome } from './move.ts'

export type { FsEntryLike, FsLike, FsTargetLike, SaveNoteResult, VaultOptions } from './index-types.ts'

/** Live vault index. One instance per plugin fiber. */
export class VaultIndex {
  private readonly store: VaultStore

  /**
   * @param fs - Host filesystem service.
   * @param options - resolved tunables.
   */
  constructor(fs: FsLike, options: VaultOptions) {
    this.store = new VaultStore(fs, options)
  }

  /**
   * Point the index at another vault directory. Parsed entries and every
   * derived index belong to the old root, so they are dropped before the next
   * refresh.
   * @param root - absolute directory of the new vault.
   */
  rebind(root: string): void {
    this.store.rebind(root)
  }

  /**
   * Rename one entry in place, rewriting links like a same-folder move so
   * existing `[[links]]` keep resolving. Conflicts reject instead of
   * overwriting the target.
   * @param path - vault-relative path.
   * @param name - new file name (no separators).
   */
  async rename(path: string, name: string): Promise<void> {
    await renameEntry(this.opsContext(), path, name)
  }

  /**
   * Move one entry to `.trash`, then rescan.
   * @param path - vault-relative path.
   * @returns the trash path.
   */
  async remove(path: string): Promise<string> {
    return removeEntry(this.opsContext(), path)
  }

  /**
   * Move a note or folder, rewriting links that pointed at the old path. A
   * folder move rewrites links to every descendant note as well.
   * @param from - current vault-relative path.
   * @param to - destination vault-relative path.
   * @returns the moved path, rewritten notes, and the trash backup.
   */
  async move(from: string, to: string): Promise<MoveOutcome> {
    return moveEntryTo(this.opsContext(), from, to)
  }

  /**
   * Create a folder, then rescan.
   * @param path - vault-relative folder path.
   */
  async makeFolder(path: string): Promise<void> {
    await makeFolderIn(this.opsContext(), path)
  }

  /** Vault-relative paths of every indexed note, sorted. */
  get paths(): readonly string[] {
    return [...this.store.notes.keys()].sort()
  }

  /** Root target once the first scan resolved it. */
  get root(): FsTargetLike | undefined {
    return this.store.rootTarget
  }

  /** Directories whose change can invalidate the index. */
  get watchedDirectories(): readonly FsTargetLike[] {
    return this.store.directories
  }

  /** Index revision; changes after every rescan. */
  get version(): number {
    return this.store.revision
  }

  /**
   * Rescan the vault, reusing parsed entries whose filesystem version did not
   * move.
   * @returns nothing; failures land on the status report.
   */
  async refresh(): Promise<void> {
    await this.store.refresh()
  }

  /** Status report for the page shell. */
  status(): StatusDto {
    return statusOf({
      ready: this.store.notes.size > 0,
      root: this.store.rootPath,
      notes: this.store.notes.size,
      version: this.store.revision,
      failure: this.store.failure,
    })
  }

  /** Explorer tree over notes, attachments, and every scanned directory. */
  tree(): readonly TreeNodeDto[] {
    return treeOf({
      notes: this.store.notes,
      attachments: this.store.attachments,
      attachmentMeta: this.store.attachmentMeta,
      dirPaths: this.store.dirPaths,
    })
  }

  /**
   * Read one note into its display form.
   * @param path - vault-relative path.
   * @returns the note, or undefined when it is not indexed.
   */
  async note(path: string): Promise<NoteDto | undefined> {
    const entry = this.store.notes.get(path)
    if (entry === undefined) return undefined
    let content = entry.content
    if (content === null && this.store.rootTarget !== undefined) {
      try {
        content = await this.store.readText(path)
      } catch {
        content = ''
      }
    }
    const parsed = parseFrontmatter(content ?? '')
    return {
      path,
      title: entry.title,
      content: parsed.body,
      frontmatter: parsed.values,
      tags: entry.tags,
      headings: entry.headings,
      links: this.store.linkIndex.get(path) ?? [],
      blocks: entry.blocks,
    }
  }

  /**
   * Notes that link to this path.
   * @param path - vault-relative path.
   * @returns the backlinks, empty when none link here.
   */
  backlinksOf(path: string): readonly BacklinkDto[] {
    return this.store.backlinks.get(path) ?? []
  }

  /**
   * Mentions of this note's title or an alias that are not wikilinks.
   * @param path - vault-relative path.
   * @param limit - maximum mentions.
   * @returns the mention rows.
   */
  unlinkedMentions(path: string, limit = 20): readonly BacklinkDto[] {
    return unlinkedMentionsOf(this.store.notes, path, limit)
  }

  /** Tags with note counts, most frequent first. */
  tags(): readonly TagCountDto[] {
    return tagsOf(this.store.tagCounts)
  }

  /**
   * Rank notes by title, alias, tag, path, then content; operator queries use
   * the shared parser.
   * @param query - raw query text.
   * @param limit - maximum hits.
   * @returns the ranked hits.
   */
  search(query: string, limit = 40): readonly SearchHitDto[] {
    return searchNotes(this.store.notes, query, limit)
  }

  /**
   * Link graph around one note, or the whole vault when no center is given.
   * @param center - vault-relative path to center on.
   * @param depth - hop limit for a centered graph.
   * @param limit - node cap for a global graph.
   * @param filter - query text, tag, and which synthetic node kinds to include.
   * @returns the graph document.
   */
  graph(
    center: string | undefined,
    depth = 2,
    limit = 400,
    filter: GraphFilter = {},
  ): GraphDto {
    return buildGraph({
      notes: this.store.notes,
      adjacency: this.store.adjacency,
      linksByNote: this.store.linkIndex,
      attachments: this.store.attachments,
    }, { center, depth, limit, filter })
  }

  /**
   * Create an empty note when it does not exist yet.
   * @param path - vault-relative path ending in `.md`.
   * @returns true when the file now exists.
   */
  async create(path: string): Promise<boolean> {
    return createNote(this.writeContext(), path)
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
    return saveNoteTo(this.writeContext(), path, content, baseMtime)
  }

  /**
   * Read one vault file for the file viewer.
   * @param path - vault-relative path.
   * @returns the file, or undefined when it is absent or a directory.
   */
  async file(path: string): Promise<FileDto | undefined> {
    return fileOf(this.store.files, path)
  }

  /**
   * Read one attachment inside the vault.
   * @param path - vault-relative path.
   * @param maxBytes - inclusive cap.
   * @returns the bytes, or undefined when the file is absent, outside the vault, or unreadable.
   */
  async readAsset(path: string, maxBytes = 32 * 1024 * 1024): Promise<Uint8Array | undefined> {
    return readAssetOf({ fs: this.store.fs, root: this.store.rootTarget, attachments: this.store.attachments }, path, maxBytes)
  }

  /** Bundle the state the entry operations read. @returns the ops context. */
  private opsContext(): OpsContext {
    return {
      files: this.store.files,
      notes: this.store.notes,
      backlinks: this.store.backlinks,
      resolver: this.store.resolver,
      refresh: () => this.store.refresh(),
    }
  }

  /** Bundle the state the write paths read. @returns the write context. */
  private writeContext(): WriteContext {
    return {
      fs: this.store.fs,
      files: this.store.files,
      options: this.store.options,
      root: this.store.rootTarget,
      hasNote: (path: string) => this.store.notes.has(path),
      refresh: () => this.store.refresh(),
    }
  }
}
