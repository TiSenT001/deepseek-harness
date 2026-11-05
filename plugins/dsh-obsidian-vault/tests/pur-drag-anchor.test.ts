/**
 * Drag anchoring: a card must stay under the pointer even when the view moves on
 * its own, because edge auto-pan changes the world point below a still pointer.
 * @module dsh-obsidian-vault/tests/pur-drag-anchor
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PurController } from '../src/pur-kernel/index.ts'
import type { PurElement } from '../src/pur-kernel/index.ts'
import { LABELS, envOf } from './helpers/pur-adapter-fixtures.ts'

/**
 * A controller with one card at (700, 100).
 * @returns the controller.
 */
function controllerOf(): PurController {
  const card: PurElement = { id: 'a', type: 'image', x: 700, y: 100, w: 100, h: 100, original: 'pur-asset:a.png', rotation: 0, opacity: 1 }
  return new PurController(envOf(), LABELS, [card])
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

/**
 * Screen position of the first card.
 * @param controller - the canvas.
 * @returns x in canvas pixels.
 */
function screenX(controller: PurController): number {
  const card = controller.state.elements[0]
  assert.ok(card !== undefined)
  return (card.x ?? 0) * controller.state.view.scale + controller.state.view.offsetX
}

test('the card stays under the pointer while the view pans', () => {
  const controller = controllerOf()
  controller.state.selectedIds.add('a')
  controller.pointerDown(pointer(750, 150))
  controller.pointerMove(pointer(795, 150))
  const anchored = screenX(controller)
  for (let frame = 0; frame < 5; frame++) controller.autoPanStep()
  // The pointer never moved, so the card must still sit at the same screen x.
  assert.ok(Math.abs(screenX(controller) - anchored) < 0.001, 'the card drifted away from the pointer')
})

test('a later pointer move does not undo the auto-pan carry', () => {
  const controller = controllerOf()
  controller.state.selectedIds.add('a')
  controller.pointerDown(pointer(750, 150))
  controller.pointerMove(pointer(795, 150))
  for (let frame = 0; frame < 5; frame++) controller.autoPanStep()
  const carried = controller.state.elements[0]?.x ?? 0
  assert.ok(carried > 700, 'the pan should have carried the card')
  // One pixel of real movement, then the position has to stay where the pan left it.
  controller.pointerMove(pointer(796, 150))
  const afterMove = controller.state.elements[0]?.x ?? 0
  assert.ok(Math.abs(afterMove - carried - 1) < 0.001, `the card jumped from ${carried} to ${afterMove}`)
})

test('a drag without a pan still tracks the pointer exactly', () => {
  const controller = controllerOf()
  controller.state.selectedIds.add('a')
  controller.pointerDown(pointer(750, 150))
  controller.pointerMove(pointer(780, 170))
  const card = controller.state.elements[0]
  assert.ok(card !== undefined)
  assert.equal(card.x, 730)
  assert.equal(card.y, 120)
})

test('a pointer-anchored zoom during a drag keeps the card in place', () => {
  const controller = controllerOf()
  controller.state.selectedIds.add('a')
  controller.pointerDown(pointer(750, 150))
  controller.pointerMove(pointer(760, 150))
  const before = controller.state.elements[0]?.x ?? 0
  // Zooming around the pointer leaves the world point under it alone, which is what
  // the wheel does; the card must not read that as pointer movement.
  const worldUnderPointer = (760 - controller.state.view.offsetX) / controller.state.view.scale
  controller.state.view.scale = 2
  controller.state.view.offsetX = 760 - worldUnderPointer * 2
  controller.pointerMove(pointer(760, 150))
  const after = controller.state.elements[0]?.x ?? 0
  assert.ok(Math.abs(after - before) < 0.001, `unexpected jump from ${before} to ${after}`)
})
