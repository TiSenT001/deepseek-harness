/**
 * Native PureRef container: pictures are recovered from their length prefix.
 * @module dsh-obsidian-vault/tests/pur-import-native
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { extractEmbeddedPictures, importNativePur } from '../src/vault/pur-import.ts'

/** PNG header, the bytes a real file starts with. */
const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

/** PNG IEND chunk type plus its fixed CRC, which ends every valid PNG. */
const PNG_IEND = [0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]

/**
 * One length-prefixed PNG blob, as the native container stores it.
 * @param payload - distinguishing bytes between pictures.
 * @returns the blob: big-endian length, then a header, filler and IEND.
 */
function blob(payload: string): Buffer {
  const body = Buffer.concat([
    Buffer.from(PNG_HEADER),
    Buffer.from(payload.padEnd(64, 'x')),
    Buffer.from(PNG_IEND),
  ])
  const length = Buffer.alloc(4)
  length.writeUInt32BE(body.length, 0)
  return Buffer.concat([length, body])
}

test('pictures are recovered in file order, ignoring unrelated bytes', () => {
  const noise = Buffer.from([0x00, 0x00, 0x00, 0x08, 0x00, 0x31, 0x00, 0x2e])
  const file = new Uint8Array(Buffer.concat([noise, blob('AAA'), noise, blob('BBB')]))
  const pictures = extractEmbeddedPictures(file)
  assert.equal(pictures.length, 2)
  assert.equal(pictures[0]?.name, 'embedded-0.png')
  assert.equal(pictures[1]?.name, 'embedded-1.png')
})

test('a bogus length never reads past the file', () => {
  const body = Buffer.concat([Buffer.from(PNG_HEADER), Buffer.from('AA'), Buffer.from(PNG_IEND)])
  const length = Buffer.alloc(4)
  length.writeUInt32BE(0x7fffffff, 0)
  const file = new Uint8Array(Buffer.concat([length, body]))
  assert.deepEqual(extractEmbeddedPictures(file), [])
})

test('the native import lays the pictures out on a grid', async () => {
  const file = new Uint8Array(Buffer.concat([blob('AAA'), blob('BBB'), blob('CCC')]))
  const stored: string[] = []
  const result = await importNativePur(file, async (name) => {
    stored.push(name)
    return `pur-asset:${name}`
  })
  assert.equal(result.elements.length, 3)
  assert.equal(result.skipped, 0)
  assert.deepEqual(stored, ['embedded-0.png', 'embedded-1.png', 'embedded-2.png'])
  assert.equal(result.elements[0]?.x, 0)
  // Cards are placed on a fixed grid with a 24 unit gutter.
  assert.equal(result.elements[1]?.x, 320 + 24)
})
