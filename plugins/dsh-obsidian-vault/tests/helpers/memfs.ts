/**
 * In-memory filesystem for index tests: the subset of the Host `fs` service the
 * vault index consumes, keyed by absolute paths.
 * @module tests/helpers/memfs
 */
import type { FsEntryLike, FsLike, FsTargetLike } from '../../src/vault/index.ts'

/** A vault-shaped fake filesystem. */
export class MemFs implements FsLike {
  private readonly files = new Map<string, string>()
  private readonly root: string

  /** @param root - absolute root path used by containment checks. */
  constructor(root: string) {
    this.root = root
  }

  /** Create or replace one file. */
  write(path: string, content: string): void {
    this.files.set(path, content)
  }

  /** Remove one file. */
  remove(path: string): void {
    this.files.delete(path)
  }

  async resolve(path: string): Promise<FsTargetLike> {
    return { targetKey: path, displayPath: path }
  }

  async listDir(target: FsTargetLike): Promise<readonly FsEntryLike[]> {
    const prefix = target.displayPath.endsWith('/') ? target.displayPath : `${target.displayPath}/`
    const seen = new Map<string, FsEntryLike>()
    for (const path of this.files.keys()) {
      if (!path.startsWith(prefix)) continue
      const rest = path.slice(prefix.length)
      const slash = rest.indexOf('/')
      if (slash === -1) {
        seen.set(rest, { name: rest, type: 'file', target: { targetKey: path, displayPath: path }, version: hashOf(this.files.get(path)!), size: this.files.get(path)!.length })
        continue
      }
      const name = rest.slice(0, slash)
      const directory = `${prefix}${name}`
      if (!seen.has(name)) {
        seen.set(name, { name, type: 'directory', target: { targetKey: directory, displayPath: directory } })
      }
    }
    return [...seen.values()].sort((left, right) => left.name.localeCompare(right.name))
  }

  async readText(target: FsTargetLike): Promise<string> {
    const content = this.files.get(target.displayPath)
    if (content === undefined) throw new Error(`ENOENT: ${target.displayPath}`)
    return content
  }

  /** Binary read, so asset routes and the pur image resolver run against this FS. */
  async readBytes(target: FsTargetLike, _signal: AbortSignal | undefined, maxBytes: number): Promise<Uint8Array> {
    const content = this.files.get(target.displayPath)
    if (content === undefined) throw new Error(`ENOENT: ${target.displayPath}`)
    const bytes = Buffer.from(content, 'utf8')
    return bytes.subarray(0, maxBytes)
  }

  async writeText(target: FsTargetLike, content: string): Promise<unknown> {
    this.files.set(target.displayPath, content)
    return { version: '1' }
  }

  contains(parent: FsTargetLike, child: FsTargetLike): boolean {
    return child.displayPath === parent.displayPath || child.displayPath.startsWith(`${parent.displayPath}/`)
  }

  /** The configured vault root. */
  get vaultRoot(): string {
    return this.root
  }
}

/** Content identity for one file, so an edit changes its reported version. */
function hashOf(content: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < content.length; index += 1) {
    hash ^= content.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return `${hash.toString(16)}:${content.length}`
}
