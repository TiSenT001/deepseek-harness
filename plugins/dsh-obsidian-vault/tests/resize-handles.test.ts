/**
 * Resize geometry: corner drags on an image keep the ratio, edge drags and card
 * drags stay free.
 * @module dsh-obsidian-vault/tests/resize-handles
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { handlePositions, resizeRect } from '../src/pur-kernel/resize-handles.ts'

const START = { x: 100, y: 100, w: 200, h: 100 }

test('a south-east drag grows width and height by the delta', () => {
  const next = resizeRect('se', START, 40, 20)
  assert.deepEqual(next, { x: 100, y: 100, w: 240, h: 120 })
})

test('a north-west drag moves the origin and keeps the opposite corner fixed', () => {
  const next = resizeRect('nw', START, 20, 10)
  assert.deepEqual(next, { x: 120, y: 110, w: 180, h: 90 })
})

test('an east drag only changes width', () => {
  const next = resizeRect('e', START, -50, 999)
  assert.deepEqual(next, { x: 100, y: 100, w: 150, h: 100 })
})

test('an image corner drag keeps the starting ratio', () => {
  const next = resizeRect('se', START, 100, 0, START.w / START.h)
  assert.equal(Number((next.w / next.h).toFixed(3)), 2)
})

test('a card corner drag with no aspect ignores the other axis', () => {
  const next = resizeRect('se', START, 100, 0)
  assert.equal(next.h, 100)
})

test('every handle sits on the rectangle outline', () => {
  const points = handlePositions(START)
  assert.deepEqual(points.nw, { x: 100, y: 100 })
  assert.deepEqual(points.se, { x: 300, y: 200 })
  assert.deepEqual(points.n, { x: 200, y: 100 })
  assert.deepEqual(points.w, { x: 100, y: 150 })
})
