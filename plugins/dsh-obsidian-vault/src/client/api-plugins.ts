/**
 * Plugin and bridge endpoints: the installed-plugin list, toggles, the framed
 * plugin URL, and the file/data bridge the sandboxed plugin frame calls.
 * @module dsh-obsidian-vault/client/api-plugins
 */
import { API_BASE, type BridgeFileDto, type PluginsDto } from '../protocol.ts'
import { request } from './api-core.ts'

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
 * Allow or forbid one community plugin to run through the bridge.
 * @param id - plugin id.
 * @param enabled - desired state.
 * @returns the refreshed inventory.
 */
export function toggleBridge(id: string, enabled: boolean): Promise<PluginsDto> {
  return request<PluginsDto>('plugins/bridge-toggle', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id, enabled }),
  })
}

/**
 * URL of the sandboxed frame that loads one bridged plugin.
 * @param id - whitelisted plugin id.
 */
export function pluginFrameUrl(id: string): string {
  return `${API_BASE}/plugins/frame?id=${encodeURIComponent(id)}`
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

/**
 * Read one bridged plugin's `data.json`.
 * @param id - plugin id; the Host resolves it under `.obsidian/plugins`.
 */
export async function bridgeReadPluginData(id: string): Promise<unknown> {
  return (await request<{ value: unknown }>(`bridge/data?id=${encodeURIComponent(id)}`)).value
}

/**
 * Write one bridged plugin's `data.json`.
 * @param id - plugin id.
 * @param value - JSON-serializable document.
 */
export async function bridgeWritePluginData(id: string, value: unknown): Promise<void> {
  await request('bridge/data', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id, value }),
  })
}

/**
 * Read one vault file as text, on the frame's behalf.
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
export async function bridgeWriteText(path: string, content: string): Promise<void> {
  await request('bridge/write-text', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path, content }),
  })
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
