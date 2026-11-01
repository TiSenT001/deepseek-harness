/**
 * Reader for the SQLite database that PureRef embeds in a native `.pur` file.
 *
 * The database is rotated: page one sits at the end of the file and pages two and
 * later sit in the middle, so it has to be reassembled before the b-trees can be
 * walked. Column blobs are stored as Latin-1 expanded text, which is undone while
 * reading so the geometry bytes survive.
 * @module dsh-obsidian-vault/vault/pur-sqlite
 */

/** One decoded table row: its row id plus the columns in storage order. */
export interface SceneRow {
  /** SQLite row id, which is also the value of an INTEGER PRIMARY KEY column. */
  readonly rowId: number
  /** Column values, in storage order. */
  readonly values: readonly (number | Buffer | null)[]
}

/** The scene as PureRef stores it. */
export interface PurSceneData {
  /** Image records: id, origin path, format, bytes, width, height. */
  readonly images: readonly {
    readonly id: number
    readonly origin: string
    readonly format: string
    readonly bytes: Buffer
    readonly width: number
    readonly height: number
  }[]
  /** Items with their transform and image binding. */
  readonly items: readonly {
    readonly id: number
    readonly name: string
    readonly transform: readonly number[]
    readonly image?: number
    readonly bounds: readonly number[]
    readonly group?: boolean
    readonly note?: string
  }[]
  /** The saved scene rectangle and view transform, in the order PureRef writes them. */
  readonly sceneRect: readonly number[]
  readonly viewTransform: readonly number[]
  readonly applicationVersion: string
}

/** Reassembled database plus the page size it uses. */
interface SceneDatabase {
  readonly bytes: Buffer
  readonly pageSize: number
}

/** Marker every SQLite file starts with. */
const SQLITE_MAGIC = Buffer.from('SQLite format 3\u0000', 'latin1')

/**
 * Read a SQLite varint.
 * @param bytes - buffer holding the varint.
 * @param offset - first byte.
 * @returns the value and how many bytes it used.
 */
export function readVarint(bytes: Buffer, offset: number): { value: number; used: number } {
  let value = 0
  for (let index = 0; index < 9; index++) {
    const byte = bytes[offset + index] ?? 0
    if (index === 8) return { value: value * 256 + byte, used: 9 }
    value = value * 128 + (byte & 0x7f)
    if ((byte & 0x80) === 0) return { value, used: index + 1 }
  }
  return { value: 0, used: 1 }
}

/**
 * Undo the Latin-1 expansion PureRef applies when it stores bytes in a text column.
 * @param raw - the stored text bytes.
 * @returns the original bytes.
 */
export function unescapeTextBytes(raw: Buffer): Buffer {
  const out = Buffer.alloc(raw.length)
  let written = 0
  for (let index = 0; index < raw.length;) {
    const byte = raw[index] ?? 0
    if (byte < 0x80) {
      out[written++] = byte
      index += 1
      continue
    }
    const length = byte >= 0xf0 ? 4 : byte >= 0xe0 ? 3 : byte >= 0xc0 ? 2 : 0
    if (length === 0) {
      out[written++] = byte
      index += 1
      continue
    }
    let codePoint = byte & (0xff >> (length + 1))
    for (let extra = 1; extra < length; extra++) codePoint = codePoint * 64 + ((raw[index + extra] ?? 0) & 0x3f)
    if (codePoint > 0xff) {
      // Not a Latin-1 expansion; keep the raw byte so nothing is invented.
      out[written++] = byte
      index += 1
      continue
    }
    out[written++] = codePoint
    index += length
  }
  return out.subarray(0, written)
}

/**
 * Reassemble the rotated database out of a document.
 * @param bytes - the raw `.pur` file.
 * @returns the database, or undefined when the file holds none.
 */
export function openSceneDatabase(bytes: Buffer): SceneDatabase | undefined {
  const marker = bytes.indexOf(SQLITE_MAGIC)
  if (marker < 0) return undefined
  const pageSize = bytes.readUInt16BE(marker + 16)
  const pageCount = bytes.readUInt32BE(marker + 28)
  if (pageSize < 512 || pageSize > 65536 || pageCount === 0) return undefined
  const first = bytes.subarray(marker, marker + pageSize)
  const rest = bytes.subarray(pageSize, marker)
  const assembled = Buffer.concat([first, rest])
  // A document can be saved while the database is still shorter than its declared
  // page count; read the pages that are actually present.
  const available = Math.floor(assembled.length / pageSize) * pageSize
  const size = Math.min(pageSize * pageCount, available)
  if (size < pageSize * 2) return undefined
  return { bytes: assembled.subarray(0, size), pageSize }
}

/**
 * Decode one record from a table leaf cell.
 * @param bytes - database bytes.
 * @param offset - first byte of the record header.
 * @returns the column values.
 */
