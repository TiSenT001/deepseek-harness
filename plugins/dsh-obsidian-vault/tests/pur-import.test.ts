/**
 * PureRef import: the ZIP container is read without external libraries.
 * @module dsh-obsidian-vault/tests/pur-import
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { crc32 } from 'node:zlib'
import { importZipPur, isZipPur, readZipEntries } from '../src/vault/pur-import.ts'

/** Build one stored (uncompressed) ZIP entry's local header plus the central record. */
function buildZip(files: readonly { name: string; body: string }[]): Uint8Array {
  const chunks: Buffer[] = []
  const central: Buffer[] = []
  let offset = 0
  for (const file of files) {
    const name = Buffer.from(file.name, 'utf8')
    const body = Buffer.from(file.body, 'utf8')
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0, 6)
    local.writeUInt16LE(0, 8)
    local.writeUInt32LE(0, 10)
    local.writeUInt32LE(crc32(body), 14)
    local.writeUInt32LE(body.length, 18)
    local.writeUInt32LE(body.length, 22)
    local.writeUInt16LE(name.length, 26)
    local.writeUInt16LE(0, 28)
    chunks.push(local, name, body)

    const record = Buffer.alloc(46)
    record.writeUInt32LE(0x02014b50, 0)
    record.writeUInt16LE(20, 4)
    record.writeUInt16LE(20, 6)
    record.writeUInt16LE(0, 8)
    record.writeUInt16LE(0, 10)
    record.writeUInt32LE(0, 12)
    record.writeUInt32LE(crc32(body), 16)
    record.writeUInt32LE(body.length, 20)
    record.writeUInt32LE(body.length, 24)
    record.writeUInt16LE(name.length, 28)
    record.writeUInt32LE(offset, 42)
    central.push(Buffer.concat([record, name]))
    offset += local.length + name.length + body.length
  }
  const centralBuffer = Buffer.concat(central)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(files.length, 8)
  end.writeUInt16LE(files.length, 10)
  end.writeUInt32LE(centralBuffer.length, 12)
  end.writeUInt32LE(offset, 16)
  return new Uint8Array(Buffer.concat([...chunks, centralBuffer, end]))
}

const PNG = '\u0089PNG\r\n\u001a\n'

test('a zip-form pur document maps its images with position and size', async () => {
  const zip = buildZip([
    {
      name: 'contents.xml',
      body: '<?xml version="1.0"?><root><image path="a.png" x="20" y="30" width="200" height="150"/><note text="hi"/></root>',
    },
    { name: 'a.png', body: PNG },
  ])
  assert.equal(isZipPur(zip), true)
  const stored: string[] = []
  const result = await importZipPur(zip, async (name) => {
    stored.push(name)
    return `pur-asset:${name}`
  })
  assert.equal(result.elements.length, 1)
  assert.deepEqual(result.elements[0], { type: 'image', x: 20, y: 30, w: 200, h: 150, ref: 'pur-asset:a.png' })
  assert.deepEqual(result.unsupported, ['root', 'note'])
  assert.deepEqual(stored, ['a.png'])
})

test('entries without a matching archive member are skipped', async () => {
  const zip = buildZip([
    { name: 'contents.xml', body: '<root><image path="missing.png" x="0" y="0" width="10" height="10"/></root>' },
  ])
  const result = await importZipPur(zip, async () => 'pur-asset:x')
  assert.equal(result.elements.length, 0)
})

test('a non-zip container is rejected before parsing', () => {
  const native = new Uint8Array([0, 0, 0, 8, 0, 49, 0, 46])
  assert.equal(isZipPur(native), false)
  assert.deepEqual(readZipEntries(native), [])
})
