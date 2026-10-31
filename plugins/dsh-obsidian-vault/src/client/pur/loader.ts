/**
 * Vault I/O for the React Pur pane: `.PurStudio` load/save, note hydration,
 * the markdown note list the picker searches, decoded-image caching, and the
 * `收件箱/` export writes.
 * @module dsh-obsidian-vault/client/pur/loader
 */
import { assetUrl, bridgeExists, bridgeReadText, bridgeReadTextVersion, bridgeWriteBinary, bridgeWriteText, createFolder, fetchNote, fetchTree, purAssetUrl } from '../api.ts'
import { parseStudioDocument, serializeStudioDocument } from '../../pur-kernel/index.ts'
import type { PurImageLookup, PurStudioDocument } from '../../pur-kernel/index.ts'
import type { TreeNodeDto } from '../../protocol.ts'

/** Folder every export lands in, mirroring the Obsidian adapter. */
export const PUR_EXPORT_DIR = '收件箱'

/** A note as the pane needs it: path, display title and full text. */
export interface PurNoteSummary {
  /** Vault-relative path. */
  readonly path: string
  /** Display title. */
  readonly title: string
  /** Full markdown text. */
  readonly content: string
}

/** Modification time each canvas had when this pane loaded or last saved it. */
const studioVersions = new Map<string, number>()

/**
 * Read a `.PurStudio` document; an empty or unparsable file loads as an empty
 * canvas rather than failing the view.
 * @param path - vault-relative document path.
 * @returns the parsed document, or an empty one.
 */
export async function loadStudioDocument(path: string): Promise<PurStudioDocument> {
  const read = await bridgeReadTextVersion(path)
  if (read.mtime !== undefined) studioVersions.set(path, read.mtime)
  const text = read.content
  if (text.trim() === '') return { elements: [], viewState: { offsetX: 0, offsetY: 0, scale: 1 } }
  try {
    return parseStudioDocument(text)
  } catch {
    return { elements: [], viewState: { offsetX: 0, offsetY: 0, scale: 1 } }
  }
}

/**
 * Persist a `.PurStudio` document.
 * @param path - vault-relative document path.
 * @param document - elements and viewport.
 * @returns completion.
 */
/**
 * Persist a `.PurStudio` document, refusing to overwrite a version someone else
 * wrote after this pane loaded it.
 * @param path - vault-relative document path.
 * @param document - elements and viewport.
 * @param force - write even when the file moved since the load.
 * @throws VaultWriteConflict when the file changed and `force` is off.
 * @returns completion.
 */
export async function saveStudioDocument(path: string, document: PurStudioDocument, force = false): Promise<void> {
  const expected = force ? undefined : studioVersions.get(path)
  const result = await bridgeWriteText(path, serializeStudioDocument(document), expected)
  if (result.mtime !== undefined) studioVersions.set(path, result.mtime)
}

/** Fetched note texts, so pipeline code generation can resolve linked code. */
const noteTexts = new Map<string, string>()

/**
 * Read one note, caching its text for the pipeline's linked-code lookup.
 * @param path - vault-relative note path.
 * @returns the note, or null when it cannot be read.
 */
export async function fetchNoteSummary(path: string): Promise<PurNoteSummary | null> {
  try {
    const note = await fetchNote(path)
    noteTexts.set(note.path, note.content)
    return { path: note.path, title: note.title, content: note.content }
  } catch {
    return null
  }
}

/**
 * The cached raw text of a hydrated note.
 * @param path - vault-relative note path.
 * @returns the text, or undefined when the note was never fetched.
 */
export function cachedNoteText(path: string): string | undefined {
  return noteTexts.get(path)
}

/**
 * Resolve a link target (a basename, a `[[wikilink]]` body, or a path without
 * extension) to a note.
 * @param link - the raw link text.
 * @returns the note, or null when no markdown file matches.
 */
