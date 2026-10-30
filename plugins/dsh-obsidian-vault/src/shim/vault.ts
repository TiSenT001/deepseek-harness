/**
 * The frame's `app.vault`: reads and writes cross the bridge, the file cache
 * is prefetched before the plugin script runs so Obsidian's synchronous
 * getters (`getFiles`, `getAbstractFileByPath`) have data to answer from.
 * Writes through the facade invalidate the cache; external edits refresh on
 * the next access that misses.
 * @module dsh-obsidian-vault/shim/vault
 */
import type { BridgeFileDto } from '../protocol.ts'
import { fileFromDto, TFile, TFolder, type TAbstractFile } from './files.ts'
import { normalizePath } from './normalize.ts'
import type { BridgeTransport } from './transport.ts'

/** One registered `.on(...)` callback. */
type VaultHandler = (...args: readonly unknown[]) => void

/** Obsidian's vault facade, bridge-backed. */
export class ShimVault {
  private readonly transport: BridgeTransport
  private readonly apiBase: string
  private cache: readonly TFile[] | undefined
  private readonly handlers = new Map<string, Set<VaultHandler>>()

  /**
   * @param transport - the frame's bridge client.
   * @param apiBase - the host API prefix, for `getResourcePath`.
   */
  constructor(transport: BridgeTransport, apiBase: string) {
    this.transport = transport
    this.apiBase = apiBase
    this.adapter = {
      basePath: '/',
      exists: async (path: string): Promise<boolean> =>
        await this.transport.request('vault.exists', { path: normalizePath(path) }) === true,
      read: async (path: string): Promise<string> => await this.readText(normalizePath(path)),
      readBinary: async (path: string): Promise<ArrayBuffer> => await this.readBinaryPath(normalizePath(path)),
    }
  }

  /** Obsidian's `vault.adapter`: the small slice plugins use directly. */
  readonly adapter: {
    readonly basePath: string
    readonly exists: (path: string) => Promise<boolean>
    readonly read: (path: string) => Promise<string>
    readonly readBinary: (path: string) => Promise<ArrayBuffer>
  }

  /** Prefetch the file list; the boot sequence awaits this before loading the plugin. */
  async warmup(): Promise<void> {
    const files = await this.transport.request('vault.list')
    this.cache = (files as readonly BridgeFileDto[]).map(fileFromDto)
  }

  private invalidate(): void {
    this.cache = undefined
  }

  private cached(): readonly TFile[] {
    if (this.cache === undefined) {
      // A cold cache means plugin code read before the boot warmup settled;
      // refresh in the background so the next read sees the vault.
      void this.warmup()
      return []
    }
    return this.cache
  }

  /** Every file in the vault (synchronous, from the prefetched cache). */
  getFiles(): TFile[] {
    return [...this.cached()]
  }

  /** Every Markdown file in the vault. */
  getMarkdownFiles(): TFile[] {
    return this.cached().filter(file => file.extension === 'md')
  }

  /**
   * Look up one path.
   * @param path - vault-relative path.
   * @returns the file, a folder placeholder, or null.
   */
  getAbstractFileByPath(path: string): TAbstractFile | null {
    const target = normalizePath(path)
    const file = this.cached().find(entry => entry.path === target)
    if (file !== undefined) return file
    if (this.cached().some(entry => entry.path.startsWith(`${target}/`))) return new TFolder(target)
    return null
  }

  /**
   * Read a file's text.
   * @param file - the TFile or its path.
   */
  async read(file: TFile | string): Promise<string> {
    return this.readText(typeof file === 'string' ? normalizePath(file) : file.path)
  }

  private async readText(path: string): Promise<string> {
    return await this.transport.request('vault.readText', { path }) as string
  }

  /**
   * Read a file's bytes.
   * @param file - the TFile or its path.
   */
  async readBinary(file: TFile | string): Promise<ArrayBuffer> {
    return this.readBinaryPath(typeof file === 'string' ? normalizePath(file) : file.path)
  }

  private async readBinaryPath(path: string): Promise<ArrayBuffer> {
    const base64 = await this.transport.request('vault.readBinary', { path }) as string
    const text = atob(base64)
    const bytes = new Uint8Array(text.length)
    for (let i = 0; i < text.length; i += 1) bytes[i] = text.charCodeAt(i)
    return bytes.buffer
  }

  /**
   * Create a file; fails when the path already exists, like Obsidian.
   * @param path - vault-relative path.
   * @param content - text content.
   * @returns the created file.
   */
  async create(path: string, content: string): Promise<TFile> {
    const normalized = normalizePath(path)
    if (await this.transport.request('vault.exists', { path: normalized }) === true) {
      throw new Error(`file already exists: ${normalized}`)
    }
    await this.transport.request('vault.writeText', { path: normalized, content })
    this.invalidate()
    return new TFile(normalized, { ctime: Date.now(), mtime: Date.now(), size: content.length })
  }

  /**
   * Replace a file's content.
   * @param file - the TFile or its path.
   * @param content - the new content.
   */
  async modify(file: TFile | string, content: string): Promise<void> {
    const path = typeof file === 'string' ? normalizePath(file) : file.path
    await this.transport.request('vault.writeText', { path, content })
    this.invalidate()
  }

  /**
   * Obsidian's read-modify-write.
   * @param file - the TFile or its path.
   * @param fn - transforms the current content.
   */
  async process(file: TFile | string, fn: (data: string) => string): Promise<void> {
    await this.modify(file, fn(await this.read(file)))
  }

  /**
   * The URL the frame's `<img>` tags use for one vault file: the host's
   * CORS-enabled raw route, so canvas pixel reads keep working.
   * @param file - the TFile or its path.
   */
  getResourcePath(file: TFile | string): string {
    const path = typeof file === 'string' ? normalizePath(file) : file.path
    return `${this.apiBase}/bridge/raw?path=${encodeURIComponent(path)}`
  }

  /**
   * Subscribe to a vault event. Host pushes land with P9-4; subscriptions are
   * stored so plugin code never crashes registering them.
   * @param name - event name, e.g. `modify`.
   * @param handler - the callback.
   * @returns an event reference usable with `offref`.
   */
  on(name: string, handler: VaultHandler): { readonly name: string } {
    const set = this.handlers.get(name) ?? new Set<VaultHandler>()
    set.add(handler)
    this.handlers.set(name, set)
    return { name }
  }

  /**
   * Invoke the stored handlers for one event; the host's push channel calls
   * this when it starts delivering vault events.
   * @param name - event name.
   * @param args - event arguments.
   */
  trigger(name: string, ...args: readonly unknown[]): void {
    for (const handler of this.handlers.get(name) ?? []) handler(...args)
  }
}
