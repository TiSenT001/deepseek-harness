/**
 * Thumbnail backfill: which cards still need a small copy, and where to read them.
 * @module dsh-obsidian-vault/tests/backfill-thumbs
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cardsNeedingThumbnails, thumbnailSource } from '../src/client/pur/backfill-thumbs.ts'
import type { PurElement } from '../src/pur-kernel/index.ts'

const image = (patch: Partial<PurElement> & { id: string }): PurElement => ({
  id: patch.id,
  type: 'image',
  x: 0,
  y: 0,
  w: 100,
  h: 80,
  original: 'pur-asset:aaaa.png',
  rotation: 0,
  opacity: 1,
  ...patch,
} as PurElement)

test('a card without a thumbnail is collected, one with it is skipped', () => {
  const cards = cardsNeedingThumbnails([
    image({ id: 'a' }),
    image({ id: 'b', thumb: 'pur-asset:bbbb.png' } as Partial<PurElement>),
    image({ id: 'c', original: '' }),
  ])
  assert.deepEqual(cards.map((card) => card.element.id), ['a'])
})

test('the source follows the card kind: inline, asset route, or vault file', () => {
  assert.equal(thumbnailSource(image({ id: 'inline', original: '', dataURL: 'data:image/png;base64,AA' })), 'data:image/png;base64,AA')
  assert.equal(thumbnailSource(image({ id: 'asset' })), '/obsidian/api/pur/asset?id=aaaa.png')
  assert.equal(thumbnailSource(image({ id: 'vault', original: '图片/x.png' })), '/obsidian/api/asset?path=%E5%9B%BE%E7%89%87%2Fx.png')
  assert.equal(thumbnailSource(image({ id: 'none', original: '' })), undefined)
})

test('group children are visited', () => {
  const group = {
    id: 'g',
    type: 'group',
    x: 0,
    y: 0,
    w: 200,
    h: 200,
    content: 'g',
    children: [image({ id: 'child' })],
    rotation: 0,
    opacity: 1,
  } as PurElement
  assert.deepEqual(cardsNeedingThumbnails([group]).map((card) => card.element.id), ['child'])
})
