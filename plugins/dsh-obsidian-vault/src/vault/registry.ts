/**
 * Vault registry: the set of known vault directories, the active one, and the
 * index plus watcher bound to it. Switching a vault rebinds the same index, so
 * every route keeps one live object.
 * @module dsh-obsidian-vault/vault/registry
 */
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import { basename, dirname, resolve as resolvePath } from 'node:path'
import type { VaultDto, VaultInspectDto, VaultListDto, VaultOpenDto } from '../protocol.ts'
import { VaultIndex, type FsLike, type VaultOptions } from './index.ts'
import { VaultWatcher } from './watch.ts'

/** Persisted registry file contents. */
interface StoredRegistry {
  readonly version: 1
  readonly activeId?: string
  readonly vaults: readonly VaultRecord[]
}

/** One registered vault, as stored on disk. */
export interface VaultRecord {
  readonly id: string
  readonly path: string
  readonly name: string
  readonly lastOpenedAt: number
}

/** Where the registry lives and how failures are reported. */
export interface RegistryOptions {
  /** Absolute path of the JSON registry file under the DSH home. */
  readonly storePath: string
  /** Directory used when no vault is registered, so the index stays valid. */
  readonly emptyVaultPath: string
  /** Failure sink; persistence and watching are best-effort. */
  readonly report: (error: Error) => void
  /** Aborts directory watching on plugin disposal. */
  readonly signal: AbortSignal
}

const STORE_VERSION = 1

/** Live vault registry. One instance per plugin fiber. */
export class VaultRegistry {
  private records: VaultRecord[] = []
  private activeId: string | undefined
  private readonly index: VaultIndex
  private readonly watcher: VaultWatcher
  private readonly fs: FsLike
  private readonly options: VaultOptions
  private readonly settings: RegistryOptions
  private loaded = false

  /** @param fs - Host filesystem service. */
  constructor(fs: FsLike, options: VaultOptions, settings: RegistryOptions) {
    this.fs = fs
    this.options = options
    this.settings = settings
    this.index = new VaultIndex(fs, options)
    this.watcher = new VaultWatcher(fs, this.index, error => settings.report(error))
  }

  /** The index every note route reads. */
  get vault(): VaultIndex {
    return this.index
  }

  /**
   * Restore the registry file and activate its last vault. A fresh install
   * registers the configured root so the workspace still has content.
   * @returns nothing; failures land on the status report.
   */
  async start(): Promise<void> {
    if (this.loaded) return
    this.loaded = true
    const stored = await this.read()
    if (stored === undefined) {
      const seed = this.recordFor(this.options.root, undefined)
      this.records = [seed]
      this.activeId = seed.id
    } else {
      this.records = [...stored.vaults]
      this.activeId = stored.activeId !== undefined && stored.vaults.some(item => item.id === stored.activeId)
        ? stored.activeId
        : this.records[0]?.id
    }
    const active = this.active()
    if (active === undefined) {
      await this.activateUndefined()
      await this.save()
      return
    }
    await this.activate(active, false)
  }

  /** Registry snapshot for the vault manager. */
  list(): VaultListDto {
    const activeId = this.activeId
    return {
      ...(activeId === undefined ? {} : { activeId }),
      vaults: [...this.records]
        .sort((left, right) => right.lastOpenedAt - left.lastOpenedAt)
        .map(item => this.toDto(item)),
    }
  }

  /** The active record, if any. */
  active(): VaultRecord | undefined {
    return this.records.find(item => item.id === this.activeId)
  }

  /**
   * Activate a directory, registering it when it is new.
   * @param path - absolute directory chosen by the user.
   * @param init - create `.obsidian` when the folder has none.
   * @returns the activated vault and whether it carries configuration.
   */
  async open(path: string, init = false): Promise<VaultOpenDto> {
    const directory = resolvePath(path)
    await this.fs.resolve(directory)
    if (init) await mkdir(resolvePath(directory, '.obsidian'), { recursive: true })
    const existing = this.records.find(item => item.path === directory)
    const record = existing ?? this.recordFor(directory, undefined)
    if (existing === undefined) this.records = [...this.records, record]
    await this.activate(record, true)
    return { vault: this.toDto(record), configured: await hasConfigDirectory(directory) }
  }

  /**
   * Create a directory when missing and register it as a vault.
   * @param path - absolute directory to use.
   * @param name - display name; defaults to the directory name.
   */
  async create(path: string, name?: string): Promise<VaultOpenDto> {
    const directory = resolvePath(path)
    await mkdir(directory, { recursive: true })
    await mkdir(resolvePath(directory, '.obsidian'), { recursive: true })
    const existing = this.records.find(item => item.path === directory)
    const record = existing ?? this.recordFor(directory, name)
    if (existing === undefined) this.records = [...this.records, record]
    else if (name !== undefined && name.trim().length > 0) this.records = this.records.map(item => item.id === record.id ? { ...item, name: name.trim() } : item)
    await this.activate(record, true)
    return { vault: this.toDto(record), configured: true }
  }

