/**
 * Document-tab model: preview tabs, per-tab history, and every transition the
 * page needs. Pure functions so the behaviour is unit-testable without React.
 * @module dsh-obsidian-vault/client/ui/tabs
 */

/** Per-tab navigation history. */
export interface TabHistory {
  readonly items: readonly string[]
  readonly index: number
}

/** One open document. A preview tab is reused by the next single click. */
export interface DocTab {
  readonly path: string
  readonly preview: boolean
  readonly history: TabHistory
}

/** All open tabs plus the active index. */
export interface TabsState {
  readonly items: readonly DocTab[]
  readonly active: number
}

/** Options for {@link openTab}. */
export interface OpenOptions {
  /** Open as a preview tab (single click in the explorer). */
  readonly preview?: boolean
  /** Always append a new permanent tab. */
  readonly newTab?: boolean
}

/** No open tabs. */
export const EMPTY_TABS: TabsState = { items: [], active: 0 }

/**
 * Build one fresh tab.
 * @param path - vault-relative note path.
 * @param preview - whether it is a preview tab.
 */
export function makeTab(path: string, preview: boolean): DocTab {
  return { path, preview, history: { items: [path], index: 0 } }
}

/**
 * Append a path to a history, dropping the forward branch.
 * @param history - current history.
 * @param path - path being opened.
 */
export function pushHistory(history: TabHistory, path: string): TabHistory {
  if (history.items[history.index] === path) return history
  const items = [...history.items.slice(0, history.index + 1), path]
  return { items, index: items.length - 1 }
}

/** The active tab, when any. */
export function activeTab(state: TabsState): DocTab | undefined {
  return state.items[state.active]
}

/**
 * Open a path according to Obsidian's rules: preview tabs are reused, permanent
 * opens replace the active tab, and `newTab` always appends.
 * @param state - current tabs.
 * @param path - path to open.
 * @param options - preview/new-tab flags.
 */
export function openTab(state: TabsState, path: string, options: OpenOptions = {}): TabsState {
  const existing = state.items.findIndex(tab => tab.path === path)
  if (options.newTab === true) {
    return { items: [...state.items, makeTab(path, false)], active: state.items.length }
  }
  if (existing !== -1) {
    const items = state.items.map((tab, index) => index === existing
      ? {
        ...tab,
        preview: options.preview === true ? tab.preview : false,
        history: pushHistory(tab.history, path),
      }
      : tab)
    return { items, active: existing }
  }
  if (options.preview === true) {
    const current = activeTab(state)
    if (current !== undefined && current.preview) {
      // The preview tab is reused, but the navigation still joins its history
      // so the back/forward arrows walk every file the user clicked through.
      const items = state.items.map((tab, index) => (index === state.active
        ? { ...tab, path, history: pushHistory(tab.history, path) }
        : tab))
      return { items, active: state.active }
    }
    return { items: [...state.items, makeTab(path, true)], active: state.items.length }
  }
  if (state.items.length === 0) return { items: [makeTab(path, false)], active: 0 }
  const items = state.items.map((tab, index) => index === state.active
    ? { ...tab, path, preview: false, history: pushHistory(tab.history, path) }
    : tab)
  return { items, active: state.active }
}

/**
 * Activate one tab.
 * @param state - current tabs.
 * @param index - tab index.
 */
export function selectTab(state: TabsState, index: number): TabsState {
  if (index < 0 || index >= state.items.length || state.active === index) return state
  return { items: state.items, active: index }
}

/**
 * Make a preview tab permanent.
 * @param state - current tabs.
 * @param index - tab index.
 */
export function pinTab(state: TabsState, index: number): TabsState {
  return {
    items: state.items.map((tab, position) => (position === index ? { ...tab, preview: false } : tab)),
    active: state.active,
  }
}

/**
 * Close one tab, keeping a neighbour active.
 * @param state - current tabs.
 * @param index - tab index.
 */
export function closeTab(state: TabsState, index: number): TabsState {
  const items = state.items.filter((_, position) => position !== index)
  if (items.length === 0) return EMPTY_TABS
  const active = Math.min(state.active > index ? state.active - 1 : state.active, items.length - 1)
  return { items, active }
}

/**
 * Move one tab to another position, keeping the same document active.
 * @param state - current tabs.
 * @param from - index being dragged.
 * @param to - drop index in the current order.
 */
export function reorderTabs(state: TabsState, from: number, to: number): TabsState {
  const count = state.items.length
  if (from === to || from < 0 || to < 0 || from >= count || to >= count) return state
  const items = [...state.items]
  const moved = items.splice(from, 1)[0]
  if (moved === undefined) return state
  items.splice(to, 0, moved)
  let active = state.active
  if (active === from) active = to
  else if (from < active && to >= active) active -= 1
  else if (from > active && to <= active) active += 1
  return { items, active }
}

/**
 * Close every tab except one.
 * @param state - current tabs.
 * @param index - tab to keep.
 */
export function closeOthers(state: TabsState, index: number): TabsState {
  const tab = state.items[index]
  return tab === undefined ? state : { items: [tab], active: 0 }
}

/** Navigate the active tab back one step. */
export function goBack(state: TabsState): TabsState {
  const tab = activeTab(state)
  if (tab === undefined || tab.history.index <= 0) return state
  const index = tab.history.index - 1
  const target = tab.history.items[index]
  if (target === undefined) return state
  const items = state.items.map((item, position) => position === state.active
    ? { ...item, path: target, history: { items: tab.history.items, index } }
    : item)
  return { items, active: state.active }
}

/** Navigate the active tab forward one step. */
export function goForward(state: TabsState): TabsState {
  const tab = activeTab(state)
  if (tab === undefined || tab.history.index >= tab.history.items.length - 1) return state
  const index = tab.history.index + 1
  const target = tab.history.items[index]
  if (target === undefined) return state
  const items = state.items.map((item, position) => position === state.active
    ? { ...item, path: target, history: { items: tab.history.items, index } }
    : item)
  return { items, active: state.active }
}

/**
 * Drop tabs whose path was deleted; a folder path also drops tabs inside it.
 * Returns the same state when nothing changes.
 * @param state - current tabs.
 * @param path - removed path (note or folder).
 */
export function removePath(state: TabsState, path: string): TabsState {
  const match = (candidate: string): boolean => candidate === path || candidate.startsWith(`${path}/`)
  if (!state.items.some(tab => match(tab.path))) return state
  const removedBefore = state.items.slice(0, state.active).filter(tab => match(tab.path)).length
  const items = state.items.filter(tab => !match(tab.path))
  if (items.length === 0) return EMPTY_TABS
  return { items, active: Math.min(state.active - removedBefore, items.length - 1) }
}

/**
 * Retarget tabs after a rename or move; a folder path also retargets tabs
 * inside it, and each tab's history follows along.
 * @param state - current tabs.
 * @param from - old path (note or folder).
 * @param to - new path.
 */
export function remapPath(state: TabsState, from: string, to: string): TabsState {
  const map = (candidate: string): string =>
    candidate === from ? to : candidate.startsWith(`${from}/`) ? `${to}${candidate.slice(from.length)}` : candidate
  if (!state.items.some(tab => map(tab.path) !== tab.path)) return state
  const items = state.items.map((tab) => {
    const path = map(tab.path)
    if (path === tab.path) return tab
    return { ...tab, path, history: { items: tab.history.items.map(map), index: tab.history.index } }
  })
  return { items, active: state.active }
}
