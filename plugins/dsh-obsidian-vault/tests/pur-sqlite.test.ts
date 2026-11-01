/**
 * Scene database reader: the primitives that turn stored bytes into values.
 * @module dsh-obsidian-vault/tests/pur-sqlite
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { decodeTransform, readVarint, unescapeTextBytes } from '../src/vault/pur-sqlite.ts'

/**
 * Expand raw bytes the way PureRef stores them: every byte becomes the UTF-8
 * encoding of its own code point, so bytes above 0x7f take two bytes.
 * @param bytes - raw value bytes.
 * @returns the stored text bytes.
 */
function stored(bytes: Buffer): Buffer {
  const out: number[] = []
  for (const byte of bytes) {
    if (byte < 0x80) {
      out.push(byte)
      continue
    }
    out.push(0xc0 | (byte >> 6), 0x80 | (byte & 0x3f))
  }
  return Buffer.from(out)
}

/**
 * Encode doubles big-endian.
 * @param values - the numbers.
 * @returns their bytes.
 */
function doubles(values: readonly number[]): Buffer {
  const buffer = Buffer.alloc(values.length * 8)
  values.forEach((value, index) => buffer.writeDoubleBE(value, index * 8))
  return buffer
}

test('a varint shorter than nine bytes reports its own width', () => {
  assert.deepEqual(readVarint(Buffer.from([0x7f]), 0), { value: 127, used: 1 })
  assert.deepEqual(readVarint(Buffer.from([0x81, 0x00]), 0), { value: 128, used: 2 })
})

test('latin-1 expanded text collapses back to the original bytes', () => {
  const original = Buffer.from([0x00, 0x3f, 0xf0, 0x41])
  assert.deepEqual([...unescapeTextBytes(stored(original))], [...original])
})

test('a stored transform yields nine doubles from its fifth byte', () => {
  const values = [1, 0, 0, 0, 1, 0, 2523.044388152642, 2663.0550220835194, 1]
  const header = Buffer.from([0x00, 0x00, 0x00, 0x50, 0x00])
  const decoded = decodeTransform(stored(Buffer.concat([header, doubles(values)])))
  assert.deepEqual(decoded.map((value) => Number(value.toFixed(3))), [1, 0, 0, 0, 1, 0, 2523.044, 2663.055, 1])
})
