/**
 * Vault file operations. The harness `fs` service exposes reads and atomic text
 * writes but no rename, remove, mkdir, or mtime, so these few operations go
 * through Node's fs confined to the vault root by an explicit containment check.
 * @module dsh-obsidian-vault/vault/files
 */
import { copyFile, mkdir, open, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import type { BridgeFileDto } from '../protocol.ts'

/** Thrown when a requested path escapes the vault root. */
export class VaultPathError extends Error {
  /** @param path - the offending relative path. */
  constructor(path: string) {
    super(`path escapes the vault root: ${path}`)
    this.name = 'VaultPathError'
  }
}

/** File operations that stay inside one vault root. */
export class VaultFiles {
  private readonly root: string

  /** @param root - absolute vault directory. */
  constructor(root: string) {
    this.root = resolve(root)
  }

  /**
   * Resolve a vault-relative path, refusing anything outside the root.
   * @param relativePath - path with `/` separators.
   */
  absolute(relativePath: string): string {
    const candidate = resolve(join(this.root, relativePath))
    const relation = relative(this.root, candidate)
    if (relation.startsWith('..') || isAbsolute(relation)) throw new VaultPathError(relativePath)
    return candidate
  }

  /**
   * Modification time of one file.
   * @param relativePath - vault-relative path.
   * @returns epoch milliseconds, or undefined when the file is absent.
   */
  async mtimeOf(relativePath: string): Promise<number | undefined> {
    try {
      const info = await stat(this.absolute(relativePath))
      return info.mtimeMs
    } catch {
      return undefined
    }
  }

  /**
   * Size and modification time of one file.
   * @param relativePath - vault-relative path.
   * @returns the metadata, or undefined when the file is absent or a directory.
   */
  async info(relativePath: string): Promise<{ readonly size: number; readonly mtime: number } | undefined> {
    try {
      const stats = await stat(this.absolute(relativePath))
      if (!stats.isFile()) return undefined
      return { size: stats.size, mtime: stats.mtimeMs }
    } catch {
      return undefined
    }
  }

  /**
   * Read at most `maxBytes` from the start of one file.
   * @param relativePath - vault-relative path.
   * @param maxBytes - inclusive byte cap.
   * @returns the decoded prefix, whether the file continues, and its full size.
   */
  async readPrefix(
    relativePath: string,
    maxBytes: number,
  ): Promise<{ readonly text: string; readonly truncated: boolean; readonly size: number }> {
    const handle = await open(this.absolute(relativePath), 'r')
    try {
      const stats = await handle.stat()
      const limit = Math.min(stats.size, maxBytes)
      const buffer = Buffer.alloc(limit)
      const { bytesRead } = await handle.read(buffer, 0, limit, 0)
      // A cap inside a multi-byte sequence leaves one replacement character.
      const text = new TextDecoder('utf-8').decode(buffer.subarray(0, bytesRead)).replace(/\uFFFD$/, '')
      return { text, truncated: stats.size > bytesRead, size: stats.size }
    } finally {
      await handle.close()
    }
  }

  /**
   * Delete one file or directory inside the vault.
   * @param relativePath - vault-relative path.
   */
  async remove(relativePath: string): Promise<void> {
    await rm(this.absolute(relativePath), { force: false, recursive: true })
  }

  /**
   * Create one file, failing when it already exists.
   * @param relativePath - vault-relative path.
   * @param content - initial text.
   */
  async writeNew(relativePath: string, content: string): Promise<void> {
    await writeFile(this.absolute(relativePath), content, { encoding: 'utf8', flag: 'wx' })
  }

  /**
   * Read one file as UTF-8 text.
   * @param relativePath - vault-relative path.
   */
  async readText(relativePath: string): Promise<string> {
    return readFile(this.absolute(relativePath), 'utf8')
  }

  /**
   * Replace one file's text.
   * @param relativePath - vault-relative path.
   * @param content - new text.
   */
  async writeText(relativePath: string, content: string): Promise<void> {
    await writeFile(this.absolute(relativePath), content, 'utf8')
  }

  /**
   * Read one file as raw bytes.
   * @param relativePath - vault-relative path.
   */
  async readBytes(relativePath: string): Promise<Buffer> {
    return readFile(this.absolute(relativePath))
  }

  /**
   * Replace one file's bytes, creating missing parent directories.
   * @param relativePath - vault-relative path.
   * @param data - new content.
   */
  async writeBytes(relativePath: string, data: Uint8Array): Promise<void> {
    const target = this.absolute(relativePath)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, data)
  }

  /**
   * Whether a path exists.
   * @param relativePath - vault-relative path.
   */
  async exists(relativePath: string): Promise<boolean> {
    try {
      await stat(this.absolute(relativePath))
      return true
    } catch {
      return false
    }
  }

  /**
   * Recursively list the vault's files with stats, skipping dot-directories
   * (`.obsidian`, `.trash`) — the bridge's frame builds its TFile cache from it.
   * @returns one entry per file, vault-relative paths with `/` separators.
   */
  async list(): Promise<BridgeFileDto[]> {
    const out: BridgeFileDto[] = []
    const walk = async (directory: string, prefix: string): Promise<void> => {
      const entries = await readdir(directory, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue
        const path = prefix === '' ? entry.name : `${prefix}/${entry.name}`
        if (entry.isDirectory()) {
          await walk(join(directory, entry.name), path)
          continue
        }
        const stats = await stat(join(directory, entry.name))
        out.push({
          path,
          name: entry.name,
          extension: extname(entry.name).slice(1).toLowerCase(),
          size: stats.size,
          mtime: stats.mtimeMs,
          ctime: stats.birthtimeMs,
        })
      }
    }
    await walk(this.root, '')
    return out
  }

  /**
   * Move one entry to a new path, creating the parent directory.
   * @param from - current vault-relative path.
   * @param to - destination vault-relative path.
   */
  async move(from: string, to: string): Promise<void> {
    const target = this.absolute(to)
    await mkdir(dirname(target), { recursive: true })
    await rename(this.absolute(from), target)
  }

  /**
   * Copy one entry into `.trash/<tag>/` as a rollback point.
   * @param relativePath - vault-relative path.
   * @param tag - folder name under `.trash`.
   * @returns the vault-relative backup path.
   */
  async backup(relativePath: string, tag: string): Promise<string> {
    const name = relativePath.slice(relativePath.lastIndexOf('/') + 1)
    const target = `.trash/${tag}/${name}`
    await mkdir(dirname(this.absolute(target)), { recursive: true })
    await copyFile(this.absolute(relativePath), this.absolute(target))
    return target
  }

  /**
   * Move one entry into `.trash` instead of deleting it, mirroring Obsidian's
   * default so a mis-click stays recoverable.
   * @param relativePath - vault-relative path.
   * @returns the vault-relative trash path.
   */
  async moveToTrash(relativePath: string): Promise<string> {
    const trash = '.trash'
    await mkdir(this.absolute(trash), { recursive: true })
    const name = relativePath.slice(relativePath.lastIndexOf('/') + 1)
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const target = `${trash}/${stamp}-${name}`
    await rename(this.absolute(relativePath), this.absolute(target))
    return target
  }

  /**
   * Create a directory, including missing parents, inside the vault.
   * @param relativePath - vault-relative directory path.
   */
  async mkdir(relativePath: string): Promise<void> {
    await mkdir(this.absolute(relativePath), { recursive: true })
  }

  /** The root directory, with `/` separators normalized by Node on use. */
  get directory(): string {
    return this.root
  }

  /** Separator this platform uses, for building display paths. */
  get separator(): string {
    return sep
  }
}
