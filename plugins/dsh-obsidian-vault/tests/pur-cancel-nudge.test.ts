/**
 * Escape and keyboard nudge: backing out of a gesture must restore exactly what the
 * gesture started from, and a burst of arrow presses must undo as one step.
 * @module dsh-obsidian-vault/tests/pur-cancel-nudge
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PurController, pushHistory } from '../src/pur-kernel/index.ts'
import type { PurElement } from '../src/pur-kernel/index.ts'
import { LABELS, envOf } from './helpers/pur-adapter-fixtures.ts'

/**
 * A controller holding two cards at known positions.
 * @returns the controller.
 */
function controllerOf(): PurController {
  const a: PurElement = { id: 'a', type: 'image', x: 100, y: 100, w: 200, h: 100, original: 'pur-asset:a.png', rotation: 0, opacity: 1 }
  const b: PurElement = { id: 'b', type: 'text', x: 400, y: 300, w: 160, h: 80, content: 'b', rotation: 0, opacity: 1 }
  const controller = new PurController(envOf(), LABELS, [a, b])
  // Opening a document records it as the first snapshot.
  pushHistory(controller.history, controller.state.elements)
  return controller
}

/**
 * One pointer event at canvas coordinates.
 * @param x - viewport x.
 * @param y - viewport y.
 * @param extra - overrides.
 * @returns the event.
 */
function pointer(x: number, y: number, extra: Partial<{ button: number; ctrlKey: boolean; shiftKey: boolean }> = {}) {
  return { clientX: x, clientY: y, rectLeft: 0, rectTop: 0, button: 0, ctrlKey: false, metaKey: false, shiftKey: false, ...extra }
}

/**
 * Press one key on the controller.
 * @param controller - the canvas.
 * @param key - the key name.
 * @param shiftKey - whether shift was held.
 * @returns the result.
 */
function press(controller: PurController, key: string, shiftKey = false) {
  return controller.keyDown({ key, ctrlKey: false, metaKey: false, shiftKey })
}

test('escape clears an idle selection', () => {
  const controller = controllerOf()
  controller.state.selectedIds.add('a')
  const result = press(controller, 'Escape')
  assert.equal(result.handled, true)
  assert.equal(controller.state.selectedIds.size, 0)
  // Nothing was edited, so the stack still holds only the loaded snapshot.
  assert.equal(controller.history.stack.length, 1)
})

test('escape on an empty canvas is left to the host', () => {
  const controller = controllerOf()
  assert.equal(press(controller, 'Escape').handled, false)
})

test('escape restores the selection a rubber band started from', () => {
  const controller = controllerOf()
  controller.state.selectedIds.add('b')
  // Start a rubber band on empty canvas far from both cards.
  controller.pointerDown(pointer(700, 60))
  controller.pointerMove(pointer(760, 120))
  assert.equal(controller.state.selecting, true)
  press(controller, 'Escape')
  assert.equal(controller.state.selecting, false)
  assert.equal(controller.state.selectionRect, null)
  assert.deepEqual([...controller.state.selectedIds], ['b'])
})

test('escape rolls a drag back to where it started', () => {
  const controller = controllerOf()
  controller.state.selectedIds.add('a')
  controller.pointerDown(pointer(150, 150))
  controller.pointerMove(pointer(400, 350))
  const dragged = controller.state.elements[0]
  assert.ok(dragged !== undefined && dragged.x !== 100, 'drag should have moved the card')
  press(controller, 'Escape')
  assert.equal(controller.state.dragging, false)
  assert.equal(dragged.x, 100)
  assert.equal(dragged.y, 100)
  assert.equal(controller.history.stack.length, 1, 'cancelling must not add history')
})

test('escape rolls a resize back to the original size', () => {
  const controller = controllerOf()
  controller.state.selectedIds.add('a')
  // Grab the south-east handle of the first card (100+200, 100+100).
  controller.pointerDown(pointer(300, 200))
  controller.pointerMove(pointer(420, 320))
  const card = controller.state.elements[0]
  assert.ok(card !== undefined && card.w !== 200, 'resize should have changed the width')
  press(controller, 'Escape')
  assert.equal(controller.state.resizing, false)
  assert.equal(card.w, 200)
  assert.equal(card.h, 100)
  assert.equal(card.x, 100)
})

test('escape rolls a pan back to the original offset', () => {
  const controller = controllerOf()
  controller.pointerDown(pointer(400, 300, { button: 2 }))
  controller.pointerMove(pointer(500, 400))
  assert.notEqual(controller.state.view.offsetX, 0)
  press(controller, 'Escape')
  assert.equal(controller.state.panning, false)
  assert.equal(controller.state.view.offsetX, 0)
  assert.equal(controller.state.view.offsetY, 0)
})

test('an arrow key moves the selection by one unit', () => {
  const controller = controllerOf()
  controller.state.selectedIds.add('a')
  const result = press(controller, 'ArrowRight')
  assert.equal(result.handled, true)
  const card = controller.state.elements[0]
  assert.ok(card !== undefined)
  assert.equal(card.x, 101)
  assert.equal(card.y, 100)
})

test('shift moves ten units', () => {
  const controller = controllerOf()
  controller.state.selectedIds.add('a')
  press(controller, 'ArrowDown', true)
  const card = controller.state.elements[0]
  assert.ok(card !== undefined)
  assert.equal(card.y, 110)
})

test('a burst of presses collapses into one history step', () => {
  const controller = controllerOf()
  controller.state.selectedIds.add('a')
  for (let index = 0; index < 6; index++) press(controller, 'ArrowRight')
  const card = controller.state.elements[0]
  assert.ok(card !== undefined)
  assert.equal(card.x, 106)
  // The loaded document plus one step for the whole burst.
  assert.equal(controller.history.stack.length, 2, 'six presses should record one step')
  controller.undo()
  const restored = controller.state.elements[0]
  assert.ok(restored !== undefined)
  assert.equal(restored.x, 100, 'one undo returns the whole burst')
})

test('a locked card is reported and stays put', () => {
  const controller = controllerOf()
  const card = controller.state.elements[0]
  assert.ok(card !== undefined)
  card.locked = true
  controller.state.selectedIds.add('a')
  const result = press(controller, 'ArrowRight')
  assert.equal(card.x, 100)
  assert.deepEqual(result.effects, [{ type: 'notice', text: LABELS.lockedNotice }])
})

test('an arrow key with no selection is left to the host', () => {
  const controller = controllerOf()
  assert.equal(press(controller, 'ArrowLeft').handled, false)
})
