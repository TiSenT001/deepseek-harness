/**
 * Plugin and bridge endpoints: the installed-plugin list, toggles, the framed
 * plugin URL, and the file/data bridge the sandboxed plugin frame calls.
 * @module dsh-obsidian-vault/client/api-plugins
 */
import { API_BASE, type BridgeFileDto, type PluginsDto } from '../protocol.ts'
import { ApiError, request } from './api-core.ts'

export function fetchPlugins(): Promise<PluginsDto> {
  return request<PluginsDto>('plugins/list')
}

/**
 * Enable or disable one built-in plugin.
 * @param id - core plugin id.
 * @param enabled - desired state.
 * @returns the refreshed inventory.
 */
export function togglePlugin(id: string, enabled: boolean): Promise<PluginsDto> {
  return request<PluginsDto>('plugins/toggle', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id, enabled }),
  })
}

/** Create the DSH plugin folder when missing and open it in the OS file manager. */
export function revealPluginsFolder(): Promise<{ folder: string }> {
  return request<{ folder: string }>('plugins/reveal', { method: 'POST' })
}


/**
 * Read one vault file as base64 bytes; parts of the bridge call this for the
 * plugin frame.
 * @param path - vault-relative path.
 */
export async function bridgeReadBinary(path: string): Promise<string> {
  return (await request<{ data: string }>(`bridge/read-binary?path=${encodeURIComponent(path)}`)).data
}

/**
 * Replace one vault file with base64 bytes.
 * @param path - vault-relative path.
 * @param data - base64-encoded content.
 */
export async function bridgeWriteBinary(path: string, data: string): Promise<void> {
  await request('bridge/write-binary', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path, data }),
  })
}


/** One vault file read with its version, so a later write can detect conflicts. */
export interface VaultTextRead {
  /** File contents. */
  readonly content: string
  /** Modification time the read observed; absent when the platform cannot report one. */
  readonly mtime?: number
}

/**
 * Read one vault file and the version it carried, on the frame behalf.
 * @param path - vault-relative path.
 * @returns the text and its modification time.
 */
export async function bridgeReadTextVersion(path: string): Promise<VaultTextRead> {
  const result = await request<{ content: string; mtime?: number }>(`bridge/read-text?path=${encodeURIComponent(path)}`)
  return result.mtime === undefined ? { content: result.content } : { content: result.content, mtime: result.mtime }
}

/**
 * A write that lost a race with another writer: the file changed after the
 * caller loaded it.
 */
export class VaultWriteConflict extends Error {
  /** Version of the file that won the race. */
  readonly mtime: number | undefined

  /** @param mtime - the version on disk when the write was rejected. */
  constructor(mtime: number | undefined) {
    super('vault write conflict')
    this.name = 'VaultWriteConflict'
    this.mtime = mtime
  }
}

/**
 * Read one vault file as text, on the frame behalf.
 * @param path - vault-relative path.
 */
export async function bridgeReadText(path: string): Promise<string> {
  return (await request<{ content: string }>(`bridge/read-text?path=${encodeURIComponent(path)}`)).content
}

/**
 * Replace one vault file's text content, on the frame's behalf.
 * @param path - vault-relative path.
 * @param content - new file content.
 */
/**
 * Replace one vault file's text content, on the frame behalf.
 * @param path - vault-relative path.
 * @param content - new file content.
 * @param expectedMtime - version the caller loaded; a mismatch aborts the write
 *   with {@link VaultWriteConflict} instead of overwriting another writer.
 * @returns the version written, when the host reports one.
 */
export async function bridgeWriteText(path: string, content: string, expectedMtime?: number): Promise<{ mtime?: number }> {
  try {
    return await request<{ mtime?: number }>('bridge/write-text', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(expectedMtime === undefined ? { path, content } : { path, content, expectedMtime }),
    })
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) throw new VaultWriteConflict(undefined)
    throw error
  }
}

/** List every vault file with stats; the frame builds its TFile cache from it. */
export async function bridgeListFiles(): Promise<readonly BridgeFileDto[]> {
  return (await request<{ files: BridgeFileDto[] }>('bridge/list')).files
}

/**
 * Whether one vault path exists, on the frame's behalf.
 * @param path - vault-relative path.
 */
export async function bridgeExists(path: string): Promise<boolean> {
  return (await request<{ exists: boolean }>(`bridge/exists?path=${encodeURIComponent(path)}`)).exists
}
