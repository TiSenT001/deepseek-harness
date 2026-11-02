/**
 * Fixture builder for native `.pur` documents. A real document is a SQLite
 * database with page one moved to the end and a header block in front; this
 * builds exactly that shape from a database made with `node:sqlite`, so reader
 * tests do not depend on a user file.
 * @module dsh-obsidian-vault/tests/helpers/pur-fixture
 */
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

/** One picture row for the fixture. */
export interface FixtureImage {
  readonly id: number
  readonly width: number
  readonly height: number
  readonly bytes: Buffer
  readonly format?: string
  readonly origin?: string
}

/** One item row for the fixture. */
export interface FixtureItem {
  readonly id: number
  readonly parent?: number
  readonly name?: string
  /** World translation. */
  readonly x: number
  readonly y: number
  /** Uniform scale stored in the transform's m11/m22. */
  readonly scale?: number
  /** Rotation in degrees, baked into m12/m21. */
  readonly rotation?: number
  readonly z?: number
  readonly opacity?: number
  readonly locked?: boolean
  /** Image binding, when the item shows a picture. */
  readonly image?: number
  /** Note body as Qt rich text, when the item is a note. */
  readonly note?: string
  readonly noteTextColor?: string
  readonly noteBackgroundColor?: string
  /** Fixed note size; omit for auto sizing. */
  readonly noteWidth?: number
  readonly noteHeight?: number
  /** Marks the item as a group. */
  readonly group?: boolean
}

/** Everything the fixture accepts. */
export interface FixtureSpec {
  readonly images?: readonly FixtureImage[]
  readonly items: readonly FixtureItem[]
}

/** Page size every fixture uses. */
const PAGE = 4096

/**
 * Expand bytes the way PureRef stores them in a text column: each byte becomes
 * the UTF-8 encoding of its own code point.
 * @param bytes - raw bytes.
 * @returns the text to insert.
 */
export function expandBytes(bytes: Buffer): string {
  let out = ''
  for (const byte of bytes) out += String.fromCharCode(byte)
  return out
}

/**
 * Encode a transform the way an item stores it: five header bytes then nine
 * big-endian doubles.
 * @param x - world x.
 * @param y - world y.
 * @param scale - uniform scale.
 * @param rotation - degrees.
 * @returns the expanded text to insert.
 */
export function transformText(x: number, y: number, scale = 1, rotation = 0): string {
  const radians = (rotation * Math.PI) / 180
  const cos = Math.cos(radians) * scale
  const sin = Math.sin(radians) * scale
  const values = [cos, sin, 0, -sin, cos, 0, x, y, 1]
  const buffer = Buffer.alloc(5 + values.length * 8)
  buffer.writeUInt32BE(80, 0)
  values.forEach((value, index) => buffer.writeDoubleBE(value, 5 + index * 8))
  return expandBytes(buffer)
}

/**
 * Encode a note's fixed size. `-1` marks an auto-sized note.
 * @param width - fixed width.
 * @param height - fixed height.
 * @returns the expanded text to insert.
 */
export function sizeText(width: number, height: number): string {
  const buffer = Buffer.alloc(5 + 16)
  buffer.writeUInt32BE(22, 0)
  buffer.writeDoubleBE(width, 5)
  buffer.writeDoubleBE(height, 13)
  return expandBytes(buffer)
}

/**
 * Build one native document from a spec.
 * @param spec - rows to store.
 * @returns the document bytes.
 */
export function buildPurFixture(spec: FixtureSpec): Buffer {
  const folder = mkdtempSync(join(tmpdir(), 'pur-fixture-'))
  const file = join(folder, 'scene.sqlite')
  const db = new DatabaseSync(file)
  try {
    db.exec(`
      CREATE TABLE images (id INTEGER PRIMARY KEY, source_type INTEGER, origin TEXT, source TEXT,
        format TEXT, checksum TEXT, data BLOB, width INTEGER, height INTEGER);
      CREATE TABLE items (parent INTEGER, id INTEGER PRIMARY KEY, name TEXT, transform BLOB,
        sort_order BLOB, z REAL, opacity REAL, locked INTEGER, comment INTEGER);
      CREATE TABLE items_images (image INTEGER, playback_speed REAL, id INTEGER PRIMARY KEY,
        playback_state INTEGER, image_transform BLOB, image_bounds BLOB, playback_frame INTEGER, flags INTEGER);
      CREATE TABLE items_notes (text_color TEXT, id INTEGER PRIMARY KEY, fixed_size TEXT,
        background_color TEXT, text TEXT, style INTEGER);
      CREATE TABLE items_groups (id INTEGER PRIMARY KEY, background_color TEXT, lock_mode INTEGER);
      CREATE TABLE metadata (id INTEGER PRIMARY KEY, scene_rect TEXT, application_version TEXT,
        view_transform TEXT, thumbnail BLOB, horizontal_scroll INTEGER, vertical_scroll INTEGER,
        last_save_path TEXT, last_load_path TEXT, last_load_checksum TEXT, saved INTEGER);
    `)
    const insertImage = db.prepare('INSERT INTO images (id, source_type, origin, source, format, checksum, data, width, height) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    for (const image of spec.images ?? []) {
      insertImage.run(image.id, 0, image.origin ?? 'fixture.png', '', image.format ?? 'PNG', '', image.bytes, image.width, image.height)
    }
    const insertItem = db.prepare('INSERT INTO items (parent, id, name, transform, sort_order, z, opacity, locked, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    const insertImageRow = db.prepare('INSERT INTO items_images (image, playback_speed, id, playback_state, image_transform, image_bounds, playback_frame, flags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    const insertNote = db.prepare('INSERT INTO items_notes (text_color, id, fixed_size, background_color, text, style) VALUES (?, ?, ?, ?, ?, ?)')
    const insertGroup = db.prepare('INSERT INTO items_groups (id, background_color, lock_mode) VALUES (?, ?, ?)')
    for (const item of spec.items) {
      insertItem.run(item.parent ?? -1, item.id, item.name ?? '', transformText(item.x, item.y, item.scale ?? 1, item.rotation ?? 0), '', item.z ?? 1, item.opacity ?? 1, item.locked === true ? 1 : 0, null)
      if (item.image !== undefined) {
        insertImageRow.run(item.image, 1, item.id, 0, transformText(0, 0), '', 0, 1)
      }
      if (item.note !== undefined) {
        insertNote.run(item.noteTextColor ?? null, item.id, sizeText(item.noteWidth ?? -1, item.noteHeight ?? -1), item.noteBackgroundColor ?? '', item.note, 0)
      }
      if (item.group === true) insertGroup.run(item.id, '', 0)
    }
    db.prepare('INSERT INTO metadata (id, application_version, saved) VALUES (0, ?, 0)').run('2.1.1')
  } finally {
    db.close()
  }
  const raw = readFileSync(file)
  rmSync(folder, { recursive: true, force: true })
  const pageCount = Math.floor(raw.length / PAGE)
  const page1 = raw.subarray(0, PAGE)
  const rest = raw.subarray(PAGE, pageCount * PAGE)
  // Layout the reader expects: a header block, then pages two and later, then page one.
  return Buffer.concat([Buffer.alloc(PAGE, 0), rest, page1])
}
