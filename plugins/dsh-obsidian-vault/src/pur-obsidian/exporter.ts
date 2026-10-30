/**
 * Export flows of the Obsidian adapter: save-as `.PurStudio`, Markdown
 * outline, PNG/JPG bitmaps, JSON Canvas and generated code. Files land in the
 * vault under `收件箱` (exports) and `Pur画布` (save-as), mirroring upstream.
 * @module dsh-obsidian-vault/pur-obsidian/exporter
 */
import { Modal, Notice, TFile, normalizePath } from 'obsidian'
import type { App } from 'obsidian'
import {
  buildExportOutline,
  buildPipeline,
  buildSelectedTextExport,
  drawScene,
  elementsToJsonCanvas,
  renderJavaScript,
  renderPython,
  serializeStudioDocument,
} from '../pur-kernel/index.ts'
import type { PurElement, PurRenderPreferences, PurStudioDocument } from '../pur-kernel/index.ts'
import type { PurLabelBundles } from '../client/i18n/pur-labels.ts'

/** What the export flows need from the view. */
export interface PurExporterHost {
  /** The application. */
  app: App
  /** Dictionary reader for notices and prompts. */
  read: (key: string) => string
  /** Localized label bundles. */
  labels: PurLabelBundles
  /** The current canvas file basename, when saved. @returns the basename. */
  fileName(): string | undefined
  /** Top-level elements. @returns the elements. */
  elements(): readonly PurElement[]
  /** The selection. @returns selected ids. */
  selectedIds(): ReadonlySet<string>
  /** Decoded images keyed by `dataURL || original`. @returns the cache. */
  images(): ReadonlyMap<string, CanvasImageSource>
  /** Resolved colours and grid toggle. @returns the preferences. */
  preferences(): PurRenderPreferences
}

/** Vault folders exports land in, mirroring upstream. */
const EXPORT_DIR = '收件箱'
const STUDIO_DIR = 'Pur画布'

/** One-line modal text prompt, resolved on confirm and nulled on dismiss. */
class TextPrompt extends Modal {
  private resolve: (value: string | null) => void = () => undefined
  private settled = false

  /**
   * Create the prompt.
   * @param app - the application.
   * @param title - the heading text.
   * @param initial - the initial input value.
   * @param confirm - the confirm button text.
   */
  public constructor(
    app: App,
    private readonly title: string,
    private readonly initial: string,
    private readonly confirm: string,
  ) {
    super(app)
  }

  /** Open the modal and await its result. @returns the trimmed text, or null when dismissed. */
  public prompt(): Promise<string | null> {
    return new Promise((resolve) => {
      this.resolve = resolve
      this.open()
    })
  }

  /** Build the input row. */
  public override onOpen(): void {
    const { contentEl } = this
    const heading = contentEl.ownerDocument.createElement('h3')
    heading.textContent = this.title
    const input = contentEl.ownerDocument.createElement('input')
    input.type = 'text'
    input.value = this.initial
    input.style.cssText = 'width:100%; box-sizing:border-box; margin:8px 0;'
    const button = contentEl.ownerDocument.createElement('button')
    button.textContent = this.confirm
    const settle = (value: string | null): void => {
      if (this.settled) return
      this.settled = true
      this.resolve(value)
      this.close()
    }
    button.addEventListener('click', () => settle(input.value.trim() === '' ? null : input.value.trim()))
    input.addEventListener('keydown', (event) => {
      event.stopPropagation()
      if (event.key === 'Enter') settle(input.value.trim() === '' ? null : input.value.trim())
      if (event.key === 'Escape') settle(null)
    })
    contentEl.append(heading, input, button)
    setTimeout(() => {
      input.focus()
      input.select()
    }, 50)
  }

  /** Resolve pending prompts on dismissal. */
  public override onClose(): void {
    this.contentEl.replaceChildren()
    if (!this.settled) {
      this.settled = true
      this.resolve(null)
    }
  }
}

/**
 * Ask for a file name through a modal prompt.
 * @param app - the application.
 * @param title - the heading text.
 * @param initial - the initial value.
 * @param confirm - the confirm button text.
 * @returns the trimmed name, or null when dismissed.
 */
export function promptText(app: App, title: string, initial: string, confirm: string): Promise<string | null> {
  return new TextPrompt(app, title, initial, confirm).prompt()
}

