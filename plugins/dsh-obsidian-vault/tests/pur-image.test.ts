import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { resolvePurImage, type PurFileReader } from '../src/vault/pur-image.ts'
import { storePurImage } from '../src/vault/pur-store.ts'
import { MemFs } from './helpers/memfs.ts'

const ROOT = 'C:/vault'

const DATA_URL = 'data:image/png;base64,cG5nLWJ5dGVz'

function canvasDocument(elements: unknown[]): string {
  return JSON.stringify({ elements, viewState: { offsetX: 0, offsetY: 0, scale: 1 } }, undefined, 2)
}

let fs: MemFs
let reader: PurFileReader

beforeEach(() => {
  fs = new MemFs(ROOT)
  fs.write(`${ROOT}/Pur画布/方案.PurStudio`, canvasDocument([
    {
      id: 'g1',
      type: 'group',
      x: 0,
      y: 0,
      w: 100,
      h: 100,
      children: [{ id: 'i1', type: 'image', x: 0, y: 0, w: 10, h: 10, original: '附件/pic.png', dataURL: DATA_URL }],
    },
    { id: 'i2', type: 'image', x: 20, y: 20, w: 10, h: 10, original: '附件/磁盘.png' },
  ]))
  fs.write(`${ROOT}/附件/磁盘.png`, 'disk-bytes')
  const target = (path: string): { targetKey: string; displayPath: string } => ({
    targetKey: `${ROOT}/${path}`,
    displayPath: `${ROOT}/${path}`,
  })
  reader = {
    readText: async (path) => {
      try {
        return await fs.readText(target(path))
      } catch {
        return undefined
      }
    },
    readBytes: async (path) => {
      try {
        return await fs.readBytes(target(path), undefined, 1024 * 1024)
      } catch {
        return undefined
      }
    },
  }
})

test('resolves an inline data URL nested inside a group', async () => {
  const image = await resolvePurImage(reader, '方案', 'pic.png')
  assert.notEqual(image, undefined)
  assert.equal(image?.contentType, 'image/png')
  assert.equal(image?.bytes.toString('utf8'), 'png-bytes')
})

test('resolves an image whose bytes live on disk', async () => {
  const image = await resolvePurImage(reader, '方案.PurStudio', '磁盘.png')
  assert.equal(image?.contentType, 'image/png')
  assert.equal(image?.bytes.toString('utf8'), 'disk-bytes')
})

test('reports a missing canvas and a missing image as undefined', async () => {
  assert.equal(await resolvePurImage(reader, '没有这个', 'pic.png'), undefined)
  assert.equal(await resolvePurImage(reader, '方案', 'missing.png'), undefined)
})

test('finds a canvas by name when it lives in a subfolder', async () => {
  // The exported notes name the bucket, not a path; the canvas that holds those
  // images can sit anywhere (Pur画布/附件图库/附件图管理.PurStudio).
  const nested = 'Pur画布/附件图库/附件图库.PurStudio'
  fs.write(`${ROOT}/${nested}`, JSON.stringify({
    elements: [{ id: 'i9', type: 'image', x: 0, y: 0, w: 10, h: 10, original: '附件/深图.png', dataURL: DATA_URL }],
    viewState: { offsetX: 0, offsetY: 0, scale: 1 },
  }))
  const locating: PurFileReader = {
    ...reader,
    locate: (name) => (name === '附件图库.PurStudio' ? nested : undefined),
  }
  const image = await resolvePurImage(locating, '附件图库', '深图.png')
  assert.equal(image?.contentType, 'image/png')
  assert.equal(image?.bytes.toString('utf8'), 'png-bytes')
})

test('storing the same bytes twice reuses one attachment', async () => {
  const written = new Map<string, Uint8Array>()
  const store = {
    readBytes: async (path: string) => written.get(path),
    writeBytes: async (path: string, bytes: Uint8Array) => { written.set(path, bytes) },
  }
  const first = await storePurImage(store, 'a b.png', 'data:image/png;base64,cG5nLWJ5dGVz')
  const second = await storePurImage(store, 'other name.png', 'data:image/png;base64,cG5nLWJ5dGVz')
  assert.equal(first, second)
  assert.equal(written.size, 1)
  assert.match(first ?? '', /^附件\/[0-9a-f]{16}\.png$/)

  const third = await storePurImage(store, 'a b.png', 'data:image/png;base64,ZGlmZmVyZW50')
  assert.notEqual(third, first)
  assert.equal(written.size, 2)
})

test('a payload that is not a base64 data URL is rejected', async () => {
  const store = { readBytes: async () => undefined, writeBytes: async () => undefined }
  assert.equal(await storePurImage(store, 'x.png', 'https://example.com/x.png'), undefined)
})
