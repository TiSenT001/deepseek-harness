/**
 * Shared Obsidian export plumbing: the host contract, the vault folders
 * exports land in, the name prompt, path helpers and the write/report helpers
 * every export flow uses.
 * @module dsh-obsidian-vault/pur-obsidian/exporter-host
 */
import { Modal, Notice, TFile, normalizePath } from 'obsidian'
import type { App } from 'obsidian'
import type { PurElement, PurRenderPreferences } from '../pur-kernel/index.ts'
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
export const EXPORT_DIR = '收件箱'
export const STUDIO_DIR = 'Pur画布'

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

/**
 * Strip characters vault file names cannot carry, mirroring upstream.
 * @param name - the requested name.
 * @returns the sanitized name.
 */
export function safeName(name: string): string {
  return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/\.+$/, '').trim()
}

/**
 * Create the folder when absent.
 * @param app - the application.
 * @param path - vault-relative folder path.
 */
export async function ensureFolder(app: App, path: string): Promise<void> {
  if (!(await app.vault.adapter.exists(path))) await app.vault.adapter.mkdir(path)
}

/**
 * Pick a non-colliding vault path, appending `_N` like upstream.
 * @param app - the application.
 * @param folder - vault-relative folder.
 * @param name - sanitized base name.
 * @param extension - file extension without the dot.
 * @returns the free path.
 */
export async function uniquePath(app: App, folder: string, name: string, extension: string): Promise<string> {
  let candidate = normalizePath(`${folder}/${name}.${extension}`)
  let counter = 1
  while (await app.vault.adapter.exists(candidate)) {
    candidate = normalizePath(`${folder}/${name}_${counter}.${extension}`)
    counter++
  }
  return candidate
}

/**
 * Write text into the vault, creating or overwriting; reports failures.
 * @param app - the application.
 * @param path - vault-relative path.
 * @param content - the text to write.
 * @param read - dictionary reader for the failure notice.
 * @returns whether the write succeeded.
 */
export async function writeText(app: App, path: string, content: string, read: (key: string) => string): Promise<boolean> {
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

/**
 * Decode a `data:` URL into bytes.
 * @param dataURL - the data URL.
 * @returns the decoded buffer.
 */
export function dataURLToArrayBuffer(dataURL: string): ArrayBuffer {
  const base64 = dataURL.slice(dataURL.indexOf(',') + 1)
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index)
  return bytes.buffer
}

/**
 * Notice the exported path, interpolating the dictionary template.
 * @param host - export context.
 * @param path - the written vault path.
 */
export function exportedNotice(host: PurExporterHost, path: string): void {
  new Notice(host.read('pur.exportedTo').replace('{path}', path))
}
