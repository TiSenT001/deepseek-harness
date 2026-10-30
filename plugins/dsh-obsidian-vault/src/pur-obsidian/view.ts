/**
 * The Obsidian canvas view: an `ItemView` hosting the kernel controller,
 * loading and saving `.PurStudio` documents through the vault, rehydrating on
 * external writes, and delegating painting, events, menus and editors to the
 * sibling modules. A fileless view persists into the plugin settings,
 * upstream's fallback persistence.
 * @module dsh-obsidian-vault/pur-obsidian/view
 */
import { ItemView, Notice, TFile } from 'obsidian'
import type { EventRef, TAbstractFile, WorkspaceLeaf } from 'obsidian'
import { PurController, createElementId, executeEffects, parseStudioDocument, serializeStudioDocument } from '../pur-kernel/index.ts'
import type { PurControllerEffect, PurControllerEnv, PurEffectSink, PurMenuHost, PurRenderPreferences, PurStudioDocument } from '../pur-kernel/index.ts'
import type { PurLabelBundles } from '../client/i18n/pur-labels.ts'
import { labelsFor, readerFor } from './labels.ts'
import type { PurSettings } from './settings.ts'
import { PUR_VIEW_TYPE, createViewMenuHost } from './view-menu.ts'
import { wirePurCanvas } from './view-events.ts'
import { createViewSink, viewMenuDeps } from './view-hosts.ts'
import { PurCanvasPainter } from './view-paint.ts'

/** What the view needs from the plugin. */
export interface PurStudioHost {
  /** Current plugin settings; the fileless canvas writes back into them. */
  readonly settings: PurSettings
  /** Persist the mutated settings. @returns completion. */
  saveSettings(): Promise<void>
}

/** The `.PurStudio` canvas view. */
export class PurStudioView extends ItemView {
  /** Localized label bundles, fixed at construction from the settings. */
  public readonly labels: PurLabelBundles
  /** Flat dictionary reader for notices and dialog copy. */
  public readonly read: (key: string) => string
  /** The effect sink kernel effects drain into. */
  public readonly sink: PurEffectSink
  /** Host operations menu entries dispatch to. */
  public readonly menuHost: PurMenuHost
  private readonly pluginHost: PurStudioHost
  private readonly env: PurControllerEnv
  private readonly painter: PurCanvasPainter
  private file: TFile | null = null
  private controller: PurController | null = null
  private canvas: HTMLCanvasElement | null = null
  private surface: HTMLElement | null = null
  private dialogs = 0
  private saving = false
  private saveTimer: number | null = null
  private modifyRef: EventRef | null = null

  /**
   * Create the view.
   * @param leaf - the hosting leaf.
   * @param pluginHost - settings owner and persister; the plugin instance.
   */
  public constructor(leaf: WorkspaceLeaf, pluginHost: PurStudioHost) {
    super(leaf)
    this.pluginHost = pluginHost
    this.labels = labelsFor(pluginHost.settings.preferences.lang)
    this.read = readerFor(pluginHost.settings.preferences.lang)
    this.env = { canvasWidth: 1, canvasHeight: 1, createId: createElementId, now: () => Date.now(), hasOpenDialog: () => this.dialogs > 0 }
    this.painter = new PurCanvasPainter(this.app, this.env, {
      controller: () => this.controller,
      preferences: () => this.preferences(),
      labels: () => this.labels.render,
    })
    this.sink = createViewSink(this)
    this.menuHost = createViewMenuHost(() => viewMenuDeps(this))
  }

  /** The view type id. @returns the id. */
  public override getViewType(): string {
    return PUR_VIEW_TYPE
  }

  /** The tab title: the file basename, or the untitled fallback. @returns the title. */
  public override getDisplayText(): string {
    return this.file?.basename ?? this.read('pur.untitled')
  }

  /** The tab icon. @returns the Lucide icon name. */
  public override getIcon(): string {
    return 'brain'
  }

  /** Serialise the open file for workspace restore. @returns the state. */
  public override getState(): Record<string, unknown> {
    return this.file === null ? {} : { file: this.file.path }
  }

  /** Restore the open file and load its document. @param state - saved state. @param result - load result. @returns completion. */
  public override async setState(state: Record<string, unknown>, result: Record<string, unknown>): Promise<void> {
    const path = typeof state['file'] === 'string' ? state['file'] : undefined
    const entry = path === undefined ? null : this.app.vault.getAbstractFileByPath(path)
    this.file = entry instanceof TFile ? entry : null
    if (this.surface !== null) await this.loadDocument()
  }

  /** Build the DOM, wire events, start the paint loop and load the document. @returns completion. */
  public override async onOpen(): Promise<void> {
    const doc = this.contentEl.ownerDocument
    this.contentEl.replaceChildren()
    const surface = doc.createElement('div')
    surface.style.cssText = 'position:relative; width:100%; height:100%; overflow:hidden;'
    const canvas = doc.createElement('canvas')
    canvas.tabIndex = 0
    canvas.style.cssText = 'width:100%; height:100%; display:block; outline:none; touch-action:none;'
    surface.appendChild(canvas)
    this.contentEl.appendChild(surface)
    this.surface = surface
    this.canvas = canvas
    wirePurCanvas(this, canvas)
    this.painter.attach(surface, canvas)
    this.modifyRef = this.app.vault.on('modify', (file) => this.onVaultModify(file))
    await this.loadDocument()
  }

  /** Flush a pending save, then stop the loop and release every subscription. @returns completion. */
  public override async onClose(): Promise<void> {
    this.painter.detach()
    if (this.saveTimer !== null) {
      window.clearTimeout(this.saveTimer)
      this.saveTimer = null
      await this.saveNow()
    }
    if (this.modifyRef !== null) {
      this.app.vault.offref(this.modifyRef)
      this.modifyRef = null
    }
    this.contentEl.replaceChildren()
    this.canvas = null
    this.surface = null
  }

