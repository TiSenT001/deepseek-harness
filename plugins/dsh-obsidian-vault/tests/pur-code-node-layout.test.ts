/**
 * Pin layout and text-to-code promotion: the visible pin row is the grabbable one,
 * and a text card can become a code node without losing its place on the board.
 * @module dsh-obsidian-vault/tests/pur-code-node-layout
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PurController, codeNodeRowY, pinPosition, pushHistory } from '../src/pur-kernel/index.ts'
import type { PurElement } from '../src/pur-kernel/index.ts'
import { LABELS, envOf } from './helpers/pur-adapter-fixtures.ts'

test('pin rows sit below the header and are shared by the renderer and hit-testing', () => {
  const node = { w: 260, h: 116, inputs: [{ id: 'a', label: 'a' }, { id: 'b', label: 'b' }], outputs: [{ id: 's', label: 'sum' }] }
  const rows = Math.max(node.inputs.length, node.outputs.length, 1)
  for (let index = 0; index < rows; index++) {
    const y = pinPosition(node, true, index).y
    assert.equal(y, codeNodeRowY(node.h, rows, index))
    assert.ok(y > 38, `row ${index} overlaps the header at ${y}`)
    assert.ok(y < node.h, `row ${index} fell outside the card at ${y}`)
  }
})

test('a single pin row is centred in the body, not on the header', () => {
  const y = pinPosition({ w: 260, h: 88, inputs: [{ id: 'x', label: 'x' }], outputs: [] }, true, 0).y
  assert.ok(y > 38 && y < 88, `row at ${y}`)
  assert.ok(Math.abs(y - 63) < 0.001)
})

test('converting a text card keeps its place, size and body', () => {
  const text: PurElement = { id: 't', type: 'text', x: 120, y: 80, w: 260, h: 96, content: 'const a = 1', title: '常量', color: '#abcdef', fontSize: 15, rotation: 0, opacity: 1 }
  const controller = new PurController(envOf(), LABELS, [text])
  pushHistory(controller.history, controller.state.elements)
  const before = controller.history.stack.length
  controller.convertTextToCode('t', { title: '常量', inputs: [{ id: '', label: 'a' }], outputs: [{ id: '', label: 'sum' }] })
  const node = controller.state.elements[0]
  assert.ok(node !== undefined)
  assert.equal(node.type, 'code-node')
  assert.equal(node.x, 120)
  assert.equal(node.y, 80)
  assert.equal(node.w, 260)
  assert.equal(node.h, 96)
  if (node.type !== 'code-node') return
  assert.equal(node.code, 'const a = 1')
  assert.equal(node.content, 'const a = 1')
  assert.equal(node.title, '常量')
  assert.equal(node.color, '#abcdef')
  assert.equal(node.inputs?.length, 1)
  assert.equal(node.outputs?.length, 1)
  assert.equal(controller.history.stack.length, before + 1)
})

test('converting leaves a non-text card alone', () => {
  const image: PurElement = { id: 'i', type: 'image', x: 0, y: 0, w: 10, h: 10, original: 'pur-asset:a.png', rotation: 0, opacity: 1 }
  const controller = new PurController(envOf(), LABELS, [image])
  assert.deepEqual(controller.convertTextToCode('i', { title: 'x', inputs: [], outputs: [] }), [])
  assert.equal(controller.state.elements[0]?.type, 'image')
})

test('converting a nested text card works in place', () => {
  const group: PurElement = {
    id: 'g',
    type: 'group',
    x: 100,
    y: 100,
    w: 400,
    h: 300,
    content: 'g',
    rotation: 0,
    opacity: 1,
    children: [{ id: 'inner', type: 'text', x: 10, y: 10, w: 200, h: 80, content: 'x', rotation: 0, opacity: 1 }],
  }
  const controller = new PurController(envOf(), LABELS, [group])
  controller.convertTextToCode('inner', { title: 'n', inputs: [], outputs: [{ id: '', label: 'out' }] })
  const parent = controller.state.elements[0]
  assert.ok(parent !== undefined && parent.type === 'group')
  assert.equal(parent.children[0]?.type, 'code-node')
  assert.equal(parent.children[0]?.x, 10)
})
