/**
 * Graph node sizing: pre-Obsidian degree radius in world units, with a 2px floor.
 * @module dsh-obsidian-vault/tests/graph-node-size
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { screenRadius } from '../src/client/graph/render/node-size.ts'

test('zooming in enlarges dots above the floor', () => {
  assert.equal(screenRadius(14, 1, 0.5) * 0.5, 7)
  assert.equal(screenRadius(14, 1, 1), 14)
})

test('zoom-out stops at the 2px floor', () => {
  assert.equal(screenRadius(2.8, 1, 0.05) * 0.05, 2)
  assert.equal(screenRadius(14, 1, 0.05) * 0.05, 2)
})

test('the display multiplier still changes the size', () => {
  assert.equal(screenRadius(14, 0.5, 0.5) * 0.5, 3.5)
  assert.equal(screenRadius(2.8, 2, 0.05) * 0.05, 4)
})