/**
 * Vault invalidation: one watcher per directory, coalesced into a single
 * rescan so a burst of editor saves costs one refresh.
 * @module dsh-obsidian-vault/vault/watch
 */
import type { FsLike, FsTargetLike, VaultIndex } from './index.ts'

const DEBOUNCE_MS = 250

/** Owns the directory watchers and the debounced rescan. */
export class VaultWatcher {
  private closed = false
  private timer: ReturnType<typeof setTimeout> | undefined
  private watchers: Array<() => Promise<void>> = []
  private watchedKey = ''
  private refreshing = false
  private dirty = false

  private readonly fs: FsLike
  private readonly vault: VaultIndex
  private readonly report: (error: Error) => void

  /**
   * @param fs - Host filesystem service.
   * @param vault - index to refresh.
   * @param report - failure sink; watching is best-effort.
   */
  constructor(fs: FsLike, vault: VaultIndex, report: (error: Error) => void) {
    this.fs = fs
    this.vault = vault
    this.report = report
  }

  /**
   * Replace the current watchers with one per indexed directory.
   * @param signal - aborts initialization.
   */
  async sync(signal: AbortSignal): Promise<void> {
    const key = this.vault.watchedDirectories.map(directory => directory.displayPath).join('|')
    if (key === this.watchedKey) return
    this.watchedKey = key
    await this.releaseWatchers()
    if (this.closed) return
    for (const directory of this.vault.watchedDirectories) {
      if (this.closed) return
      await this.watch(directory, signal)
    }
  }

  /** Stop every watcher and cancel a pending rescan. */
  async close(): Promise<void> {
    this.closed = true
    this.watchedKey = ''
    if (this.timer !== undefined) {
      clearTimeout(this.timer)
      this.timer = undefined
    }
    await this.releaseWatchers()
  }

  private async releaseWatchers(): Promise<void> {
    const watchers = this.watchers
    this.watchers = []
    for (const close of watchers) {
      try {
        await close()
      } catch (error) {
        this.report(error instanceof Error ? error : new Error(String(error)))
      }
    }
  }

  private async watch(directory: FsTargetLike, signal: AbortSignal): Promise<void> {
    const watch = this.fs.watch
    if (watch === undefined) return
    try {
      const close = await watch.call(this.fs, directory, () => { this.schedule() }, signal)
      this.watchers.push(close)
    } catch (error) {
      this.report(error instanceof Error ? error : new Error(String(error)))
    }
  }

  private schedule(): void {
    this.dirty = true
    if (this.timer !== undefined) return
    this.timer = setTimeout(() => {
      this.timer = undefined
      void this.flush()
    }, DEBOUNCE_MS)
  }

  private async flush(): Promise<void> {
    if (this.refreshing) return
    this.refreshing = true
    try {
      while (this.dirty && !this.closed) {
        this.dirty = false
        await this.vault.refresh()
        const abort = new AbortController()
        await this.sync(abort.signal)
      }
    } catch (error) {
      this.report(error instanceof Error ? error : new Error(String(error)))
    } finally {
      this.refreshing = false
    }
  }
}
