/**
 * Running a node from the canvas: the controller gathers each input pin's upstream
 * value, asks the adapter to evaluate the snippet, stores the outputs on the node
 * and lets them feed the next node; the menu offers the action and the document
 * round-trips the stored values.
 * @module dsh-obsidian-vault/tests/pur-run-node
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MAX_RUN_HISTORY, PurController, displayRunValue, executeEffects, parseStudioDocument, serializeStudioDocument } from '../src/pur-kernel/index.ts'
import type { PurElement } from '../src/pur-kernel/index.ts'
import { LABELS, envOf, sinkOf } from './helpers/pur-adapter-fixtures.ts'

/**
 * Two connected code nodes plus a third one that consumes their output.
 * @returns the controller.
 */
function controllerOf(): PurController {
  const source: PurElement = {
    id: 'a',
    type: 'code-node',
    title: 'a',
    x: 0,
    y: 0,
    w: 260,
    h: 116,
    code: 'function process(inputs) { return { sum: inputs.x + 1 } }',
    content: '',
    inputs: [{ id: 'ai', label: 'x' }],
    outputs: [{ id: 'ao', label: 'sum' }],
    rotation: 0,
    opacity: 1,
  }
  const sink: PurElement = {
    id: 'b',
    type: 'code-node',
    title: 'b',
    x: 400,
    y: 0,
    w: 260,
    h: 88,
    code: 'function process(inputs) { return { doubled: inputs.sum * 2 } }',
    content: '',
    inputs: [{ id: 'bi', label: 'sum' }],
    outputs: [{ id: 'bo', label: 'doubled' }],
    rotation: 0,
    opacity: 1,
  }
  const line: PurElement = { id: 'l', type: 'line', from: 'a', to: 'b', fromPin: 'ao', toPin: 'bi', content: '', arrow: false }
  return new PurController(envOf(), LABELS, [source, sink, line])
}

test('running a node asks the adapter for the connected inputs', () => {
  const controller = controllerOf()
  controller.applyRunResult('a', { ok: true, values: { sum: '5' }, ms: 2 })
  const effects = controller.runCodeNode('b')
  assert.deepEqual(effects, [{ type: 'run-code', id: 'b', code: 'function process(inputs) { return { doubled: inputs.sum * 2 } }', inputs: { sum: 5 } }])
})

test('an unconnected input reaches the snippet as null', () => {
  const controller = controllerOf()
  const effects = controller.runCodeNode('a')
  assert.deepEqual(effects, [{ type: 'run-code', id: 'a', code: 'function process(inputs) { return { sum: inputs.x + 1 } }', inputs: { x: null } }])
})

test('a node without code reports instead of running', () => {
  const controller = controllerOf()
  const empty = controller.state.elements[0]
  if (empty !== undefined && empty.type === 'code-node') empty.code = ''
  const effects = controller.runCodeNode('a')
  assert.equal(effects.some((effect) => effect.type === 'run-code'), false)
  assert.equal(effects.some((effect) => effect.type === 'notice'), true)
})

test('storing a result saves, renders and lands on the node', () => {
  const controller = controllerOf()
  assert.deepEqual(controller.applyRunResult('a', { ok: true, values: { sum: '5' }, ms: 3 }), [{ type: 'save' }, { type: 'render' }])
  const node = controller.state.elements[0]
  assert.ok(node !== undefined && node.type === 'code-node')
  if (node === undefined || node.type !== 'code-node') return
  assert.deepEqual(node.values, { sum: '5' })
  assert.deepEqual(node.run, { ok: true, ms: 3 })
})

test('a failure is stored with its message', () => {
  const controller = controllerOf()
  controller.applyRunResult('a', { ok: false, error: 'boom', ms: 1 })
  const node = controller.state.elements[0]
  assert.ok(node !== undefined && node.type === 'code-node')
  if (node === undefined || node.type !== 'code-node') return
  assert.deepEqual(node.run, { ok: false, ms: 1, error: 'boom' })
})

