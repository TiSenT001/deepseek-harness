/**
 * Plugin inventory: the DSH-adapted plugin folder, which is global (inside the
 * plugin package) and injected by the caller, plus the built-in plugin
 * enablement Obsidian records in `core-plugins.json`. This module never loads
 * third-party code: the panel shows what is installed and lets the user flip a
 * flag.
 * @module dsh-obsidian-vault/vault/plugins
 */
import { spawn } from 'node:child_process'
import { mkdir, readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import type { CorePluginDto, PluginDto, PluginsDto } from '../protocol.ts'
import { CONFIG_DIRECTORY, readObsidianConfig, writeObsidianConfig } from './obsidian-config.ts'

/** Obsidian's built-in plugin ids, in the order its settings list them, with the state a fresh vault starts from. */
const CORE_DEFAULTS: readonly (readonly [string, boolean])[] = [
  ['file-explorer', true],
  ['global-search', true],
  ['switcher', true],
  ['graph', true],
  ['backlink', true],
  ['canvas', true],
  ['outgoing-link', true],
  ['tag-pane', true],
  ['footnotes', false],
  ['properties', true],
  ['page-preview', true],
  ['daily-notes', false],
  ['templates', false],
  ['note-composer', true],
  ['command-palette', true],
  ['slash-command', false],
  ['editor-status', true],
  ['bookmarks', true],
  ['markdown-importer', false],
  ['zk-prefixer', false],
  ['random-note', false],
  ['outline', true],
  ['word-count', true],
  ['slides', false],
  ['audio-recorder', false],
  ['workspaces', false],
  ['file-recovery', true],
  ['publish', false],
  ['sync', false],
  ['bases', true],
  ['webviewer', false],
]

/** The subset of `manifest.json` the panel displays. */
interface Manifest {
  readonly id?: unknown
  readonly name?: unknown
  readonly version?: unknown
  readonly author?: unknown
  readonly description?: unknown
}

/**
 * Read everything the plugin panel shows.
 * @param root - vault directory holding `.obsidian`.
 * @param dshFolder - global DSH-adapted plugin folder, shared by every vault.
 * @returns the inventory; an absent `core-plugins.json` falls back to Obsidian's defaults.
 */
export async function listPlugins(root: string, dshFolder: string): Promise<PluginsDto> {
  return {
    core: await corePlugins(root),
    dsh: await pluginManifests(dshFolder),
    dshFolder,
    community: await pluginManifests(join(root, CONFIG_DIRECTORY, 'plugins')),
  }
}

/**
 * Flip one built-in plugin, keeping whichever format the file already uses.
 * `core-plugins.json` is either an object of booleans or, in older vaults, an
 * array listing only the enabled ids.
 * @param root - vault directory holding `.obsidian`.
 * @param id - core plugin id.
 * @param enabled - desired state.
 */
export async function setCorePluginEnabled(root: string, id: string, enabled: boolean): Promise<void> {
  const value = await readObsidianConfig(root, 'core-plugins')
  if (Array.isArray(value)) {
    const current = value.filter((entry): entry is string => typeof entry === 'string')
    const next = enabled
      ? (current.includes(id) ? current : [...current, id])
      : current.filter(entry => entry !== id)
    await writeObsidianConfig(root, 'core-plugins', next)
    return
  }
  const state = coreState(value)
  state.set(id, enabled)
  await writeObsidianConfig(root, 'core-plugins', Object.fromEntries(state))
}

/**
 * Create the DSH plugin folder when missing and open it in the OS file
 * manager; users only ever place DSH-adapted plugins themselves.
 * @param folder - global DSH-adapted plugin folder.
 * @returns the folder path, so the caller can show it.
 */
export async function revealPluginsFolder(folder: string): Promise<string> {
  await mkdir(folder, { recursive: true })
  const command = process.platform === 'win32' ? 'explorer' : process.platform === 'darwin' ? 'open' : 'xdg-open'
  spawn(command, [folder], { detached: true, stdio: 'ignore' }).unref()
  return folder
}

/** Directory names under the plugin folder, sorted. */
async function installedIds(folder: string): Promise<string[]> {
  const entries = await readdir(folder, { withFileTypes: true })
  return entries
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
    .map(entry => entry.name)
    .sort()
}

/**
 * Manifests under one plugin folder. Entries are display-only metadata; the
 * bridge whitelist decides which community ids may actually run.
 */
async function pluginManifests(folder: string): Promise<PluginDto[]> {
  if (!(await exists(folder))) return []
  const plugins: PluginDto[] = []
  for (const id of await installedIds(folder)) {
    const manifest = await readManifest(folder, id)
    plugins.push({
      id,
      name: text(manifest?.name) ?? id,
      ...optional('version', text(manifest?.version)),
      ...optional('author', text(manifest?.author)),
      ...optional('description', text(manifest?.description)),
    })
  }
  plugins.sort((left, right) => left.name.localeCompare(right.name))
  return plugins
}

/** Parse one plugin manifest; a missing or broken file leaves the folder name as the label. */
async function readManifest(folder: string, id: string): Promise<Manifest | undefined> {
  try {
    const parsed: unknown = JSON.parse(await readFile(join(folder, id, 'manifest.json'), 'utf8'))
    return typeof parsed === 'object' && parsed !== null ? parsed as Manifest : undefined
  } catch {
    return undefined
  }
}

/** Built-in plugins: known ids first, then any extra ids the config names. */
async function corePlugins(root: string): Promise<CorePluginDto[]> {
  const stored = await readObsidianConfig(root, 'core-plugins')
  const state = coreState(stored)
  return [...state].map(([id, enabled]) => ({ id, enabled }))
}

/**
 * Normalize `core-plugins.json`, preserving its order: known ids in Obsidian's
 * default order, then any extra ids from the file. An array names enabled ids;
 * anything else falls back to the defaults.
 */
function coreState(value: unknown): Map<string, boolean> {
  if (Array.isArray(value)) {
    const enabled = new Set(value.filter((entry): entry is string => typeof entry === 'string'))
    const state = new Map(CORE_DEFAULTS.map(([id]) => [id, enabled.has(id)]))
    for (const id of enabled) if (!state.has(id)) state.set(id, true)
    return state
  }
  const stored = plainObject(value)
  // The object format lists every plugin, so a missing key is a disabled one;
  // only a wholly absent file falls back to the defaults.
  const state = new Map(CORE_DEFAULTS.map(([id, fallback]) => [id, stored === undefined ? fallback : stored[id] === true]))
  if (stored !== undefined) {
    for (const [id, on] of Object.entries(stored)) if (!state.has(id)) state.set(id, on === true)
  }
  return state
}

function plainObject(value: unknown): Readonly<Record<string, unknown>> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Readonly<Record<string, unknown>>
    : undefined
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function optional<K extends 'version' | 'author' | 'description'>(key: K, value: string | undefined): { [P in K]?: string } {
  return value === undefined ? {} : { [key]: value } as { [P in K]?: string }
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}
