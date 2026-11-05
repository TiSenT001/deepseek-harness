/**
 * Embedded picture recovery: documents whose scene database cannot be read still
 * carry their pictures inline, and they may be PNG as well as JPEG.
 * @module dsh-obsidian-vault/tests/pur-embedded-pictures
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { extractEmbeddedPictures } from '../src/vault/pur-import.ts'

/** A one pixel PNG, complete with its end chunk. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

/** Filler that cannot be mistaken for a picture header. */
const JUNK = Buffer.alloc(64, 0x2a)

test('a PNG blob inside a container is recovered', () => {
  const document = Buffer.concat([JUNK, PNG, JUNK])
  const pictures = extractEmbeddedPictures(document)
  assert.equal(pictures.length, 1)
  assert.equal(pictures[0]?.name.endsWith('.png'), true)
  assert.deepEqual(Buffer.from(pictures[0]?.bytes ?? []), PNG)
})

test('two PNG blobs are both recovered, in order', () => {
  const document = Buffer.concat([JUNK, PNG, Buffer.alloc(32, 0x11), PNG, JUNK])
  const pictures = extractEmbeddedPictures(document)
  assert.equal(pictures.length, 2)
  assert.equal(pictures[0]?.name, 'embedded-0.png')
  assert.equal(pictures[1]?.name, 'embedded-1.png')
})

test('a truncated PNG without its end chunk is not recovered', () => {
  const truncated = PNG.subarray(0, PNG.length - 12)
  const pictures = extractEmbeddedPictures(Buffer.concat([JUNK, truncated, JUNK]))
  assert.deepEqual(pictures, [])
})

test('a document with no pictures yields nothing', () => {
  assert.deepEqual(extractEmbeddedPictures(Buffer.alloc(256, 0x7f)), [])
})

test('a lone PNG signature is not enough', () => {
  const signatureOnly = Buffer.concat([JUNK, PNG.subarray(0, 12), JUNK])
  assert.deepEqual(extractEmbeddedPictures(signatureOnly), [])
})
