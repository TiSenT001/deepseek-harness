/**
 * Hover cursors: the pointer has to say what a press would do before the user
 * commits — grab a handle, move a card, or start a rubber band.
 * @module dsh-obsidian-vault/tests/pur-hover-cursor
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PurController } from '../src/pur-kernel/index.ts'
import type { PurControllerEffect, PurElement } from '../src/pur-kernel/index.ts'
import { LABELS, envOf } from './helpers/pur-adapter-fixtures.ts'

/**
 * A controller with one 200x100 card at (100, 100).
 * @returns the controller.
 */
function controllerOf(): PurController {
  const card: PurElement = { id: 'a', type: 'image', x: 100, y: 100, w: 200, h: 100, original: 'pur-asset:a.png', rotation: 0, opacity: 1 }
  return new PurController(envOf(), LABELS, [card])
}

/**
 * Move the pointer to canvas coordinates and return the cursor it asked for.
 * @param controller - the canvas.
 * @param x - viewport x.
 * @param y - viewport y.
 * @returns the cursor name, or undefined when no cursor was requested.
 */
function cursorAt(controller: PurController, x: number, y: number): string | undefined {
  const effects: PurControllerEffect[] = controller.pointerMove({ clientX: x, clientY: y, rectLeft: 0, rectTop: 0, button: 0, ctrlKey: false, metaKey: false, shiftKey: false })
  const cursor = effects.find((effect) => effect.type === 'cursor')
  return cursor === undefined || cursor.type !== 'cursor' ? undefined : cursor.cursor
}

test('hovering a card asks for the move cursor', () => {
  const controller = controllerOf()
  assert.equal(cursorAt(controller, 150, 150), 'move')
})

test('hovering empty canvas asks for the default cursor', () => {
  const controller = controllerOf()
  assert.equal(cursorAt(controller, 600, 500), 'default')
})

test('hovering a corner handle asks for the diagonal resize cursor', () => {
  const controller = controllerOf()
  controller.state.selectedIds.add('a')
  // South-east corner of the card, in canvas pixels.
  assert.equal(cursorAt(controller, 300, 200), 'nwse-resize')
})

test('hovering an edge handle asks for the matching axis cursor', () => {
  const controller = controllerOf()
  controller.state.selectedIds.add('a')
  // East edge midpoint.
  assert.equal(cursorAt(controller, 300, 150), 'ew-resize')
  // South edge midpoint.
  assert.equal(cursorAt(controller, 200, 200), 'ns-resize')
})

test('an unselected card offers no handles, only the move cursor', () => {
  const controller = controllerOf()
  assert.equal(cursorAt(controller, 300, 200), 'move')
})

test('dragging suppresses the hover cursor', () => {
  const controller = controllerOf()
  controller.state.selectedIds.add('a')
  controller.pointerDown({ clientX: 150, clientY: 150, rectLeft: 0, rectTop: 0, button: 0, ctrlKey: false, metaKey: false, shiftKey: false })
  const effects = controller.pointerMove({ clientX: 160, clientY: 160, rectLeft: 0, rectTop: 0, button: 0, ctrlKey: false, metaKey: false, shiftKey: false })
  assert.ok(!effects.some((effect) => effect.type === 'cursor'), 'a drag must not rewrite the cursor')
})
