import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { resolvePurImage, type PurFileReader } from '../src/vault/pur-image.ts'
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
