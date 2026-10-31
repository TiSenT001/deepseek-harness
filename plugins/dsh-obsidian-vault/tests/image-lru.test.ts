/**
 * Bounded image cache: the least recently used bitmap goes first.
 * @module dsh-obsidian-vault/tests/image-lru
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BoundedImageMap } from '../src/client/pur/image-lru.ts'

const MB = 1024 * 1024

test('entries past the budget evict the least recently used', () => {
  const map = new BoundedImageMap<string>(3 * MB)
  map.set('a', 'A', MB)
  map.set('b', 'B', MB)
  map.get('a')
  map.set('c', 'C', MB)
  assert.deepEqual(map.keys().sort(), ['a', 'b', 'c'])
  map.set('d', 'D', MB)
  assert.equal(map.has('b'), false, 'b was the oldest untouched entry')
  assert.equal(map.has('a'), true)
  assert.deepEqual(map.keys().sort(), ['a', 'c', 'd'])
})

test('replacing one key adjusts the byte count instead of doubling it', () => {
  const map = new BoundedImageMap<string>(2 * MB)
  map.set('a', 'A', MB)
  map.set('a', 'A2', MB)
  assert.equal(map.bytes, MB)
  assert.equal(map.size, 1)
  assert.equal(map.get('a'), 'A2')
})

test('one oversized entry is kept rather than evicted immediately', () => {
  const map = new BoundedImageMap<string>(MB)
  map.set('huge', 'H', 4 * MB)
  assert.equal(map.get('huge'), 'H')
})
