/**
 * Graph node sizing: every node uses one screen-space radius.
 * @module dsh-obsidian-vault/tests/graph-node-size
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { screenRadius } from '../src/client/graph/render/node-size.ts'

test('every node renders at the same fixed screen radius', () => {
  assert.equal(screenRadius(8, 1, 0.25) * 0.25, 4)
  assert.equal(screenRadius(30, 1, 0.25) * 0.25, 4)
  assert.equal(screenRadius(8, 1, 1), 4)
  assert.equal(screenRadius(30, 1, 2), 2)
})

test('the display multiplier still changes the screen size', () => {
  assert.equal(screenRadius(30, 0.5, 0.2) * 0.2, 2)
  assert.equal(screenRadius(8, 2, 0.2) * 0.2, 8)
})
test('zoom changes spacing, never the dot size', () => {
  for (const zoom of [0.02, 0.05, 0.2, 1, 2]) {
    assert.equal(screenRadius(30, 1, zoom) * zoom, 4)
  }
})