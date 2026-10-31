/**
 * PureRef `.pur` import. Two containers exist in the wild: a ZIP holding
 * `contents.xml` plus image entries, and PureRef's native QDataStream form.
 * This module reads the ZIP form, which needs no guessing: the XML names each
 * picture, its position and its size.
 * @module dsh-obsidian-vault/vault/pur-import
 */
import { inflateRawSync } from 'node:zlib'

/** One imported element, in canvas world coordinates. */
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
