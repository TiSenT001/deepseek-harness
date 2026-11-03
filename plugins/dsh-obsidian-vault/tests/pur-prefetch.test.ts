/**
 * Idle prefetch: which pictures sit close enough to the viewport to be worth
 * decoding before a pan reaches them.
 * @module dsh-obsidian-vault/tests/pur-prefetch
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { PurElement } from '../src/pur-kernel/index.ts'
import { PREFETCH_LIMIT, prefetchKeys } from '../src/pur-kernel/prefetch.ts'

/**
 * Build an image element.
 * @param id - element id.
 * @param x - world x.
 * @param y - world y.
 * @param extra - extra fields.
 * @returns the element.
 */
function image(id: string, x: number, y: number, extra: Partial<PurElement> = {}): PurElement {
  return { id, type: 'image', x, y, w: 100, h: 100, original: `${id}.png`, rotation: 0, opacity: 1, ...extra } as PurElement
}

test('a picture inside the viewport is prefetched', () => {
  const keys = prefetchKeys([image('a', 10, 10)], { offsetX: 0, offsetY: 0, scale: 1 }, 800, 600)
  assert.deepEqual(keys, ['a.png'])
})

test('a picture far outside the margin is skipped', () => {
  const keys = prefetchKeys([image('far', 5000, 5000)], { offsetX: 0, offsetY: 0, scale: 1 }, 800, 600)
  assert.deepEqual(keys, [])
})

test('a picture just past the edge is warmed', () => {
  // 900 world units at scale 1 sits beyond the 800 wide viewport but inside the margin.
  const keys = prefetchKeys([image('edge', 900, 10)], { offsetX: 0, offsetY: 0, scale: 1 }, 800, 600)
  assert.deepEqual(keys, ['edge.png'])
})

test('the thumbnail of a near picture is warmed with it', () => {
  const keys = prefetchKeys([image('a', 0, 0, { thumb: 'a-thumb.png' } as Partial<PurElement>)], { offsetX: 0, offsetY: 0, scale: 1 }, 800, 600)
  assert.deepEqual(keys, ['a.png', 'a-thumb.png'])
})

test('group members are visited and the result is capped', () => {
  const children = Array.from({ length: 40 }, (_, index) => image(`c${index}`, index * 40, 0))
  const group = { id: 'g', type: 'group', x: 0, y: 0, w: 2000, h: 200, content: 'g', children, rotation: 0, opacity: 1 } as PurElement
  const keys = prefetchKeys([group], { offsetX: 0, offsetY: 0, scale: 1 }, 800, 600)
  assert.equal(keys.length, PREFETCH_LIMIT)
  assert.equal(keys[0], 'c0.png')
})
