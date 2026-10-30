/**
 * Vault registry and Obsidian-config endpoints: which vaults exist, which one
 * is active, and the six whitelisted configuration files.
 * @module dsh-obsidian-vault/client/api-registry
 */
import type {
  ObsidianConfigDto, ObsidianConfigFile, VaultInspectDto, VaultListDto, VaultOpenDto,
} from '../protocol.ts'
import { request } from './api-core.ts'

/** Read the registered vaults and which one is active. */
export function fetchVaults(): Promise<VaultListDto> {
  return request<VaultListDto>('vault/list')
}

/**
 * Probe a candidate vault directory before opening it.
 * @param path - absolute directory.
 */
export function inspectVault(path: string): Promise<VaultInspectDto> {
  return request<VaultInspectDto>(`vault/inspect?path=${encodeURIComponent(path)}`)
}

/**
 * Register and activate a vault directory.
 * @param path - absolute directory.
 * @param init - create `.obsidian` when the folder has none.
 */
export function openVault(path: string, init = false): Promise<VaultOpenDto> {
  return request<VaultOpenDto>('vault/open', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path, init }),
  })
}

/**
 * Create a directory and register it as a vault.
 * @param path - absolute directory.
 * @param name - optional display name.
 */
export function createVault(path: string, name?: string): Promise<VaultOpenDto> {
  return request<VaultOpenDto>('vault/create', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(name === undefined ? { path } : { path, name }),
  })
}

/**
 * Drop one vault from the registry.
 * @param id - registry id.
 * @returns the remaining registry snapshot.
 */
export function forgetVault(id: string): Promise<VaultListDto> {
  return request<VaultListDto>('vault/forget', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id }),
  })
}

/**
 * Read one `.obsidian` configuration file.
 * @param file - configuration file name without its extension.
 * @returns the parsed document, with `null` when the file does not exist.
 */
export function readObsidianConfig(file: ObsidianConfigFile): Promise<ObsidianConfigDto> {
  return request<ObsidianConfigDto>(`config/read?file=${encodeURIComponent(file)}`)
}

/**
 * Merge a patch into one `.obsidian` configuration file.
 * @param file - configuration file name without its extension.
 * @param value - values to set; nested objects merge, arrays replace.
 * @returns the document as written, unknown keys included.
 */
export function writeObsidianConfig(file: ObsidianConfigFile, value: unknown): Promise<ObsidianConfigDto> {
  return request<ObsidianConfigDto>('config/write', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ file, value }),
  })
}

/** Read the DSH-adapted plugins and the built-in plugin states. */
