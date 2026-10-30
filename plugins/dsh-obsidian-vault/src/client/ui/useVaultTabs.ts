/**
 * The split-pane tab model and its navigation verbs: opening (preview or
 * permanent), selecting, pinning, closing, history, reordering, splitting, and
 * the reveal anchor. Tab operations target the active pane; path retargets map
 * every pane.
 * @module dsh-obsidian-vault/client/ui/useVaultTabs
 */
import { useCallback, useState } from 'react'
import { noteOpen } from '../api.ts'
import {
  activePane as activePaneOf, closePane as reduceClosePane, EMPTY_PANES, mapActive, mapAllPanes,
  resizePanePair as reduceResizePair, splitPane as reduceSplit, activatePane as reduceActivate,
  type PanesState, type SplitDirection,
} from './panes.ts'
import {
  closeOthers as reduceCloseOthers, closeTab as reduceCloseTab, goBack as reduceBack,
  goForward as reduceForward, openTab as reduceOpen, pinTab as reducePin, reorderTabs,
  selectTab as reduceSelect, type TabsState,
} from './tabs.ts'

/** Options accepted by {@link VaultTabs.openPath}. */
export interface OpenOptions {
  readonly preview?: boolean
  readonly newTab?: boolean
  readonly anchor?: string
}

/** Everything the page needs from the pane model. */
export interface VaultTabs {
  /** Every pane in layout order. */
  readonly panes: PanesState['panes']
  /** Index of the focused pane. */
  readonly activePane: number
  /** How the pane strip lays out. */
  readonly direction: SplitDirection
  /** The active pane's tabs. */
  readonly tabs: TabsState
  /** Heading or block id the reading view must reveal. */
  readonly anchor: string | undefined
  readonly openPath: (path: string, options?: OpenOptions) => void
  readonly selectTab: (index: number) => void
  readonly pinTab: (index: number) => void
  readonly closeTab: (index: number) => void
  readonly closeOthers: (index: number) => void
  readonly closeAll: () => void
  readonly goBack: () => void
  readonly goForward: () => void
  readonly moveTab: (from: number, to: number) => void
  /** Focus one pane by index. */
  readonly activatePane: (index: number) => void
  /** Split the active pane, moving its active tab into a new one. */
  readonly splitPane: (direction: SplitDirection) => void
  /** Close the active pane, dropping its tabs. */
  readonly closePane: () => void
  /** Resize the pane pair around divider `index`; `first` is the share before it. */
  readonly resizePanePair: (index: number, first: number) => void
  /** Apply a tab transition to every pane (rename, move, delete retargets). */
  readonly mapTabs: (fn: (tabs: TabsState) => TabsState) => void
  /** Drop every pane and the pending anchor (used on a vault switch). */
  readonly reset: () => void
}

/**
 * Own the pane state.
 * @returns the pane snapshot plus every mutation the UI dispatches.
 */
export function useVaultTabs(): VaultTabs {
  const [state, setState] = useState<PanesState>(EMPTY_PANES)
  const [anchor, setAnchor] = useState<string | undefined>()

  const openPath = useCallback((next: string, options: OpenOptions = {}) => {
    setAnchor(options.anchor)
    setState(previous => mapActive(previous, tabs => reduceOpen(tabs, next, {
      ...(options.preview === true ? { preview: true } : {}),
      ...(options.newTab === true ? { newTab: true } : {}),
    })))
    void noteOpen(next)
  }, [])

  const selectTab = useCallback((index: number) => {
    setState(previous => mapActive(previous, tabs => reduceSelect(tabs, index)))
    setAnchor(undefined)
  }, [])

  const pinTab = useCallback((index: number) => {
    setState(previous => mapActive(previous, tabs => reducePin(tabs, index)))
  }, [])

  const closeTab = useCallback((index: number) => {
    setState(previous => mapActive(previous, tabs => reduceCloseTab(tabs, index)))
    setAnchor(undefined)
  }, [])

  const closeOthers = useCallback((index: number) => {
    setState(previous => mapActive(previous, tabs => reduceCloseOthers(tabs, index)))
    setAnchor(undefined)
  }, [])

  const closeAll = useCallback(() => {
    setState(previous => mapActive(previous, () => ({ items: [], active: 0 })))
    setAnchor(undefined)
  }, [])

  const goBack = useCallback(() => {
    setState(previous => mapActive(previous, reduceBack))
    setAnchor(undefined)
  }, [])

  const goForward = useCallback(() => {
    setState(previous => mapActive(previous, reduceForward))
    setAnchor(undefined)
  }, [])

  const moveTab = useCallback((from: number, to: number) => {
    setState(previous => mapActive(previous, tabs => reorderTabs(tabs, from, to)))
  }, [])

  const activatePane = useCallback((index: number) => {
    setState(previous => reduceActivate(previous, index))
    setAnchor(undefined)
  }, [])

  const splitPane = useCallback((direction: SplitDirection) => {
    setState(previous => reduceSplit(previous, direction))
  }, [])

  const closePane = useCallback(() => {
    setState(previous => reduceClosePane(previous))
    setAnchor(undefined)
  }, [])

  const resizePanePair = useCallback((index: number, first: number) => {
    setState(previous => reduceResizePair(previous, index, first))
  }, [])

  const mapTabs = useCallback((fn: (tabs: TabsState) => TabsState) => {
    setState(previous => mapAllPanes(previous, fn))
  }, [])

  const reset = useCallback(() => {
    setState(EMPTY_PANES)
    setAnchor(undefined)
  }, [])

  return {
    panes: state.panes,
    activePane: state.active,
    direction: state.direction,
    tabs: activePaneOf(state).tabs,
    anchor,
    openPath, selectTab, pinTab, closeTab, closeOthers, closeAll, goBack, goForward, moveTab,
    activatePane, splitPane, closePane, resizePanePair, mapTabs, reset,
  }
}
