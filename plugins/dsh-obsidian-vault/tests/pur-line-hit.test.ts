/**
 * Connection hit-testing follows the path the renderer draws: a click anywhere on a
 * long arc selects the line, a card still wins where it covers the line, and the
 * straight and elbow styles keep their own paths.
 * @module dsh-obsidian-vault/tests/pur-line-hit
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PurController, distanceToLinePath, elementAt, pinWorldPosition } from '../src/pur-kernel/index.ts'
import type { PurElement } from '../src/pur-kernel/index.ts'
import { LABELS, envOf } from './helpers/pur-adapter-fixtures.ts'

/**
 * Two code nodes joined by a line, plus a text card that can be placed over it.
 * @param style - line stroke pattern.
 * @returns the elements.
 */
function sceneOf(style: 'curve' | 'straight' | 'rect'): PurElement[] {
  const a: PurElement = { id: 'a', type: 'code-node', title: 'a', x: 0, y: 0, w: 260, h: 116, inputs: [], outputs: [{ id: 'ao', label: 'sum' }], code: '', content: '', rotation: 0, opacity: 1 }
  const b: PurElement = { id: 'b', type: 'code-node', title: 'b', x: 500, y: 260, w: 260, h: 88, inputs: [{ id: 'bi', label: 'x' }], outputs: [], code: '', content: '', rotation: 0, opacity: 1 }
  const line: PurElement = { id: 'l1', type: 'line', from: 'a', to: 'b', fromPin: 'ao', toPin: 'bi', content: '', arrow: false, style }
  return [a, b, line]
}

/**
 * A point on the default cubic curve at the given parameter.
 * @param t - parameter, 0 to 1.
 * @returns the world point.
 */
function curvePoint(t: number, start: { x: number; y: number } = { x: 260, y: 81 }, end: { x: number; y: number } = { x: 500, y: 327 }): { x: number; y: number } {
  const control = Math.max(50, Math.abs(end.x - start.x) * 0.5)
  const p1 = { x: start.x + control, y: start.y }
  const p2 = { x: end.x - control, y: end.y }
  const u = 1 - t
  return {
    x: u * u * u * start.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * end.x,
    y: u * u * u * start.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * end.y,
  }
}

test('a click on the arc selects the line', () => {
  const elements = sceneOf('curve')
  const point = curvePoint(0.2)
  assert.equal(elementAt(elements, point.x, point.y, 1)?.id, 'l1')
})

test('the arc is hit far from the straight midpoint', () => {
  const elements = sceneOf('curve')
  const point = curvePoint(0.2)
  const distanceToMidpoint = Math.hypot(point.x - 380, point.y - 200)
  assert.ok(distanceToMidpoint > 25, `the sample is only ${distanceToMidpoint.toFixed(0)} from the midpoint`)
  assert.equal(elementAt(elements, point.x, point.y, 1)?.id, 'l1')
})

test('the path distance agrees with the drawn curve', () => {
  const elements = sceneOf('curve')
  const point = curvePoint(0.6)
  const start = pinWorldPosition(elements, 'a', 'ao')
  const end = pinWorldPosition(elements, 'b', 'bi')
  assert.ok(start !== null && end !== null)
  const sampled = curvePoint(0.6, start, end)
  assert.ok(distanceToLinePath('curve', start, end, sampled.x, sampled.y) < 1)
})

test('a card covering the line still wins the click', () => {
  const elements = sceneOf('curve')
  const point = curvePoint(0.2)
  const card: PurElement = { id: 'card', type: 'text', x: point.x - 20, y: point.y - 20, w: 80, h: 40, content: 'x', rotation: 0, opacity: 1 }
  assert.equal(elementAt([...elements, card], point.x, point.y, 1)?.id, 'card')
})

test('the straight style is hit along the segment', () => {
  const elements = sceneOf('straight')
  assert.equal(elementAt(elements, 380, 200, 1)?.id, 'l1')
  assert.equal(elementAt(elements, 380, 260, 1)?.id ?? null, null)
})

test('the elbow style is hit on its horizontal arm', () => {
  const elements = sceneOf('rect')
  assert.equal(elementAt(elements, 350, 77, 1)?.id, 'l1')
  assert.equal(elementAt(elements, 380, 200, 1)?.id, 'l1')
})

test('clicking the arc selects the line in the controller', () => {
  const elements = sceneOf('curve')
  const controller = new PurController(envOf(), LABELS, elements)
  const point = curvePoint(0.2)
  controller.pointerDown({ clientX: point.x, clientY: point.y, rectLeft: 0, rectTop: 0, button: 0, ctrlKey: false, metaKey: false, shiftKey: false })
  assert.deepEqual([...controller.state.selectedIds], ['l1'])
})