export async function resolveNoteLink(link: string): Promise<PurNoteSummary | null> {
  const wanted = link.replace(/\.md$/i, '')
  const direct = await fetchNoteSummary(`${wanted}.md`)
  if (direct !== null) return direct
  const notes = await listMarkdownNotes()
  const match = notes.find((path) => path.replace(/\.md$/i, '').split('/').pop() === wanted.split('/').pop())
  return match === undefined ? null : fetchNoteSummary(match)
}

/**
 * List every markdown path in the vault, flattening the explorer tree.
 * @returns vault-relative `.md` paths.
 */
export async function listMarkdownNotes(): Promise<readonly string[]> {
  const out: string[] = []
  const walk = (nodes: readonly TreeNodeDto[]): void => {
    for (const node of nodes) {
      if (node.kind === 'file' && node.path.toLowerCase().endsWith('.md')) out.push(node.path)
      if (node.children !== undefined) walk(node.children)
    }
  }
  walk(await fetchTree())
  return out
}

/** Estimated decoded size of one bitmap: four bytes per pixel, a megabyte when unknown. */
function decodedBytes(value: CanvasImageSource): number {
  const width = (value as { naturalWidth?: number }).naturalWidth ?? (value as { width?: number }).width ?? 0
  const height = (value as { naturalHeight?: number }).naturalHeight ?? (value as { height?: number }).height ?? 0
  return width > 0 && height > 0 ? width * height * 4 : 1024 * 1024
}

/**
 * Decoded images keyed by `dataURL || original`, bounded by a byte budget and
 * evicted least-recently-used: a canvas may reference thousands of pictures, and
 * every decoded bitmap holds its pixels for as long as it stays cached.
 */
class PurImageMap extends Map<string, CanvasImageSource> implements PurImageLookup {
  /** Keys the browser could not decode; the renderer draws a placeholder for them. */
  readonly failedKeys = new Set<string>()
  private readonly touched = new Map<string, number>()
  private readonly sizes = new Map<string, number>()
  private held = 0
  private stamp = 0

  override get(key: string): CanvasImageSource | undefined {
    const value = super.get(key)
    if (value !== undefined) this.touched.set(key, ++this.stamp)
    return value
  }

  override set(key: string, value: CanvasImageSource): this {
    const previous = this.sizes.get(key)
    if (previous !== undefined) this.held -= previous
    const size = decodedBytes(value)
    this.sizes.set(key, size)
    this.touched.set(key, ++this.stamp)
    this.held += size
    super.set(key, value)
    this.evict(IMAGE_BUDGET_BYTES)
    return this
  }

  override delete(key: string): boolean {
    const size = this.sizes.get(key)
    if (size !== undefined) this.held -= size
    this.sizes.delete(key)
    this.touched.delete(key)
    return super.delete(key)
  }

  /** Drop the least recently drawn images until the budget holds. @param budget - bytes to keep. */
  private evict(budget: number): void {
    while (this.held > budget && this.size > 1) {
      let oldestKey: string | undefined
      let oldest = Infinity
      for (const [key, stamp] of this.touched) {
        if (stamp < oldest) {
          oldest = stamp
          oldestKey = key
        }
      }
      if (oldestKey === undefined) return
      this.delete(oldestKey)
    }
  }
}

/** Decoded pixels the cache keeps before evicting the least recently drawn. */
const IMAGE_BUDGET_BYTES = 256 * 1024 * 1024

/** Decoded canvas images keyed by `dataURL || original`, with load dedupe. */
/** Decodes allowed to run at once; more than a couple only queue for the same frame. */
const MAX_PARALLEL_DECODES = 2

export class PurImageCache {
  private readonly images = new PurImageMap()
  private readonly pending = new Set<string>()
  private readonly queue: { key: string; onSettled: () => void }[] = []
  private active = 0

  /** The lookup the scene builder reads. @returns decoded images by key, with failed keys. */
  get map(): PurImageLookup {
    return this.images
  }

