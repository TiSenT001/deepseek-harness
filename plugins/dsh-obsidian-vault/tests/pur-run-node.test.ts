/**
 * Running a node from the canvas: the controller gathers each input pin's upstream
 * value, asks the adapter to evaluate the snippet, stores the outputs on the node
 * and lets them feed the next node; the menu offers the action and the document
 * round-trips the stored values.
 * @module dsh-obsidian-vault/tests/pur-run-node
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PurController, executeEffects, parseStudioDocument, serializeStudioDocument } from '../src/pur-kernel/index.ts'
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
