/**
 * PureRef `.pur` import. Three containers exist in the wild: a ZIP holding
 * `contents.xml` plus image entries, PureRef's native SQLite form, and a
 * qCompress-wrapped variant (`.purz`) that is inflated before parsing.
 * @module dsh-obsidian-vault/vault/pur-import
 */
import { inflateRawSync, inflateSync } from 'node:zlib'

/** One imported element, in canvas world coordinates. */
import { readPurScene, richTextToPlain, salvageImages } from './pur-sqlite.ts'

export type ImportedElement = ImportedImage | ImportedText | ImportedGroup

/** Placement shared by every imported kind. */
interface ImportedPlacement {
  /** Left edge in world units. */
  readonly x: number
  /** Top edge in world units. */
  readonly y: number
  /** Width in world units. */
  readonly w: number
  /** Height in world units. */
  readonly h: number
  /** Rotation in degrees, taken from the item transform. */
  readonly rotation?: number
  /** Mirrored horizontally. */
  readonly flipH?: boolean
  /** Mirrored vertically. */
  readonly flipV?: boolean
  /** The source item was locked. */
  readonly locked?: boolean
  /** Opacity, 0-1. */
  readonly opacity?: number
}

/** One picture placed on the canvas. */
export interface ImportedImage extends ImportedPlacement {
  readonly type: 'image'
  /** `pur-asset:<id>` reference after the picture was stored. */
  readonly ref: string
}

/** One text card, which is how a PureRef note arrives. */
export interface ImportedText extends ImportedPlacement {
  readonly type: 'text'
  readonly text: string
  /** Text colour as stored by PureRef. */
  readonly textColor?: string
  /** Card fill as stored by PureRef. */
  readonly bgColor?: string
}

/** One group, mirroring the nesting PureRef stores. */
export interface ImportedGroup extends ImportedPlacement {
  readonly type: 'group'
  /** Group name as stored by PureRef. */
  readonly name: string
  /** Members with coordinates relative to this group. */
  readonly children: readonly ImportedElement[]
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
    // JPEG: start of image, then walk the segment chain to the end of image.
    if (bytes[offset] === 0xff && bytes[offset + 1] === 0xd8 && bytes[offset + 2] === 0xff) {
      const length = jpegLengthAt(bytes, offset)
      if (length !== undefined && length >= 128) {
        found.push({ name: `embedded-${found.length}.jpg`, bytes: bytes.subarray(offset, offset + length) })
        offset += length
        continue
      }
    } else if (isPngHeader(bytes, offset)) {
      // PNG: header, then chunks until the end chunk, which closes the picture.
      // The chunk chain already proves the picture is whole, so the size floor only
      // rejects a header that happens to sit inside unrelated bytes.
      const length = pngLengthAt(bytes, offset)
      if (length !== undefined && length >= 64) {
        found.push({ name: `embedded-${found.length}.png`, bytes: bytes.subarray(offset, offset + length) })
        offset += length
        continue
      }
    }
    offset += 1
  }
  return found
}

/**
 * Whether the bytes at an offset start a PNG.
 * @param bytes - the document.
 * @param offset - where the header would start.
 * @returns true for the eight byte signature.
 */
function isPngHeader(bytes: Uint8Array, offset: number): boolean {
  return bytes[offset] === 0x89
    && bytes[offset + 1] === 0x50
    && bytes[offset + 2] === 0x4e
    && bytes[offset + 3] === 0x47
    && bytes[offset + 4] === 0x0d
    && bytes[offset + 5] === 0x0a
    && bytes[offset + 6] === 0x1a
    && bytes[offset + 7] === 0x0a
}

/**
 * Length of the PNG starting at an offset, read from its chunk chain.
 * @param bytes - the document.
 * @param start - where the signature starts.
 * @returns the byte length, or undefined when the chunk chain is broken.
 */