  /**
   * Drop one vault from the list. Forgetting the active vault activates the
   * most recently used remaining one, or an empty vault when none remain.
   * @param id - registry id.
   */
  async forget(id: string): Promise<void> {
    const record = this.records.find(item => item.id === id)
    if (record === undefined) return
    this.records = this.records.filter(item => item.id !== id)
    if (this.activeId !== id) {
      await this.save()
      return
    }
    this.activeId = undefined
    const next = [...this.records].sort((left, right) => right.lastOpenedAt - left.lastOpenedAt)[0]
    if (next === undefined) await this.activateUndefined()
    else await this.activate(next, true)
  }

  /**
   * Probe a directory before opening it: whether it exists, carries
   * `.obsidian`, and is already registered. The picker dialog asks before
   * activating an unconfigured folder, so this never mutates anything.
   * @param path - candidate directory.
   */
  async inspect(path: string): Promise<VaultInspectDto> {
    const directory = resolvePath(path)
    let exists = false
    try {
      exists = (await stat(directory)).isDirectory()
    } catch {
      exists = false
    }
    return {
      path: directory,
      exists,
      configured: exists && (await hasConfigDirectory(directory)),
      registered: this.records.some(item => item.path === directory),
      name: basename(directory),
    }
  }

  /** Stop the watcher. */
  async close(): Promise<void> {
    await this.watcher.close()
  }

  private async activate(record: VaultRecord, persist: boolean): Promise<void> {
    this.activeId = record.id
    this.records = this.records.map(item => item.id === record.id
      ? { ...item, name: item.name.length > 0 ? item.name : basename(item.path), lastOpenedAt: Date.now() }
      : item)
    this.index.rebind(record.path)
    try {
      await this.index.refresh()
    } catch (error) {
      this.settings.report(asError(error))
    }
    await this.syncWatcher()
    if (persist) await this.save()
  }

  private async activateUndefined(): Promise<void> {
    await mkdir(this.settings.emptyVaultPath, { recursive: true })
    this.index.rebind(this.settings.emptyVaultPath)
    try {
      await this.index.refresh()
    } catch (error) {
      this.settings.report(asError(error))
    }
    await this.syncWatcher()
  }

  private async syncWatcher(): Promise<void> {
    try {
      await this.watcher.sync(this.settings.signal)
    } catch (error) {
      this.settings.report(asError(error))
    }
  }

  private recordFor(path: string, name: string | undefined): VaultRecord {
    const directory = resolvePath(path)
    return {
      id: randomUUID(),
      path: directory,
      name: name !== undefined && name.trim().length > 0 ? name.trim() : basename(directory),
      lastOpenedAt: Date.now(),
    }
  }

  private toDto(record: VaultRecord): VaultDto {
    return {
      id: record.id,
      path: record.path,
      name: record.name,
      lastOpenedAt: record.lastOpenedAt,
      ...(record.id === this.activeId ? { active: true } : {}),
    }
  }

  private async read(): Promise<StoredRegistry | undefined> {
    let text: string
    try {
      text = await readFile(this.settings.storePath, 'utf8')
    } catch (error) {
      if ((error as { readonly code?: string }).code !== 'ENOENT') this.settings.report(asError(error))
      return undefined
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch (error) {
      this.settings.report(asError(error))
      return undefined
    }
    if (typeof parsed !== 'object' || parsed === null) return undefined
    const document = parsed as { version?: unknown; activeId?: unknown; vaults?: unknown }
    if (!Array.isArray(document.vaults)) return undefined
    const vaults = document.vaults.flatMap((item: unknown): VaultRecord[] => {
      if (typeof item !== 'object' || item === null) return []
      const record = item as Record<string, unknown>
      if (typeof record['id'] !== 'string' || typeof record['path'] !== 'string') return []
      return [{
        id: record['id'],
        path: resolvePath(record['path']),
        name: typeof record['name'] === 'string' && record['name'].length > 0
          ? record['name']
          : basename(record['path']),
        lastOpenedAt: typeof record['lastOpenedAt'] === 'number' ? record['lastOpenedAt'] : 0,
      }]
    })
    return {
      version: STORE_VERSION,
      ...(typeof document.activeId === 'string' ? { activeId: document.activeId } : {}),
      vaults,
    }
  }

  private async save(): Promise<void> {
    const document: StoredRegistry = {
      version: STORE_VERSION,
      ...(this.activeId === undefined ? {} : { activeId: this.activeId }),
      vaults: this.records,
    }
    try {
      await mkdir(dirname(this.settings.storePath), { recursive: true })
      const temporary = `${this.settings.storePath}.tmp`
      await writeFile(temporary, `${JSON.stringify(document, undefined, 2)}\n`, 'utf8')
      await rename(temporary, this.settings.storePath)
    } catch (error) {
      this.settings.report(asError(error))
    }
  }
}

/** Whether a directory carries an Obsidian configuration folder. */
async function hasConfigDirectory(path: string): Promise<boolean> {
  try {
    const info = await stat(resolvePath(path, '.obsidian'))
    return info.isDirectory()
  } catch {
    return false
  }
}

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}
