/**
 * Last opened page in the vault workspace. Persisted so reopening the
 * knowledge base (or reloading the page) lands on the note, canvas, or graph
 * view the user left. One record per vault root, because switching vaults must
 * not carry a foreign path across.
 * @module dsh-obsidian-vault/client/ui/viewMemory
 */
import { request } from '../api.ts'
import type { SavedTab, SavedWorkspace } from './panes.ts'

/** Reading area the user left open. */
export type RememberedView = 'note' | 'graph'

/** What the workspace restores on the next mount. */
export interface ViewMemory {
  /** Vault root the record belongs to; empty until the first status report. */
  readonly root?: string
  /** Path of the active tab, if one was open. */
  readonly path?: string
  /** Reading area: the note itself or the graph. */
  readonly view?: RememberedView
  /** Right-rail panel. */
  readonly rail?: string
  /** Every pane and tab, so a restart keeps the whole workspace. */
  readonly workspace?: SavedWorkspace
}

/** localStorage key holding the JSON record. */
export const VIEW_MEMORY_KEY = 'ov.view.last.v1'

/** Bounds for records read from storage or the Host. */
const MAX_PANES = 8
const MAX_TABS = 50
const MAX_PATH = 4096
const MAX_RAIL = 64

/**
 * Validate a persisted workspace record.
 * @param value - untrusted value from storage or the Host.
 * @returns the record, or undefined when it cannot be trusted.
 */
function sanitizeWorkspace(value: unknown): SavedWorkspace | undefined {
  if (value === null || typeof value !== 'object') return undefined
  const input = value as { readonly panes?: unknown; readonly activePane?: unknown; readonly direction?: unknown }
  if (!Array.isArray(input.panes) || input.panes.length === 0 || input.panes.length > MAX_PANES) return undefined
  if (input.direction !== 'row' && input.direction !== 'column') return undefined
  const panes = []
  for (const paneValue of input.panes) {
    if (paneValue === null || typeof paneValue !== 'object') return undefined
    const pane = paneValue as { readonly tabs?: unknown; readonly active?: unknown; readonly size?: unknown }
    if (!Array.isArray(pane.tabs) || pane.tabs.length > MAX_TABS) return undefined
    if (typeof pane.active !== 'number' || typeof pane.size !== 'number') return undefined
    const tabs: SavedTab[] = []
    for (const tabValue of pane.tabs) {
      if (tabValue === null || typeof tabValue !== 'object') return undefined
      const tab = tabValue as { readonly path?: unknown; readonly preview?: unknown; readonly empty?: unknown }
      if (typeof tab.path !== 'string' || tab.path.length > MAX_PATH) return undefined
      if (tab.path.length === 0) {
        // Only the explicit new-tab placeholder may have no path.
        if (tab.empty !== true) return undefined
        tabs.push({ path: '', empty: true })
        continue
      }
      tabs.push({ path: tab.path, ...(tab.preview === true ? { preview: true } : {}) })
    }
    panes.push({ tabs, active: pane.active, size: pane.size })
  }
  if (typeof input.activePane !== 'number') return undefined
  return { panes, activePane: input.activePane, direction: input.direction }
}

/**
 * Read the stored record.
 * @param raw - stored JSON, or null when absent.
 * @returns the record, or undefined when missing or unreadable.
 */
export function parseViewMemory(raw: string | null): ViewMemory | undefined {
  if (raw === null) return undefined
  try {
    const parsed = JSON.parse(raw) as { readonly root?: unknown; readonly path?: unknown; readonly view?: unknown; readonly rail?: unknown; readonly workspace?: unknown }
    const workspace = sanitizeWorkspace(parsed.workspace)
    const memory: ViewMemory = {
      ...(typeof parsed.root === 'string' ? { root: parsed.root } : {}),
      ...(typeof parsed.path === 'string' && parsed.path.length > 0 ? { path: parsed.path } : {}),
      ...(parsed.view === 'graph' || parsed.view === 'note' ? { view: parsed.view } : {}),
      ...(typeof parsed.rail === 'string' ? { rail: parsed.rail } : {}),
      ...(workspace === undefined ? {} : { workspace }),
    }
    return memory
  } catch {
    // A truncated or hand-edited entry just means "open the first paint state".
    return undefined
  }
}

/**
 * Serialize a record for storage.
 * @param memory - current view state.
 * @returns the JSON string.
 */
export function serializeViewMemory(memory: ViewMemory): string {
  return JSON.stringify({
    ...(memory.root === undefined ? {} : { root: memory.root }),
    ...(memory.path === undefined ? {} : { path: memory.path }),
    ...(memory.view === undefined ? {} : { view: memory.view }),
    ...(memory.rail === undefined ? {} : { rail: memory.rail }),
    ...(memory.workspace === undefined ? {} : { workspace: memory.workspace }),
  })
}

/**
 * Read the stored record; storage failures fall back to no record.
 * @returns the record, or undefined.
 */
export function readViewMemory(): ViewMemory | undefined {
  try {
    return parseViewMemory(window.localStorage.getItem(VIEW_MEMORY_KEY))
  } catch {
    // Private mode or a blocked store: start from the first paint state.
    return undefined
  }
}

/**
 * Persist a record; a failed write keeps the current session working.
 * @param memory - current view state.
 */
export function writeViewMemory(memory: ViewMemory): void {
  try {
    window.localStorage.setItem(VIEW_MEMORY_KEY, serializeViewMemory(memory))
  } catch {
    // Nothing to retry: the next change tries again.
  }
}

/**
 * Read the durable copy from the Host. localStorage is per browser profile, so
 * the Host copy lets another browser or cleared site data find the page again.
 * @param root - absolute vault root.
 * @returns the record, or undefined when absent or unreachable.
 */
export async function readHostViewMemory(root: string): Promise<ViewMemory | undefined> {
  try {
    const body = await request<{ readonly memory?: unknown }>(`view-memory?root=${encodeURIComponent(root)}`)
    if (body.memory === null || body.memory === undefined) return undefined
    return parseViewMemory(JSON.stringify(body.memory))
  } catch {
    return undefined
  }
}

/**
 * Persist the durable copy. Failures stay silent: the local copy still works
 * for this browser.
 * @param root - absolute vault root.
 * @param memory - current view state.
 */
export function writeHostViewMemory(root: string, memory: ViewMemory): void {
  void request('view-memory', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ root, memory }),
  }).catch(() => undefined)
}
