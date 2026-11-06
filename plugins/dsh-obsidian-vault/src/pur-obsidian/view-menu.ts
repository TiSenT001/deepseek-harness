/**
 * The view's menu host: note picking through a `FuzzySuggestModal`, creation
 * of fresh canvases under `Pur画布/`, exports through the exporter, imports
 * through the paste/drop flows, and link navigation. Popout, pin-top and
 * embed degrade to a localized unsupported notice.
 * @module dsh-obsidian-vault/pur-obsidian/view-menu
 */
import { FuzzySuggestModal, Notice } from 'obsidian'
import type { App, TFile } from 'obsidian'
import { NOTE_RAW_PICKER, executeEffects } from '../pur-kernel/index.ts'
import type {
  PurController,
  PurEffectSink,
  PurElement,
  PurMenuHost,
  PurMenuPoint,
  PurOpenDestination,
} from '../pur-kernel/index.ts'
import type { PurLabelBundles } from '../client/i18n/pur-labels.ts'
import { createEmptyCanvas, exportCanvasDocument, exportImage, exportMarkdown, generateCode, savePur } from './exporter.ts'
import type { PurExporterHost } from './exporter.ts'
import { importFromUrl, importLocalImage, importStructuredFile, insertVaultNote } from './paste-drop.ts'
import type { PurInsertHost } from './paste-drop.ts'

/**
 * View type id the plugin registers. Distinct from upstream's `pur-studio` so
 * both plugins can load at once; a shared id would let load order decide which
 * one owns every open canvas leaf.
 */
export const PUR_VIEW_TYPE = 'dsh-pur-studio'

/** Which element editor an open request targets. */
export type PurViewEditorKind = 'text' | 'group' | 'line' | 'note-link'

/** What the menu host reads from the view, resolved at dispatch time. */
export interface PurMenuDeps {
  /** The application. */
  readonly app: App
  /** The canvas controller. @returns the controller. */
  controller(): PurController
  /** The effect sink. @returns the sink. */
  sink(): PurEffectSink
  /** Localized label bundles. @returns the bundles. */
  labels(): PurLabelBundles
  /** Dictionary reader. @param key - the `pur.*` key. @returns the copy. */
  read(key: string): string
  /** Insert context for the paste/drop flows. @returns the host. */
  insertHost(): PurInsertHost
  /** Export context for the exporter flows. @returns the host. */
  exporterHost(): PurExporterHost
  /** Vault path of the open document, for link resolution. @returns the path, or ''. */
  sourcePath(): string
  /** Rebind the view to a freshly saved document file. @param file - the written file. */
  adoptFile(file: TFile): void
  /** Open an element editor overlay. @param kind - the editor. @param id - the element id. */
  openEditor(kind: PurViewEditorKind, id: string): void
  /** Open a vault canvas file in a new tab. @param path - vault-relative path. */
  openFile(path: string): void
}

/** A markdown-note picker that resolves the chosen path, or null on dismiss. */
class NotePicker extends FuzzySuggestModal<string> {
  private resolve: (path: string | null) => void = () => undefined
  private settled = false

  /** Open the picker and await its result. @returns the chosen path, or null. */
  public prompt(): Promise<string | null> {
    return new Promise((resolve) => {
      this.resolve = resolve
      this.open()
    })
  }

  /** The vault's markdown paths. @returns the candidates. */
  public getItems(): string[] {
    return this.app.vault.getFiles().filter((file) => file.extension === 'md').map((file) => file.path)
  }

  /** The row text of one candidate. @param item - the path. @returns the text. */
  public getItemText(item: string): string {
    return item
  }

  /** Settle with the chosen path. @param item - the chosen path. */
  public onChooseItem(item: string): void {
    this.settled = true
    this.resolve(item)
  }

  /** Settle with null when dismissed without a choice. */
  public override onClose(): void {
    if (!this.settled) {
      this.settled = true
      this.resolve(null)
    }
  }
}

/** Open the note picker. @param app - the application. @returns the chosen path, or null. */
function pickNote(app: App): Promise<string | null> {
  return new NotePicker(app).prompt()
}

/** Create a fresh empty canvas and open it, upstream's prompt-free flow. */
async function newCanvasFlow(deps: PurMenuDeps): Promise<void> {
  const path = await createEmptyCanvas(deps.app, deps.read)
  if (path !== null) deps.openFile(path)
}

/** Pick a note and insert it as a hydrated note-link card at the point. */
async function insertPickedNote(deps: PurMenuDeps, at: PurMenuPoint): Promise<void> {
  const picked = await pickNote(deps.app)
  if (picked === null) return
  const title = picked.replace(/\.md$/i, '').split('/').pop() ?? picked
  await insertVaultNote(deps.insertHost(), at, picked, title, NOTE_RAW_PICKER)
}

/** Open a link target: URLs in the browser, vault links in the workspace. */
function openViewLink(deps: PurMenuDeps, target: string, destination: PurOpenDestination): void {
  if (/^https?:/i.test(target)) {
    window.open(target, '_blank', 'noopener')
    return
  }
  void deps.app.workspace.openLinkText(target, deps.sourcePath(), destination === 'current' ? false : destination === 'new-tab' ? 'tab' : 'split')
}

