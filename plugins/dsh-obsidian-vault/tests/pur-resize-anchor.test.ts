/**
 * Resize geometry: every move is measured from the press, so dragging a west or
 * north handle must place the edge where the pointer is, not accumulate.
 * @module dsh-obsidian-vault/tests/pur-resize-anchor
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PurController } from '../src/pur-kernel/index.ts'
import type { PurElement } from '../src/pur-kernel/index.ts'
import { LABELS, envOf } from './helpers/pur-adapter-fixtures.ts'

/**
 * A controller with one selected 200x100 card at (100, 100).
 * @returns the controller.
 */
function controllerOf(): PurController {
  const card: PurElement = { id: 'a', type: 'image', x: 100, y: 100, w: 200, h: 100, original: 'pur-asset:a.png', rotation: 0, opacity: 1 }
  const controller = new PurController(envOf(), LABELS, [card])
  controller.state.selectedIds.add('a')
  return controller
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

test('a west-edge drag lands the edge where the pointer is, however many moves it takes', () => {
  const controller = controllerOf()
  // West handle sits at the card's left edge midpoint.
  controller.pointerDown(pointer(100, 150))
  controller.pointerMove(pointer(90, 150))
  const card = controller.state.elements[0]
  assert.ok(card !== undefined)
  assert.equal(card.x, 90)
  assert.equal(card.w, 210)
  // The pointer is now 30 units left of the original edge, not 10+30.
  controller.pointerMove(pointer(70, 150))
  assert.equal(card.x, 70, `x drifted to ${String(card.x)}`)
  assert.equal(card.w, 230)
})

test('a north-edge drag lands the edge where the pointer is', () => {
  const controller = controllerOf()
  controller.pointerDown(pointer(200, 100))
  controller.pointerMove(pointer(200, 90))
  controller.pointerMove(pointer(200, 70))
  const card = controller.state.elements[0]
  assert.ok(card !== undefined)
  assert.equal(card.y, 70, `y drifted to ${String(card.y)}`)
  assert.equal(card.h, 130)
})

test('a south-east drag grows from a fixed origin and keeps a picture in ratio', () => {
  const controller = controllerOf()
  controller.pointerDown(pointer(300, 200))
  controller.pointerMove(pointer(320, 220))
  controller.pointerMove(pointer(340, 240))
  const card = controller.state.elements[0]
  assert.ok(card !== undefined)
  assert.equal(card.x, 100)
  assert.equal(card.y, 100)
  assert.equal(card.w, 240)
  // The card is a picture, so a corner drag keeps its 2:1 ratio.
  assert.equal(card.h, 120)
})

test('a text card resizes freely on a corner', () => {
  const text: PurElement = { id: 't', type: 'text', x: 100, y: 100, w: 200, h: 100, content: 't', rotation: 0, opacity: 1 }
  const controller = new PurController(envOf(), LABELS, [text])
  controller.state.selectedIds.add('t')
  controller.pointerDown(pointer(300, 200))
  controller.pointerMove(pointer(320, 220))
  controller.pointerMove(pointer(340, 240))
  const card = controller.state.elements[0]
  assert.ok(card !== undefined)
  assert.equal(card.w, 240)
  assert.equal(card.h, 140)
})