  /** The controller, or null before the first document load. @returns the controller. */
  public controllerOrNull(): PurController | null {
    return this.controller
  }

  /** The controller; throws when no document has loaded yet. @returns the controller. */
  public requireController(): PurController {
    const controller = this.controller
    if (controller === null) throw new Error('pur-studio: no document loaded')
    return controller
  }

  /** Drain kernel effects through the sink. @param effects - the effects. */
  public runEffects(effects: readonly PurControllerEffect[]): void {
    executeEffects(effects, this.sink)
  }

  /** Vault path of the open document, or '' when fileless. @returns the path. */
  public filePath(): string {
    return this.file?.path ?? ''
  }

  /** Basename of the open document, when file-backed. @returns the basename. */
  public fileBaseName(): string | undefined {
    return this.file?.basename
  }

  /** Rebind the view to a freshly saved document file. @param file - the written file. */
  public adoptFile(file: TFile): void {
    this.file = file
  }

  /** Open a vault canvas file in a new tab. @param path - vault-relative path. */
  public openFile(path: string): void {
    void this.app.workspace.getLeaf('tab').setViewState({ type: PUR_VIEW_TYPE, state: { file: path } })
  }

  /** Open a link target in the current tab: URLs in the browser, vault links in the workspace. @param target - vault path or URL. */
  public openLink(target: string): void {
    if (/^https?:/i.test(target)) {
      window.open(target, '_blank', 'noopener')
      return
    }
    void this.app.workspace.openLinkText(target, this.filePath(), false)
  }

  /** Set the canvas CSS cursor. @param cursor - the CSS cursor. */
  public setCursor(cursor: string): void {
    if (this.canvas !== null) this.canvas.style.cursor = cursor
  }

  /** Mark the next frame for repaint. */
  public markDirty(): void {
    this.painter.markDirty()
  }

  /** Debounce document persistence, mirroring upstream's save-on-change. */
  public scheduleSave(): void {
    if (this.saveTimer !== null) window.clearTimeout(this.saveTimer)
    this.saveTimer = window.setTimeout(() => {
      this.saveTimer = null
      void this.saveNow()
    }, 400)
  }

  /** Resolved colours and grid toggle from the settings. @returns the preferences. */
  public preferences(): PurRenderPreferences {
    const prefs = this.pluginHost.settings.preferences
    return { backgroundColor: prefs.backgroundColor, gridColor: prefs.gridColor, showGrid: prefs.showGrid }
  }

  /** The overlay host element. @returns the surface, or null before `onOpen`. */
  public surfaceEl(): HTMLElement | null {
    return this.surface
  }

  /** The canvas element, or null before `onOpen`. @returns the canvas. */
  public canvasEl(): HTMLCanvasElement | null {
    return this.canvas
  }

  /** Decoded images keyed by `dataURL || original`. @returns the cache. */
  public imagesMap(): ReadonlyMap<string, CanvasImageSource> {
    return this.painter.imageMap
  }

  /** Track an opening dialog, for `hasOpenDialog`. */
  public dialogOpened(): void {
    this.dialogs++
  }

  /** Track a closing dialog. */
  public dialogClosed(): void {
    this.dialogs--
  }

  /** Refocus the canvas after a dialog closes. */
  public focusCanvas(): void {
    this.canvas?.focus()
  }

  /** Read the current file (or the fileless settings fallback) into a fresh document. */
  private async loadDocument(): Promise<void> {
    if (this.file === null) {
      this.adoptDocument(this.pluginHost.settings.canvasData ?? { elements: [], viewState: { offsetX: 0, offsetY: 0, scale: 1 } })
      return
    }
    try {
      this.adoptDocument(parseStudioDocument(await this.app.vault.read(this.file)))
    } catch (error) {
      console.warn('pur-studio: unparseable document, opening an empty canvas', error)
      this.adoptDocument({ elements: [], viewState: { offsetX: 0, offsetY: 0, scale: 1 } })
    }
  }

  /** Replace the controller's document, creating the controller on first load. */
  private adoptDocument(document: PurStudioDocument): void {
    if (this.controller === null) this.controller = new PurController(this.env, this.labels.controller, document.elements, document.viewState)
    else {
      this.controller.state.elements = document.elements
      this.controller.state.view = document.viewState
      this.controller.state.selectedIds.clear()
    }
    this.markDirty()
  }

  /** Rehydrate when the open file changes on disk outside our own saves. */
  private onVaultModify(file: TAbstractFile): void {
    if (this.saving || this.file === null || file.path !== this.file.path) return
    const open = this.file
    void this.app.vault.read(open).then((text) => {
      if (this.file !== open) return
      try {
        this.adoptDocument(parseStudioDocument(text))
      } catch (error) {
        console.warn('pur-studio: unparseable external write, keeping the in-memory canvas', error)
      }
    })
  }

  /** Persist the document to the file, or to the settings fallback when fileless. */
  private async saveNow(): Promise<void> {
    const controller = this.controller
    if (controller === null) return
    const document: PurStudioDocument = { elements: controller.state.elements, viewState: controller.state.view }
    if (this.file === null) {
      this.pluginHost.settings.canvasData = document
      await this.pluginHost.saveSettings()
      return
    }
    this.saving = true
    try {
      await this.app.vault.modify(this.file, serializeStudioDocument(document))
    } catch {
      new Notice(this.read('pur.saveFailed'))
    } finally {
      this.saving = false
    }
  }
}
