/**
 * Shortcut set: cut, duplicate, ungroup and the zoom keys. Each one has to leave
 * the document and the viewport in a state the user can undo or repeat.
 * @module dsh-obsidian-vault/tests/pur-shortcuts
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PurController } from '../src/pur-kernel/index.ts'
import type { PurElement } from '../src/pur-kernel/index.ts'
import { LABELS, envOf } from './helpers/pur-adapter-fixtures.ts'

/**
 * A controller with two cards.
 * @returns the controller.
 */
function controllerOf(): PurController {
  const a: PurElement = { id: 'a', type: 'image', x: 100, y: 100, w: 200, h: 100, original: 'pur-asset:a.png', rotation: 0, opacity: 1 }
  const b: PurElement = { id: 'b', type: 'text', x: 400, y: 300, w: 160, h: 80, content: 'b', rotation: 0, opacity: 1 }
  return new PurController(envOf(), LABELS, [a, b])
}

/**
 * Press one shortcut.
 * @param controller - the canvas.
 * @param key - the key name.
 * @param ctrlKey - whether Ctrl was held.
 * @param shiftKey - whether Shift was held.
 * @returns the key result.
 */
function press(controller: PurController, key: string, ctrlKey = false, shiftKey = false) {
  return controller.keyDown({ key, ctrlKey, metaKey: false, shiftKey })
}

test('ctrl+d duplicates the selection', () => {
  const controller = controllerOf()
  controller.state.selectedIds.add('a')
  const result = press(controller, 'd', true)
  assert.equal(result.handled, true)
  assert.equal(controller.state.elements.length, 3)
  const clone = controller.state.elements.find((element) => element.id !== 'a' && element.id !== 'b')
  assert.ok(clone !== undefined)
  assert.equal(clone.x, 130, 'the clone lands 30 units down-right')
  assert.deepEqual([...controller.state.selectedIds], [clone.id])
})

test('ctrl+x cuts: the card leaves the document and lands in the clipboard', () => {
  const controller = controllerOf()
  controller.state.selectedIds.add('a')
  press(controller, 'x', true)
  assert.equal(controller.state.elements.length, 1)
  assert.equal(controller.state.elements[0]?.id, 'b')
  assert.equal(controller.state.clipboard.length, 1)
  assert.equal(controller.state.clipboard[0]?.id, 'a')
})

test('ctrl+shift+g ungroups the frame and keeps the children in place', () => {
  const controller = controllerOf()
  const group: PurElement = {
    id: 'g',
    type: 'group',
    x: 500,
    y: 500,
    w: 400,
    h: 300,
    content: '组',
    rotation: 0,
    opacity: 1,
    children: [
      { id: 'c1', type: 'image', x: 10, y: 20, w: 100, h: 80, original: 'pur-asset:c1.png', rotation: 0, opacity: 1 },
      { id: 'c2', type: 'text', x: 150, y: 120, w: 100, h: 60, content: 'c2', rotation: 0, opacity: 1 },
    ],
  }
  controller.state.elements.push(group)
  controller.state.selectedIds.add('g')
  const result = press(controller, 'G', true, true)
  assert.equal(result.handled, true)
  assert.equal(controller.state.elements.some((element) => element.id === 'g'), false, 'the frame is gone')
  const child = controller.state.elements.find((element) => element.id === 'c1')
  assert.ok(child !== undefined)
  assert.equal(child.x, 510, 'the child keeps its world position')
  assert.equal(child.y, 520)
  // Ungrouping leaves nothing selected, so a follow-up delete cannot take the\n  // children by surprise.\n  assert.equal(controller.state.selectedIds.size, 0)
})

test('0 returns to 100% around the canvas centre', () => {
  const controller = controllerOf()
  controller.state.view = { offsetX: -1200, offsetY: -800, scale: 2.5 }
  const env = envOf()
  const worldX = (env.canvasWidth / 2 - controller.state.view.offsetX) / controller.state.view.scale
  press(controller, '0')
  const view = controller.state.view
  assert.equal(view.scale, 1)
  const screenX = worldX * view.scale + view.offsetX
  assert.ok(Math.abs(screenX - env.canvasWidth / 2) < 0.5, 'the centred point stays centred')
})

test('plus and minus step the zoom and stay clamped', () => {
  const controller = controllerOf()
  controller.state.view.scale = 1
  press(controller, '+')
  assert.ok(Math.abs(controller.state.view.scale - 1.15) < 1e-9)
  press(controller, '-')
  assert.ok(Math.abs(controller.state.view.scale - 1.15 * 0.85) < 1e-9, 'the step is a factor, not a return trip')
  for (let index = 0; index < 40; index++) press(controller, '+')
  assert.equal(controller.state.view.scale, 10)
  for (let index = 0; index < 80; index++) press(controller, '-')
  assert.equal(controller.state.view.scale, 0.05)
})
