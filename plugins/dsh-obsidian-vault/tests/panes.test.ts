import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  activatePane, closePane, EMPTY_PANES, mapActive, mapAllPanes, mapPane, moveTabBetween, resizePanePair, splitPane,
  type PanesState,
} from '../src/client/ui/panes.ts'
import { EMPTY_TABS, makeTab, openTab, type TabsState } from '../src/client/ui/tabs.ts'

const withTabs = (paths: readonly string[]): TabsState =>
  paths.reduce<TabsState>((state, path) => openTab(state, path, { newTab: true }), EMPTY_TABS)

test('split moves the active tab into a new focused pane', () => {
  const state = splitPane({ ...EMPTY_PANES, panes: [{ id: 0, size: 1, tabs: withTabs(['a', 'b', 'c']) }] }, 'row')
  assert.equal(state.panes.length, 2)
  assert.equal(state.active, 1)
  assert.deepEqual(state.panes[0]!.tabs.items.map(tab => tab.path), ['a', 'b'])
  assert.deepEqual(state.panes[1]!.tabs.items.map(tab => tab.path), ['c'])
  assert.equal(state.direction, 'row')
})

test('splitting an empty pane adds an empty pane without dropping it', () => {
  const state = splitPane(EMPTY_PANES, 'column')
  assert.equal(state.panes.length, 2)
  assert.equal(state.panes[0]!.tabs.items.length, 0)
  assert.equal(state.panes[1]!.tabs.items.length, 0)
  assert.equal(state.direction, 'column')
})

test('mapActive collapses a pane whose last tab closed, keeping focus valid', () => {
  let state = splitPane({ ...EMPTY_PANES, panes: [{ id: 0, size: 1, tabs: withTabs(['a', 'b']) }] }, 'row')
  // Active pane holds [b]; closing it removes the pane and focuses the first.
  state = mapActive(state, tabs => ({ items: [], active: 0 }))
  assert.equal(state.panes.length, 1)
  assert.equal(state.active, 0)
  assert.deepEqual(state.panes[0]!.tabs.items.map(tab => tab.path), ['a'])
  // The last pane never collapses.
  state = mapActive(state, tabs => ({ items: [], active: 0 }))
  assert.equal(state.panes.length, 1)
  assert.equal(state.panes[0]!.tabs.items.length, 0)
})

test('mapPane keeps a single empty pane and adjusts active on collapse', () => {
  let state = splitPane({ ...EMPTY_PANES, panes: [{ id: 0, size: 1, tabs: withTabs(['a', 'b']) }] }, 'row')
  state = activatePane(state, 0)
  // Empty the first pane (which holds [a]) while the second holds [b].
  state = mapPane(state, 0, () => ({ items: [], active: 0 }))
  assert.equal(state.panes.length, 1)
  assert.equal(state.active, 0)
  assert.deepEqual(state.panes[0]!.tabs.items.map(tab => tab.path), ['b'])
})

test('mapAllPanes retargets every pane and collapses emptied ones', () => {
  const state = splitPane({ ...EMPTY_PANES, panes: [{ id: 0, size: 1, tabs: withTabs(['old/a', 'old/b']) }] }, 'row')
  const renamed = mapAllPanes(state, tabs => ({
    items: tabs.items.map(tab => tab.path.startsWith('old/') ? { ...tab, path: `new/${tab.path.slice(4)}` } : tab),
    active: tabs.active,
  }))
  assert.equal(renamed.panes.length, 2)
  assert.deepEqual(renamed.panes[0]!.tabs.items.map(tab => tab.path), ['new/a'])
  assert.deepEqual(renamed.panes[1]!.tabs.items.map(tab => tab.path), ['new/b'])
  const removed = mapAllPanes(renamed, () => ({ items: [], active: 0 }))
  assert.equal(removed.panes.length, 1)
  assert.equal(removed.panes[0]!.tabs.items.length, 0)
})

