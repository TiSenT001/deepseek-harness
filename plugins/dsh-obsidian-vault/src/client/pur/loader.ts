/**
 * Vault I/O for the React Pur pane: `.PurStudio` load/save, note hydration,
 * the markdown note list the picker searches, decoded-image caching, and the
 * `收件箱/` export writes.
 * @module dsh-obsidian-vault/client/pur/loader
 */
import { assetUrl, purAssetUrl, bridgeExists, bridgeReadText, bridgeWriteBinary, bridgeWriteText, createFolder, fetchNote, fetchTree } from '../api.ts'
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

/**
 * Read a `.PurStudio` document; an empty or unparsable file loads as an empty
 * canvas rather than failing the view.
 * @param path - vault-relative document path.
 * @returns the parsed document, or an empty one.
 */
export async function loadStudioDocument(path: string): Promise<PurStudioDocument> {
  const text = await bridgeReadText(path)
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
export async function saveStudioDocument(path: string, document: PurStudioDocument): Promise<void> {
  await bridgeWriteText(path, serializeStudioDocument(document))
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

/** Decoded images keyed by `dataURL || original`, with the failed keys attached. */
class PurImageMap extends Map<string, CanvasImageSource> implements PurImageLookup {
  /** Keys the browser could not decode; the renderer draws a placeholder for them. */
  readonly failedKeys = new Set<string>()
}

/** Decoded canvas images keyed by `dataURL || original`, with load dedupe. */
export class PurImageCache {
  private readonly images = new PurImageMap()
  private readonly pending = new Set<string>()

  /** The lookup the scene builder reads. @returns decoded images by key, with failed keys. */
  get map(): PurImageLookup {
    return this.images
  }

  /**
   * Decode an image when missing; the callback fires once the request settles,
   * whether the image decoded or the cache recorded a failure. A failed key is
   * never requested again, so a broken reference costs one request per cache.
   * @param key - the scene's image key (`dataURL || original`).
   * @param onSettled - repaint callback.
   */
  request(key: string, onSettled: () => void): void {
    if (key === '' || this.images.has(key) || this.images.failedKeys.has(key) || this.pending.has(key)) return
    this.pending.add(key)
    const image = new Image()
    image.onload = () => {
      this.pending.delete(key)
      this.images.set(key, image)
      onSettled()
    }
    image.onerror = () => {
      this.pending.delete(key)
      this.images.failedKeys.add(key)
      onSettled()
    }
    image.src = key.startsWith('data:') || /^https?:/i.test(key) ? key : purAssetUrl(key)
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
