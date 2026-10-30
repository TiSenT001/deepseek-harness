/**
 * Paste, drop and import glue: classify payloads through the kernel, read
 * vault notes for hydration, store imported files in the vault, then insert
 * through the controller. The adapter owns all vault and network access.
 * @module dsh-obsidian-vault/pur-obsidian/paste-drop
 */
import { Notice, TFile, requestUrl } from 'obsidian'
import type { App } from 'obsidian'
import {
  NOTE_RAW_OBSIDIAN_URI,
  NOTE_RAW_PATH,
  NOTE_RAW_PICKER,
  NOTE_RAW_WIKI,
  classifyDropText,
  classifyPasteText,
  classifyUrlInput,
  droppedFileTextSpec,
  executeEffects,
  irToElements,
  jsonCanvasToElements,
  parseSimpleYAML,
  pushHistory,
} from '../pur-kernel/index.ts'
import type { PurController, PurControllerEffect, PurEffectSink, PurMenuPoint, PurNoteRawOptions } from '../pur-kernel/index.ts'
import { promptText } from './exporter.ts'

/** What insert flows need from the view. */
export interface PurInsertHost {
  /** The application. */
  app: App
  /** The canvas controller. */
  controller: PurController
  /** Effect sink the inserts drain into. */
  sink: PurEffectSink
  /** Dictionary reader for card content and notices. */
  read: (key: string) => string
  /** Element id source, the one the controller env uses. */
  createId: () => string
}

/** Vault folder imported media lands in, mirroring upstream. */
const ATTACHMENT_DIR = '附件'

/** Video hosts upstream downloads; here they degrade to fetched link cards. */
const VIDEO_URL = /^https?:\/\/(www\.)?(bilibili\.com|youtube\.com|youtu\.be|vimeo\.com|b23\.tv)/i

/** Drain effects through the host sink. */
function apply(host: PurInsertHost, effects: PurControllerEffect[]): void {
  executeEffects(effects, host.sink)
}

/**
 * Read a vault note's raw text, resolving the `.md` suffix when missing.
 * @param app - the application.
 * @param link - note path or basename the card links to.
 * @returns the raw text, or undefined when unreadable.
 */
export async function readNoteRaw(app: App, link: string): Promise<string | undefined> {
  const entry = app.vault.getAbstractFileByPath(link) ?? app.vault.getAbstractFileByPath(`${link}.md`)
  if (!(entry instanceof TFile)) return undefined
  try {
    return await app.vault.read(entry)
  } catch {
    return undefined
  }
}

/**
 * Insert a hydrated note-link card at the point.
 * @param host - insert context.
 * @param world - insertion point in world coordinates.
 * @param link - the link target the card opens.
 * @param content - the card's display text.
 * @param options - the hydration variant.
 * @param size - card size override.
 */
export async function insertVaultNote(host: PurInsertHost, world: PurMenuPoint, link: string, content: string, options: PurNoteRawOptions, size?: { w: number; h: number }): Promise<void> {
  const raw = await readNoteRaw(host.app, link)
  apply(host, host.controller.insertNoteLink(world.x, world.y, link, content, raw, options, size))
}