test('closePane drops the active pane and its tabs; the last pane stays', () => {
  let state = splitPane({ ...EMPTY_PANES, panes: [{ id: 0, size: 1, tabs: withTabs(['a', 'b']) }] }, 'row')
  state = closePane(state)
  assert.equal(state.panes.length, 1)
  assert.deepEqual(state.panes[0]!.tabs.items.map(tab => tab.path), ['a'])
  assert.equal(closePane(state), state)
})

test('activatePane ignores out-of-range and no-op indexes', () => {
  const state = splitPane(EMPTY_PANES, 'row')
  assert.equal(activatePane(state, 5), state)
  assert.equal(activatePane(state, 1), state)
  assert.equal(activatePane(state, 0).active, 0)
})

test('split keeps the moved tab with its history', () => {
  const source = withTabs(['a', 'b'])
  const state = splitPane({ ...EMPTY_PANES, panes: [{ id: 0, size: 1, tabs: source }] }, 'row')
  const moved = state.panes[1]!.tabs.items[0]
  assert.deepEqual(moved, makeTab('b', false))
})

test('split halves the source pane size share', () => {
  const state = splitPane({ ...EMPTY_PANES, panes: [{ id: 0, size: 1, tabs: withTabs(['a', 'b']) }] }, 'row')
  assert.deepEqual(state.panes.map(pane => pane.size), [0.5, 0.5])
})

test('resizePanePair keeps the pair total and clamps to the minimum', () => {
  const state = splitPane({ ...EMPTY_PANES, panes: [{ id: 0, size: 1, tabs: withTabs(['a', 'b']) }] }, 'row')
  const resized = resizePanePair(state, 0, 0.75)
  assert.deepEqual(resized.panes.map(pane => pane.size), [0.75, 0.25])
  const clamped = resizePanePair(resized, 0, 10)
  assert.equal(clamped.panes[0]!.size, 0.95)
  assert.ok(Math.abs(clamped.panes[1]!.size - 0.05) < 1e-9)
  assert.equal(resizePanePair(state, 3, 0.5), state)
})

const twoPanes = (left: readonly string[], right: readonly string[]): PanesState => ({
  panes: [
    { id: 0, size: 1, tabs: withTabs(left) },
    { id: 1, size: 1, tabs: withTabs(right) },
  ],
  active: 0,
  direction: 'row',
  nextId: 2,
})

test('dragging a tab into another pane moves it and focuses that pane', () => {
  const state = moveTabBetween(twoPanes(['a', 'b'], ['c']), 0, 0, 1, 0)
  assert.deepEqual(state.panes[0]!.tabs.items.map(tab => tab.path), ['b'])
  assert.deepEqual(state.panes[1]!.tabs.items.map(tab => tab.path), ['a', 'c'])
  assert.equal(state.active, 1)
})

test('moving the last tab out collapses the source pane', () => {
  const state = moveTabBetween(twoPanes(['a'], ['b']), 0, 0, 1, 1)
  assert.equal(state.panes.length, 1)
  assert.deepEqual(state.panes[0]!.tabs.items.map(tab => tab.path), ['b', 'a'])
  assert.equal(state.active, 0)
})

test('dropping a document the target already shows focuses it instead of duplicating', () => {
  const state = moveTabBetween(twoPanes(['dup'], ['dup', 'b']), 0, 0, 1, 1)
  assert.deepEqual(state.panes[0]!.tabs.items.map(tab => tab.path), ['dup', 'b'])
  assert.equal(state.panes[0]!.tabs.active, 0)
  assert.equal(state.active, 0)
})

test('moving inside one pane reorders without changing the active pane', () => {
  const state = moveTabBetween(
    { ...EMPTY_PANES, panes: [{ id: 0, size: 1, tabs: withTabs(['a', 'b', 'c']) }], active: 0 },
    0, 0, 0, 2,
  )
  assert.deepEqual(state.panes[0]!.tabs.items.map(tab => tab.path), ['b', 'c', 'a'])
  assert.equal(state.active, 0)
})
