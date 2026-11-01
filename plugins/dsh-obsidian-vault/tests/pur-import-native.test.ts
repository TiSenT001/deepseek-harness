/**
 * Native PureRef container: pictures are recovered by walking JPEG markers.
 * @module dsh-obsidian-vault/tests/pur-import-native
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { extractEmbeddedPictures, importNativePur, jpegLengthAt, pictureSize } from '../src/vault/pur-import.ts'

/**
 * A structurally valid 2x1 JPEG: the marker walk stops only on a real end marker,
 * so the fixture has to carry the segments a real file does.
 * @param entropy - filler for the scan data, to vary the picture size.
 * @returns the JPEG bytes.
 */
function jpeg(entropy: string): Buffer {
  const segment = (marker: number[], payload: Buffer): Buffer => {
    const header = Buffer.alloc(2)
    header.writeUInt16BE(payload.length + 2, 0)
    return Buffer.concat([Buffer.from(marker), header, payload])
  }
  const app0 = segment([0xff, 0xe0], Buffer.from('JFIF\u0000\u0001\u0001\u0000\u0000\u0001\u0000\u0001\u0000\u0000', 'latin1'))
  const quant = segment([0xff, 0xdb], Buffer.concat([Buffer.from([0x00]), Buffer.alloc(64, 0x10)]))
  const frame = segment([0xff, 0xc0], Buffer.from([0x08, 0x00, 0x01, 0x00, 0x02, 0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01]))
  const huffman = segment([0xff, 0xc4], Buffer.concat([Buffer.from([0x00]), Buffer.alloc(28, 0x00)]))
  const scan = segment([0xff, 0xda], Buffer.from([0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3f, 0x00]))
  return Buffer.concat([
    Buffer.from([0xff, 0xd8]),
    app0,
    quant,
    frame,
    huffman,
    scan,
    Buffer.from(entropy.padEnd(64, 'z'), 'latin1'),
    Buffer.from([0xff, 0xd9]),
  ])
}

/**
 * A file whose pictures are separated by filler bytes, like the native container.
 * @param pictures - picture payloads.
 * @returns the file bytes.
 */
function container(...pictures: Buffer[]): Uint8Array {
  const parts: Buffer[] = [Buffer.from('2.1', 'utf16le')]
  for (const picture of pictures) parts.push(Buffer.alloc(16, 0x20), picture)
  return new Uint8Array(Buffer.concat(parts))
}

test('a JPEG is measured by walking its markers, not by the first end marker inside it', () => {
  const picture = jpeg('AAA')
  assert.equal(jpegLengthAt(new Uint8Array(picture), 0), picture.length)
})

test('a thumbnail embedded in an APP segment does not cut the picture short', () => {
  const inner = jpeg('inner')
  const outer = jpeg('head')
  const app1 = Buffer.concat([Buffer.from([0xff, 0xe1, 0x00, 0x00]), inner])
  app1.writeUInt16BE(inner.length + 2, 2)
  // Splice the APP1 segment in right after the start marker, as EXIF does.
  const withThumb = Buffer.concat([outer.subarray(0, 2), app1, outer.subarray(2)])
  const measured = jpegLengthAt(new Uint8Array(withThumb), 0)
  assert.equal(measured, withThumb.length)
})

test('pictures are recovered in file order and measured correctly', () => {
  const first = jpeg('AAA')
  const second = jpeg('BBBB')
  const pictures = extractEmbeddedPictures(container(first, second))
  assert.equal(pictures.length, 2)
  assert.equal(pictures[0]?.bytes.length, first.length)
  assert.equal(pictures[1]?.bytes.length, second.length)
  assert.equal(pictureSize(pictures[0]?.bytes ?? new Uint8Array())?.width, 2)
})

test('the native import lays the pictures out on a grid', async () => {
  const file = container(jpeg('AAA'), jpeg('BBBB'), jpeg('CCCCC'))
  const stored: string[] = []
  const result = await importNativePur(file, async (name) => {
    stored.push(name)
    return `pur-asset:${name}`
  })
  assert.equal(result.elements.length, 3)
  assert.equal(result.skipped, 0)
  assert.deepEqual(stored, ['embedded-0.jpg', 'embedded-1.jpg', 'embedded-2.jpg'])
  assert.equal(result.elements[0]?.x, 0)
  // Cards are placed on a fixed grid with a 24 unit gutter.
  assert.equal(result.elements[1]?.x, 320 + 24)
})
