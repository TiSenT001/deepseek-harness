/**
 * The real-Obsidian plugin shell: registers the `.PurStudio` view and its file
 * extensions, a ribbon button, the settings tab, and upstream's full command
 * surface (view commands dispatch through the first open canvas, mirroring
 * upstream's `v()`). Settings load before views can be constructed, so a
 * view's constructor always reads resolved settings.
 * @module dsh-obsidian-vault/pur-obsidian/plugin
 */
import { Notice, Plugin } from 'obsidian'
import type { PurController, PurControllerEffect } from '../pur-kernel/index.ts'
import { createEmptyCanvas, exportMarkdown } from './exporter.ts'
import { readerFor } from './labels.ts'
import { PurStudioSettingTab, resolvePurSettings, DEFAULT_PUR_SETTINGS } from './settings.ts'
import type { PurSettings } from './settings.ts'
import { PurStudioView } from './view.ts'
import type { PurStudioHost } from './view.ts'
import { viewExporterHost } from './view-hosts.ts'
import { PUR_VIEW_TYPE } from './view-menu.ts'

/** Fixed file name of the no-prompt Markdown export command, mirroring upstream. */
const COMMAND_EXPORT_NAME = 'pur-studio-export'

/** Pur Studio Obsidian plugin: canvas view, ribbon, commands and settings tab. */
export class PurStudioPlugin extends Plugin implements PurStudioHost {
  /** Current settings, merged over the defaults at load. */
  public settings: PurSettings = DEFAULT_PUR_SETTINGS

  /** Load settings, then register the view, extensions, ribbon, commands and settings tab. @returns completion. */
  public override async onload(): Promise<void> {
    this.settings = resolvePurSettings(await this.loadData())
    this.registerView(PUR_VIEW_TYPE, (leaf) => new PurStudioView(leaf, this))
    // Coexistence: upstream `pur-studio` owns the `.purstudio` extension while
    // both plugins are enabled, so this one must not claim it as well. Claiming
    // it would make load order decide which plugin opens a canvas file.
    if (this.settings.ownFileExtension) this.registerExtensions(['PurStudio', 'purstudio'], PUR_VIEW_TYPE)
    this.addRibbonIcon('brain', 'Pur Studio', () => this.openCanvas())
    this.registerCommands()
    this.addSettingTab(new PurStudioSettingTab(this.app, this))
  }

  /** Persist the mutated settings. @returns completion. */
  public async saveSettings(): Promise<void> {
    await this.saveData(this.settings)
  }

  /** Resolve a dictionary key under the active language. @param key - the `pur.*` key. @returns the copy. */
  private read(key: string): string {
    return readerFor(this.settings.preferences.lang)(key)
  }

  /** The first open canvas view, upstream's `v()`; undefined when none is open. @returns the view. */
  private firstView(): PurStudioView | undefined {
    const candidate = this.app.workspace.getLeavesOfType(PUR_VIEW_TYPE)[0]?.view
    return candidate instanceof PurStudioView ? candidate : undefined
  }

  /** Open or reveal a fileless canvas tab, backed by the settings fallback. */
  private openCanvas(): void {
    const existing = this.app.workspace.getLeavesOfType(PUR_VIEW_TYPE)[0]
    const leaf = existing ?? this.app.workspace.getLeaf('tab')
    void leaf.setViewState({ type: PUR_VIEW_TYPE, state: {} }).then(() => this.app.workspace.revealLeaf(leaf))
  }

  /** Create a fresh canvas and open it in the current leaf, upstream's `createNewStudio`. @returns completion. */
  private async createCanvas(): Promise<void> {
    const path = await createEmptyCanvas(this.app, (key) => this.read(key))
    if (path !== null) await this.app.workspace.openLinkText(path, '', false)
  }

  /** Save the active leaf's canvas under a new name; notices when no canvas is active, upstream's `saveCurrentStudioAs`. */
  private saveActiveAs(): void {
    const leaf = this.app.workspace.getLeavesOfType(PUR_VIEW_TYPE).find((candidate) => candidate === this.app.workspace.activeLeaf)
    const view = leaf?.view
    if (!(view instanceof PurStudioView)) {
      new Notice(this.read('pur.noOpenCanvas'))
      return
    }
    view.menuHost.savePur()
  }

  /** Register upstream's full command surface; view commands no-op silently without an open canvas. */
  private registerCommands(): void {
    this.addCommand({ id: 'pur-studio-open', name: 'Pur Studio: open canvas', callback: () => this.openCanvas() })
    this.addCommand({ id: 'new-pur-studio', name: this.read('pur.newCanvas'), callback: () => void this.createCanvas() })
    this.addCommand({ id: 'save-pur-studio-as', name: this.read('pur.cmdSaveStudioAs'), callback: () => this.saveActiveAs() })
    const dispatch = (run: (controller: PurController) => readonly PurControllerEffect[]): void => {
      const view = this.firstView()
      if (view === undefined) return
      const controller = view.controllerOrNull()
      if (controller !== null) view.runEffects(run(controller))
    }
    this.addCommand({ id: 'pur-delete', name: this.read('pur.cmdDelete'), callback: () => dispatch((c) => c.deleteSelection()) })
    this.addCommand({ id: 'pur-group', name: this.read('pur.cmdGroup'), callback: () => dispatch((c) => c.group()) })
    this.addCommand({ id: 'pur-ungroup', name: this.read('pur.cmdUngroup'), callback: () => dispatch((c) => c.ungroup()) })
    this.addCommand({ id: 'pur-duplicate', name: this.read('pur.cmdDuplicate'), callback: () => dispatch((c) => c.duplicate()) })
    this.addCommand({ id: 'pur-fit-view', name: this.read('pur.cmdFitView'), callback: () => dispatch((c) => c.fitToView()) })
    this.addCommand({ id: 'pur-export-md', name: this.read('pur.cmdExportMd'), callback: () => this.exportActiveMarkdown() })
    this.addCommand({ id: 'pur-select-all', name: this.read('pur.cmdSelectAll'), callback: () => dispatch((c) => c.selectAll()) })
    this.addCommand({ id: 'pur-undo', name: this.read('pur.cmdUndo'), callback: () => dispatch((c) => c.undo()) })
    this.addCommand({ id: 'pur-redo', name: this.read('pur.cmdRedo'), callback: () => dispatch((c) => c.redo()) })
    this.addCommand({ id: 'pur-copy', name: this.read('pur.cmdCopy'), callback: () => dispatch((c) => c.copy()) })
    this.addCommand({ id: 'pur-paste', name: this.read('pur.cmdPaste'), callback: () => dispatch((c) => c.paste()) })
    this.addCommand({ id: 'pur-popout', name: this.read('pur.cmdPopout'), callback: () => this.firstView()?.menuHost.togglePopout() })
    this.addCommand({ id: 'pur-save-as', name: this.read('pur.cmdSaveAs'), callback: () => this.firstView()?.menuHost.savePur() })
  }

  /** Export the first canvas as Markdown without prompting, upstream's `exportAsText()`. */
  private exportActiveMarkdown(): void {
    const view = this.firstView()
    if (view === undefined || view.controllerOrNull() === null) return
    void exportMarkdown(viewExporterHost(view), false, false, COMMAND_EXPORT_NAME)
  }
}
