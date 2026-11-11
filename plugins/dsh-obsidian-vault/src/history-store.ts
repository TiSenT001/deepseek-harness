/**
 * Local file-recovery snapshots. Every successful note save keeps the previous
 * text in the plugin data folder, per vault and path, capped at
 * {@link MAX_SNAPSHOTS}; Obsidian's File recovery works the same way.
 * @module dsh-obsidian-vault/history-store
 */
import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readdir, readFile, stat, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { PLUGIN_DATA_FOLDER } from './package-root.ts'

/** Folder holding every snapshot file; names are `<key>.<ms>-<rand>.md`. */
const HISTORY_DIR = join(PLUGIN_DATA_FOLDER, 'history')
/** Snapshots kept per note. */
const MAX_SNAPSHOTS = 20
/** One stored version, as the client lists it. */
export interface HistoryEntry {
  readonly id: string
  readonly savedAt: number
  readonly size: number
}

/**
 * Stable opaque key for one (vault, path) pair.
 * @param root - absolute vault root.
 * @param path - vault-relative note path.
 * @returns a short hex digest.
 */
function keyOf(root: string, path: string): string {
  return createHash('sha1').update(`${root}\u0000${path}`).digest('hex').slice(0, 24)
}

/** Snapshot file name for a key and time. */
function snapshotName(key: string, savedAt: number): string {
  return `${key}.${savedAt}-${randomUUID().slice(0, 8)}.md`
}

/** Parse a snapshot file name; foreign names return undefined. */
export function parseSnapshotId(id: string, key: string): { readonly savedAt: number } | undefined {
  if (!id.startsWith(`${key}.`) || !id.endsWith('.md')) return undefined
  const match = /^(\d+)-[0-9a-f]{8}\.md$/.exec(id.slice(key.length + 1))
  if (match === null) return undefined
  const savedAt = Number(match[1])
  return Number.isFinite(savedAt) ? { savedAt } : undefined
}

/** Snapshot files for one key, newest first. */
async function filesFor(key: string): Promise<string[]> {
  try {
    const names = await readdir(HISTORY_DIR)
    return names
      .filter(name => parseSnapshotId(name, key) !== undefined)
      .sort((left, right) => (left < right ? 1 : left > right ? -1 : 0))
  } catch {
    return []
  }
}

/**
 * Keep the previous body of a note. Empty files and unchanged bodies are not
 * stored twice.
 * @param root - absolute vault root.
 * @param path - vault-relative note path.
 * @param content - body before the save.
 */
export async function snapshotNote(root: string, path: string, content: string): Promise<void> {
  if (content.length === 0) return
  await mkdir(HISTORY_DIR, { recursive: true })
  const key = keyOf(root, path)
  const files = await filesFor(key)
  const latest = files[0]
  if (latest !== undefined) {
    try {
      if (await readFile(join(HISTORY_DIR, latest), 'utf8') === content) return
    } catch {
      // A vanished snapshot should not block the new one.
    }
  }
  await writeFile(join(HISTORY_DIR, snapshotName(key, Date.now())), content, 'utf8')
  for (const stale of files.slice(MAX_SNAPSHOTS - 1)) {
    await unlink(join(HISTORY_DIR, stale)).catch(() => undefined)
  }
}

/**
 * List snapshots for one note, newest first.
 * @param root - absolute vault root.
 * @param path - vault-relative note path.
 */
export async function listHistory(root: string, path: string): Promise<HistoryEntry[]> {
  const key = keyOf(root, path)
  const names = await filesFor(key)
  const entries: HistoryEntry[] = []
  for (const name of names) {
    const parsed = parseSnapshotId(name, key)
    if (parsed === undefined) continue
    try {
      const info = await stat(join(HISTORY_DIR, name))
      entries.push({ id: name, savedAt: parsed.savedAt, size: info.size })
    } catch {
      // A pruned or removed snapshot simply drops out of the list.
    }
  }
  return entries
}

/**
 * Read one snapshot body.
 * @param root - absolute vault root.
 * @param path - vault-relative note path.
 * @param id - snapshot id from {@link listHistory}.
 * @returns the body, or undefined when the id is foreign or missing.
 */
export async function readHistory(root: string, path: string, id: string): Promise<string | undefined> {
  const key = keyOf(root, path)
  if (parseSnapshotId(id, key) === undefined) return undefined
  try {
    return await readFile(join(HISTORY_DIR, id), 'utf8')
  } catch {
    return undefined
  }
}
