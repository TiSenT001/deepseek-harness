/**
 * Simulation cadence: small graphs may tick every frame, larger ones slow down
 * so a warm animation never blocks the page, and the bench's budget mirrors it.
 * @module dsh-obsidian-vault/tests/graph-tick-cadence
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { tickIntervalMs } from '../src/client/graph/layout-types.ts'

test('small graphs tick at the frame budget', () => {
  assert.equal(tickIntervalMs(0), 1000 / 60)
  assert.equal(tickIntervalMs(600), 1000 / 60)
})

test('larger graphs slow down in steps', () => {
  assert.equal(tickIntervalMs(601), 1000 / 40)
  assert.equal(tickIntervalMs(1500), 1000 / 40)
  assert.equal(tickIntervalMs(1501), 1000 / 25)
  assert.equal(tickIntervalMs(3000), 1000 / 25)
  assert.equal(tickIntervalMs(3001), 1000 / 15)
  assert.equal(tickIntervalMs(5000), 1000 / 15)
})

test('the cadence never drops below roughly 15fps', () => {
  for (const nodes of [1, 500, 1200, 2500, 4000, 20000]) {
    assert.ok(tickIntervalMs(nodes) <= 1000 / 15 + 0.01)
  }
})
