/**
 * Graph node sizing: the pre-Obsidian degree radius in world units.
 * @module dsh-obsidian-vault/tests/graph-node-size
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { screenRadius } from '../src/client/graph/render/node-size.ts'

test('node radius is world units and scales with camera zoom', () => {
  assert.equal(screenRadius(14, 1, 0.25), 14)
  assert.equal(screenRadius(14, 1, 0.25) * 0.25, 3.5)
  assert.equal(screenRadius(14, 1, 1), 14)
})

test('zoom does not change the stored node radius', () => {
  for (const zoom of [0.02, 0.05, 0.2, 1, 2]) {
    assert.equal(screenRadius(14, 1, zoom), 14)
  }
})

test('the display multiplier changes the world radius', () => {
  assert.equal(screenRadius(14, 0.5, 0.2), 7)
  assert.equal(screenRadius(14, 2, 0.2), 28)
})