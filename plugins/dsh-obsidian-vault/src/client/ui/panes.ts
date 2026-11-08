/**
 * Split-pane model: an ordered list of tab groups (panes), the active pane,
 * and the direction the groups lay out in. Pure functions so the behavior is
 * unit-testable without React.
 * @module dsh-obsidian-vault/client/ui/panes
 */
import { activeTab, closeTab, EMPTY_TABS, makeTab, type TabsState } from './tabs.ts'

/** Layout direction of the pane strip: side by side or stacked. */
export type SplitDirection = 'row' | 'column'

/** One tab group with a stable identity for React keys. */
export interface PaneState {
  readonly id: number
  readonly tabs: TabsState
  /** Flex-grow share of the pane strip; a split halves the source's share. */
  readonly size: number
}

/** The workspace's panes, the focused one, and the next free pane id. */
export interface PanesState {
  readonly panes: readonly PaneState[]
  /** Index into {@link PanesState.panes}. */
  readonly active: number
  readonly direction: SplitDirection
  readonly nextId: number
}

/** A single empty pane. */
export const EMPTY_PANES: PanesState = { panes: [{ id: 0, tabs: EMPTY_TABS, size: 1 }], active: 0, direction: 'row', nextId: 1 }

/** Lower bound for a pane's flex-grow share while resizing. */
export const MIN_PANE_SIZE = 0.05

/** The active pane, always present. */
export function activePane(state: PanesState): PaneState {
  return state.panes[state.active] ?? state.panes[0]!
}

/**
 * Apply a tab transition to one pane. A pane left without tabs collapses
 * unless it is the last one.
 * @param state - current panes.
 * @param index - pane to change.
 * @param fn - the tab transition.
 */
export function mapPane(state: PanesState, index: number, fn: (tabs: TabsState) => TabsState): PanesState {
  const pane = state.panes[index]
  if (pane === undefined) return state
  const tabs = fn(pane.tabs)
  if (tabs === pane.tabs) return state
  if (tabs.items.length === 0 && state.panes.length > 1) {
    const panes = state.panes.filter((_, position) => position !== index)
    const active = state.active > index ? state.active - 1 : Math.min(state.active, panes.length - 1)
    return { ...state, panes, active }
  }
  return { ...state, panes: state.panes.map((item, position) => (position === index ? { ...item, tabs } : item)) }
}

/** Apply a tab transition to the active pane. */
export function mapActive(state: PanesState, fn: (tabs: TabsState) => TabsState): PanesState {
  return mapPane(state, state.active, fn)
}

/**
 * Apply a tab transition to every pane, e.g. a rename or delete that retargets
 * paths vault-wide. Panes emptied by the change collapse unless last.
 */
export function mapAllPanes(state: PanesState, fn: (tabs: TabsState) => TabsState): PanesState {
  let next = state
  for (let index = state.panes.length - 1; index >= 0; index -= 1) {
    next = mapPane(next, index, fn)
  }
  return next
}

/** Focus one pane; out-of-range indexes are ignored. */
export function activatePane(state: PanesState, index: number): PanesState {
  if (index < 0 || index >= state.panes.length || index === state.active) return state
  return { ...state, active: index }
}

/**
 * Split the active pane: its active tab moves into a fresh pane inserted right
 * after it, and the new pane takes focus. Splitting an empty pane adds an
 * empty one.
 * @param state - current panes.
 * @param direction - layout direction the strip shows after the split.
 */
export function splitPane(state: PanesState, direction: SplitDirection): PanesState {
  const source = activePane(state)
  const tab = activeTab(source.tabs)
  const moved: TabsState = tab === undefined ? EMPTY_TABS : { items: [tab], active: 0 }
  const remaining = tab === undefined ? source.tabs : closeTab(source.tabs, source.tabs.active)
  // The new pane takes half the source's share so every other pane keeps its size.
  const half = source.size / 2
  const pane: PaneState = { id: state.nextId, tabs: moved, size: half }
  const panes = state.panes.flatMap((item, position) => {
    const current = position === state.active ? { ...item, tabs: remaining, size: half } : item
    return position === state.active ? [current, pane] : [current]
  })
  return { panes, active: state.active + 1, direction, nextId: state.nextId + 1 }
}

/**
 * Close the active pane, dropping its tabs; the last pane is kept.
 * The pane before it takes focus.
 */
export function closePane(state: PanesState): PanesState {
  if (state.panes.length <= 1) return state
  const panes = state.panes.filter((_, position) => position !== state.active)
  return { ...state, panes, active: Math.min(state.active, panes.length - 1) }
}

/**
 * Resize two neighbouring panes, keeping their combined share constant so the
 * other panes do not move. Both shares clamp to {@link MIN_PANE_SIZE}.
 * @param state - current panes.
 * @param index - index of the pane before the divider.
 * @param first - requested share for that pane; the neighbour takes the rest.
 */
export function resizePanePair(state: PanesState, index: number, first: number): PanesState {
  const a = state.panes[index]
  const b = state.panes[index + 1]
  if (a === undefined || b === undefined) return state
  const sum = a.size + b.size
  const clamped = Math.min(Math.max(first, MIN_PANE_SIZE), sum - MIN_PANE_SIZE)
  if (clamped === a.size) return state
  return {
    ...state,
    panes: state.panes.map((pane, position) =>
      position === index ? { ...pane, size: clamped } : position === index + 1 ? { ...pane, size: sum - clamped } : pane),
  }
}

/** One tab in the persisted workspace record. */
export interface SavedTab {
  readonly path: string
  /** True for a preview tab; the next single click reuses it. */
  readonly preview?: boolean
}

/** One pane in the persisted workspace record. */
export interface SavedPane {
  readonly tabs: readonly SavedTab[]
  readonly active: number
  readonly size: number
}

/** Every pane plus the layout metadata the workspace restores on mount. */
export interface SavedWorkspace {
  readonly panes: readonly SavedPane[]
  readonly activePane: number
  readonly direction: SplitDirection
}

/**
 * Rebuild the live pane state from a stored record. The caller has already
 * validated path strings and bounds; this only clamps indexes and sizes.
 * @param saved - persisted panes.
 * @returns the pane state to hand to the tab hook.
 */
export function panesFromSaved(saved: SavedWorkspace): PanesState {
  const panes: PaneState[] = saved.panes.map((pane, index) => ({
    id: index,
    size: Number.isFinite(pane.size) && pane.size > 0 ? pane.size : 1,
    tabs: {
      items: pane.tabs.map(tab => makeTab(tab.path, tab.preview === true)),
      active: Math.min(Math.max(0, Math.floor(pane.active)), Math.max(0, pane.tabs.length - 1)),
    },
  }))
  if (panes.length === 0) return EMPTY_PANES
  return {
    panes,
    active: Math.min(Math.max(0, Math.floor(saved.activePane)), panes.length - 1),
    direction: saved.direction === 'column' ? 'column' : 'row',
    nextId: panes.length,
  }
}

/**
 * Take a snapshot of the live panes for persistence.
 * @param state - current pane state.
 * @returns the serialisable record, with tab history intentionally dropped.
 */
export function savedFromPanes(state: PanesState): SavedWorkspace {
  return {
    panes: state.panes.map(pane => ({
      tabs: pane.tabs.items.map(tab => ({ path: tab.path, ...(tab.preview ? { preview: true } : {}) })),
      active: pane.tabs.active,
      size: pane.size,
    })),
    activePane: state.active,
    direction: state.direction,
  }
}