export function decodeRecord(bytes: Buffer, offset: number): readonly (number | Buffer | null)[] {
  const header = readVarint(bytes, offset)
  const headerEnd = offset + header.value
  const types: number[] = []
  let cursor = offset + header.used
  while (cursor < headerEnd) {
    const type = readVarint(bytes, cursor)
    types.push(type.value)
    cursor += type.used
  }
  const values: (number | Buffer | null)[] = []
  let body = headerEnd
  for (const type of types) {
    if (type === 0) {
      values.push(null)
      continue
    }
    if (type >= 1 && type <= 6) {
      const size = [0, 1, 2, 3, 4, 6, 8][type] ?? 8
      let value = 0
      for (let index = 0; index < size; index++) value = value * 256 + (bytes[body + index] ?? 0)
      values.push(size === 8 && value > Number.MAX_SAFE_INTEGER ? value - 2 ** 64 : value)
      body += size
      continue
    }
    if (type === 7) {
      values.push(bytes.readDoubleBE(body))
      body += 8
      continue
    }
    if (type === 8) {
      values.push(0)
      continue
    }
    if (type === 9) {
      values.push(1)
      continue
    }
    // Text lengths use (type - 13) / 2, blob lengths (type - 12) / 2.
    const size = type % 2 === 0 ? (type - 12) / 2 : (type - 13) / 2
    values.push(Buffer.from(bytes.subarray(body, body + size)))
    body += size
  }
  return values
}

/**
 * Walk a table b-tree and collect every row.
 * @param database - reassembled database.
 * @param rootPage - first page of the table.
 * @returns the rows.
 */
export function readTable(database: SceneDatabase, rootPage: number): SceneRow[] {
  const rows: SceneRow[] = []
  const pending = [rootPage]
  const visited = new Set<number>()
  const usable = database.pageSize
  const maxLocal = usable - 35
  const minLocal = Math.floor((usable - 12) * 32 / 255) - 23

  /**
   * Read the whole record payload, following the overflow chain when the record
   * does not fit on its own page.
   * @param cell - offset of the cell header.
   * @param payloadSize - declared record size.
   * @param headerLength - bytes of cell header before the payload.
   * @returns the payload bytes.
   */
  const payloadAt = (cell: number, payloadSize: number, headerLength: number): Buffer => {
    if (payloadSize <= maxLocal) return Buffer.from(database.bytes.subarray(cell + headerLength, cell + headerLength + payloadSize))
    if (cell + headerLength + maxLocal + 4 > database.bytes.length) throw new RangeError('record outside assembled pages')
    const local = minLocal + ((payloadSize - minLocal) % (usable - 4))
    const head = Buffer.from(database.bytes.subarray(cell + headerLength, cell + headerLength + local))
    const parts = [head]
    let next = database.bytes.readUInt32BE(cell + headerLength + local)
    let remaining = payloadSize - local
    const seen = new Set<number>([next])
    while (next > 0 && remaining > 0) {
      const offset = (next - 1) * database.pageSize
      const take = Math.min(usable - 4, remaining)
      parts.push(Buffer.from(database.bytes.subarray(offset + 4, offset + 4 + take)))
      remaining -= take
      const following = database.bytes.readUInt32BE(offset)
      if (seen.has(following)) break
      seen.add(following)
      next = following
    }
    return Buffer.concat(parts)
  }

  while (pending.length > 0) {
    const pageNumber = pending.pop() ?? 0
    if (pageNumber <= 0 || visited.has(pageNumber)) continue
    visited.add(pageNumber)
    const base = (pageNumber - 1) * database.pageSize
    const headerSkip = pageNumber === 1 ? 100 : 0
    const kind = database.bytes[base + headerSkip]
    const cellCount = database.bytes.readUInt16BE(base + headerSkip + 3)
    if (kind === 0x0d) {
      for (let index = 0; index < cellCount; index++) {
        const pointer = database.bytes.readUInt16BE(base + headerSkip + 8 + index * 2)
        const cell = base + pointer
        const payload = readVarint(database.bytes, cell)
        const rowId = readVarint(database.bytes, cell + payload.used)
        const header = payload.used + rowId.used
        // A record that points outside the assembled pages is skipped rather than
        // aborting the whole table, so one damaged page cannot hide the others.
        try {
          const record = payloadAt(cell, payload.value, header)
          rows.push({ rowId: rowId.value, values: decodeRecord(record, 0) })
        } catch {
          continue
        }
      }
      continue
    }
    if (kind === 0x05) {
      const right = database.bytes.readUInt32BE(base + headerSkip + 8)
      for (let index = 0; index < cellCount; index++) {
        const pointer = database.bytes.readUInt16BE(base + headerSkip + 12 + index * 2)
        pending.push(database.bytes.readUInt32BE(base + pointer))
      }
      pending.push(right)
    }
  }
  return rows
}

