/**
 * Host-side copy of the "last page" record, one entry per vault root. The
 * browser's localStorage is still the fast first paint, but it is per browser
 * profile: opening the workspace from a different browser or after clearing
 * site data used to forget the page. This file is the durable copy.
 * @module dsh-obsidian-vault/view-memory-store
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { PLUGIN_DATA_FOLDER } from './package-root.ts'

/** Reading area the user left open. */
export type StoredView = 'note' | 'graph'

/** One tab in the persisted workspace. */
interface StoredTab {
  readonly path: string
  readonly preview?: boolean
}

/** One pane in the persisted workspace. */
interface StoredPane {
  readonly tabs: readonly StoredTab[]
  readonly active: number
  readonly size: number
}

/** The persisted pane layout. */
interface StoredWorkspace {
  readonly panes: readonly StoredPane[]
  readonly activePane: number
  readonly direction: 'row' | 'column'
}

/** One vault's remembered page. */
export interface StoredViewMemory {
  readonly path?: string
  readonly view?: StoredView
  readonly rail?: string
  readonly workspace?: StoredWorkspace
}

/** File holding every vault's record. */
const STORE_FILE = join(PLUGIN_DATA_FOLDER, 'view-memory.json')
/** Bounds keep a corrupted or hostile payload from growing without limit. */
const MAX_ROOT = 4096
const MAX_PATH = 4096
const MAX_RAIL = 64
const MAX_PANES = 8
const MAX_TABS = 50

interface StoreFile {
  readonly version: 1
  readonly vaults: Record<string, StoredViewMemory>
}

/** Validate one workspace record from disk or a request. */
function sanitizeWorkspace(value: unknown): StoredWorkspace | undefined {
  if (value === null || typeof value !== 'object') return undefined
  const input = value as { readonly panes?: unknown; readonly activePane?: unknown; readonly direction?: unknown }
  if (!Array.isArray(input.panes) || input.panes.length === 0 || input.panes.length > MAX_PANES) return undefined
  if (input.direction !== 'row' && input.direction !== 'column') return undefined
  if (typeof input.activePane !== 'number') return undefined
  const panes: StoredPane[] = []
  for (const paneValue of input.panes) {
    if (paneValue === null || typeof paneValue !== 'object') return undefined
    const pane = paneValue as { readonly tabs?: unknown; readonly active?: unknown; readonly size?: unknown }
    if (!Array.isArray(pane.tabs) || pane.tabs.length > MAX_TABS) return undefined
    if (typeof pane.active !== 'number' || typeof pane.size !== 'number' || !Number.isFinite(pane.size)) return undefined
    const tabs: StoredTab[] = []
    for (const tabValue of pane.tabs) {
      if (tabValue === null || typeof tabValue !== 'object') return undefined
      const tab = tabValue as { readonly path?: unknown; readonly preview?: unknown }
      if (typeof tab.path !== 'string' || tab.path.length === 0 || tab.path.length > MAX_PATH) return undefined
      tabs.push({ path: tab.path, ...(tab.preview === true ? { preview: true } : {}) })
    }
    panes.push({ tabs, active: pane.active, size: pane.size })
  }
  return { panes, activePane: input.activePane, direction: input.direction }
}

/** Validate one record from disk or a request. */
function sanitize(value: unknown): StoredViewMemory | undefined {
  if (value === null || typeof value !== 'object') return undefined
  const input = value as { readonly path?: unknown; readonly view?: unknown; readonly rail?: unknown; readonly workspace?: unknown }
  const memory: { path?: string; view?: StoredView; rail?: string; workspace?: StoredWorkspace } = {}
  if (typeof input.path === 'string' && input.path.length > 0 && input.path.length <= MAX_PATH) memory.path = input.path
  if (input.view === 'note' || input.view === 'graph') memory.view = input.view
  if (typeof input.rail === 'string' && input.rail.length <= MAX_RAIL) memory.rail = input.rail
  const workspace = sanitizeWorkspace(input.workspace)
  if (workspace !== undefined) memory.workspace = workspace
  return Object.keys(memory).length === 0 ? undefined : memory
}

/** Read the store; a missing or corrupt file starts empty. */
async function readStore(): Promise<StoreFile> {
  try {
    const parsed = JSON.parse(await readFile(STORE_FILE, 'utf8')) as { readonly vaults?: unknown }
    const vaults: Record<string, StoredViewMemory> = {}
    if (parsed.vaults !== null && typeof parsed.vaults === 'object') {
      for (const [root, value] of Object.entries(parsed.vaults as Record<string, unknown>)) {
        if (root.length > MAX_ROOT) continue
        const memory = sanitize(value)
        if (memory !== undefined) vaults[root] = memory
      }
    }
    return { version: 1, vaults }
  } catch {
    return { version: 1, vaults: {} }
  }
}

/**
 * Read the remembered page for one vault.
 * @param root - absolute vault root.
 * @returns the stored record, or undefined when none exists.
 */
export async function readStoredViewMemory(root: string): Promise<StoredViewMemory | undefined> {
  if (root.length === 0 || root.length > MAX_ROOT) return undefined
  return (await readStore()).vaults[root]
}

/**
 * Persist the remembered page for one vault.
 * @param root - absolute vault root.
 * @param memory - fields to store; invalid fields are dropped.
 */
export async function writeStoredViewMemory(root: string, memory: unknown): Promise<void> {
  if (root.length === 0 || root.length > MAX_ROOT) return
  const sanitized = sanitize(memory)
  if (sanitized === undefined) return
  const store = await readStore()
  await mkdir(dirname(STORE_FILE), { recursive: true })
  await writeFile(STORE_FILE, JSON.stringify({ ...store, vaults: { ...store.vaults, [root]: sanitized } }), 'utf8')
}