  /**
   * Decode an image when missing; the callback fires once the request settles,
   * whether the image decoded or the cache recorded a failure. A failed key is
   * never requested again, so a broken reference costs one request per cache.
   *
   * Decodes run at most `MAX_PARALLEL_DECODES` at a time: a pan that brings a
   * screenful of new pictures into view would otherwise start every decode at
   * once and blow the frame budget.
   * @param key - the scene's image key (`dataURL || original`).
   * @param onSettled - repaint callback.
   */
  request(key: string, onSettled: () => void): void {
    if (key === '' || this.images.has(key) || this.images.failedKeys.has(key) || this.pending.has(key)) return
    this.pending.add(key)
    this.queue.push({ key, onSettled })
    this.pump()
  }

  /** Start queued decodes up to the concurrency limit. */
  private pump(): void {
    while (this.active < MAX_PARALLEL_DECODES && this.queue.length > 0) {
      const next = this.queue.shift()
      if (next === undefined) return
      this.active += 1
      const image = new Image()
      const settle = (failed: boolean): void => {
        this.active -= 1
        this.pending.delete(next.key)
        if (failed) this.images.failedKeys.add(next.key)
        else this.images.set(next.key, image)
        next.onSettled()
        this.pump()
      }
      image.onload = () => settle(false)
      image.onerror = () => settle(true)
      image.src = next.key.startsWith('data:') || /^https?:/i.test(next.key) ? next.key : purAssetUrl(next.key)
    }
  }
}

/** Create the export folder when absent. @returns completion. */
export async function ensureExportDir(): Promise<void> {
  if (!(await bridgeExists(PUR_EXPORT_DIR))) await createFolder(PUR_EXPORT_DIR)
}

/** Strip characters vault file names cannot carry, mirroring upstream. */
function safeFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/\.+$/, '').trim()
}

/**
 * Pick a non-colliding export path, appending `_N` like upstream.
 * @param name - requested base name.
 * @param extension - file extension without the dot.
 * @returns the free vault-relative path.
 */
export async function uniqueExportPath(name: string, extension: string): Promise<string> {
  const base = safeFileName(name) || 'export'
  let candidate = `${PUR_EXPORT_DIR}/${base}.${extension}`
  let counter = 1
  while (await bridgeExists(candidate)) {
    candidate = `${PUR_EXPORT_DIR}/${base}_${counter}.${extension}`
    counter++
  }
  return candidate
}

/**
 * Write a text export under `收件箱/`.
 * @param path - vault-relative target from {@link uniqueExportPath}.
 * @param content - file text.
 * @returns completion.
 */
export async function writeExportText(path: string, content: string): Promise<void> {
  await bridgeWriteText(path, content)
}

/**
 * Write a `data:` URL export under `收件箱/` as bytes.
 * @param path - vault-relative target from {@link uniqueExportPath}.
 * @param dataURL - the canvas `toDataURL` output.
 * @returns completion.
 */
export async function writeExportDataURL(path: string, dataURL: string): Promise<void> {
  await bridgeWriteBinary(path, dataURL.slice(dataURL.indexOf(',') + 1))
}


/** Longest edge of the copy drawn for a zoomed-out canvas. */
const THUMB_MAX_EDGE = 256

/**
 * Downscale one picture for the zoomed-out view.
 * @param dataUrl - source image as a data URL.
 * @returns a PNG data URL, or null when the browser cannot decode the source.
 */
export async function thumbnailOf(dataUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => {
      const sourceW = image.naturalWidth
      const sourceH = image.naturalHeight
      if (sourceW === 0 || sourceH === 0) {
        resolve(null)
        return
      }
      const ratio = Math.min(1, THUMB_MAX_EDGE / Math.max(sourceW, sourceH))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(sourceW * ratio))
      canvas.height = Math.max(1, Math.round(sourceH * ratio))
      const context = canvas.getContext('2d')
      if (context === null) {
        resolve(null)
        return
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/png'))
    }
    image.onerror = () => resolve(null)
    image.src = dataUrl
  })
}
