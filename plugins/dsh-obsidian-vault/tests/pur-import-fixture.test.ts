/**
 * Import regression: a synthetic native document must come back with its items,
 * nesting, rotation, note size and picture bindings intact.
 * @module dsh-obsidian-vault/tests/pur-import-fixture
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { deflateSync } from 'node:zlib'
import { importNativePur } from '../src/vault/pur-import.ts'
import { readPurScene } from '../src/vault/pur-sqlite.ts'
import { buildPurFixture, type FixtureSpec } from './helpers/pur-fixture.ts'

/** A one pixel PNG, enough for the reader to treat the row as a picture. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

/** Two pictures, a rotation, a note with a fixed size and a nested group. */
const SPEC: FixtureSpec = {
  images: [
    { id: 0, width: 640, height: 480, bytes: PNG },
    { id: 1, width: 200, height: 100, bytes: PNG },
  ],
  items: [
    { id: 0, x: 100, y: 200, scale: 0.5, image: 0, name: 'first' },
    { id: 1, x: 900, y: 300, scale: 1, rotation: 30, image: 1, name: 'tilted' },
    {
      id: 2,
      x: -400,
      y: 50,
      note: '<p>hello <b>world</b></p>',
      noteTextColor: '#ff0000',
      noteBackgroundColor: 'rgba(10,10,10,0.5)',
      noteWidth: 260,
      noteHeight: 120,
    },
    { id: 3, x: 2000, y: 2000, group: true, name: '组' },
    { id: 4, parent: 3, x: 2010, y: 2020, scale: 1, image: 0, name: 'inner' },
  ],
}

test('the scene reader keeps parents, rotation and note styling', () => {
  const scene = readPurScene(buildPurFixture(SPEC))
  assert.ok(scene !== undefined)
  assert.equal(scene.items.length, 5)
  assert.equal(scene.images.length, 2)
  const tilted = scene.items.find((item) => item.id === 1)
  assert.ok(tilted !== undefined)
  // m12 carries the sine of the rotation.
  assert.ok(Math.abs(Math.atan2(tilted.transform[1] ?? 0, tilted.transform[0] ?? 1) * (180 / Math.PI) - 30) < 0.5)
  const note = scene.items.find((item) => item.id === 2)?.note
  assert.ok(note !== undefined)
  assert.equal(note.width, 260)
  assert.equal(note.height, 120)
  assert.equal(note.textColor, '#ff0000')
  assert.equal(scene.items.find((item) => item.id === 4)?.parent, 3)
})

test('the importer rebuilds the group tree with relative members', async () => {
  const result = await importNativePur(buildPurFixture(SPEC), async (name) => `pur-asset:${name}`)
  assert.equal(result.skipped, 0)
  // Three roots: two pictures plus a note, then the group holding one picture.
  assert.equal(result.elements.length, 4)
  const group = result.elements.find((element) => element.type === 'group')
  assert.ok(group !== undefined && group.type === 'group')
  assert.equal(group.children.length, 1)
  const inner = group.children[0]
  assert.ok(inner !== undefined)
  // Coordinates are stored relative to the group box, which pads by ten units.
  assert.ok(inner.x > 0 && inner.y > 0, `inner at ${inner.x},${inner.y}`)
})

test('the importer keeps rotation, size and note styling', async () => {
  const result = await importNativePur(buildPurFixture(SPEC), async (name) => `pur-asset:${name}`)
  const tilted = result.elements.find((element) => element.type === 'image' && Math.abs((element.rotation ?? 0) - 30) < 0.5)
  assert.ok(tilted !== undefined, 'rotated picture missing')
  const first = result.elements.find((element) => element.type === 'image' && element.w === 320)
  assert.ok(first !== undefined, 'scaled picture should be 640*0.5 wide')
  const note = result.elements.find((element) => element.type === 'text')
  assert.ok(note !== undefined && note.type === 'text')
  assert.equal(note.w, 260)
  assert.equal(note.h, 120)
  assert.equal(note.text, 'hello world')
  assert.equal(note.textColor, '#ff0000')
  assert.equal(note.bgColor, 'rgba(10,10,10,0.5)')
})

test('a qCompress-wrapped document imports like the plain one', async () => {
  const raw = buildPurFixture(SPEC)
  const plain = await importNativePur(raw, async (name) => `pur-asset:${name}`)
  const wrapped = await importNativePur(deflateSync(raw), async (name) => `pur-asset:${name}`)
  assert.equal(wrapped.elements.length, plain.elements.length)
  assert.deepEqual(
    wrapped.elements.map((element) => [element.type, Math.round(element.x), Math.round(element.y)]),
    plain.elements.map((element) => [element.type, Math.round(element.x), Math.round(element.y)]),
  )
})