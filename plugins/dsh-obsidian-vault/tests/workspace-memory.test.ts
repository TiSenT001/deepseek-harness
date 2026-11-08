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
