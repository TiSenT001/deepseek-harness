/**
 * Adapter-glue tests: effect dispatch order and menu-action routing through
 * the recording sink and host fixtures.
 * @module dsh-obsidian-vault/tests/pur-adapter
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { executeEffects, runMenuAction } from '../src/pur-kernel/index.ts'
import type { PurControllerEffect } from '../src/pur-kernel/index.ts'
import { controllerOf, hostOf, sinkOf, WORLD } from './helpers/pur-adapter-fixtures.ts'

test('executeEffects dispatches every variant in order', () => {
  const { sink, calls } = sinkOf()
  const effects: PurControllerEffect[] = [
    { type: 'render' },
    { type: 'save' },
    { type: 'notice', text: 'hi' },
    { type: 'cursor', cursor: 'grab' },
    { type: 'open-link', target: 'a.md' },
    { type: 'edit-text', id: 'e1' },
    { type: 'edit-group', id: 'e2' },
    { type: 'edit-line', id: 'e3' },
    { type: 'edit-note-link', id: 'e4' },
    { type: 'context-menu', clientX: 1, clientY: 2 },
    { type: 'export-text' },
  ]
  executeEffects(effects, sink)
  assert.deepEqual(calls, ['render', 'save', 'notice:hi', 'cursor:grab', 'open:a.md', 'edit-text:e1', 'edit-group:e2', 'edit-line:e3', 'edit-note-link:e4', 'menu:1,2', 'export-text'])
})

test('runMenuAction routes controller commands', () => {
  const controller = controllerOf()
  const { host } = hostOf()
  const before = controller.state.elements.length
  const effects = runMenuAction(controller, host, { id: 'new-text', world: WORLD })
  assert.equal(controller.state.elements.length, before + 1)
  assert.deepEqual(effects, [{ type: 'save' }, { type: 'render' }])
  controller.state.selectedIds.add(controller.state.elements[0]?.id ?? '')
  assert.deepEqual(runMenuAction(controller, host, { id: 'copy', world: WORLD }), [{ type: 'notice', text: 'copied 1' }])
  assert.deepEqual(runMenuAction(controller, host, { id: 'fit-view', world: WORLD }), [{ type: 'render' }])
})

test('runMenuAction resolves preset and pin parameterised ids', () => {
  const controller = controllerOf()
  const { host } = hostOf()
  const effects = runMenuAction(controller, host, { id: 'preset:math-add', world: WORLD })
  assert.deepEqual(effects, [{ type: 'save' }, { type: 'render' }])
  const node = controller.state.elements.at(-1)
  assert.equal(node?.type, 'code-node')
  if (node?.type === 'code-node') {
    assert.equal(node.title, 'title:math-add')
    assert.deepEqual(node.inputs?.map((pin) => pin.label), ['a', 'b'])
  }
  const codeNode = controller.state.elements[1]
  assert.equal(codeNode?.type, 'code-node')
  if (codeNode?.type !== 'code-node') return
  const pinId = codeNode.inputs?.[0]?.id ?? ''
  runMenuAction(controller, host, { id: `del-in-pin:${pinId}`, world: WORLD, targetId: codeNode.id })
  assert.deepEqual(codeNode.inputs, [])
})

test('runMenuAction dispatches host operations and editors', () => {
  const controller = controllerOf()
  const { host, calls } = hostOf()
  const textId = controller.state.elements[0]?.id ?? ''
  assert.deepEqual(runMenuAction(controller, host, { id: 'save-pur', world: WORLD }), [])
  runMenuAction(controller, host, { id: 'gen-js', world: WORLD })
  runMenuAction(controller, host, { id: 'export-png', world: WORLD })
  runMenuAction(controller, host, { id: 'edit', world: WORLD, targetId: textId })
  assert.deepEqual(calls, ['savePur', 'generateCode:js', 'exportImage:png', `editText:${textId}`])
})

test('runMenuAction validates value, target and unknown ids', () => {
  const controller = controllerOf()
  const { host } = hostOf()
  assert.throws(() => runMenuAction(controller, host, { id: 'opacity', world: WORLD }), /requires a value/)
  assert.throws(() => runMenuAction(controller, host, { id: 'add-in-pin', world: WORLD }), /requires a target/)
  assert.throws(() => runMenuAction(controller, host, { id: 'nope', world: WORLD }), /unknown pur menu action/)
  assert.throws(() => runMenuAction(controller, host, { id: 'preset:nope', world: WORLD }), /unknown pur preset/)
  const textId = controller.state.elements[0]?.id ?? ''
  controller.state.selectedIds.add(textId)
  assert.deepEqual(runMenuAction(controller, host, { id: 'opacity', world: WORLD, value: 0.5 }), [{ type: 'save' }])
  assert.equal(controller.state.elements[0]?.opacity, 0.5)
  assert.deepEqual(runMenuAction(controller, host, { id: 'save-export', world: WORLD }), [])
  assert.deepEqual(runMenuAction(controller, host, { id: 'preset-cat:math', world: WORLD }), [])
})
