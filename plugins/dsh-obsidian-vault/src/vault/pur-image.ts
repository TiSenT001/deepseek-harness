/**
 * Resolve the `https://pur.studio/<canvas>/<file>` references that the export
 * and embed commands write into notes. The canvas document names the image; its
 * `dataURL` or its vault path supplies the bytes, so an exported outline paints
 * the same picture the canvas shows without touching the network.
 * @module dsh-obsidian-vault/vault/pur-image
 */
import { parseStudioDocument } from '../pur-kernel/studio-file.ts'
import type { PurElement } from '../pur-kernel/types.ts'
import type { VaultIndex } from './index.ts'

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
 * @param vault - index over the active vault.
 * @param canvas - canvas name from the URL, with or without its extension.
 * @param file - image file name from the URL.
 * @returns the bytes and content type, or undefined when either side is missing.
 */
export async function resolvePurImage(
  vault: VaultIndex,
  canvas: string,
  file: string,
): Promise<PurImage | undefined> {
  const document = await readCanvas(vault, canvas)
  if (document === undefined) return undefined
  const image = findImage(document, file)
  if (image === undefined) return undefined
  return await imageBytes(vault, image)
}

/** Read and parse one canvas document, trying the usual folders. */
async function readCanvas(vault: VaultIndex, canvas: string): Promise<readonly PurElement[] | undefined> {
  const base = canvas.replace(/\.PurStudio$/i, '')
  for (const folder of CANVAS_DIRS) {
    const path = folder.length === 0 ? `${base}.PurStudio` : `${folder}/${base}.PurStudio`
    const bytes = await vault.readAsset(path)
    if (bytes === undefined) continue
    try {
      return parseStudioDocument(Buffer.from(bytes).toString('utf8')).elements
    } catch {
      // An unreadable canvas is reported as a missing image; the caller renders
      // the file name instead of failing the whole note.
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
async function imageBytes(vault: VaultIndex, element: PurElement): Promise<PurImage | undefined> {
  const inline = element.type === 'image' ? element.dataURL : undefined
  if (inline !== undefined && inline.startsWith('data:')) {
    const separator = inline.indexOf(',')
    const meta = inline.slice(5, separator)
    const payload = inline.slice(separator + 1)
    const base64 = meta.endsWith(';base64')
    const contentType = base64 ? meta.slice(0, -';base64'.length) : meta
    return {
      bytes: base64 ? Buffer.from(payload, 'base64') : Buffer.from(decodeURIComponent(payload), 'utf8'),
      contentType: contentType.length === 0 ? 'application/octet-stream' : contentType,
    }
  }
  const original = element.type === 'image' ? element.original : ''
  if (original.length === 0) return undefined
  for (const candidate of [original, `Pur画布/${original}`, `附件/${original}`]) {
    const bytes = await vault.readAsset(candidate)
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