/** Strip characters vault file names cannot carry, mirroring upstream. */
function safeName(name: string): string {
  return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/\.+$/, '').trim()
}

/** Create the folder when absent. */
async function ensureFolder(app: App, path: string): Promise<void> {
  if (!(await app.vault.adapter.exists(path))) await app.vault.adapter.mkdir(path)
}

/** Pick a non-colliding vault path, appending `_N` like upstream. */
async function uniquePath(app: App, folder: string, name: string, extension: string): Promise<string> {
  let candidate = normalizePath(`${folder}/${name}.${extension}`)
  let counter = 1
  while (await app.vault.adapter.exists(candidate)) {
    candidate = normalizePath(`${folder}/${name}_${counter}.${extension}`)
    counter++
  }
  return candidate
}

/** Write text into the vault, creating or overwriting; reports failures. */
async function writeText(app: App, path: string, content: string, read: (key: string) => string): Promise<boolean> {
  try {
    const existing = app.vault.getAbstractFileByPath(path)
    if (existing instanceof TFile) await app.vault.modify(existing, content)
    else await app.vault.create(path, content)
    return true
  } catch {
    new Notice(read('pur.saveFailed'))
    return false
  }
}

/** Decode a `data:` URL into bytes. */
function dataURLToArrayBuffer(dataURL: string): ArrayBuffer {
  const base64 = dataURL.slice(dataURL.indexOf(',') + 1)
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index)
  return bytes.buffer
}

/** Notice the exported path, interpolating the dictionary template. */
function exportedNotice(host: PurExporterHost, path: string): void {
  new Notice(host.read('pur.exportedTo').replace('{path}', path))
}

/**
 * Save the document under a new `.PurStudio` name, prompting first. The
 * default name carries upstream's `_副本` suffix.
 * @param host - export context.
 * @param document - the current document.
 * @param adopt - called with the written file so the view rebinds to it.
 */
export async function savePur(host: PurExporterHost, document: PurStudioDocument, adopt: (file: TFile) => void): Promise<void> {
  const base = host.fileName()
  const initial = base === undefined || base === '' ? host.read('pur.newCanvasName') : base + host.read('pur.copySuffix')
  const name = await promptText(host.app, host.read('pur.saveAsPur'), initial, host.read('pur.confirm'))
  if (name === null) return
  await ensureFolder(host.app, STUDIO_DIR)
  const path = await uniquePath(host.app, STUDIO_DIR, safeName(name), 'PurStudio')
  if (!(await writeText(host.app, path, serializeStudioDocument(document), host.read))) return
  const file = host.app.vault.getAbstractFileByPath(path)
  if (file instanceof TFile) adopt(file)
  new Notice(host.read('pur.savedTo').replace('{path}', path))
}

/**
 * Create a fresh empty canvas under `Pur画布/`, mirroring upstream's
 * `createNewStudio`: no prompt, a localized fixed name with `_N` increments,
 * and a created notice.
 * @param app - the application.
 * @param read - dictionary reader for the name and notices.
 * @returns the written vault path, or null on failure.
 */
export async function createEmptyCanvas(app: App, read: (key: string) => string): Promise<string | null> {
  await ensureFolder(app, STUDIO_DIR)
  const path = await uniquePath(app, STUDIO_DIR, read('pur.newCanvasName'), 'PurStudio')
  const document: PurStudioDocument = { elements: [], viewState: { offsetX: 0, offsetY: 0, scale: 1 } }
  try {
    await app.vault.create(path, serializeStudioDocument(document))
  } catch {
    new Notice(read('pur.saveFailed'))
    return null
  }
  new Notice(read('pur.createdTo').replace('{path}', path))
  return path
}

/**
 * Export the canvas as a Markdown outline (or the selection's text/code).
 * @param host - export context.
 * @param selectedOnly - export only the selection's text and code.
 * @param promptName - prompt for the file name first.
 * @param fixedName - name override for the no-prompt command path, upstream's `customName`.
 */
