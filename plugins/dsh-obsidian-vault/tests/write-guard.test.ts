/**
 * Stale-write guard: the comparison the bridge runs before overwriting a file.
 * @module dsh-obsidian-vault/tests/write-guard
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isStaleWrite } from '../src/vault/write-guard.ts'

test('a write is stale once the file moved past the reported version', () => {
  assert.equal(isStaleWrite(2_000, 1_000), true)
  assert.equal(isStaleWrite(1_000, 2_000), true)
})

test('the same version, and sub-millisecond jitter, are not stale', () => {
  assert.equal(isStaleWrite(1_000, 1_000), false)
  assert.equal(isStaleWrite(1_000.4, 1_000), false)
  assert.equal(isStaleWrite(1_001, 1_000), false)
})

test('an unknown version on either side never blocks the write', () => {
  assert.equal(isStaleWrite(undefined, 1_000), false)
  assert.equal(isStaleWrite(1_000, undefined), false)
  assert.equal(isStaleWrite(undefined, undefined), false)
})
