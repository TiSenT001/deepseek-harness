/**
 * Canvas options the settings panel exposes: snapping can be switched off or
 * narrowed, the auto-pan ceiling limits how far one frame may move the view, and a
 * wider line tolerance makes a connection easier to select.
 * @module dsh-obsidian-vault/tests/pur-canvas-options
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DEFAULT_CANVAS_OPTIONS, PurController, autoPanSpeed, elementAt, pinWorldPosition } from '../src/pur-kernel/index.ts'
import type { PurElement } from '../src/pur-kernel/index.ts'
import { LABELS, envOf } from './helpers/pur-adapter-fixtures.ts'

/**
 * Two cards side by side, close enough that one snaps to the other while dragged.
 * @returns the elements.
 */
function sceneOf(): PurElement[] {
  const a: PurElement = { id: 'a', type: 'text', x: 0, y: 0, w: 100, h: 60, content: 'a', rotation: 0, opacity: 1 }
  const b: PurElement = { id: 'b', type: 'text', x: 150, y: 120, w: 100, h: 60, content: 'b', rotation: 0, opacity: 1 }
  return [a, b]
}

/**
 * One pointer event.
 * @param x - viewport x.
 * @param y - viewport y.
 * @returns the event.
 */
function pointer(x: number, y: number): { clientX: number; clientY: number; rectLeft: number; rectTop: number; button: number; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean } {
  return { clientX: x, clientY: y, rectLeft: 0, rectTop: 0, button: 0, ctrlKey: false, metaKey: false, shiftKey: false }
}

test('the controller exposes the defaults and accepts overrides', () => {
  const controller = new PurController(envOf(), LABELS, sceneOf())
  assert.deepEqual(controller.canvasOptions, DEFAULT_CANVAS_OPTIONS)
  const custom = new PurController(envOf(), LABELS, sceneOf(), undefined, { snapEnabled: false, lineHitTolerance: 40 })
  assert.equal(custom.canvasOptions.snapEnabled, false)
  assert.equal(custom.canvasOptions.lineHitTolerance, 40)
  assert.equal(custom.canvasOptions.snapDistance, DEFAULT_CANVAS_OPTIONS.snapDistance)
})

test('dragging snaps by default and stops when snapping is off', () => {
  const snapping = new PurController(envOf(), LABELS, sceneOf())
  snapping.pointerDown(pointer(50, 30))
  snapping.pointerMove(pointer(50, 30 + 59))
  assert.notEqual(snapping.state.snapGuides.y, null, 'expected a snap guide')

  const free = new PurController(envOf(), LABELS, sceneOf(), undefined, { snapEnabled: false })
  free.pointerDown(pointer(50, 30))
  free.pointerMove(pointer(50, 30 + 59))
  assert.equal(free.state.snapGuides.y, null, 'snapping should be off')
})

test('a zero snap distance disables latching', () => {
  const controller = new PurController(envOf(), LABELS, sceneOf(), undefined, { snapDistance: 0 })
  controller.pointerDown(pointer(50, 30))
  controller.pointerMove(pointer(50, 30 + 59))
  assert.equal(controller.state.snapGuides.y, null)
})

test('the auto-pan speed follows the configured ceiling', () => {
  assert.equal(autoPanSpeed(0, 1000, 12), 12)
  assert.equal(autoPanSpeed(0, 1000, 30), 30)
  assert.equal(autoPanSpeed(500, 1000, 30), 0)
  assert.ok(autoPanSpeed(8, 1000, 30) < autoPanSpeed(0, 1000, 30))
})

test('a wider line tolerance makes the connection selectable from farther away', () => {
  const a: PurElement = { id: 'a', type: 'code-node', title: 'a', x: 0, y: 0, w: 260, h: 116, inputs: [], outputs: [{ id: 'ao', label: 'sum' }], code: '', content: '', rotation: 0, opacity: 1 }
  const b: PurElement = { id: 'b', type: 'code-node', title: 'b', x: 500, y: 260, w: 260, h: 88, inputs: [{ id: 'bi', label: 'x' }], outputs: [], code: '', content: '', rotation: 0, opacity: 1 }
  const line: PurElement = { id: 'l1', type: 'line', from: 'a', to: 'b', fromPin: 'ao', toPin: 'bi', content: '', arrow: false, style: 'curve' }
  const elements = [a, b, line]
  const start = pinWorldPosition(elements, 'a', 'ao')
  const end = pinWorldPosition(elements, 'b', 'bi')
  assert.ok(start !== null && end !== null)
  const point = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 - 40 }
  assert.equal(elementAt(elements, point.x, point.y, 1, 8)?.id ?? null, null)
  assert.equal(elementAt(elements, point.x, point.y, 1, 60)?.id, 'l1')
})
test('grid opacity only fades the grid lines', async () => {
  const { drawGrid } = await import('../src/pur-kernel/render-background.ts')
  const { RenderRecorder } = await import('./helpers/pur-render-recorder.ts')
  const recorder = new RenderRecorder()
  drawGrid(recorder, {
    elements: [],
    view: { offsetX: 0, offsetY: 0, scale: 1 },
    width: 200,
    height: 100,
    preferences: { backgroundColor: 'transparent', gridColor: '#333333', showGrid: true, gridOpacity: 0.4 },
    labels: { imageLoading: 'x', codeNodeFallbackTitle: 'x', codeNodeBadge: 'x', noteLinkFallback: 'x', codeCardPrefix: '' },
  })
  assert.ok(recorder.calls.includes('globalAlpha=0.4'), 'opacity was not applied')
  assert.equal(recorder.calls.filter((call) => call === 'restore()').length, 1)
})

test('an opaque grid records no alpha change', async () => {
  const { drawGrid } = await import('../src/pur-kernel/render-background.ts')
  const { RenderRecorder } = await import('./helpers/pur-render-recorder.ts')
  const recorder = new RenderRecorder()
  drawGrid(recorder, {
    elements: [],
    view: { offsetX: 0, offsetY: 0, scale: 1 },
    width: 200,
    height: 100,
    preferences: { backgroundColor: 'transparent', gridColor: '#333333', showGrid: true, gridOpacity: 1 },
    labels: { imageLoading: 'x', codeNodeFallbackTitle: 'x', codeNodeBadge: 'x', noteLinkFallback: 'x', codeCardPrefix: '' },
  })
  assert.equal(recorder.calls.some((call) => call.startsWith('globalAlpha=')), false)
})