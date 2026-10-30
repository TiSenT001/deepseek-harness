import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  closeOthers, closeTab, EMPTY_TABS, goBack, goForward, makeTab, openTab, pinTab, remapPath, removePath,
  reorderTabs, selectTab,
  type TabsState,
} from '../src/client/ui/tabs.ts'

const preview = (state: TabsState, path: string): TabsState => openTab(state, path, { preview: true })

test('a single click opens a preview tab', () => {
  const state = preview(EMPTY_TABS, 'a.md')
  assert.equal(state.items.length, 1)
  assert.equal(state.items[0]!.preview, true)
  assert.equal(state.active, 0)
})

test('a second single click reuses the preview tab and records history', () => {
  const state = preview(preview(EMPTY_TABS, 'a.md'), 'b.md')
  assert.equal(state.items.length, 1)
  assert.equal(state.items[0]!.path, 'b.md')
  assert.equal(state.items[0]!.preview, true)
  assert.deepEqual(state.items[0]!.history.items, ['a.md', 'b.md'])
})

test('back walks preview navigations within the reused tab', () => {
  let state = preview(preview(EMPTY_TABS, 'a.md'), 'b.md')
  state = preview(state, 'c.md')
  state = goBack(state)
  assert.equal(state.items[0]!.path, 'b.md')
  state = goBack(state)
  assert.equal(state.items[0]!.path, 'a.md')
  assert.equal(goBack(state), state)
  // A fresh preview open after going back drops the forward branch.
  state = preview(state, 'd.md')
  assert.deepEqual(state.items[0]!.history.items, ['a.md', 'd.md'])
})

test('a permanent open replaces the active tab', () => {
  const state = openTab(preview(EMPTY_TABS, 'a.md'), 'b.md')
  assert.equal(state.items.length, 1)
  assert.equal(state.items[0]!.path, 'b.md')
  assert.equal(state.items[0]!.preview, false)
})

test('newTab always appends', () => {
  const state = openTab(preview(EMPTY_TABS, 'a.md'), 'b.md', { newTab: true })
  assert.equal(state.items.length, 2)
  assert.equal(state.active, 1)
})

test('double click pins a preview tab', () => {
  const state = pinTab(preview(EMPTY_TABS, 'a.md'), 0)
  assert.equal(state.items[0]!.preview, false)
})

test('opening an existing tab activates it and clears the preview flag', () => {
  let state = preview(EMPTY_TABS, 'a.md')
  state = openTab(state, 'b.md', { newTab: true })
  state = openTab(state, 'a.md')
  assert.equal(state.active, 0)
  assert.equal(state.items[0]!.preview, false)
})

test('closing the active tab selects its neighbour', () => {
  let state = openTab(EMPTY_TABS, 'a.md')
  state = openTab(state, 'b.md', { newTab: true })
  state = openTab(state, 'c.md', { newTab: true })
  const closed = closeTab(state, 1)
  assert.deepEqual(closed.items.map(tab => tab.path), ['a.md', 'c.md'])
  assert.equal(closed.active, 1)
})

test('closing the last tab leaves no active tab', () => {
  assert.equal(closeTab(openTab(EMPTY_TABS, 'a.md'), 0), EMPTY_TABS)
})

test('close others keeps exactly one tab', () => {
  let state = openTab(EMPTY_TABS, 'a.md')
  state = openTab(state, 'b.md', { newTab: true })
  const kept = closeOthers(state, 1)
  assert.deepEqual(kept.items.map(tab => tab.path), ['b.md'])
  assert.equal(kept.active, 0)
})

test('history records each navigation and back/forward walk it', () => {
  let state = openTab(EMPTY_TABS, 'a.md')
  state = openTab(state, 'b.md')
  state = openTab(state, 'c.md')
  assert.deepEqual(state.items[0]!.history.items, ['a.md', 'b.md', 'c.md'])
  state = goBack(state)
  assert.equal(state.items[0]!.path, 'b.md')
  state = goBack(state)
  assert.equal(state.items[0]!.path, 'a.md')
  assert.equal(goBack(state), state)
  state = goForward(state)
  assert.equal(state.items[0]!.path, 'b.md')
})