test('values survive a document round trip', () => {
  const controller = controllerOf()
  controller.applyRunResult('a', { ok: true, values: { sum: '5' }, ms: 2 })
  const text = serializeStudioDocument({ elements: controller.state.elements, viewState: controller.state.view })
  const parsed = parseStudioDocument(text)
  const node = parsed.elements[0]
  assert.ok(node !== undefined && node.type === 'code-node')
  if (node === undefined || node.type !== 'code-node') return
  assert.deepEqual(node.values, { sum: '5' })
  assert.deepEqual(node.run, { ok: true, ms: 2 })
})

test('the adapter evaluates through the sink', () => {
  const controller = controllerOf()
  const { sink, calls } = sinkOf()
  executeEffects(controller.runCodeNode('a'), sink)
  assert.match(calls[0] ?? '', /^run-code:a:\d+$/)
})

test('the context menu offers running a code node', () => {
  const controller = controllerOf()
  controller.state.selectedIds.add('a')
  const model = controller.contextMenu(10, 10, {
    activeFileIsMarkdown: true,
    isPopout: false,
    isPinned: false,
    supportsPopout: false,
    supportsPinTop: false,
    supportsReveal: false,
  }).model
  const ids: string[] = []
  const walk = (entries: readonly { id: string; children?: readonly { id: string; children?: readonly { id: string }[] }[] }[]): void => {
    for (const entry of entries) {
      ids.push(entry.id)
      if (entry.children !== undefined) walk(entry.children as readonly { id: string; children?: readonly { id: string }[] }[])
    }
  }
  walk(model.entries)
  assert.ok(ids.includes('run-node'), 'no run-node entry in the menu')
})

test('the run-all plan follows the connections upstream first', () => {
  const plan = controllerOf().planRunAll()
  assert.deepEqual(plan, { order: ['a', 'b'], cycle: false })
})

test('independent nodes keep their document order', () => {
  const controller = controllerOf()
  const extra: PurElement = { id: 'c', type: 'code-node', title: 'c', x: 900, y: 0, w: 200, h: 80, code: '', content: '', rotation: 0, opacity: 1 }
  controller.state.elements.push(extra)
  assert.deepEqual(controller.planRunAll(), { order: ['a', 'b', 'c'], cycle: false })
})

test('a cycle is reported instead of ordered', () => {
  const controller = controllerOf()
  controller.state.elements.push({ id: 'back', type: 'line', from: 'b', to: 'a', fromPin: 'bo', toPin: 'ai', content: '', arrow: false })
  assert.deepEqual(controller.planRunAll(), { order: [], cycle: true })
})

test('a run-all pass feeds each result to the next node', () => {
  const controller = controllerOf()
  for (const id of controller.planRunAll().order) {
    const effect = controller.runCodeNode(id).find((candidate) => candidate.type === 'run-code')
    assert.ok(effect !== undefined && effect.type === 'run-code')
    if (effect === undefined || effect.type !== 'run-code') return
    if (id === 'a') {
      controller.applyRunResult('a', { ok: true, values: { sum: '5' }, ms: 1 })
      continue
    }
    assert.deepEqual(effect.inputs, { sum: 5 })
  }
})

test('the menu offers running every node', () => {
  const controller = controllerOf()
  controller.state.selectedIds.add('a')
  const model = controller.contextMenu(10, 10, {
    activeFileIsMarkdown: true,
    isPopout: false,
    isPinned: false,
    supportsPopout: false,
    supportsPinTop: false,
    supportsReveal: false,
  }).model
  assert.ok(model.entries.some((entry) => entry.id === 'run-all-nodes'), 'no run-all-nodes entry')
})
test('a typed value is stored as JSON when it parses', () => {
  const controller = controllerOf()
  assert.deepEqual(controller.setNodeValue('a', 'sum', '42'), [{ type: 'save' }, { type: 'render' }])
  const node = controller.state.elements[0]
  assert.ok(node !== undefined && node.type === 'code-node')
  if (node === undefined || node.type !== 'code-node') return
  assert.deepEqual(node.values, { sum: '42' })
})

