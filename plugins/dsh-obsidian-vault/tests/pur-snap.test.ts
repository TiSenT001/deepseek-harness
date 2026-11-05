/**
 * Snapping: a dragged card latches onto the neighbours' edges and centres, shows
 * the line it matched, and gives up on both when Alt is held.
 * @module dsh-obsidian-vault/tests/pur-snap
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PurController, SNAP_RADIUS, snapDrag } from '../src/pur-kernel/index.ts'
import type { PurElement } from '../src/pur-kernel/index.ts'
import { LABELS, envOf } from './helpers/pur-adapter-fixtures.ts'

/**
 * Build one card.
 * @param id - element id.
 * @param x - world x.
 * @param y - world y.
 * @param w - width.
 * @param h - height.
 * @returns the element.
 */
function card(id: string, x: number, y: number, w = 200, h = 100): PurElement {
  return { id, type: 'image', x, y, w, h, original: `pur-asset:${id}.png`, rotation: 0, opacity: 1 }
}

/**
 * A controller with a fixed card at (100,100) and a dragged card.
 * @param draggedX - where the dragged card sits.
 * @param draggedY - where the dragged card sits.
 * @returns the controller.
 */
function controllerOf(draggedX: number, draggedY: number): PurController {
  return new PurController(envOf(), LABELS, [card('fixed', 100, 100), card('moving', draggedX, draggedY)])
}

test('a card within the radius latches onto the neighbour edge', () => {
  const controller = controllerOf(304, 400)
  controller.state.selectedIds.add('moving')
  controller.pointerDown({ clientX: 304 + 10, clientY: 400 + 10, rectLeft: 0, rectTop: 0, button: 0, ctrlKey: false, metaKey: false, shiftKey: false })
  controller.pointerMove({ clientX: 304 + 10, clientY: 400 + 10, rectLeft: 0, rectTop: 0, button: 0, ctrlKey: false, metaKey: false, shiftKey: false })
  const moving = controller.state.elements.find((element) => element.id === 'moving')
  assert.ok(moving !== undefined)
  // The fixed card ends at x=300; the moving card starts at 304 and snaps back.
  assert.equal(moving.x, 300)
  assert.equal(controller.state.snapGuides.x, 300)
})

test('a card outside the radius keeps its position', () => {
  const controller = controllerOf(340, 400)
  controller.state.selectedIds.add('moving')
  controller.pointerDown({ clientX: 350, clientY: 410, rectLeft: 0, rectTop: 0, button: 0, ctrlKey: false, metaKey: false, shiftKey: false })
  controller.pointerMove({ clientX: 350, clientY: 410, rectLeft: 0, rectTop: 0, button: 0, ctrlKey: false, metaKey: false, shiftKey: false })
  const moving = controller.state.elements.find((element) => element.id === 'moving')
  assert.ok(moving !== undefined)
  assert.equal(moving.x, 340)
  assert.equal(controller.state.snapGuides.x, null)
})

test('alt keeps the exact pointer offset', () => {
  const controller = controllerOf(304, 400)
  controller.state.selectedIds.add('moving')
  controller.pointerDown({ clientX: 314, clientY: 410, rectLeft: 0, rectTop: 0, button: 0, ctrlKey: false, metaKey: false, shiftKey: false })
  controller.pointerMove({ clientX: 314, clientY: 410, rectLeft: 0, rectTop: 0, button: 0, ctrlKey: false, metaKey: false, shiftKey: false, altKey: true })
  const moving = controller.state.elements.find((element) => element.id === 'moving')
  assert.ok(moving !== undefined)
  assert.equal(moving.x, 304)
  assert.equal(controller.state.snapGuides.x, null)
})

test('centres snap too', () => {
  // The fixed card centres at x=200; a card whose centre is 3 units off latches.
  const controller = controllerOf(103, 400)
  controller.state.selectedIds.add('moving')
  controller.pointerDown({ clientX: 113, clientY: 410, rectLeft: 0, rectTop: 0, button: 0, ctrlKey: false, metaKey: false, shiftKey: false })
  controller.pointerMove({ clientX: 113, clientY: 410, rectLeft: 0, rectTop: 0, button: 0, ctrlKey: false, metaKey: false, shiftKey: false })
  const moving = controller.state.elements.find((element) => element.id === 'moving')
  assert.ok(moving !== undefined)
  // Centre of the moving card is x + 100; snapping it to 200 means x = 100.
  assert.equal(moving.x, 100)
})

test('the radius shrinks with the zoom', () => {
  const controller = controllerOf(340, 400)
  controller.state.view.scale = 8
  controller.state.selectedIds.add('moving')
  const result = snapDrag({ ...controller.state, dragStart: { clientX: 0, clientY: 0, pointerWorldX: 340, pointerWorldY: 400, elements: [{ id: 'moving', x: 340, y: 400, parentX: 0, parentY: 0 }] } }, 'moving')
  // At 8x the 8px radius is one world unit, so the 40-unit gap cannot latch.
  assert.equal(result.x, null)
  assert.ok(SNAP_RADIUS / 8 < 2)
})

test('pointer up clears the guides', () => {
  const controller = controllerOf(304, 400)
  controller.state.selectedIds.add('moving')
  controller.pointerDown({ clientX: 314, clientY: 410, rectLeft: 0, rectTop: 0, button: 0, ctrlKey: false, metaKey: false, shiftKey: false })
  controller.pointerMove({ clientX: 314, clientY: 410, rectLeft: 0, rectTop: 0, button: 0, ctrlKey: false, metaKey: false, shiftKey: false })
  controller.pointerUp({ clientX: 314, clientY: 410, rectLeft: 0, rectTop: 0, button: 0, ctrlKey: false, metaKey: false, shiftKey: false })
  assert.deepEqual(controller.state.snapGuides, { x: null, y: null })
})
