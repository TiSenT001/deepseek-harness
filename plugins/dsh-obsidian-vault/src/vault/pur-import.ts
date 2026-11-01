/**
 * PureRef `.pur` import. Two containers exist in the wild: a ZIP holding
 * `contents.xml` plus image entries, and PureRef's native QDataStream form.
 * This module reads the ZIP form, which needs no guessing: the XML names each
 * picture, its position and its size.
 * @module dsh-obsidian-vault/vault/pur-import
 */
import { inflateRawSync } from 'node:zlib'

/** One imported element, in canvas world coordinates. */
import { readPurScene } from './pur-sqlite.ts'

export interface ImportedElement {
  readonly type: 'image'
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
  /** `pur-asset:<id>` reference after the picture was stored. */
  readonly ref: string
}

/** Result of one import. */
export interface PurImportResult {
  readonly elements: readonly ImportedElement[]
  /** Tags the reader recognised but cannot map yet, for the report. */
  readonly unsupported: readonly string[]
}

/** Magic bytes of a ZIP local file header. */
const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04]

/** One file inside the archive. */
interface ZipEntry {
  readonly name: string
  readonly bytes: Uint8Array
}

/**
 * Whether the bytes start with the ZIP signature.
 * @param bytes - file contents.
 * @returns true for the ZIP variant of `.pur`.
 */
export function isZipPur(bytes: Uint8Array): boolean {
  return ZIP_MAGIC.every((value, index) => bytes[index] === value)
}

/**
 * Import a ZIP-form `.pur` document.
 * @param bytes - file contents.
 * @param store - callback storing one picture and returning its `pur-asset:` ref.
 * @returns the elements and any tags the reader skipped.
 */
export async function importZipPur(
  bytes: Uint8Array,
  store: (name: string, data: Uint8Array) => Promise<string | undefined>,
): Promise<PurImportResult> {
  const entries = readZipEntries(bytes)
  const xml = entries.find((entry) => entry.name.toLowerCase().endsWith('contents.xml'))
  if (xml === undefined) return { elements: [], unsupported: [] }
  const byName = new Map(entries.map((entry) => [entry.name, entry]))
  const text = new TextDecoder('utf-8').decode(xml.bytes)
  const elements: ImportedElement[] = []
  const unsupported = new Set<string>()

  for (const match of text.matchAll(/<([a-zA-Z]+)\b([^>]*)\/?>/g)) {
    const tag = match[1] ?? ''
    const attributes = readAttributes(match[2] ?? '')
    if (tag !== 'image') {
      unsupported.add(tag)
      continue
    }
    const path = attributes['path'] ?? ''
    const entry = byName.get(path) ?? byName.get(decodeURIComponent(path))
    if (entry === undefined) continue
    const ref = await store(path, entry.bytes)
    if (ref === undefined) continue
    elements.push({
      type: 'image',
      x: numberAttribute(attributes, 'x'),
      y: numberAttribute(attributes, 'y'),
      w: Math.max(20, numberAttribute(attributes, 'width', 200)),
      h: Math.max(20, numberAttribute(attributes, 'height', 150)),
      ref,
    })
  }
  return { elements, unsupported: [...unsupported] }
}

/**
 * Read one numeric attribute.
 * @param attributes - parsed attribute map.
 * @param name - attribute name.
 * @param fallback - value used when absent or unusable.
 * @returns the number.
 */
function numberAttribute(attributes: Readonly<Record<string, string>>, name: string, fallback = 0): number {
  const raw = attributes[name]
  if (raw === undefined) return fallback
  const value = Number(raw)
  return Number.isFinite(value) ? value : fallback
}

/**
 * Parse the attributes of one XML tag.
 * @param source - text after the tag name.
 * @returns attribute name to value.
 */
function readAttributes(source: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const match of source.matchAll(/([a-zA-Z:_-]+)\s*=\s*"([^"]*)"/g)) {
    const key = match[1]
    const value = match[2]
    if (key !== undefined && value !== undefined) out[key] = value
  }
  return out
}