test('plain text that is not JSON is stored as a string', () => {
  const controller = controllerOf()
  controller.setNodeValue('a', 'sum', 'hello')
  const node = controller.state.elements[0]
  assert.ok(node !== undefined && node.type === 'code-node')
  if (node === undefined || node.type !== 'code-node') return
  assert.deepEqual(node.values, { sum: '"hello"' })
})

test('an unknown pin is ignored', () => {
  const controller = controllerOf()
  assert.deepEqual(controller.setNodeValue('a', 'nope', '1'), [])
  const node = controller.state.elements[0]
  assert.ok(node !== undefined && node.type === 'code-node')
  if (node === undefined || node.type !== 'code-node') return
  assert.equal(node.values, undefined)
})

test('an empty value clears the stored one', () => {
  const controller = controllerOf()
  controller.setNodeValue('a', 'sum', '42')
  controller.setNodeValue('a', 'sum', '   ')
  const node = controller.state.elements[0]
  assert.ok(node !== undefined && node.type === 'code-node')
  if (node === undefined || node.type !== 'code-node') return
  assert.equal(node.values, undefined)
})

test('a stored value round-trips into editor text', () => {
  assert.equal(displayRunValue('42'), '42')
  assert.equal(displayRunValue('"hi"'), 'hi')
  assert.equal(displayRunValue('{"k":1}'), '{"k":1}')
  assert.equal(displayRunValue(undefined), '')
})
test('each run prepends a history entry', () => {
  const controller = controllerOf()
  controller.applyRunResult('a', { ok: true, values: { sum: '5' }, ms: 2 })
  controller.applyRunResult('a', { ok: false, error: 'boom', ms: 1 })
  const node = controller.state.elements[0]
  assert.ok(node !== undefined && node.type === 'code-node')
  if (node === undefined || node.type !== 'code-node') return
  assert.equal(node.history?.length, 2)
  assert.equal(node.history?.[0]?.ok, false)
  assert.deepEqual(node.history?.[1]?.values, { sum: '5' })
  assert.equal(node.history?.[0]?.at, 1000)
})

test('history is capped at the kernel limit', () => {
  const controller = controllerOf()
  for (let index = 0; index < MAX_RUN_HISTORY + 3; index++) controller.applyRunResult('a', { ok: true, values: { sum: String(index) }, ms: index })
  const node = controller.state.elements[0]
  assert.ok(node !== undefined && node.type === 'code-node')
  if (node === undefined || node.type !== 'code-node') return
  assert.equal(node.history?.length, MAX_RUN_HISTORY)
  assert.deepEqual(node.history?.[0]?.values, { sum: String(MAX_RUN_HISTORY + 2) })
})

test('typed values do not enter the run history', () => {
  const controller = controllerOf()
  controller.setNodeValue('a', 'sum', '7')
  const node = controller.state.elements[0]
  assert.ok(node !== undefined && node.type === 'code-node')
  if (node === undefined || node.type !== 'code-node') return
  assert.equal(node.history, undefined)
})

test('history survives a document round trip', () => {
  const controller = controllerOf()
  controller.applyRunResult('a', { ok: true, values: { sum: '5' }, ms: 2 })
  const text = serializeStudioDocument({ elements: controller.state.elements, viewState: controller.state.view })
  const parsed = parseStudioDocument(text)
  const node = parsed.elements[0]
  assert.ok(node !== undefined && node.type === 'code-node')
  if (node === undefined || node.type !== 'code-node') return
  assert.deepEqual(node.history, [{ ok: true, ms: 2, at: 1000, values: { sum: '5' } }])
})
