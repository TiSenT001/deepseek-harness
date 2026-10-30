/**
 * Node-backed FsLike for index integration tests: real files in a temp folder.
 * @module tests/helpers/node-fs
 */
import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { FsEntryLike, FsLike, FsTargetLike } from '../../src/vault/index.ts'

/** A filesystem adapter over one real directory. */
export class NodeFs implements FsLike {
  private readonly root: string

  /** @param root - absolute directory root. */
  constructor(root: string) {
    this.root = root
  }

  async resolve(path: string): Promise<FsTargetLike> {
    return { targetKey: path, displayPath: path }
  }

  async listDir(target: FsTargetLike): Promise<readonly FsEntryLike[]> {
    const entries = await readdir(target.displayPath, { withFileTypes: true })
    const out: FsEntryLike[] = []
    for (const entry of entries) {
      const path = join(target.displayPath, entry.name)
      const info = await stat(path).catch(() => undefined)
      out.push({
        name: entry.name,
        type: entry.isDirectory() ? 'directory' : 'file',
        target: { targetKey: path, displayPath: path },
        version: info === undefined ? undefined : `${info.mtimeMs}:${info.size}`,
        size: info?.size,
      })
    }
    return out.sort((left, right) => left.name.localeCompare(right.name))
  }

  async readText(target: FsTargetLike): Promise<string> {
    return readFile(target.displayPath, 'utf8')
  }

  async writeText(target: FsTargetLike, content: string): Promise<unknown> {
    await writeFile(target.displayPath, content, 'utf8')
    return { version: '1' }
  }

  contains(parent: FsTargetLike, child: FsTargetLike): boolean {
    return child.displayPath === parent.displayPath || child.displayPath.startsWith(`${parent.displayPath}\\`)
      || child.displayPath.startsWith(`${parent.displayPath}/`)
  }

  /** The root this adapter serves. */
  get directory(): string {
    return this.root
  }
}

/** Adapter whose text writes always fail, to exercise the direct-write fallback. */
export class ReadOnlyWriteFs extends NodeFs {
  override async writeText(): Promise<unknown> {
    throw new Error('sandbox: write outside the workspace is denied')
  }
}