/**
 * Read every file of a ZIP archive. Only the central directory is trusted, and
 * both stored and deflated entries are supported, which covers what PureRef and
 * archive tools write.
 * @param bytes - archive contents.
 * @returns the entries, in archive order.
 */
export function readZipEntries(bytes: Uint8Array): readonly ZipEntry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const eocd = findEndOfCentralDirectory(view)
  if (eocd < 0) return []
  const count = view.getUint16(eocd + 10, true)
  let offset = view.getUint32(eocd + 16, true)
  const entries: ZipEntry[] = []
  for (let index = 0; index < count; index++) {
    if (offset + 46 > bytes.byteLength) break
    if (view.getUint32(offset, true) !== 0x02014b50) break
    const method = view.getUint16(offset + 10, true)
    const compressedSize = view.getUint32(offset + 20, true)
    const nameLength = view.getUint16(offset + 28, true)
    const extraLength = view.getUint16(offset + 30, true)
    const commentLength = view.getUint16(offset + 32, true)
    const localOffset = view.getUint32(offset + 42, true)
    const name = new TextDecoder('utf-8').decode(bytes.subarray(offset + 46, offset + 46 + nameLength))
    offset += 46 + nameLength + extraLength + commentLength

    if (localOffset + 30 > bytes.byteLength) continue
    if (view.getUint32(localOffset, true) !== 0x04034b50) continue
    const localNameLength = view.getUint16(localOffset + 26, true)
    const localExtraLength = view.getUint16(localOffset + 28, true)
    const dataStart = localOffset + 30 + localNameLength + localExtraLength
    const raw = bytes.subarray(dataStart, dataStart + compressedSize)
    if (method === 0) {
      entries.push({ name, bytes: raw })
      continue
    }
    if (method === 8) {
      try {
        entries.push({ name, bytes: inflateRawSync(raw) })
      } catch {
        // A damaged entry is skipped; the rest of the archive still imports.
      }
    }
  }
  return entries
}

/**
 * Locate the end-of-central-directory record.
 * @param view - archive bytes.
 * @returns its offset, or -1 when the archive is not readable.
 */
function findEndOfCentralDirectory(view: DataView): number {
  for (let offset = view.byteLength - 22; offset >= 0 && offset > view.byteLength - 66_000; offset--) {
    if (view.getUint32(offset, true) === 0x06054b50) return offset
  }
  return -1
}

/** PNG signature, used to recognise an embedded picture. */
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

/** JPEG start-of-image marker. */
const JPEG_MAGIC = [0xff, 0xd8, 0xff]

/** Markers that carry no length field and stand alone in the stream. */
const STANDALONE = new Set([0x01, 0xd0, 0xd1, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7])

/**
 * Length of the JPEG that starts at one offset, or undefined when the bytes are
 * not a structurally valid one. Markers are walked rather than searching for the
 * first end-of-image pair, because a JPEG may embed a thumbnail whose own end
 * marker sits inside the picture data and would cut the span short.
 * @param bytes - file bytes.
 * @param start - offset of the start-of-image marker.
 * @returns the byte length including the end marker, or undefined.
 */
export function jpegLengthAt(bytes: Uint8Array, start: number): number | undefined {
  if (bytes[start] !== 0xff || bytes[start + 1] !== 0xd8) return undefined
  let offset = start + 2
  while (offset + 1 < bytes.byteLength) {
    if (bytes[offset] !== 0xff) return undefined
    // Markers may be preceded by fill bytes that repeat ff; skip them.
    while (bytes[offset + 1] === 0xff) offset += 1
    const marker = bytes[offset + 1] ?? 0
    if (marker === 0xd9) return offset + 2 - start
    if (STANDALONE.has(marker)) {
      offset += 2
      continue
    }
    if (offset + 4 > bytes.byteLength) return undefined
    const length = ((bytes[offset + 2] ?? 0) << 8) | (bytes[offset + 3] ?? 0)
    if (length < 2 || offset + 2 + length > bytes.byteLength) return undefined
    offset += 2 + length
    if (marker !== 0xda) continue
    // Entropy-coded data: ff is stuffed with 00, restarts are d0-d7; any other
    // marker byte ends the scan of this segment.
    while (offset + 1 < bytes.byteLength) {
      if (bytes[offset] !== 0xff) {
        offset += 1
        continue
      }
      const next = bytes[offset + 1] ?? 0
      if (next === 0x00 || next === 0xff || (next >= 0xd0 && next <= 0xd7)) {
        offset += 2
        continue
      }
      break
    }
  }
  return undefined
}

