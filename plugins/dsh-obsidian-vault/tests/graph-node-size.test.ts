/**
 * Graph node sizing: world radius scales with zoom, with a visible floor.
 * @module dsh-obsidian-vault/tests/graph-node-size
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { screenRadius } from '../src/client/graph/render/node-size.ts'

test('zooming in makes dots larger', () => {
  assert.equal(screenRadius(30, 1, 0.1) * 0.1, 3)
  assert.equal(screenRadius(30, 1, 0.5) * 0.5, 15)
  assert.equal(screenRadius(30, 1, 1), 30)
})

test('zooming out shrinks dots down to the floor', () => {
  assert.equal(screenRadius(30, 1, 0.05) * 0.05, 2)
  assert.equal(screenRadius(8, 1, 0.05) * 0.05, 2)
})

test('degree still separates hubs once above the floor', () => {
  assert.ok(screenRadius(30, 1, 0.2) > screenRadius(8, 1, 0.2))
})