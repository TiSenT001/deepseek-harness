/**
 * The plugin bridge's vault-side primitives: the whitelist naming which
 * community plugins may run, per-plugin `data.json` storage, and the script
 * the sandboxed frame loads. Everything stays inside the vault root through
 * `VaultFiles`.
 * @module dsh-obsidian-vault/vault/bridge
 */
import { VaultFiles } from './files.ts'
import { readObsidianConfig, writeObsidianConfig } from './obsidian-config.ts'

/** Plugin ids are folder names: no separators, no traversal. */
const PLUGIN_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/

/** Whether a wire value is a usable plugin id. */
export function isPluginId(value: unknown): value is string {
  return typeof value === 'string' && PLUGIN_ID.test(value)
}

/**
 * Read the bridge whitelist: the plugin ids the user explicitly allowed to run.
 * @param root - vault directory holding `.obsidian`.
 * @returns the stored ids; an absent or malformed file means an empty list.
 */
export async function readBridgeWhitelist(root: string): Promise<readonly string[]> {
  const value = await readObsidianConfig(root, 'plugins-bridge')
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === 'string' && isPluginId(entry))
}

/**
 * Add or remove one plugin id in the bridge whitelist.
 * @param root - vault directory holding `.obsidian`.
 * @param id - plugin id; must be a plain folder name.
 * @param enabled - desired state.
 * @returns the whitelist as written.
 */
export async function setBridgeEnabled(root: string, id: string, enabled: boolean): Promise<readonly string[]> {
  if (!isPluginId(id)) throw new Error(`invalid plugin id: ${id}`)
  const current = await readBridgeWhitelist(root)
  const next = enabled ? [...new Set([...current, id])] : current.filter(entry => entry !== id)
  await writeObsidianConfig(root, 'plugins-bridge', next)
  return next
}

/**
 * Read one bridged plugin's `data.json`, the storage Obsidian's `loadData`
 * wraps.
 * @param root - vault directory holding `.obsidian`.
 * @param id - whitelisted plugin id.
 * @returns the parsed document, or `undefined` when absent or unparsable.
 */
export async function readPluginData(root: string, id: string): Promise<unknown> {
  if (!isPluginId(id)) throw new Error(`invalid plugin id: ${id}`)
  let text: string
  try {
    text = await new VaultFiles(root).readText(`.obsidian/plugins/${id}/data.json`)
  } catch (error) {
    if ((error as { readonly code?: string }).code === 'ENOENT') return undefined
    throw error
  }
  try {
    return JSON.parse(text) as unknown
  } catch {
    return undefined
  }
}

/**
 * Write one bridged plugin's `data.json`, the storage Obsidian's `saveData`
 * wraps.
 * @param root - vault directory holding `.obsidian`.
 * @param id - whitelisted plugin id.
 * @param value - JSON-serializable document.
 */
export async function writePluginData(root: string, id: string, value: unknown): Promise<void> {
  if (!isPluginId(id)) throw new Error(`invalid plugin id: ${id}`)
  await new VaultFiles(root).writeText(`.obsidian/plugins/${id}/data.json`, `${JSON.stringify(value, undefined, 2)}\n`)
}

/**
 * Read one whitelisted plugin's bundled script for the sandboxed frame.
 * @param root - vault directory holding `.obsidian`.
 * @param id - plugin id; the caller enforces the whitelist.
 * @returns the script bytes, or `undefined` when the plugin has no `main.js`.
 */
export async function readPluginScript(root: string, id: string): Promise<Buffer | undefined> {
  if (!isPluginId(id)) throw new Error(`invalid plugin id: ${id}`)
  try {
    return await new VaultFiles(root).readBytes(`.obsidian/plugins/${id}/main.js`)
  } catch (error) {
    if ((error as { readonly code?: string }).code === 'ENOENT') return undefined
    throw error
  }
}