/**
 * Extract the pictures embedded in PureRef's native container. Each picture is a
 * plain JPEG: the first one is the scene preview, the rest are the full pictures.
 * Only structurally valid ones are kept: the full-size pictures are interleaved
 * with other records, so a span taken from the next end marker decodes as broken
 * data and is refused here rather than imported.
 * @param bytes - native `.pur` contents.
 * @returns each found picture, in file order.
 */
export function extractEmbeddedPictures(bytes: Uint8Array): readonly { name: string; bytes: Uint8Array }[] {
  const found: { name: string; bytes: Uint8Array }[] = []
  let offset = 0
  while (offset + 3 < bytes.byteLength) {
    if (bytes[offset] !== 0xff || bytes[offset + 1] !== 0xd8 || bytes[offset + 2] !== 0xff) {
      offset += 1
      continue
    }
    const length = jpegLengthAt(bytes, offset)
    if (length === undefined || length < 128) {
      offset += 1
      continue
    }
    found.push({ name: `embedded-${found.length}.jpg`, bytes: bytes.subarray(offset, offset + length) })
    offset += length
  }
  return found
}

/**
 * Import the pictures of a native `.pur` document on a grid. The scene
 * coordinates live in a serialised Qt structure this reader does not decode, so
 * the layout is approximate and the caller is told so.
 * @param bytes - native `.pur` contents.
 * @param store - callback storing one picture and returning its `pur-asset:` ref.
 * @returns the elements and the count of pictures that could not be stored.
 */
/** Width or height read from a picture header. */
export interface PictureSize {
  /** Pixel width. */
  readonly width: number
  /** Pixel height. */
  readonly height: number
}

/** Card width on the imported grid, in world units. */
const GRID_CARD_WIDTH = 320

/** Largest card side, so a tall screenshot cannot dominate the board. */
const GRID_MAX_HEIGHT = 480

/**
 * Read a picture's pixel size from its own header: PNG stores it in IHDR, JPEG
 * in the first SOFn marker. The native container layout is still unread, but the
 * cards can at least keep each picture's aspect ratio.
 * @param bytes - picture bytes.
 * @returns the size, or undefined when the header is not understood.
 */