/** The link an element exposes, when it has one. */
function elementLink(element: PurElement): string {
  if (element.type === 'note-link') return element.link
  if (element.type === 'image') return element.link ?? element.original
  if (element.type === 'group') return element.link ?? ''
  return ''
}

/** Copy the element's link or image source to the clipboard. */
function copyLinkOf(deps: PurMenuDeps, element: PurElement): void {
  const text = elementLink(element)
  if (text === '') return
  void navigator.clipboard.writeText(text).then(() => new Notice(deps.read('pur.copied')))
}

/** Reveal the element's vault target in the OS file explorer. */
function revealInExplorer(deps: PurMenuDeps, element: PurElement): void {
  const target = elementLink(element)
  const show = deps.app.showInFolder
  if (target === '' || /^https?:/i.test(target) || show === undefined) {
    new Notice(deps.read('pur.unsupportedFeature'))
    return
  }
  void show(target)
}

/** Pick a note and link the element to it, upstream's link-note flow. */
async function linkPickedElement(deps: PurMenuDeps, element: PurElement): Promise<void> {
  const picked = await pickNote(deps.app)
  if (picked === null) return
  executeEffects(deps.controller().updateElement(element.id, { link: picked }), deps.sink())
  new Notice(deps.read(element.type === 'group' ? 'pur.groupLinked' : 'pur.linkedNotice'))
}

/**
 * Create the view's menu host.
 * @param deps - view context, read at dispatch time.
 * @returns host operations for menu ids the kernel cannot perform.
 */
export function createViewMenuHost(deps: () => PurMenuDeps): PurMenuHost {
  const unsupported = (): void => {
    new Notice(deps().read('pur.unsupportedFeature'))
  }
  return {
    presetTitle: (presetId) => deps().read(`pur.preset.${presetId}`),
    runAllNodes: () => new Notice('Run node needs the DSH pane'),
    newCanvas: () => void newCanvasFlow(deps()),
    addNoteLink: (at) => void insertPickedNote(deps(), at),
    importLocal: (at) => importLocalImage(deps().insertHost(), at),
    importIr: (at) => importStructuredFile(deps().insertHost(), at, 'ir'),
    importCanvas: (at) => importStructuredFile(deps().insertHost(), at, 'canvas'),
    importNet: (at) => void importFromUrl(deps().insertHost(), at),
    savePur: () => {
      const d = deps()
      const controller = d.controller()
      void savePur(d.exporterHost(), { elements: controller.state.elements, viewState: controller.state.view }, (file) => d.adoptFile(file))
    },
    exportMarkdown: () => void exportMarkdown(deps().exporterHost(), false, true),
    generateCode: (format) => void generateCode(deps().exporterHost(), format),
    exportImage: (format) => void exportImage(deps().exporterHost(), format),
    exportCanvasDocument: () => void exportCanvasDocument(deps().exporterHost()),
    togglePopout: unsupported,
    togglePinTop: unsupported,
      importPurAsCanvas: (at) => {
    deps().read('pur.importPurUnsupported')
    void at
  },
  importPur: (at) => {
      // The Obsidian adapter reuses the same import flow as the web client.
      void at
      deps().read('pur.importPurUnsupported')
    },
    insertCodeSnippet: (id, at) => {
      deps().read('pur.snippetUnsupported')
      void id
      void at
    },
    deleteCodeSnippet: (id) => {
      deps().read('pur.snippetUnsupported')
      void id
    },
    saveCodeSnippet: (elementId) => {
      deps().read('pur.snippetUnsupported')
      void elementId
    },
  openFileWith: (target, program) => {
      // Obsidian owns the desktop side, so the fixed list collapses to its opener.
      void program
      const file = deps().app.vault.getAbstractFileByPath(target)
      if (file === null) return
      // Public API, but the shipped typings still omit it.
      const opener = deps().app as App & { openWithDefaultApp?: (path: string) => void }
      opener.openWithDefaultApp?.(file.path)
    },
  openAsset: (id) => {
      void id
      new Notice(deps().read('pur.unsupportedFeature'))
    },
    openEmbeddingNote: (element) => openEmbeddingNoteIn(deps(), element),
    openLink: (target, destination) => openViewLink(deps(), target, destination),
    copyLinkOf: (element) => copyLinkOf(deps(), element),
    revealInExplorer: (element) => revealInExplorer(deps(), element),
    embedInActiveNote: unsupported,
    promptElementLink: (element) => void linkPickedElement(deps(), element),
    editText: (id) => deps().openEditor('text', id),
    editGroup: (id) => deps().openEditor('group', id),
    editLine: (id) => deps().openEditor('line', id),
    editNoteLink: (id) => deps().openEditor('note-link', id),
  }
}


/**
 * Open the note that embeds one canvas image, when the vault has one. Obsidian
 * does not index `.PurStudio` files, so this walks markdown links for the image
 * name and opens the first match.
 * @param deps - menu host context with the app handle.
 * @param element - the image element the menu was opened on.
 */
/**
 * Reverse lookup is only implemented in the DSH pane: Obsidian's metadata index
 * does not see .PurStudio files, so nothing here can name the embedding note.
 * @param deps - menu host context (unused).
 * @param element - the image element (unused).
 */
function openEmbeddingNoteIn(deps: PurMenuDeps, element: PurElement): void {
  void deps
  void element
}
