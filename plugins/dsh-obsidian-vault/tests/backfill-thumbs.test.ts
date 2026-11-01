/**
 * Thumbnail backfill: which cards still need a small copy, and where to read them.
 * @module dsh-obsidian-vault/tests/backfill-thumbs
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { PurImageElement } from '../src/pur-kernel/index.ts'
import { cardsNeedingThumbnails, thumbnailSource } from '../src/client/pur/backfill-thumbs.ts'

/**
 * One image card; only the fields the selection logic reads are required.
 * @param patch - fields to override.
 * @returns the element.
 */
function imageCard(patch: Partial<PurImageElement> & { id: string }): PurImageElement {
  return {
    type: 'image',
    x: 0,
    y: 0,
    w: 100,
    h: 80,
    original: 'pur-asset:aaaa.png',
    rotation: 0,
    opacity: 1,
    ...patch,
  }
}

test('a card without a thumbnail is collected, one with it is skipped', () => {
  const cards = cardsNeedingThumbnails([
    imageCard({ id: 'a' }),
    imageCard({ id: 'b', thumb: 'pur-asset:bbbb.png' }),
    imageCard({ id: 'c', original: '' }),
  ])
  assert.deepEqual(cards.map((card) => card.element.id), ['a'])
})

test('the source follows the card kind: inline, asset route, or vault file', () => {
  assert.equal(thumbnailSource(imageCard({ id: 'inline', original: '', dataURL: 'data:image/png;base64,AA' })), 'data:image/png;base64,AA')
  assert.equal(thumbnailSource(imageCard({ id: 'asset' })), '/obsidian/api/pur/asset?id=aaaa.png')
  assert.equal(thumbnailSource(imageCard({ id: 'vault', original: '图片/x.png' })), '/obsidian/api/asset?path=%E5%9B%BE%E7%89%87%2Fx.png')
  assert.equal(thumbnailSource(imageCard({ id: 'none', original: '' })), undefined)
})

test('group children are visited', () => {
  const group = {
    id: 'g',
    type: 'group' as const,
    x: 0,
    y: 0,
    w: 200,
    h: 200,
    content: 'g',
    children: [imageCard({ id: 'child' })],
    rotation: 0,
    opacity: 1,
  }
  assert.deepEqual(cardsNeedingThumbnails([group]).map((card) => card.element.id), ['child'])
})