export function pictureSize(bytes: Uint8Array): PictureSize | undefined {
  if (bytes.length > 24 && bytes[0] === 0x89 && bytes[1] === 0x50) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    return { width: view.getUint32(16, false), height: view.getUint32(20, false) }
  }
  if (bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset += 1
        continue
      }
      const marker = bytes[offset + 1] ?? 0
      // SOF0..SOF15 except DHT/JPG/DAC carry the frame size.
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return {
          height: ((bytes[offset + 5] ?? 0) << 8) | (bytes[offset + 6] ?? 0),
          width: ((bytes[offset + 7] ?? 0) << 8) | (bytes[offset + 8] ?? 0),
        }
      }
      const length = ((bytes[offset + 2] ?? 0) << 8) | (bytes[offset + 3] ?? 0)
      if (length < 2) return undefined
      offset += 2 + length
    }
  }
  return undefined
}
export async function importNativePur(
  bytes: Uint8Array,
  store: (name: string, data: Uint8Array) => Promise<string | undefined>,
): Promise<{ elements: readonly ImportedElement[]; skipped: number; placed: boolean }> {
  // The scene database carries the real placement, so it wins whenever it parses;
  // the embedded pictures remain the fallback for documents it cannot read.
  const placed = await importPlacedScene(Buffer.from(bytes), store)
  if (placed !== undefined) return { ...placed, placed: true }

  const pictures = extractEmbeddedPictures(bytes)
  const columns = Math.max(1, Math.ceil(Math.sqrt(pictures.length)))
  const elements: ImportedElement[] = []
  // Cards keep each picture's own aspect ratio, so a board of portrait and
  // landscape references still reads correctly even on an approximate layout.
  const rowHeights: number[] = []
  let skipped = 0
  for (const [index, picture] of pictures.entries()) {
    const ref = await store(picture.name, picture.bytes)
    if (ref === undefined) {
      skipped += 1
      continue
    }
    const size = pictureSize(picture.bytes)
    const ratio = size === undefined || size.width === 0 ? 0.75 : size.height / size.width
    const width = GRID_CARD_WIDTH
    const height = Math.min(GRID_MAX_HEIGHT, Math.max(GRID_CARD_WIDTH * 0.4, width * ratio))
    const column = index % columns
    const row = Math.floor(index / columns)
    rowHeights[row] = Math.max(rowHeights[row] ?? 0, height)
    let y = 0
    for (let above = 0; above < row; above++) y += (rowHeights[above] ?? 0) + 24
    elements.push({
      type: 'image',
      x: column * (GRID_CARD_WIDTH + 24),
      y,
      w: width,
      h: height,
      ref,
    })
  }
  return { elements, skipped, placed: false }
}

/** Smallest card the placed import will produce, so a heavily zoomed item stays usable. */
const MIN_PLACED_SIZE = 24

/**
 * Build the canvas from the scene database: each item's transform holds its world
 * position, and its image bounds hold the displayed size.
 * @param bytes - the native document.
 * @param store - callback storing one picture and returning its ref.
 * @returns the elements, or undefined when the database does not describe a scene.
 */
async function importPlacedScene(
  bytes: Buffer,
  store: (name: string, data: Uint8Array) => Promise<string | undefined>,
): Promise<{ elements: readonly ImportedElement[]; skipped: number } | undefined> {
  const scene = readPurScene(bytes)
  if (scene === undefined || scene.items.length === 0) return undefined
  const byId = new Map(scene.images.map((image) => [image.id, image]))
  const pictures = extractEmbeddedPictures(bytes)
  const elements: ImportedElement[] = []
  let skipped = 0
  let fallbackIndex = 0
  for (const item of scene.items) {
    if (item.image === undefined) continue
    const image = byId.get(item.image)
    let payload: Uint8Array | undefined = image?.bytes
    if (payload === undefined || payload.length === 0) {
      // The picture bytes live in pages this reader cannot place yet; fall back to
      // the embedded copy so the card still shows something.
      payload = pictures[fallbackIndex]?.bytes
      fallbackIndex += 1
    }
    if (payload === undefined || payload.length === 0) {
      skipped += 1
      continue
    }
    // The stored name must carry an extension: the asset route keys files by it.
    const isPng = payload[0] === 0x89 && payload[1] === 0x50
    const ref = await store(`scene-${item.image}-${fallbackIndex}.${isPng ? 'png' : 'jpg'}`, payload)
    if (ref === undefined) {
      skipped += 1
      continue
    }
    // The item's scale times the picture's own pixel size is the size on the board.
    const scale = Math.abs(item.transform[0] ?? 1)
    const size = pictureSize(payload)
    const naturalWidth = size?.width ?? 320
    const naturalHeight = size?.height ?? 240
    const width = Math.max(MIN_PLACED_SIZE, naturalWidth * scale)
    const height = Math.max(MIN_PLACED_SIZE, naturalHeight * scale)
    elements.push({
      type: 'image',
      x: item.transform[6] ?? 0,
      y: item.transform[7] ?? 0,
      w: width,
      h: height,
      ref,
    })
  }
  if (elements.length === 0) return undefined
  return { elements, skipped }
}
