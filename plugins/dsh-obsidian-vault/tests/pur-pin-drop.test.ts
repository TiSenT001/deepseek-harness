/**
 * Connections from a dropped pin: an empty drop asks for a node kind, the chosen
 * card is wired immediately, and a plain click selects a line so it can be deleted.
 * @module dsh-obsidian-vault/tests/pur-pin-drop
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PurController, pinWorldPosition } from '../src/pur-kernel/index.ts'
import type { PurElement } from '../src/pur-kernel/index.ts'
import { LABELS, envOf } from './helpers/pur-adapter-fixtures.ts'

/**
 * Two code nodes, the first with one output pin.
 * @returns the controller.
 */
function controllerOf(): PurController {
  const a: PurElement = {
    id: 'a',
    type: 'code-node',
    title: 'na',
    x: 0,
    y: 0,
    w: 260,
    h: 116,
    inputs: [],
    outputs: [{ id: 'ao0', label: 'sum' }],
    code: '',
    content: '',
    rotation: 0,
    opacity: 1,
  }
  const b: PurElement = {
    id: 'b',
    type: 'code-node',
    title: 'nb',
    x: 500,
    y: 0,
    w: 260,
    h: 88,
    inputs: [{ id: 'bi0', label: 'x' }],
    outputs: [],
    code: '',
    content: '',
    rotation: 0,
    opacity: 1,
  }
  return new PurController(envOf(), LABELS, [a, b])
}

/**
 * One pointer event at canvas coordinates.
 * @param x - viewport x.
 * @param y - viewport y.
 * @returns the event.
 */
function pointer(x: number, y: number) {
  return { clientX: x, clientY: y, rectLeft: 0, rectTop: 0, button: 0, ctrlKey: false, metaKey: false, shiftKey: false }
}

test('dropping a connection on empty canvas asks for a node kind', () => {
  const controller = controllerOf()
  const start = pinWorldPosition(controller.state.elements, 'a', 'ao0')
  assert.ok(start !== null)
  controller.pointerDown(pointer(start.x, start.y))
  controller.pointerMove(pointer(600, 300))
  const effects = controller.pointerUp(pointer(600, 300))
  assert.ok(effects.some((effect) => effect.type === 'context-menu'), 'no menu was requested')
  assert.notEqual(controller.state.pinDrop, null)
})

test('choosing a code node creates it at the drop and wires the line without an arrow', () => {
  const controller = controllerOf()
  const start = pinWorldPosition(controller.state.elements, 'a', 'ao0')
  assert.ok(start !== null)
  controller.pointerDown(pointer(start.x, start.y))
  controller.pointerMove(pointer(600, 300))
  controller.pointerUp(pointer(600, 300))
  controller.completePinDrop('code')
  assert.equal(controller.state.pinDrop, null)
  const created = controller.state.elements.find((element) => element.type === 'code-node' && element.id !== 'a' && element.id !== 'b')
  assert.ok(created !== undefined, 'no card was created')
  if (created === undefined || created.type !== 'code-node') return
  const line = controller.state.elements.find((element) => element.type === 'line')
  assert.ok(line !== undefined && line.type === 'line')
  if (line === undefined || line.type !== 'line') return
  assert.equal(line.from, 'a')
  assert.equal(line.fromPin, 'ao0')
  assert.equal(line.to, created.id)
  assert.equal(line.toPin, created.inputs?.[0]?.id)
  assert.equal(line.arrow, false)
  assert.deepEqual([...controller.state.selectedIds], [created.id])
})

test('choosing a text card keeps the text kind and its pins', () => {
  const controller = controllerOf()
  const start = pinWorldPosition(controller.state.elements, 'a', 'ao0')
  assert.ok(start !== null)
  controller.pointerDown(pointer(start.x, start.y))
  controller.pointerMove(pointer(600, 300))
  controller.pointerUp(pointer(600, 300))
  controller.completePinDrop('text')
  const created = controller.state.elements.find((element) => element.type === 'text')
  assert.ok(created !== undefined && created.type === 'text')
  assert.equal(created.inputs?.length, 1)
  const line = controller.state.elements.find((element) => element.type === 'line')
  assert.ok(line !== undefined && line.type === 'line')
})

test('cancelling the drop leaves the document untouched', () => {
  const controller = controllerOf()
  const before = JSON.stringify(controller.state.elements)
  const start = pinWorldPosition(controller.state.elements, 'a', 'ao0')
  assert.ok(start !== null)
  controller.pointerDown(pointer(start.x, start.y))
  controller.pointerMove(pointer(600, 300))
  controller.pointerUp(pointer(600, 300))
  controller.cancelPinDrop()
  assert.equal(controller.state.pinDrop, null)
  assert.equal(JSON.stringify(controller.state.elements), before)
})

test('a single click selects a line instead of opening its editor', () => {
  const controller = controllerOf()
  controller.state.elements.push({ id: 'l1', type: 'line', from: 'a', to: 'b', fromPin: 'ao0', toPin: 'bi0', content: '', arrow: false })
  const start = pinWorldPosition(controller.state.elements, 'a', 'ao0')
  const end = pinWorldPosition(controller.state.elements, 'b', 'bi0')
  assert.ok(start !== null && end !== null)
  const effects = controller.pointerDown(pointer((start.x + end.x) / 2, (start.y + end.y) / 2))
  assert.ok(!effects.some((effect) => effect.type === 'edit-line'), 'the click opened the editor')
  assert.ok(controller.state.selectedIds.has('l1'), 'the line was not selected')
})

test('deleting a selected line removes it', () => {
  const controller = controllerOf()
  controller.state.elements.push({ id: 'l1', type: 'line', from: 'a', to: 'b', fromPin: 'ao0', toPin: 'bi0', content: '', arrow: false })
  controller.state.selectedIds.add('l1')
  controller.deleteSelection()
  assert.equal(controller.state.elements.some((element) => element.id === 'l1'), false)
})
