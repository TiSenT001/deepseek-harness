/**
 * Registry persistence: read and atomically write the JSON file that lists the
 * known vaults and which one is active. Failures report through the caller's
 * sink; a missing or unreadable file is not an error.
 * @module dsh-obsidian-vault/vault/registry-file
 */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { basename, dirname, resolve as resolvePath } from 'node:path'

/** One registered vault, as stored on disk. */
export interface VaultRecord {
  readonly id: string
  readonly path: string
  readonly name: string
  readonly lastOpenedAt: number
}

/** Persisted registry file contents. */
export interface StoredRegistry {
  readonly version: 1
  readonly activeId?: string
  readonly vaults: readonly VaultRecord[]
}

/** Where the registry lives and how failures are reported. */
export interface RegistryFileSettings {
  /** Absolute path of the JSON registry file under the DSH home. */
  readonly storePath: string
  /** Failure sink; persistence is best-effort. */
  readonly report: (error: Error) => void
}

/** Schema version written by this build. */
export const STORE_VERSION = 1

/**
 * Read the registry file.
 * @param settings - file location and failure sink.
 * @returns the stored document, or undefined when absent or unreadable.
 */
export async function readRegistry(settings: RegistryFileSettings): Promise<StoredRegistry | undefined> {
  let text: string
  try {
    text = await readFile(settings.storePath, 'utf8')
  } catch (error) {
    if ((error as { readonly code?: string }).code !== 'ENOENT') settings.report(asError(error))
    return undefined
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (error) {
    settings.report(asError(error))
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

/**
 * Write the registry file atomically (temporary file, then rename).
 * @param settings - file location and failure sink.
 * @param document - the document to persist.
 */
export async function writeRegistry(settings: RegistryFileSettings, document: StoredRegistry): Promise<void> {
  try {
    await mkdir(dirname(settings.storePath), { recursive: true })
    const temporary = `${settings.storePath}.tmp`
    await writeFile(temporary, `${JSON.stringify(document, undefined, 2)}\n`, 'utf8')
    await rename(temporary, settings.storePath)
  } catch (error) {
    settings.report(asError(error))
  }
}

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}
