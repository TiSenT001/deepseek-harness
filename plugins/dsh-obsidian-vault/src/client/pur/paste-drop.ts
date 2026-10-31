/**
 * Paste, drop and URL-dialog glue for the React Pur pane: kernel classifiers
 * decide what a payload becomes, then the controller inserts it. Note
 * hydration reads the vault; local image files insert as data URLs without
 * touching the vault.
 * @module dsh-obsidian-vault/client/pur/paste-drop
 */
import {
  NOTE_RAW_OBSIDIAN_URI,
  NOTE_RAW_PATH,
  NOTE_RAW_WIKI,
  classifyDropText,
  classifyPasteText,
  classifyUrlInput,
  droppedFileTextSpec,
  screenToWorld,
} from '../../pur-kernel/index.ts'
import type { PurController, PurControllerEffect, PurMenuPoint, PurNoteRawOptions } from '../../pur-kernel/index.ts'
import type { PurNoteSummary } from './loader.ts'
import { storeImage } from '../api.ts'
import { thumbnailOf } from './loader.ts'

/** What the paste/drop flows need from the pane. */
export interface PurInsertDeps {
  /** Content of a dropped web link card. */
  readonly webLinkCard: string
  /** Resolve a link target to a note. */
  readonly resolveNote: (link: string) => Promise<PurNoteSummary | null>
  /** Drain controller effects into the pane's sink. */
  readonly run: (effects: readonly PurControllerEffect[]) => void
}

/** Video hosts and extensions, checked before web links like upstream. */
const VIDEO_URL = /(?:youtube\.com|youtu\.be|bilibili\.com|vimeo\.com)\//i

/**
 * Tell whether a URL points at a video page or file.
 * @param url - the URL.
 * @returns true for known video targets.
 */
export function isVideoUrl(url: string): boolean {
  return VIDEO_URL.test(url) || /\.(mp4|webm|mov)(\?.*)?$/i.test(url)
}

/**
 * Read a local file as a `data:` URL.
 * @param file - the dropped or picked file.
 * @returns the data URL.
 */
export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error(`cannot read ${file.name}`))
    reader.readAsDataURL(file)
  })
}

/**
 * Insert a note card hydrated from a vault note, falling back to a plain card
 * when the note cannot be read.
 * @param controller - the canvas controller.
 * @param at - insertion point in world coordinates.
 * @param link - the raw link the card opens when unresolved.
 * @param fallback - card text when no note resolves.
 * @param options - the hydration variant.
 * @param deps - vault access and effect drain.
 */
async function insertNote(controller: PurController, at: PurMenuPoint, link: string, fallback: string, options: PurNoteRawOptions, deps: PurInsertDeps): Promise<void> {
  const note = await deps.resolveNote(link)
  if (note === null) {
    deps.run(controller.insertNoteLink(at.x, at.y, link, fallback))
    return
  }
  deps.run(controller.insertNoteLink(at.x, at.y, note.path, note.title === '' ? fallback : note.title, note.content, options))
}

/**
 * Handle a clipboard paste: kernel classification, then insertion at the
 * canvas centre. Clipboard images decode into data-URL image cards.
 * @param controller - the canvas controller.
 * @param event - the paste event.
 * @param deps - vault access and effect drain.
 */
export function pasteIntoCanvas(controller: PurController, event: ClipboardEvent, deps: PurInsertDeps): void {
  const data = event.clipboardData
  if (data === null) return
  const text = data.getData('text/plain').trim()
  const imageItem = Array.from(data.items).find((item) => item.type.startsWith('image/'))
  if (text === '' && imageItem === undefined) return
  event.preventDefault()
  const at = controller.canvasCentreWorld()
  const spec = classifyPasteText(text, imageItem !== undefined)
  switch (spec.kind) {
    case 'image-url':
      deps.run(controller.insertImage(at.x, at.y, spec.url))
      return
    case 'fetch-url':
      deps.run(controller.insertNoteLink(at.x, at.y, spec.url, deps.webLinkCard))
      return
    case 'note-link':
      void insertNote(controller, at, spec.link, spec.content, NOTE_RAW_WIKI, deps)
      return
    case 'text':
      deps.run(controller.insertText(at.x, at.y, spec.content, { w: spec.w, h: spec.h, bgColor: spec.bgColor }))
      return
    case 'clipboard-image': {
      const file = imageItem?.getAsFile()
      if (file == null) return
      void insertStoredImage(controller, file, at.x, at.y, deps)
      return
    }
    case 'none':
      return
  }
}

