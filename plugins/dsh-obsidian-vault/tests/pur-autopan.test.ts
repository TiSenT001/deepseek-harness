/**
 * Edge auto-pan: a drag near the border has to keep the view moving, and the
 * carried cards must stay under the pointer while it does.
 * @module dsh-obsidian-vault/tests/pur-autopan
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { AUTOPAN_MAX_SPEED, AUTOPAN_ZONE, PurController, autoPanSpeed } from '../src/pur-kernel/index.ts'
import type { PurElement } from '../src/pur-kernel/index.ts'
import { LABELS, envOf } from './helpers/pur-adapter-fixtures.ts'

/**
 * A controller with one card at (100, 100).
 * @returns the controller.
 */
function controllerOf(): PurController {
  const card: PurElement = { id: 'a', type: 'image', x: 100, y: 100, w: 200, h: 100, original: 'pur-asset:a.png', rotation: 0, opacity: 1 }
  return new PurController(envOf(), LABELS, [card])
}

test('the speed ramps towards the edge and stops outside the zone', () => {
  const env = envOf()
  assert.equal(autoPanSpeed(env.canvasWidth / 2, env.canvasWidth), 0)
  const near = autoPanSpeed(env.canvasWidth - 8, env.canvasWidth)
  const nearest = autoPanSpeed(env.canvasWidth - 1, env.canvasWidth)
  assert.ok(near > 0 && near <= AUTOPAN_MAX_SPEED)
  assert.ok(nearest >= near, 'closer to the edge pans faster')
  assert.equal(autoPanSpeed(2, env.canvasWidth), -AUTOPAN_MAX_SPEED, 'the left edge pans the other way')
})

test('a drag held at the edge keeps the view and the card moving together', () => {
  const controller = controllerOf()
  controller.state.selectedIds.add('a')
  controller.pointerDown({ clientX: 150, clientY: 150, rectLeft: 0, rectTop: 0, button: 0, ctrlKey: false, metaKey: false, shiftKey: false })
  // Hold the pointer inside the right edge zone.
  controller.pointerMove({ clientX: 795, clientY: 150, rectLeft: 0, rectTop: 0, button: 0, ctrlKey: false, metaKey: false, shiftKey: false })
  const before = controller.state.view.offsetX
  const cardX = controller.state.elements[0]?.x ?? 0
  const effects = controller.autoPanStep()
  assert.equal(effects.length, 1)
  assert.ok(controller.state.view.offsetX > before, 'the view moves toward the edge')
  const moved = controller.state.elements[0]?.x ?? 0
  assert.ok(moved > cardX, 'the dragged card follows the view')
})

test('nothing moves without a gesture', () => {
  const controller = controllerOf()
  controller.pointerMove({ clientX: 795, clientY: 150, rectLeft: 0, rectTop: 0, button: 0, ctrlKey: false, metaKey: false, shiftKey: false })
  assert.deepEqual(controller.autoPanStep(), [])
})

test('a pointer in the middle does not pan', () => {
  const controller = controllerOf()
  controller.state.selectedIds.add('a')
  controller.pointerDown({ clientX: 150, clientY: 150, rectLeft: 0, rectTop: 0, button: 0, ctrlKey: false, metaKey: false, shiftKey: false })
  controller.pointerMove({ clientX: 400, clientY: 300, rectLeft: 0, rectTop: 0, button: 0, ctrlKey: false, metaKey: false, shiftKey: false })
  assert.deepEqual(controller.autoPanStep(), [])
})

test('the zone constant is the documented width', () => {
  assert.equal(AUTOPAN_ZONE, 32)
})
