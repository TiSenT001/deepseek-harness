/**
 * Graph settings: one persisted object, one loader, one merger. Every control
 * in the settings panel reads and writes a path in this object.
 * @module dsh-obsidian-vault/client/graph/settings
 */

/** One colour group: nodes whose text matches `query` get `color`. */
export interface GraphGroup {
  readonly query: string
  readonly color: string
}

/** Everything the graph settings panel can change. */
export interface GraphSettings {
  readonly filters: {
    readonly query: string
    readonly tag: string
    /** Obsidian's "Existing files only": hide unresolved links. */
    readonly existingOnly: boolean
    readonly showTags: boolean
    readonly showAttachments: boolean
    readonly showOrphans: boolean
  }
  readonly groups: readonly GraphGroup[]
  readonly display: {
    readonly arrows: boolean
    /** Zoom below which labels fade out, 0 (never) … 0.9. */
    readonly textFade: number
    readonly nodeScale: number
    readonly linkWidth: number
  }
  readonly forces: {
    readonly center: number
    readonly repel: number
    readonly link: number
    readonly linkDistance: number
  }
}

/** Defaults mirror Obsidian 1.12.7's graph options (`wQ` in app.js). */
export const DEFAULT_GRAPH_SETTINGS: GraphSettings = {
  filters: {
    query: '',
    tag: '',
    existingOnly: false,
    showTags: false,
    showAttachments: false,
    showOrphans: true,
  },
  groups: [],
  display: {
    arrows: false,
    textFade: 0,
    nodeScale: 1,
    linkWidth: 1,
  },
  forces: {
    center: 0.1,
    repel: 10,
    link: 1,
    linkDistance: 250,
  },
}

const STORAGE_KEY = 'dsh.obsidian.graph.settings'

/** Any subset of {@link GraphSettings}, nested sections included. */
export interface GraphSettingsPatch {
  readonly filters?: Partial<GraphSettings['filters']>
  readonly groups?: readonly GraphGroup[]
  readonly display?: Partial<GraphSettings['display']>
  readonly forces?: Partial<GraphSettings['forces']>
}

/** Deep-merge a stored or partial value over the defaults. */
export function mergeGraphSettings(patch: GraphSettingsPatch | undefined): GraphSettings {
  if (patch === undefined) return DEFAULT_GRAPH_SETTINGS
  return {
    filters: { ...DEFAULT_GRAPH_SETTINGS.filters, ...patch.filters },
    groups: patch.groups ?? DEFAULT_GRAPH_SETTINGS.groups,
    display: { ...DEFAULT_GRAPH_SETTINGS.display, ...patch.display },
    forces: { ...DEFAULT_GRAPH_SETTINGS.forces, ...patch.forces },
  }
}

/**
 * Read the persisted graph settings.
 * @param storage - web storage; defaults to `window.localStorage` when available.
 */
export function loadGraphSettings(storage?: Pick<Storage, 'getItem'> | null): GraphSettings {
  const store = storage === undefined ? defaultStorage() : storage
  if (store === null || store === undefined) return DEFAULT_GRAPH_SETTINGS
  try {
    const raw = store.getItem(STORAGE_KEY)
    if (raw === null || raw.length === 0) return DEFAULT_GRAPH_SETTINGS
    const parsed: unknown = JSON.parse(raw)
    return mergeGraphSettings(typeof parsed === 'object' && parsed !== null ? parsed as GraphSettingsPatch : undefined)
  } catch {
    return DEFAULT_GRAPH_SETTINGS
  }
}

/**
 * Persist the graph settings.
 * @param settings - current values.
 * @param storage - web storage; defaults to `window.localStorage` when available.
 */
export function saveGraphSettings(
  settings: GraphSettings,
  storage?: Pick<Storage, 'setItem'> | null,
): void {
  const store = storage === undefined ? defaultStorage() : storage
  if (store === null || store === undefined) return
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Private mode or a full quota: settings simply do not survive a reload.
  }
}

/**
 * First group whose query matches a node, in declaration order.
 * @param settings - current settings.
 * @param title - node title.
 * @param path - node path.
 * @returns the group color, or undefined when no group matches.
 */
export function groupColorOf(settings: GraphSettings, title: string, path: string): string | undefined {
  const haystack = `${title}\n${path}`.toLowerCase()
  for (const group of settings.groups) {
    const query = group.query.trim().toLowerCase()
    if (query.length > 0 && haystack.includes(query)) return group.color
  }
  return undefined
}

function defaultStorage(): Pick<Storage, 'getItem' | 'setItem'> | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}