/**
 * Handle a drop: local files first (images as data-URL cards, text files as
 * text cards), otherwise the kernel-classified string payload.
 * @param controller - the canvas controller.
 * @param event - the drop event.
 * @param deps - vault access and effect drain.
 */
export function dropIntoCanvas(controller: PurController, event: DragEvent, deps: PurInsertDeps): void {
  event.preventDefault()
  const data = event.dataTransfer
  if (data === null) return
  const rect = event.currentTarget instanceof HTMLElement ? event.currentTarget.getBoundingClientRect() : { left: 0, top: 0 }
  const at = screenToWorld(controller.state.view, event.clientX - rect.left, event.clientY - rect.top)
  const files = Array.from(data.files)
  if (files.length > 0) {
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        void insertStoredImage(controller, file, at.x, at.y, deps)
      } else {
        void file.text().then((text) => deps.run(controller.insertText(at.x, at.y, text, droppedFileTextSpec(text))))
      }
    }
    return
  }
  const spec = classifyDropText({ uriList: data.getData('text/uri-list'), html: data.getData('text/html'), plainText: data.getData('text/plain') }, isVideoUrl)
  switch (spec.kind) {
    case 'obsidian-note':
      void insertNote(controller, at, spec.fileParam, spec.fileParam, NOTE_RAW_OBSIDIAN_URI, deps)
      return
    case 'path-note':
      void insertNote(controller, at, spec.fileName, spec.fileName, NOTE_RAW_PATH, deps)
      return
    case 'wiki-note':
      void insertNote(controller, at, spec.linkText, spec.linkText, NOTE_RAW_WIKI, deps)
      return
    case 'image-url':
      deps.run(controller.insertImage(at.x, at.y, spec.url))
      return
    case 'video-url':
    case 'web-url':
      deps.run(controller.insertNoteLink(at.x, at.y, spec.url, deps.webLinkCard))
      return
    case 'text':
      deps.run(controller.insertText(at.x, at.y, spec.text, { w: spec.w, h: spec.h, bgColor: spec.bgColor }))
      return
    case 'none':
      return
  }
}

/**
 * Insert the URL dialog's committed text at a point.
 * @param controller - the canvas controller.
 * @param at - insertion point in world coordinates.
 * @param value - the committed text.
 * @param deps - vault access and effect drain.
 */
export function insertUrlInput(controller: PurController, at: PurMenuPoint, value: string, deps: PurInsertDeps): void {
  const spec = classifyUrlInput(value)
  switch (spec.kind) {
    case 'image-url':
      deps.run(controller.insertImage(at.x, at.y, spec.url))
      return
    case 'web-url':
      deps.run(controller.insertNoteLink(at.x, at.y, spec.url, deps.webLinkCard))
      return
    case 'text':
      deps.run(controller.insertText(at.x, at.y, spec.text, { w: spec.w, h: spec.h, bgColor: spec.bgColor }))
      return
    default:
      return
  }
}
/**
 * Insert one local image: store the bytes in the vault and reference the path,
 * falling back to an inline data URL when the host has no store endpoint.
 * @param controller - the canvas controller.
 * @param file - the pasted or dropped image file.
 * @param x - world x. @param y - world y.
 * @param deps - effect drain.
 */
async function insertStoredImage(
  controller: PurController,
  file: File,
  x: number,
  y: number,
  deps: PurInsertDeps,
): Promise<void> {
  const dataURL = await fileToDataURL(file)
  const path = await storeImage(file.name, dataURL).catch(() => '')
  // A small copy keeps a zoomed-out board readable without decoding every
  // original at full resolution.
  const thumbData = await thumbnailOf(dataURL).catch(() => null)
  const thumb = thumbData === null ? '' : await storeImage(`${file.name}-thumb`, thumbData).catch(() => '')
  const thumbRef = thumb.length === 0 ? undefined : thumb
  deps.run(path.length === 0
    ? controller.insertImage(x, y, '', dataURL, thumbRef)
    : controller.insertImage(x, y, path, undefined, thumbRef))
}