export async function exportMarkdown(host: PurExporterHost, selectedOnly: boolean, promptName: boolean, fixedName?: string): Promise<void> {
  let content: string | null
  if (selectedOnly) {
    content = buildSelectedTextExport(host.elements(), host.selectedIds())
    if (content === null) {
      new Notice(host.read('pur.noExportContent'))
      return
    }
  } else {
    content = buildExportOutline(host.elements(), { title: host.fileName(), time: new Date().toLocaleString(), labels: host.labels.exportText })
  }
  let name = fixedName ?? host.fileName() ?? host.read('pur.untitled')
  if (promptName) {
    const asked = await promptText(host.app, host.read('pur.exportNamePrompt'), name, host.read('pur.confirm'))
    if (asked === null) return
    name = asked
  }
  await ensureFolder(host.app, EXPORT_DIR)
  const path = await uniquePath(host.app, EXPORT_DIR, safeName(name), 'md')
  if (await writeText(host.app, path, content, host.read)) exportedNotice(host, path)
}

/**
 * Export the canvas bounds as a bitmap, redrawing the scene offscreen.
 * @param host - export context.
 * @param format - the image format.
 */
export async function exportImage(host: PurExporterHost, format: 'png' | 'jpg'): Promise<void> {
  const elements = host.elements().filter((element) => element.type !== 'line')
  if (elements.length === 0) return
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const element of elements) {
    const x = element.x ?? 0
    const y = element.y ?? 0
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x + (element.w ?? 0))
    maxY = Math.max(maxY, y + (element.h ?? 0))
  }
  const padding = 20
  const width = maxX - minX + padding * 2
  const height = maxY - minY + padding * 2
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (ctx === null) return
  const preferences = host.preferences()
  drawScene(ctx, {
    elements,
    view: { offsetX: padding - minX, offsetY: padding - minY, scale: 1 },
    width,
    height,
    preferences: { ...preferences, backgroundColor: format === 'jpg' ? (preferences.backgroundColor === 'obsidian' || preferences.backgroundColor === 'transparent' ? '#1e1e1e' : preferences.backgroundColor) : 'transparent', showGrid: false },
    labels: host.labels.render,
    images: host.images(),
  })
  const dataURL = canvas.toDataURL(format === 'jpg' ? 'image/jpeg' : 'image/png', format === 'jpg' ? 0.9 : 1)
  await ensureFolder(host.app, EXPORT_DIR)
  const path = await uniquePath(host.app, EXPORT_DIR, safeName(host.fileName() ?? host.read('pur.untitled')), format)
  try {
    await host.app.vault.createBinary(path, dataURLToArrayBuffer(dataURL))
    exportedNotice(host, path)
  } catch {
    new Notice(host.read('pur.saveFailed'))
  }
}

/**
 * Export the elements as a JSON Canvas document.
 * @param host - export context.
 */
export async function exportCanvasDocument(host: PurExporterHost): Promise<void> {
  await ensureFolder(host.app, EXPORT_DIR)
  const path = await uniquePath(host.app, EXPORT_DIR, safeName(host.fileName() ?? host.read('pur.untitled')), 'canvas')
  const content = JSON.stringify(elementsToJsonCanvas(host.elements()), null, 2)
  if (await writeText(host.app, path, content, host.read)) exportedNotice(host, path)
}

/**
 * Generate runnable JavaScript or Python from the pipeline and write it to
 * the vault; pipeline failures surface as localized notices.
 * @param host - export context.
 * @param format - the target language.
 */
export async function generateCode(host: PurExporterHost, format: 'js' | 'py'): Promise<void> {
  const result = buildPipeline(host.elements())
  if (!result.ok) {
    new Notice(host.read(result.reason === 'no-code-nodes' ? 'pur.noCodeNodes' : 'pur.cycleError'))
    return
  }
  const time = new Date().toLocaleString()
  const header = host.labels.codegenCore.header(result.pipeline.nodes.length, result.pipeline.edges.length, time)
  const code =
    format === 'js'
      ? renderJavaScript(result.pipeline, host.labels.codegenCore, host.labels.codegenJs, header)
      : renderPython(result.pipeline, host.labels.codegenCore, host.labels.codegenPy, header)
  await ensureFolder(host.app, EXPORT_DIR)
  const path = await uniquePath(host.app, EXPORT_DIR, safeName(host.fileName() ?? host.read('pur.untitled')), format)
  if (await writeText(host.app, path, code, host.read)) exportedNotice(host, path)
}
