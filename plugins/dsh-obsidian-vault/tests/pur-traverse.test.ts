/**
 * Tab traversal: the canvas has to be usable without a pointer, so Tab walks the
 * selection through the board and Shift+Tab walks back.
 * @module dsh-obsidian-vault/tests/pur-traverse
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PurController } from '../src/pur-kernel/index.ts'
import type { PurElement } from '../src/pur-kernel/index.ts'
import { LABELS, envOf } from './helpers/pur-adapter-fixtures.ts'

/**
 * A controller with two cards and one group holding a child.
 * @returns the controller.
 */
function controllerOf(): PurController {
  const a: PurElement = { id: 'a', type: 'image', x: 0, y: 0, w: 10, h: 10, original: 'pur-asset:a.png', rotation: 0, opacity: 1 }
  const b: PurElement = { id: 'b', type: 'image', x: 20, y: 0, w: 10, h: 10, original: 'pur-asset:b.png', rotation: 0, opacity: 1 }
  const group: PurElement = {
    id: 'g',
    type: 'group',
    x: 40,
    y: 0,
    w: 100,
    h: 100,
    content: 'g',
    rotation: 0,
    opacity: 1,
    children: [{ id: 'c', type: 'image', x: 5, y: 5, w: 10, h: 10, original: 'pur-asset:c.png', rotation: 0, opacity: 1 }],
  }
  return new PurController(envOf(), LABELS, [a, b, group])
}

/**
 * Press Tab.
 * @param controller - the canvas.
 * @param backwards - whether shift was held.
 * @returns the selected ids after the press.
 */
function tab(controller: PurController, backwards = false): string[] {
  const result = controller.keyDown({ key: 'Tab', ctrlKey: false, metaKey: false, shiftKey: backwards })
  assert.equal(result.handled, true)
  return [...controller.state.selectedIds]
}

test('the first Tab selects the first element', () => {
  const controller = controllerOf()
  assert.deepEqual(tab(controller), ['a'])
})

test('Tab walks the elements and the group children in order', () => {
  const controller = controllerOf()
  assert.deepEqual(tab(controller), ['a'])
  assert.deepEqual(tab(controller), ['b'])
  assert.deepEqual(tab(controller), ['g'])
  assert.deepEqual(tab(controller), ['c'])
})

test('Tab wraps around at the end', () => {
  const controller = controllerOf()
  for (let press = 0; press < 4; press++) tab(controller)
  assert.deepEqual(tab(controller), ['a'])
})

test('shift+tab walks back and wraps to the last element', () => {
  const controller = controllerOf()
  assert.deepEqual(tab(controller, true), ['c'])
  assert.deepEqual(tab(controller, true), ['g'])
})

test('an empty canvas keeps the key', () => {
  const controller = new PurController(envOf(), LABELS, [])
  const result = controller.keyDown({ key: 'Tab', ctrlKey: false, metaKey: false, shiftKey: false })
  // Nothing to select: report handled with no effects so focus stays put.
  assert.equal(result.handled, true)
  assert.deepEqual(result.effects, [])
})

test('traversal continues from a pointer-selected element', () => {
  const controller = controllerOf()
  controller.state.selectedIds.add('b')
  assert.deepEqual(tab(controller), ['g'])
})
test('tabbing to an off-screen element brings it into view', () => {
  const far: PurElement = { id: 'far', type: 'image', x: 9000, y: 9000, w: 100, h: 100, original: 'pur-asset:far.png', rotation: 0, opacity: 1 }
  const controller = new PurController(envOf(), LABELS, [far])
  tab(controller)
  const env = envOf()
  const screenX = far.x * controller.state.view.scale + controller.state.view.offsetX
  const screenY = (far.y ?? 0) * controller.state.view.scale + controller.state.view.offsetY
  assert.ok(Math.abs(screenX + 50 - env.canvasWidth / 2) < 0.5, `x landed at ${screenX}`)
  assert.ok(Math.abs(screenY + 50 - env.canvasHeight / 2) < 0.5, `y landed at ${screenY}`)
})

test('tabbing to a visible element leaves the view alone', () => {
  const controller = controllerOf()
  controller.state.view.offsetX = 10
  tab(controller)
  assert.equal(controller.state.view.offsetX, 10)
})
