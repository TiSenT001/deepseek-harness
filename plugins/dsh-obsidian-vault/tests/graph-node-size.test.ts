/**
 * Graph node sizing: degree maps to a fixed screen-pixel band, independent of zoom.
 * @module dsh-obsidian-vault/tests/graph-node-size
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { screenRadius } from '../src/client/graph/render/node-size.ts'

test('degree changes the screen radius', () => {
  assert.equal(screenRadius(8, 1, 1), 1.5)
  assert.equal(screenRadius(30, 1, 1), 4)
  assert.ok(screenRadius(24, 1, 1) > screenRadius(12, 1, 1))
})

test('zoom never changes the dot size', () => {
  for (const zoom of [0.02, 0.05, 0.2, 1, 2]) {
    assert.equal(screenRadius(30, 1, zoom) * zoom, 4)
    assert.equal(screenRadius(8, 1, zoom) * zoom, 1.5)
  }
})

test('the display multiplier still changes the screen size', () => {
  assert.equal(screenRadius(30, 0.5, 0.2) * 0.2, 2)
  assert.equal(screenRadius(8, 2, 0.2) * 0.2, 3)
})