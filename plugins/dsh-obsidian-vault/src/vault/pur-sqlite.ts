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
    /** Enclosing item id, or -1 at the canvas root. */
    readonly parent: number
    readonly transform: readonly number[]
    readonly image?: number
    readonly bounds: readonly number[]
    readonly group?: boolean
    /** Note body and styling, when the item is a note. */
    readonly note?: {
      readonly text: string
      readonly bold?: boolean
      readonly fontSize?: number
      readonly textColor?: string
      readonly backgroundColor?: string
      readonly style: number
      /** Fixed size in world units; -1 means the note sizes itself. */
      readonly width: number
      readonly height: number
    }
    readonly z: number
    readonly opacity: number
    readonly locked: boolean
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
 * Every candidate assembly of the rotated database. The header in front of the
 * pages differs per document and more than one offset can look plausible, so all
 * of them are returned and the caller picks the one that decodes into real values.
 * @param bytes - the raw `.pur` file.
 * @returns the candidates, in file order.
 */
export function sceneDatabaseCandidates(bytes: Buffer): SceneDatabase[] {
  const marker = bytes.indexOf(SQLITE_MAGIC)
  if (marker < 0) return []
  const pageSize = bytes.readUInt16BE(marker + 16)
  const pageCount = bytes.readUInt32BE(marker + 28)
  if (pageSize < 512 || pageSize > 65536 || pageCount === 0) return []
  const first = bytes.subarray(marker, marker + pageSize)
  const restLength = (pageCount - 1) * pageSize
  const limit = Math.min(marker, pageSize * 32)
  const candidates: SceneDatabase[] = []
  for (let shift = 0; shift <= limit; shift += pageSize) {
    const rest = bytes.subarray(shift, shift + restLength)
    if (rest.length < restLength) continue
    candidates.push({ bytes: Buffer.concat([first, rest]), pageSize })
  }
  return candidates
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
/**
 * Convert a colour as Qt stores it into the CSS form a canvas takes. Qt writes
 * `#AARRGGBB`, so the alpha pair moves to the end; a six digit value is already
 * the CSS order.
 * @param value - the stored colour text.
 * @returns the CSS colour, or undefined when the value is empty or unrecognised.
 */
export function qtColorToCss(value: string): string | undefined {
  const trimmed = value.trim()
  if (trimmed === '') return undefined
  const match = /^#([0-9a-f]{8})$/i.exec(trimmed)
  if (match === null) {
    // Six digit hex, a named colour and a functional CSS value already mean what
    // they say; anything else is not a colour this importer understands.
    const css = /^#[0-9a-f]{6}$/i.test(trimmed) || /^[a-z]+$/i.test(trimmed) || /^(?:rgba?|hsla?)\(/i.test(trimmed)
    return css ? trimmed : undefined
  }
  const digits = match[1] ?? ''
  return `#${digits.slice(2)}${digits.slice(0, 2)}`
}

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
/**
 * Decode a stored QSizeF. The blob starts with a five byte header, as the
 * transforms do, so the doubles begin at five.
 * @param raw - stored size text bytes.
 * @returns width and height; -1 means the note sizes itself.
 */
export function decodeSize(raw: Buffer): { width: number; height: number } {
  const bytes = unescapeTextBytes(raw)
  if (bytes.length < 21) return { width: -1, height: -1 }
  return { width: bytes.readDoubleBE(5), height: bytes.readDoubleBE(13) }
}

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

/** Picture magic that a salvaged row must carry in its data column. */
const PICTURE_MAGIC = [
  Buffer.from([0xff, 0xd8, 0xff]),
  Buffer.from([0x89, 0x50, 0x4e, 0x47]),
]

/**
 * Recover image rows directly from page-aligned leaves when the images b-tree
 * cannot be walked. Pages are not stored in logical order, so every aligned offset
 * is tried and a row is kept only when its data column holds a real picture.
 * @param bytes - the raw `.pur` file.
 * @param wanted - image ids to keep, or undefined to keep every plausible row.
 * @returns the recovered image records.
 */
export function salvageImages(
  bytes: Buffer,
  wanted?: ReadonlySet<number>,
): PurSceneData['images'] {
  const marker = bytes.indexOf(SQLITE_MAGIC)
  if (marker < 0) return []
  const pageSize = bytes.readUInt16BE(marker + 16)
  if (pageSize < 512 || pageSize > 65536) return []
  const recovered: PurSceneData['images'][number][] = []
  const seen = new Set<number>()
  for (let offset = 0; offset + pageSize <= bytes.length; offset += pageSize) {
    if (bytes[offset] !== 0x0d) continue
    let rows: SceneRow[]
    try {
      rows = readLeafPage(bytes, offset, pageSize)
    } catch {
      continue
    }
    for (const row of rows) {
      const values = row.values
      if (values.length < 9) continue
      const data = values[6]
      if (!Buffer.isBuffer(data) || data.length === 0) continue
      const magic = PICTURE_MAGIC.some((prefix) => data.subarray(0, prefix.length).equals(prefix))
      if (!magic) continue
      const width = Number(values[7] ?? 0)
      const height = Number(values[8] ?? 0)
      if (width <= 0 || height <= 0 || width > 100000 || height > 100000) continue
      const id = row.rowId
      if (wanted !== undefined && !wanted.has(id)) continue
      if (seen.has(id)) continue
      seen.add(id)
      recovered.push({
        id,
        origin: textOf(values[2] ?? null),
        format: textOf(values[4] ?? null),
        bytes: Buffer.from(data),
        width,
        height,
      })
    }
  }
  return recovered
}

/**
 * Decode every cell of one table leaf page.
 * @param bytes - the raw file.
 * @param offset - page start in the file.
 * @param pageSize - page size in bytes.
 * @returns the rows.
 */
function readLeafPage(bytes: Buffer, offset: number, pageSize: number): SceneRow[] {
  const rows: SceneRow[] = []
  const cellCount = bytes.readUInt16BE(offset + 3)
  const usable = pageSize
  const maxLocal = usable - 35
  const minLocal = Math.floor((usable - 12) * 32 / 255) - 23
  for (let index = 0; index < cellCount; index++) {
    const pointer = bytes.readUInt16BE(offset + 8 + index * 2)
    const cell = offset + pointer
    const payload = readVarint(bytes, cell)
    const rowId = readVarint(bytes, cell + payload.used)
    const header = payload.used + rowId.used
    let body: Buffer
    if (payload.value <= maxLocal) {
      body = Buffer.from(bytes.subarray(cell + header, cell + header + payload.value))
    } else {
      const local = minLocal + ((payload.value - minLocal) % (usable - 4))
      const parts = [Buffer.from(bytes.subarray(cell + header, cell + header + local))]
      let next = bytes.readUInt32BE(cell + header + local)
      let remaining = payload.value - local
      const visited = new Set<number>([next])
      while (next > 0 && remaining > 0) {
        const pageOffset = (next - 1) * pageSize
        if (pageOffset + 4 > bytes.length) break
        const take = Math.min(usable - 4, remaining)
        parts.push(Buffer.from(bytes.subarray(pageOffset + 4, pageOffset + 4 + take)))
        remaining -= take
        const following = bytes.readUInt32BE(pageOffset)
        if (visited.has(following)) break
        visited.add(following)
        next = following
      }
      body = Buffer.concat(parts)
    }
    rows.push({ rowId: rowId.value, values: decodeRecord(body, 0) })
  }
  return rows
}
/**
 * Read a whole scene out of a native document.
 * @param bytes - the raw `.pur` file.
 * @returns the scene, or undefined when the document carries no database.
 */
/**
 * Turn a Qt rich-text note into the plain text a canvas card shows. PureRef stores
 * notes as HTML, so the tags, the head block and the entities have to go.
 * @param html - the stored note.
 * @returns the readable text.
 */
/**
 * Read the few text attributes Qt stores in a note's rich text: whether the body is
 * bold and the first explicit font size.
 * @param html - the stored HTML.
 * @returns the attributes that were present.
 */
export function richTextStyle(html: string): { bold?: boolean; fontSize?: number } {
  const bold = /<b[\s>]|<strong[\s>]|font-weight:\s*(?:bold|[6-9]00)/i.test(html)
  const size = /font-size:\s*(\d+(?:\.\d+)?)\s*(pt|px)/i.exec(html)
  const style: { bold?: boolean; fontSize?: number } = {}
  if (bold) style.bold = true
  if (size !== null) {
    const value = Number(size[1])
    // CSS takes pixels; Qt notes write points, and 1pt is 4/3 of a pixel.
    const pixels = size[2]?.toLowerCase() === 'pt' ? Math.round((value * 4) / 3) : Math.round(value)
    if (Number.isFinite(pixels) && pixels >= 6 && pixels <= 96) style.fontSize = pixels
  }
  return style
}

export function richTextToPlain(html: string): string {
  const withoutHead = html
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
  const text = withoutHead
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
export function readPurScene(bytes: Buffer): PurSceneData | undefined {
  // Several offsets can hold a structurally plausible database, so every candidate
  // is decoded and scored by the values it produces rather than by its page headers.
  let best: PurSceneData | undefined
  let bestScore = -1
  for (const candidate of sceneDatabaseCandidates(bytes)) {
    const scene = decodeScene(candidate)
    if (scene === undefined) continue
    const sized = scene.images.filter((image) => image.width > 0 && image.height > 0).length
    const placed = scene.items.filter((item) => item.transform.length >= 9).length
    const score = sized * 8 + placed * 4 + scene.images.length + scene.items.length
    if (score > bestScore) {
      bestScore = score
      best = scene
    }
  }
  return best
}

/**
 * Decode one scene from a specific database assembly.
 * @param database - the reassembled database.
 * @returns the scene, or undefined when its tables are missing.
 */
function decodeScene(database: SceneDatabase): PurSceneData | undefined {
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

  const notes = new Map<number, PurSceneData['items'][number]['note']>()
  const noteRoot = roots.get('items_notes')
  if (noteRoot !== undefined) {
    for (const row of readTable(database, noteRoot)) {
      const size = Buffer.isBuffer(row.values[2]) ? decodeSize(row.values[2]) : { width: -1, height: -1 }
      const textColor = qtColorToCss(textOf(row.values[0] ?? null))
      const backgroundColor = qtColorToCss(textOf(row.values[3] ?? null))
      const body = textOf(row.values[4] ?? null)
      const style = richTextStyle(body)
      notes.set(row.rowId, {
        text: body,
        ...style,
        ...(textColor === undefined ? {} : { textColor }),
        ...(backgroundColor === undefined ? {} : { backgroundColor }),
        style: Number(row.values[5] ?? 0),
        width: size.width,
        height: size.height,
      })
    }
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
      // The parent arrives as a signed byte, so a root shows up as 255 rather than -1.
      parent: ((value) => (value > 127 && value < 256 ? value - 256 : value))(Number(row.values[0] ?? -1)),
      name: textOf(row.values[2] ?? null),
      transform: Buffer.isBuffer(row.values[3]) ? decodeTransform(row.values[3]) : [],
      image: link?.image,
      bounds: link?.bounds ?? [],
      group: groups.has(id),
      note: notes.get(id),
      z: Number(row.values[5] ?? 1),
      opacity: Number(row.values[6] ?? 1),
      locked: Number(row.values[7] ?? 0) === 1,
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
