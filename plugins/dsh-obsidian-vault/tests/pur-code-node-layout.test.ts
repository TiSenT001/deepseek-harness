/**
 * Pin layout and card kinds: rows never leave their card, code nodes reserve a
 * header the other pin hosts do not, and a text card can be wired as it is.
 * @module dsh-obsidian-vault/tests/pur-code-node-layout
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PurController, codeNodeMinHeight, codeNodeRowY, pinPosition, pinWorldPosition, pushHistory } from '../src/pur-kernel/index.ts'
import type { PurElement } from '../src/pur-kernel/index.ts'
import { LABELS, envOf } from './helpers/pur-adapter-fixtures.ts'

test('pin rows sit below the header and are shared by the renderer and hit-testing', () => {
  const node = { type: 'code-node', w: 260, h: 116, inputs: [{ id: 'a', label: 'a' }, { id: 'b', label: 'b' }], outputs: [{ id: 's', label: 'sum' }] }
  const rows = Math.max(node.inputs.length, node.outputs.length, 1)
  for (let index = 0; index < rows; index++) {
    const y = pinPosition(node, true, index).y
    assert.equal(y, codeNodeRowY(node.h, rows, index))
    assert.ok(y > 38, `row ${index} overlaps the header at ${y}`)
    assert.ok(y < node.h, `row ${index} fell outside the card at ${y}`)
  }
})

test('a card too short for its rows keeps them inside', () => {
  for (const height of [40, 52, 60, 70, 80]) {
    for (let index = 0; index < 3; index++) {
      const y = codeNodeRowY(height, 3, index)
      assert.ok(y >= 0 && y <= height, `row ${index} of a ${height} high card landed at ${y}`)
    }
  }
})

test('the minimum height grows with the rows', () => {
  assert.ok(codeNodeMinHeight(1) < codeNodeMinHeight(2))
  const node = { type: 'code-node', w: 260, h: codeNodeMinHeight(3), inputs: [{ id: 'a', label: 'a' }, { id: 'b', label: 'b' }, { id: 'c', label: 'c' }], outputs: [] }
  const ys = [0, 1, 2].map((index) => pinPosition(node, true, index).y)
  for (let index = 1; index < ys.length; index++) {
    assert.ok((ys[index] ?? 0) - (ys[index - 1] ?? 0) >= 21, `rows ${index - 1} and ${index} are cramped`)
  }
})

test('text cards keep their own row positions, without a header', () => {
  const text = { type: 'text', w: 220, h: 100, inputs: [{ id: 'a', label: 'a' }, { id: 'b', label: 'b' }], outputs: [] }
  assert.equal(pinPosition(text, true, 0).y, 15)
  assert.equal(pinPosition(text, true, 1).y, 85)
  const code = { type: 'code-node', w: 220, h: 100, inputs: [{ id: 'a', label: 'a' }, { id: 'b', label: 'b' }], outputs: [] }
  assert.notEqual(pinPosition(code, true, 0).y, 15)
})

test('a text card can carry pins without becoming a code node', () => {
  const text: PurElement = { id: 't', type: 'text', x: 10, y: 20, w: 220, h: 100, content: 'x', rotation: 0, opacity: 1 }
  const controller = new PurController(envOf(), LABELS, [text])
  pushHistory(controller.history, controller.state.elements)
  controller.setPins('t', { inputs: [{ id: '', label: 'a' }], outputs: [{ id: '', label: 'sum' }] })
  const element = controller.state.elements[0]
  assert.ok(element !== undefined)
  assert.equal(element.type, 'text')
  assert.equal(element.inputs?.length, 1)
  assert.equal(element.outputs?.length, 1)
  const located = pinWorldPosition(controller.state.elements, 't', element.outputs?.[0]?.id ?? '')
  assert.ok(located !== null, 'the new output pin has no world position')
  assert.equal(located.x, 230)
})

test('converting a text card keeps its place, and grows for its pins', () => {
  const text: PurElement = { id: 't', type: 'text', x: 120, y: 80, w: 260, h: 60, content: 'const a = 1', title: '常量', color: '#abcdef', fontSize: 15, rotation: 0, opacity: 1 }
  const controller = new PurController(envOf(), LABELS, [text])
  pushHistory(controller.history, controller.state.elements)
  const before = controller.history.stack.length
  controller.convertTextToCode('t', {
    title: '常量',
    inputs: [{ id: '', label: 'a' }, { id: '', label: 'b' }],
    outputs: [{ id: '', label: 'sum' }],
  })
  const node = controller.state.elements[0]
  assert.ok(node !== undefined)
  assert.equal(node.type, 'code-node')
  assert.equal(node.x, 120)
  assert.equal(node.y, 80)
  assert.equal(node.w, 260)
  assert.ok((node.h ?? 0) >= codeNodeMinHeight(2), `height ${String(node.h)} does not fit the rows`)
  if (node.type !== 'code-node') return
  assert.equal(node.code, 'const a = 1')
  assert.equal(node.color, '#abcdef')
  assert.equal(controller.history.stack.length, before + 1)
})

test('editing a code node grows it when pins need room', () => {
  const node: PurElement = { id: 'n', type: 'code-node', x: 0, y: 0, w: 260, h: 60, code: '', content: '', rotation: 0, opacity: 1 }
  const controller = new PurController(envOf(), LABELS, [node])
  controller.commitCodeNode('n', { title: 'n', inputs: [{ id: '', label: 'a' }, { id: '', label: 'b' }, { id: '', label: 'c' }], outputs: [] })
  const updated = controller.state.elements[0]
  assert.ok(updated !== undefined)
  assert.ok((updated.h ?? 0) >= codeNodeMinHeight(3))
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
