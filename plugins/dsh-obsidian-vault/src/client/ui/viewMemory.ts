/**
 * Last opened page in the vault workspace. Persisted so reopening the
 * knowledge base (or reloading the page) lands on the note, canvas, or graph
 * view the user left. One record per vault root, because switching vaults must
 * not carry a foreign path across.
 * @module dsh-obsidian-vault/client/ui/viewMemory
 */
import { request } from '../api.ts'

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
}

/** localStorage key holding the JSON record. */
export const VIEW_MEMORY_KEY = 'ov.view.last.v1'

/**
 * Read the stored record.
 * @param raw - stored JSON, or null when absent.
 * @returns the record, or undefined when missing or unreadable.
 */
export function parseViewMemory(raw: string | null): ViewMemory | undefined {
  if (raw === null) return undefined
  try {
    const parsed = JSON.parse(raw) as { readonly root?: unknown; readonly path?: unknown; readonly view?: unknown; readonly rail?: unknown }
    const memory: ViewMemory = {
      ...(typeof parsed.root === 'string' ? { root: parsed.root } : {}),
      ...(typeof parsed.path === 'string' && parsed.path.length > 0 ? { path: parsed.path } : {}),
      ...(parsed.view === 'graph' || parsed.view === 'note' ? { view: parsed.view } : {}),
      ...(typeof parsed.rail === 'string' ? { rail: parsed.rail } : {}),
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