/**
 * Interpret a QString the way PureRef stores it: UTF-16 length prefix then units.
 * @param row - a text column.
 * @returns the decoded text.
 */
function textOf(row: number | Buffer | null): string {
  if (!Buffer.isBuffer(row)) return ''
  const unescaped = unescapeTextBytes(row)
  const text = unescaped.toString('utf8')
  return text.replace(/^\u0000+/, '')
}

/**
 * Decode the nine doubles of a stored transform. The blob starts with a short
 * header whose last byte belongs to the payload, so the doubles begin at five.
 * @param raw - stored transform text bytes.
 * @returns the transform values.
 */
export function decodeTransform(raw: Buffer): number[] {
  const bytes = unescapeTextBytes(raw)
  const values: number[] = []
  for (let offset = 5; offset + 8 <= bytes.length; offset += 8) values.push(bytes.readDoubleBE(offset))
  return values
}

/**
 * Decode the polygon of an item's image bounds.
 * @param raw - stored bounds text bytes.
 * @returns the points, in storage order.
 */
export function decodeBounds(raw: Buffer): number[] {
  const bytes = unescapeTextBytes(raw)
  const marker = bytes.indexOf('QPainterPath', 0, 'latin1')
  const start = marker < 0 ? 0 : marker + 'QPainterPath'.length
  const values: number[] = []
  for (let offset = start; offset + 8 <= bytes.length; offset += 8) {
    const value = bytes.readDoubleBE(offset)
    if (Number.isFinite(value) && Math.abs(value) < 1e9) values.push(value)
  }
  return values
}

/**
 * Read a whole scene out of a native document.
 * @param bytes - the raw `.pur` file.
 * @returns the scene, or undefined when the document carries no database.
 */
export function readPurScene(bytes: Buffer): PurSceneData | undefined {
  const database = openSceneDatabase(bytes)
  if (database === undefined) return undefined
  const master = readTable(database, 1)
  const roots = new Map<string, number>()
  for (const row of master) {
    const name = textOf(row.values[1] ?? null)
    const root = row.values[3]
    if (name !== '' && typeof root === 'number') roots.set(name, root)
  }
  const imagesRoot = roots.get('images')
  const itemsRoot = roots.get('items')
  if (imagesRoot === undefined || itemsRoot === undefined) return undefined

  const images = readTable(database, imagesRoot).map((row) => ({
    id: row.rowId,
    origin: textOf(row.values[2] ?? null),
    format: textOf(row.values[4] ?? null),
    bytes: Buffer.isBuffer(row.values[6]) ? Buffer.from(row.values[6]) : Buffer.alloc(0),
    width: Number(row.values[7] ?? 0),
    height: Number(row.values[8] ?? 0),
  }))

  const transforms = new Map<number, { transform: number[]; image?: number; bounds: number[] }>()
  const linkRoot = roots.get('items_images')
  if (linkRoot !== undefined) {
    for (const row of readTable(database, linkRoot)) {
      transforms.set(row.rowId, {
        image: Number(row.values[0] ?? 0),
        transform: Buffer.isBuffer(row.values[4]) ? decodeTransform(row.values[4]) : [],
        bounds: Buffer.isBuffer(row.values[5]) ? decodeBounds(row.values[5]) : [],
      })
    }
  }

  const notes = new Map<number, string>()
  const noteRoot = roots.get('items_notes')
  if (noteRoot !== undefined) {
    for (const row of readTable(database, noteRoot)) notes.set(row.rowId, textOf(row.values[4] ?? null))
  }
  const groups = new Set<number>()
  const groupRoot = roots.get('items_groups')
  if (groupRoot !== undefined) {
    for (const row of readTable(database, groupRoot)) groups.add(row.rowId)
  }

  const items = readTable(database, itemsRoot).map((row) => {
    const id = row.rowId
    const link = transforms.get(id)
    return {
      id,
      name: textOf(row.values[2] ?? null),
      transform: Buffer.isBuffer(row.values[3]) ? decodeTransform(row.values[3]) : [],
      image: link?.image,
      bounds: link?.bounds ?? [],
      group: groups.has(id),
      note: notes.get(id),
    }
  })

  let sceneRect: number[] = []
  let viewTransform: number[] = []
  let applicationVersion = ''
  const metaRoot = roots.get('metadata')
  if (metaRoot !== undefined) {
    const row = readTable(database, metaRoot)[0]
    if (row !== undefined) {
      sceneRect = Buffer.isBuffer(row.values[1]) ? decodeTransform(row.values[1]) : []
      applicationVersion = textOf(row.values[2] ?? null)
      viewTransform = Buffer.isBuffer(row.values[3]) ? decodeTransform(row.values[3]) : []
    }
  }

  return { images, items, sceneRect, viewTransform, applicationVersion }
}
