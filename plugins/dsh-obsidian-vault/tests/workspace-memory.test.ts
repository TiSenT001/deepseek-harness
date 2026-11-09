/**
 * Workspace memory: panes, tabs and the empty page survive serialisation, and a
 * malformed record is dropped instead of restoring a broken layout.
 * @module dsh-obsidian-vault/tests/workspace-memory
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { EMPTY_PANES, panesFromSaved, savedFromPanes } from '../src/client/ui/panes.ts'
import { parseViewMemory, serializeViewMemory } from '../src/client/ui/viewMemory.ts'

test('panes round-trip with tabs, preview flags and the active pane', () => {
  const state = panesFromSaved({
    panes: [
      { tabs: [{ path: '知识库总览/笔记编写规范.md' }, { path: '画布/测试.PurStudio', preview: true }], active: 1, size: 0.6 },
      { tabs: [{ path: '收件箱/草稿.md' }], active: 0, size: 0.4 },
    ],
    activePane: 1,
    direction: 'column',
  })
  assert.equal(state.panes.length, 2)
  assert.equal(state.active, 1)
  assert.equal(state.direction, 'column')
  assert.equal(state.panes[0]?.tabs.items[1]?.preview, true)

  const saved = savedFromPanes(state)
  assert.equal(saved.panes.length, 2)
  assert.equal(saved.activePane, 1)
  assert.equal(saved.direction, 'column')
  assert.equal(saved.panes[0]?.tabs[1]?.preview, true)
  assert.equal(saved.panes[1]?.tabs[0]?.path, '收件箱/草稿.md')
})

test('the empty page is a valid workspace record', () => {
  const saved = savedFromPanes(EMPTY_PANES)
  assert.equal(saved.panes.length, 1)
  assert.deepEqual(saved.panes[0]?.tabs, [])
  const restored = panesFromSaved(saved)
  assert.equal(restored.panes.length, 1)
  assert.deepEqual(restored.panes[0]?.tabs.items, [])
})

test('new-tab placeholders survive as explicit empty tabs', () => {
  const state = panesFromSaved({
    panes: [{ tabs: [{ path: '笔记.md' }, { path: '', empty: true }], active: 1, size: 1 }],
    activePane: 0,
    direction: 'row',
  })
  assert.equal(state.panes[0]?.tabs.items[1]?.path, '')
  const saved = savedFromPanes(state)
  assert.deepEqual(saved.panes[0]?.tabs, [{ path: '笔记.md' }, { path: '', empty: true }])
  const restored = panesFromSaved(saved)
  assert.equal(restored.panes[0]?.tabs.items[1]?.path, '')
  assert.equal(restored.panes[0]?.tabs.active, 1)
})

test('a workspace survives the view-memory JSON round-trip', () => {
  const state = panesFromSaved({
    panes: [{ tabs: [{ path: '笔记.md' }], active: 0, size: 1 }],
    activePane: 0,
    direction: 'row',
  })
  const raw = serializeViewMemory({
    root: 'G:\\个人知识库',
    view: 'graph',
    rail: 'backlinks',
    workspace: savedFromPanes(state),
  })
  const parsed = parseViewMemory(raw)
  assert.equal(parsed?.root, 'G:\\个人知识库')
  assert.equal(parsed?.view, 'graph')
  assert.equal(parsed?.workspace?.panes[0]?.tabs[0]?.path, '笔记.md')
})

test('the recent list survives the JSON round-trip', () => {
  const raw = serializeViewMemory({ root: 'G:\\个人知识库', recent: ['a.md', 'b.md'] })
  const parsed = parseViewMemory(raw)
  assert.deepEqual(parsed?.recent, ['a.md', 'b.md'])
  const cleaned = parseViewMemory(JSON.stringify({ root: 'x', recent: ['ok.md', '', 3, 'z.md'] }))
  assert.deepEqual(cleaned?.recent, ['ok.md', 'z.md'])
  const capped = parseViewMemory(JSON.stringify({ recent: Array.from({ length: 30 }, (_, index) => `n${index}.md`) }))
  assert.equal(capped?.recent?.length, 20)
})

test('malformed workspace records are dropped, not whole records', () => {
  const badDirection = parseViewMemory(JSON.stringify({
    root: 'G:\\个人知识库',
    workspace: { panes: [{ tabs: [], active: 0, size: 1 }], activePane: 0, direction: 'diagonal' },
  }))
  assert.equal(badDirection?.root, 'G:\\个人知识库')
  assert.equal(badDirection?.workspace, undefined)

  const badPath = parseViewMemory(JSON.stringify({
    root: 'G:\\个人知识库',
    workspace: { panes: [{ tabs: [{ path: '' }], active: 0, size: 1 }], activePane: 0, direction: 'row' },
  }))
  assert.equal(badPath?.workspace, undefined)

  const tooManyPanes = parseViewMemory(JSON.stringify({
    root: 'G:\\个人知识库',
    workspace: {
      panes: Array.from({ length: 9 }, () => ({ tabs: [], active: 0, size: 1 })),
      activePane: 0,
      direction: 'row',
    },
  }))
  assert.equal(tooManyPanes?.workspace, undefined)
})

test('named layouts round-trip and keep one entry per name', () => {
  const workspace = savedFromPanes(panesFromSaved({
    panes: [{ tabs: [{ path: '甲.md' }, { path: '乙.md' }], active: 0, size: 1 }],
    activePane: 0,
    direction: 'row',
  }))
  const raw = serializeViewMemory({
    root: 'G:\\个人知识库',
    layouts: [
      { name: '写作', workspace, view: 'note', rail: 'outline', savedAt: 2 },
      { name: '阅读', workspace, view: 'graph', rail: 'backlinks', savedAt: 1 },
    ],
  })
  const parsed = parseViewMemory(raw)
  assert.equal(parsed?.layouts?.length, 2)
  assert.equal(parsed?.layouts?.[0]?.name, '写作')
  assert.equal(parsed?.layouts?.[1]?.view, 'graph')
  assert.equal(parsed?.layouts?.[0]?.workspace.panes[0]?.tabs.length, 2)
})

test('invalid or duplicate layouts are dropped individually', () => {
  const workspace = savedFromPanes(panesFromSaved({
    panes: [{ tabs: [{ path: '甲.md' }], active: 0, size: 1 }],
    activePane: 0,
    direction: 'row',
  }))
  const parsed = parseViewMemory(JSON.stringify({
    layouts: [
      { name: '好', workspace, view: 'note', rail: 'outline', savedAt: 1 },
      { name: '好', workspace, view: 'graph', rail: 'outline', savedAt: 2 },
      { name: '', workspace, view: 'note', rail: 'outline', savedAt: 1 },
      { name: '坏', workspace: { panes: [] }, view: 'note', rail: 'outline', savedAt: 1 },
      { name: '也坏', workspace, view: 'sideways', rail: 'outline', savedAt: 1 },
    ],
  }))
  assert.deepEqual(parsed?.layouts?.map(layout => layout.name), ['好'])
})

test('the layout list is capped at twenty', () => {
  const workspace = savedFromPanes(panesFromSaved({ panes: [{ tabs: [{ path: '甲.md' }], active: 0, size: 1 }], activePane: 0, direction: 'row' }))
  const layouts = Array.from({ length: 25 }, (_, index) => ({
    name: '布局 ' + index,
    workspace,
    view: 'note' as const,
    rail: 'outline',
    savedAt: index,
  }))
  const parsed = parseViewMemory(JSON.stringify({ layouts }))
  assert.equal(parsed?.layouts?.length, 20)
})