/** Write a dropped or picked file into the vault, returning its path. */
async function storeFile(host: PurInsertHost, file: File): Promise<string | null> {
  try {
    if (!(await host.app.vault.adapter.exists(ATTACHMENT_DIR))) await host.app.vault.adapter.mkdir(ATTACHMENT_DIR)
    const safe = file.name.replace(/[<>:"/\\|?*]/g, '_') || 'image.png'
    let path = `${ATTACHMENT_DIR}/${safe}`
    let counter = 1
    while (await host.app.vault.adapter.exists(path)) {
      path = `${ATTACHMENT_DIR}/${safe.replace(/(\.[^.]*)?$/, `_${counter}$1`)}`
      counter++
    }
    await host.app.vault.createBinary(path, await file.arrayBuffer())
    return path
  } catch {
    new Notice(host.read('pur.importFailed'))
    return null
  }
}

/** Fetch a URL and insert its text as a card; failure degrades to a link card. */
async function insertFetchedUrl(host: PurInsertHost, world: PurMenuPoint, url: string): Promise<void> {
  try {
    const response = await requestUrl({ url })
    const doc = new DOMParser().parseFromString(response.text, 'text/html')
    doc.querySelectorAll('script, style, noscript, nav, footer, header, svg').forEach((node) => node.remove())
    const text = (doc.body.textContent ?? '').replace(/\n\s*\n/g, '\n\n').trim().slice(0, 1500)
    if (text === '') throw new Error('empty page')
    const content = `${url}\n\n${text}`
    apply(host, host.controller.insertText(world.x, world.y, content, { w: 480, h: Math.min(400, Math.max(80, content.split('\n').length * 22 + 20)), bgColor: 'rgba(35,35,40,0.85)' }))
  } catch {
    apply(host, host.controller.insertNoteLink(world.x, world.y, url, host.read('pur.webLinkCard')))
  }
}

/**
 * Handle a clipboard paste at the canvas centre, in upstream's precedence
 * order: image URL, fetched URL, wikilink, plain text, clipboard image file.
 * @param host - insert context.
 * @param event - the paste event.
 * @param world - insertion point in world coordinates.
 */
export async function handlePaste(host: PurInsertHost, event: ClipboardEvent, world: PurMenuPoint): Promise<void> {
  const data = event.clipboardData
  if (data === null) return
  const firstItemIsImage = data.items[0]?.type.includes('image') === true
  const text = data.getData('text/plain').trim()
  const spec = classifyPasteText(text, firstItemIsImage)
  if (spec.kind === 'none') return
  event.preventDefault()
  if (spec.kind === 'image-url') apply(host, host.controller.insertImage(world.x, world.y, spec.url))
  else if (spec.kind === 'fetch-url') await insertFetchedUrl(host, world, spec.url)
  else if (spec.kind === 'note-link') await insertVaultNote(host, world, spec.link, spec.content, NOTE_RAW_PICKER, { w: spec.w, h: spec.h })
  else if (spec.kind === 'text') apply(host, host.controller.insertText(world.x, world.y, spec.content, { w: spec.w, h: spec.h, bgColor: spec.bgColor }))
  else {
    const file = data.items[0]?.getAsFile()
    if (file == null) return
    const path = await storeFile(host, file)
    if (path !== null) apply(host, host.controller.insertImage(world.x, world.y, path))
  }
}

/**
 * Handle a drop on the canvas: files first (images into the vault, text files
 * as cards), then Obsidian URIs, note paths, wikilinks, image URLs, web URLs
 * and plain text.
 * @param host - insert context.
 * @param event - the drop event.
 * @param world - insertion point in world coordinates.
 */
export async function handleDrop(host: PurInsertHost, event: DragEvent, world: PurMenuPoint): Promise<void> {
  const data = event.dataTransfer
  if (data === null) return
  event.preventDefault()
  for (const file of data.files) {
    if (file.type.startsWith('image/')) {
      const path = await storeFile(host, file)
      if (path !== null) apply(host, host.controller.insertImage(world.x, world.y, path))
    } else {
      const text = await file.text()
      apply(host, host.controller.insertText(world.x, world.y, text, droppedFileTextSpec(text)))
    }
    return
  }
  const spec = classifyDropText(
    { uriList: data.getData('text/uri-list'), html: data.getData('text/html'), plainText: data.getData('text/plain') },
    (url) => VIDEO_URL.test(url),
  )
  if (spec.kind === 'none') return
  if (spec.kind === 'obsidian-note') await insertVaultNote(host, world, spec.fileParam, spec.fileParam, NOTE_RAW_OBSIDIAN_URI)
  else if (spec.kind === 'path-note') await insertVaultNote(host, world, spec.fileName, spec.fileName, NOTE_RAW_PATH)
  else if (spec.kind === 'wiki-note') await insertVaultNote(host, world, spec.linkText, spec.linkText, NOTE_RAW_WIKI)
  else if (spec.kind === 'image-url') apply(host, host.controller.insertImage(world.x, world.y, spec.url))
  else if (spec.kind === 'video-url' || spec.kind === 'web-url') await insertFetchedUrl(host, world, spec.url)
  else apply(host, host.controller.insertText(world.x, world.y, spec.text, { w: spec.w, h: spec.h, bgColor: spec.bgColor }))
}

/** Push imported elements into the document with one history snapshot. */
function insertElements(host: PurInsertHost, elements: readonly import('../pur-kernel/index.ts').PurElement[]): void {
  host.controller.state.elements.push(...elements)
  pushHistory(host.controller.history, host.controller.state.elements)
  apply(host, [{ type: 'save' }, { type: 'render' }])
}

/** Open an OS file picker and run the chosen file through `consume`. */
function pickFile(host: PurInsertHost, accept: string, consume: (file: File) => Promise<void>): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = accept
  input.style.display = 'none'
  input.addEventListener('change', () => {
    const file = input.files?.[0]
    input.remove()
    if (file !== undefined) void consume(file)
  })
  document.body.appendChild(input)
  input.click()
}

/**
 * Import a local image through the OS file picker into the vault.
 * @param host - insert context.
 * @param world - insertion point in world coordinates.
 */
export function importLocalImage(host: PurInsertHost, world: PurMenuPoint): void {
  pickFile(host, 'image/*', async (file) => {
    const path = await storeFile(host, file)
    if (path !== null) apply(host, host.controller.insertImage(world.x, world.y, path))
  })
}

/**
 * Import a `.canvas` or YAML/IR document through the OS file picker.
 * @param host - insert context.
 * @param world - insertion point in world coordinates.
 * @param kind - which parser to run.
 */
export function importStructuredFile(host: PurInsertHost, world: PurMenuPoint, kind: 'ir' | 'canvas'): void {
  pickFile(host, kind === 'canvas' ? '.canvas' : '.yaml,.yml,.json', async (file) => {
    try {
      const text = await file.text()
      if (kind === 'canvas') insertElements(host, jsonCanvasToElements(JSON.parse(text)))
      else {
        const groups = irToElements(parseSimpleYAML(text), world.x, world.y, { createId: host.createId })
        if (groups !== null) insertElements(host, groups)
      }
    } catch {
      new Notice(host.read('pur.importFailed'))
    }
  })
}

/**
 * Prompt for a URL or text and insert it, the import-net menu flow.
 * @param host - insert context.
 * @param world - insertion point in world coordinates.
 */
export async function importFromUrl(host: PurInsertHost, world: PurMenuPoint): Promise<void> {
  const value = await promptText(host.app, host.read('pur.importNet'), '', host.read('pur.confirm'))
  if (value === null) return
  const spec = classifyUrlInput(value)
  if (spec.kind === 'image-url') apply(host, host.controller.insertImage(world.x, world.y, spec.url))
  else if (spec.kind === 'web-url' || spec.kind === 'video-url') await insertFetchedUrl(host, world, spec.url)
  else if (spec.kind === 'text') apply(host, host.controller.insertText(world.x, world.y, spec.text, { w: spec.w, h: spec.h, bgColor: spec.bgColor }))
}
