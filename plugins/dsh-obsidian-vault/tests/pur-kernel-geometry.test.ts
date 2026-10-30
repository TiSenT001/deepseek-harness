import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  elementAt,
  gridStep,
  lineEndpointAt,
  pinAt,
  pinPosition,
  pinWorldPosition,
  rectsIntersect,
  screenToWorld,
  worldRect,
  worldToScreen,
  worldViewport,
  wrapText,
} from '../src/pur-kernel/index.ts'
import type { PurViewState } from '../src/pur-kernel/index.ts'
import {
  GEOMETRY_ELEMENTS,
  GOLDEN_ELEMENT_AT,
  GOLDEN_GRID,
  GOLDEN_LINE_ENDPOINT_AT,
  GOLDEN_PIN_AT,
  GOLDEN_PIN_OFFSETS,
  GOLDEN_PIN_WORLD,
  GOLDEN_WORLD_RECTS,
  GOLDEN_WRAP,
} from './helpers/pur-geometry-golden.ts'

/** Width the upstream run measured: ten units per code point. */
const measure = (text: string): number => [...text].length * 10

test('wraps text the way the upstream renderer does', () => {
  for (const block of GOLDEN_WRAP) {
    assert.deepEqual(wrapText(block.text, block.maxWidth, measure), block.lines, block.text)
  }
})

test('an empty paragraph wraps to one empty line', () => {
  assert.deepEqual(wrapText('', 100, measure), [''])
  assert.deepEqual(wrapText(undefined, 100, measure), [''])
  assert.deepEqual(wrapText('a\n\nb', 40, measure), ['a', '', 'b'])
})

test('snaps the grid to the upstream 1/2/5 step', () => {
  for (const { scale, step } of GOLDEN_GRID) assert.equal(gridStep(scale), step, `scale ${scale}`)
})

test('reports the world rectangle of nested elements', () => {
  for (const { id, rect } of GOLDEN_WORLD_RECTS) assert.deepEqual(worldRect(GEOMETRY_ELEMENTS, id), rect, id)
})

test('places pins at the upstream offsets', () => {
  for (const query of GOLDEN_PIN_OFFSETS) {
    const node = {
      w: query.w,
      h: query.h,
      inputs: Array.from({ length: query.inputCount }, (_, index) => ({ id: `i${index}`, label: `i${index}` })),
      outputs: Array.from({ length: query.outputCount }, (_, index) => ({ id: `o${index}`, label: `o${index}` })),
    }
    assert.deepEqual(pinPosition(node, query.isInput, query.index), query.result)
  }
})

test('resolves pin world positions through group offsets', () => {
  for (const { nodeId, pinId, result } of GOLDEN_PIN_WORLD) {
    assert.deepEqual(pinWorldPosition(GEOMETRY_ELEMENTS, nodeId, pinId), result, `${nodeId}.${pinId}`)
  }
})

test('hits the same element, pin and endpoint as upstream', () => {
  for (const query of GOLDEN_ELEMENT_AT) {
    assert.equal(elementAt(GEOMETRY_ELEMENTS, query.x, query.y, query.scale)?.id ?? null, query.id, `${query.x},${query.y}@${query.scale}`)
  }
  for (const query of GOLDEN_PIN_AT) {
    assert.deepEqual(pinAt(GEOMETRY_ELEMENTS, query.x, query.y, query.scale), query.hit, `${query.x},${query.y}@${query.scale}`)
  }
  for (const query of GOLDEN_LINE_ENDPOINT_AT) {
    assert.deepEqual(lineEndpointAt(GEOMETRY_ELEMENTS, query.x, query.y, query.scale), query.hit, `${query.x},${query.y}@${query.scale}`)
  }
})

test('converts between screen and world coordinates', () => {
  const view: PurViewState = { offsetX: 100, offsetY: -50, scale: 2 }
  assert.deepEqual(screenToWorld(view, 100, -50), { x: 0, y: 0 })
  assert.deepEqual(screenToWorld(view, 500, 150), { x: 200, y: 100 })
  assert.deepEqual(worldToScreen(view, 0, 0), { x: 100, y: -50 })
  assert.deepEqual(worldToScreen(view, 200, 100), { x: 500, y: 150 })
  assert.deepEqual(worldViewport(view, 800, 600), { x: -50, y: 25, w: 400, h: 300 })
})

test('overlapping rectangles intersect but touching edges do not', () => {
  assert.equal(rectsIntersect({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 }), true)
  assert.equal(rectsIntersect({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 }), false)
  assert.equal(rectsIntersect({ x: 0, y: 0, w: 10, h: 10 }, { x: 20, y: 20, w: 5, h: 5 }), false)
})