test('opening a new path after going back drops the forward branch', () => {
  let state = openTab(EMPTY_TABS, 'a.md')
  state = openTab(state, 'b.md')
  state = goBack(state)
  state = openTab(state, 'c.md')
  assert.deepEqual(state.items[0]!.history.items, ['a.md', 'c.md'])
})

test('selectTab ignores out-of-range indexes', () => {
  const state = openTab(EMPTY_TABS, 'a.md')
  assert.equal(selectTab(state, 5), state)
  assert.equal(selectTab(state, -1), state)
})

test('removePath drops the tab for a deleted note', () => {
  let state = openTab(EMPTY_TABS, 'a.md')
  state = openTab(state, 'b.md', { newTab: true })
  const next = removePath(state, 'a.md')
  assert.deepEqual(next.items.map(tab => tab.path), ['b.md'])
})

test('removePath keeps the active tab when an earlier tab disappears', () => {
  let state = openTab(EMPTY_TABS, 'a.md')
  state = openTab(state, 'b.md', { newTab: true })
  state = openTab(state, 'c.md', { newTab: true })
  state = openTab(state, 'd.md', { newTab: true })
  state = selectTab(state, 2)
  const next = removePath(state, 'a.md')
  assert.deepEqual(next.items.map(tab => tab.path), ['b.md', 'c.md', 'd.md'])
  assert.equal(next.items[next.active]!.path, 'c.md')
})

test('removePath drops tabs inside a deleted folder', () => {
  let state = openTab(EMPTY_TABS, 'keep.md')
  state = openTab(state, 'proj/a.md', { newTab: true })
  state = openTab(state, 'proj/sub/b.md', { newTab: true })
  const next = removePath(state, 'proj')
  assert.deepEqual(next.items.map(tab => tab.path), ['keep.md'])
  assert.equal(next.active, 0)
})

test('remapPath retargets tabs and their history after a rename', () => {
  let state = openTab(EMPTY_TABS, 'a.md')
  state = openTab(state, 'b.md', { newTab: true })
  const next = remapPath(state, 'a.md', 'renamed.md')
  assert.deepEqual(next.items.map(tab => tab.path), ['renamed.md', 'b.md'])
  assert.deepEqual(next.items[0]!.history.items, ['renamed.md'])
  assert.equal(next.active, 1)
})

test('remapPath retargets tabs inside a moved folder', () => {
  let state = openTab(EMPTY_TABS, 'proj/a.md')
  state = openTab(state, 'elsewhere.md', { newTab: true })
  const next = remapPath(state, 'proj', 'areas/proj')
  assert.deepEqual(next.items.map(tab => tab.path), ['areas/proj/a.md', 'elsewhere.md'])
})

test('makeTab seeds history with the opened path', () => {
  assert.deepEqual(makeTab('x.md', true).history, { items: ['x.md'], index: 0 })
})

const fourTabs = (): TabsState => {
  let state = openTab(EMPTY_TABS, 'a.md')
  state = openTab(state, 'b.md', { newTab: true })
  state = openTab(state, 'c.md', { newTab: true })
  return openTab(state, 'd.md', { newTab: true })
}

test('reorderTabs moves an earlier tab to the end', () => {
  const next = reorderTabs(selectTab(fourTabs(), 2), 0, 3)
  assert.deepEqual(next.items.map(tab => tab.path), ['b.md', 'c.md', 'd.md', 'a.md'])
  assert.equal(next.items[next.active]!.path, 'c.md')
})

test('reorderTabs moves a later tab to the front', () => {
  const next = reorderTabs(selectTab(fourTabs(), 1), 3, 0)
  assert.deepEqual(next.items.map(tab => tab.path), ['d.md', 'a.md', 'b.md', 'c.md'])
  assert.equal(next.items[next.active]!.path, 'b.md')
})

test('reorderTabs keeps the dragged tab active', () => {
  const next = reorderTabs(selectTab(fourTabs(), 2), 2, 0)
  assert.deepEqual(next.items.map(tab => tab.path), ['c.md', 'a.md', 'b.md', 'd.md'])
  assert.equal(next.items[next.active]!.path, 'c.md')
})

test('reorderTabs ignores out-of-range and no-op moves', () => {
  const state = fourTabs()
  assert.equal(reorderTabs(state, 1, 1), state)
  assert.equal(reorderTabs(state, -1, 2), state)
  assert.equal(reorderTabs(state, 1, 9), state)
})