function pngLengthAt(bytes: Uint8Array, start: number): number | undefined {
  let offset = start + 8
  while (offset + 8 <= bytes.byteLength) {
    const length = ((bytes[offset] ?? 0) << 24) | ((bytes[offset + 1] ?? 0) << 16) | ((bytes[offset + 2] ?? 0) << 8) | (bytes[offset + 3] ?? 0)
    if (length < 0 || offset + 12 + length > bytes.byteLength) return undefined
    const type = String.fromCharCode(bytes[offset + 4] ?? 0, bytes[offset + 5] ?? 0, bytes[offset + 6] ?? 0, bytes[offset + 7] ?? 0)
    offset += 12 + length
    if (type === 'IEND') return offset - start
  }
  return undefined
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
/**
 * Inflate a qCompress-wrapped document. The wrapper is a zlib stream with an
 * optional four byte size prefix; anything that does not inflate is returned as is.
 * @param bytes - the document as read from disk.
 * @returns the raw document.
 */
export function maybeInflate(bytes: Buffer): Buffer {
  const zlibHeader = bytes.length > 2 && bytes[0] === 0x78 && [0x01, 0x5e, 0x9c, 0xda].includes(bytes[1] ?? 0)
  if (!zlibHeader) return bytes
  try {
    return Buffer.from(inflateSync(bytes, { maxOutputLength: 512 * 1024 * 1024 }))
  } catch {
    return bytes
  }
}
export async function importNativePur(
  bytes: Uint8Array,
  store: (name: string, data: Uint8Array) => Promise<string | undefined>,
): Promise<{ elements: readonly ImportedElement[]; skipped: number; placed: boolean }> {
  // A `.purz` is the same document behind qCompress, so it is inflated first.
  const document = maybeInflate(Buffer.from(bytes))
  // The scene database carries the real placement, so it wins whenever it parses;
  // the embedded pictures remain the fallback for documents it cannot read.
  const placed = await importPlacedScene(document, store)
  if (placed !== undefined) return { ...placed, placed: true }

  const pictures = extractEmbeddedPictures(document)
  const columns = Math.max(1, Math.ceil(Math.sqrt(pictures.length)))
  const elements: ImportedElement[] = []
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

/** Padding around a group box, matching the canvas group command. */
const GROUP_PAD = 10

/** Smallest text card the placed import will produce. */
const TEXT_MIN_WIDTH = 220

/** Shortest text card, so a one-line note stays readable. */
const TEXT_MIN_HEIGHT = 90

/** Tallest a note card grows before its text scrolls. */
const TEXT_MAX_HEIGHT = 620

/** Height one line of note text needs, including spacing. */
const TEXT_LINE_HEIGHT = 22

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
  // Pages are not stored in logical order, so the images table can come back empty
  // while the rows themselves sit intact on some page; recover those by scanning.
  const missing = new Set<number>()
  for (const item of scene.items) {
    if (item.image !== undefined && !byId.has(item.image)) missing.add(item.image)
  }
  if (missing.size > 0) {
    for (const image of salvageImages(bytes, missing)) byId.set(image.id, image)
  }
  const pictures = extractEmbeddedPictures(bytes)
  const itemsById = new Map(scene.items.map((item) => [item.id, item]))
  const childrenOf = new Map<number, number[]>()
  const isGroupItem = (id: number): boolean => itemsById.get(id)?.group === true
  for (const item of scene.items) {
    // Only a real group can own children; anything else that points at another item
    // is kept at the root rather than dropped with its would-be parent.
    const parent = item.parent !== -1 && isGroupItem(item.parent) ? item.parent : -1
    const list = childrenOf.get(parent) ?? []
    list.push(item.id)
    childrenOf.set(parent, list)
  }
  // PureRef draws items in z order; the canvas draws later elements on top, so the
  // children lists are sorted by z to keep the same layering.
  for (const [parent, ids] of childrenOf) {
    childrenOf.set(parent, [...ids].sort((a, b) => (itemsById.get(a)?.z ?? 1) - (itemsById.get(b)?.z ?? 1)))
  }
  let skipped = 0
  let fallbackIndex = 0
  // Pictures no item claims, used to fill an item whose own row was lost.
  const unused = [...byId.values()].filter((image) => !scene.items.some((item) => item.image === image.id))
  let unusedIndex = 0

  /**
   * Read the placement PureRef stored for one item.
   * @param item - the item row.
   * @returns world position, rotation, mirroring and opacity.
   */
  const placementOf = (item: { transform: readonly number[]; opacity: number; locked: boolean }) => {
    const t = item.transform
    const scaleX = t[0] ?? 1
    const scaleY = t[4] ?? 1
    const rotation = Math.atan2(t[1] ?? 0, scaleX) * (180 / Math.PI)
    // A negative determinant means the item is mirrored rather than rotated.
    const determinant = scaleX * scaleY - (t[1] ?? 0) * (t[3] ?? 0)
    return {
      x: t[6] ?? 0,
      y: t[7] ?? 0,
      rotation: Math.abs(rotation) < 0.01 ? undefined : rotation,
      flipH: determinant < 0 ? true : undefined,
      flipV: undefined,
      opacity: item.opacity === 1 ? undefined : item.opacity,
      locked: item.locked ? true : undefined,
    }
  }

  /**
   * Build one item and, for a group, its members.
   * @param id - item id.
   * @returns the element, or undefined when it cannot be represented.
   */
  const build = async (id: number): Promise<ImportedElement | undefined> => {
    const item = itemsById.get(id)
    if (item === undefined) return undefined
    const base = placementOf(item)
    if (item.group === true) {
      const children: ImportedElement[] = []
      for (const childId of childrenOf.get(id) ?? []) {
        const child = await build(childId)
        if (child !== undefined) children.push(child)
      }
      if (children.length === 0) return undefined
      const minX = Math.min(...children.map((child) => child.x))
      const minY = Math.min(...children.map((child) => child.y))
      const maxX = Math.max(...children.map((child) => child.x + child.w))
      const maxY = Math.max(...children.map((child) => child.y + child.h))
      return {
        type: 'group',
        name: item.name === '' ? '群组' : item.name,
        x: minX - GROUP_PAD,
        y: minY - GROUP_PAD,
        w: maxX - minX + GROUP_PAD * 2,
        h: maxY - minY + GROUP_PAD * 2,
        rotation: base.rotation,
        opacity: base.opacity,
        locked: base.locked,
        children: children.map((child) => ({
          ...child,
          x: child.x - (minX - GROUP_PAD),
          y: child.y - (minY - GROUP_PAD),
        })),
      }
    }
    if (item.image !== undefined) {
      let image = byId.get(item.image)
      if (image === undefined && unusedIndex < unused.length) {
        // The images table can lose a row while the picture itself survives on some
        // page, so a recovered picture stands in for the missing one.
        image = unused[unusedIndex]
        unusedIndex += 1
      }
      let payload: Uint8Array | undefined = image?.bytes
      if (payload === undefined || payload.length === 0) {
        // The picture bytes live in pages this reader cannot place yet; fall back to
        // the embedded copy so the card still shows something.
        payload = pictures[fallbackIndex]?.bytes
        fallbackIndex += 1
      }
      if (payload === undefined || payload.length === 0) {
        skipped += 1
        return undefined
      }
      // The stored name must carry an extension: the asset route keys files by it.
      const isPng = payload[0] === 0x89 && payload[1] === 0x50
      const ref = await store(`scene-${item.image}-${fallbackIndex}.${isPng ? 'png' : 'jpg'}`, payload)
      if (ref === undefined) {
        skipped += 1
        return undefined
      }
      const scaleX = Math.abs(item.transform[0] ?? 1)
      const scaleY = Math.abs(item.transform[4] ?? 1)
      // The scene columns hold the original picture size, which is authoritative;
      // the header is only a fallback for rows whose columns were lost.
      const size = pictureSize(payload)
      const columnWidth = image?.width ?? 0
      const columnHeight = image?.height ?? 0
      const naturalWidth = columnWidth > 0 ? columnWidth : (size?.width ?? 320)
      const naturalHeight = columnHeight > 0 ? columnHeight : (size?.height ?? 240)
      return {
        type: 'image',
        ...base,
        x: base.x,
        y: base.y,
        w: Math.max(MIN_PLACED_SIZE, naturalWidth * scaleX),
        h: Math.max(MIN_PLACED_SIZE, naturalHeight * scaleY),
        ref,
      }
    }
    const noteInfo = item.note
    const note = richTextToPlain(noteInfo === undefined ? '' : noteInfo.text).trim()
    if (note === '') return undefined
    // A stored fixed size wins; otherwise the card keeps a readable width and grows
    // with the number of lines so a short note does not become a tall card.
    const noteLines = note.split('\n').length
    const fixedWidth = noteInfo !== undefined && noteInfo.width > 0 ? noteInfo.width : 0
    const fixedHeight = noteInfo !== undefined && noteInfo.height > 0 ? noteInfo.height : 0
    return {
      type: 'text',
      ...base,
      x: base.x,
      y: base.y,
      w: fixedWidth > 0 ? fixedWidth : TEXT_MIN_WIDTH,
      h: fixedHeight > 0 ? fixedHeight : Math.max(TEXT_MIN_HEIGHT, Math.min(TEXT_MAX_HEIGHT, noteLines * TEXT_LINE_HEIGHT + 32)),
      text: note,
      ...(noteInfo?.textColor === undefined ? {} : { textColor: noteInfo.textColor }),
      ...(noteInfo?.backgroundColor === undefined ? {} : { bgColor: noteInfo.backgroundColor }),
    }
  }

  const elements: ImportedElement[] = []
  for (const id of childrenOf.get(-1) ?? []) {
    const element = await build(id)
    if (element !== undefined) elements.push(element)
  }
  if (elements.length === 0) return undefined
  return { elements, skipped }
}
