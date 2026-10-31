/**
 * Resolve the `https://pur.studio/<canvas>/<file>` references that the export
 * and embed commands write into notes. The canvas document names the image; its
 * `dataURL` or its vault path supplies the bytes, so an exported outline paints
 * the same picture the canvas shows without touching the network.
 *
 * Reads go through {@link PurFileReader} rather than the index: a canvas saved a
 * moment ago is not in the index yet, and its reference must still resolve.
 * @module dsh-obsidian-vault/vault/pur-image
 */
import { parseStudioDocument } from '../pur-kernel/studio-file.ts'
import { PUR_ASSET_SCHEME } from './pur-store.ts'
import type { PurElement } from '../pur-kernel/types.ts'

/** Root-confined file access, as `VaultFiles` provides it. */
export interface PurFileReader {
  /** @param path - vault-relative path. @returns the text, or undefined when absent. */
  readText(path: string): Promise<string | undefined>
  /** @param path - vault-relative path. @returns the bytes, or undefined when absent. */
  readBytes(path: string): Promise<Uint8Array | undefined>
  /**
   * Find a file by name anywhere in the vault, for canvases in subfolders.
   * @param fileName - base name including the extension.
   * @returns the vault-relative path, or undefined when absent.
   */
  locate?(fileName: string): string | undefined
}

/** One resolved image: bytes plus the type the response should declare. */
export interface PurImage {
  readonly bytes: Buffer
  readonly contentType: string
}

const CONTENT_TYPES: Readonly<Record<string, string>> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  avif: 'image/avif',
  ico: 'image/x-icon',
}

/** Folders a canvas document may live in, most specific first. */
const CANVAS_DIRS = ['Pur画布', ''] as const

/**
 * Resolve one pur.studio image reference against the active vault.
 * @param files - root-confined reader for the active vault.
 * @param canvas - canvas name from the URL, with or without its extension.
 * @param file - image file name from the URL.
 * @returns the bytes and content type, or undefined when either side is missing.
 */
export async function resolvePurImage(
  files: PurFileReader,
  canvas: string,
  file: string,
  readAsset?: (id: string) => Promise<Uint8Array | undefined>,
): Promise<PurImage | undefined> {
  const elements = await readCanvas(files, canvas)
  if (elements === undefined) return undefined
  const image = findImage(elements, file)
  if (image === undefined) return undefined
  return await imageBytes(files, image, readAsset)
}

/** Read and parse one canvas document, trying the usual folders and then a name search. */
async function readCanvas(files: PurFileReader, canvas: string): Promise<readonly PurElement[] | undefined> {
  const base = canvas.replace(/\.PurStudio$/i, '')
  const located = files.locate?.(`${base}.PurStudio`)
  const paths = CANVAS_DIRS.map(folder => (folder.length === 0 ? `${base}.PurStudio` : `${folder}/${base}.PurStudio`))
  if (located !== undefined && !paths.includes(located)) paths.push(located)
  for (const path of paths) {
    const text = await files.readText(path)
    if (text === undefined) continue
    try {
      return parseStudioDocument(text).elements
    } catch {
      // An unreadable canvas is reported as a missing image; the note then paints
      // the file name instead of failing as a whole.
      return undefined
    }
  }
  return undefined
}

/** Depth-first search for the image element whose source names `file`. */
function findImage(elements: readonly PurElement[], file: string): PurElement | undefined {
  for (const element of elements) {
    if (element.type === 'image' && matchesFile(element.original, file)) return element
    if (element.type === 'group') {
      const nested = findImage(element.children, file)
      if (nested !== undefined) return nested
    }
  }
  return undefined
}

/** Whether an element's `original` field names the requested file. */
function matchesFile(original: string, file: string): boolean {
  if (original.length === 0) return false
  const name = original.slice(original.lastIndexOf('/') + 1)
  return name === file || original === file
}

/** Decode the element's inline data URL, or read the file it points at. */
async function imageBytes(
  files: PurFileReader,
  element: PurElement,
  readAsset?: (id: string) => Promise<Uint8Array | undefined>,
): Promise<PurImage | undefined> {
  if (element.type !== 'image') return undefined
  const inline = element.dataURL
  if (inline !== undefined && inline.startsWith('data:')) {
    const separator = inline.indexOf(',')
    const meta = inline.slice(5, separator)
    const payload = inline.slice(separator + 1)
    const base64 = meta.endsWith(';base64')
    return {
      bytes: base64 ? Buffer.from(payload, 'base64') : Buffer.from(decodeURIComponent(payload), 'utf8'),
      contentType: base64 ? meta.slice(0, -';base64'.length) : meta,
    }
  }
  const original = element.original
  if (original.length === 0) return undefined
  if (original.startsWith(PUR_ASSET_SCHEME) && readAsset !== undefined) {
    const bytes = await readAsset(original.slice(PUR_ASSET_SCHEME.length))
    if (bytes === undefined) return undefined
    return { bytes: Buffer.from(bytes), contentType: CONTENT_TYPES[extensionOf(original)] ?? 'application/octet-stream' }
  }
  for (const candidate of [original, `Pur画布/${original}`, `Pur画布/附件/${original}`, `附件/${original}`]) {
    const bytes = await files.readBytes(candidate)
    if (bytes !== undefined) {
      return { bytes: Buffer.from(bytes), contentType: CONTENT_TYPES[extensionOf(candidate)] ?? 'application/octet-stream' }
    }
  }
  return undefined
}

function extensionOf(path: string): string {
  const dot = path.lastIndexOf('.')
  return dot < 0 ? '' : path.slice(dot + 1).toLowerCase()
}
