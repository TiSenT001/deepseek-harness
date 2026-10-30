/**
 * The frame's `Plugin` base class: `loadData`/`saveData` and command
 * registration cross the bridge, `registerView` feeds the frame's view
 * registry, and everything the plugin registers unloads with it.
 * @module dsh-obsidian-vault/shim/plugin
 */
import type { BridgeTransport } from './transport.ts'
import type { ShimCommands } from './commands.ts'
import type { ShimMetadataCache } from './metadata.ts'
import type { ShimVault } from './vault.ts'
import { Component, type ViewFactory, type ViewRegistry, type ShimWorkspace } from './views.ts'

/** The manifest subset the host embeds into the frame document. */
export interface ShimManifest {
  readonly id: string
  readonly name: string
  readonly version?: string
  readonly author?: string
  readonly description?: string
}

/** The app object plugin code receives. */
export interface ShimApp {
  readonly vault: ShimVault
  readonly workspace: ShimWorkspace
  readonly metadataCache: ShimMetadataCache
  readonly commands: ShimCommands
  readonly views: ViewRegistry
  /** Internal: the bridge client. Not part of Obsidian's surface. */
  readonly bridge: BridgeTransport
  /** Registered setting tabs, stored until a settings surface exists. */
  readonly settingTabs: unknown[]
}

/** One `addCommand` entry. */
export interface ShimCommand {
  readonly id: string
  readonly name: string
  readonly callback?: () => void
}

/** Obsidian's `Plugin` base class. */
export class Plugin extends Component {
  readonly app: ShimApp
  readonly manifest: ShimManifest
  private readonly commands = new Map<string, ShimCommand>()

  /**
   * @param app - the shim app.
   * @param manifest - the plugin's manifest.
   */
  constructor(app: ShimApp, manifest: ShimManifest) {
    super()
    this.app = app
    this.manifest = manifest
  }

  /** Plugin setup; the subclass overrides it. */
  async onload(): Promise<void> {}

  /** Plugin teardown; the subclass overrides it. */
  async onunload(): Promise<void> {}

  /** Read the plugin's `data.json`; absent reads as null. */
  async loadData(): Promise<unknown> {
    return await this.app.bridge.request('plugin.loadData')
  }

  /**
   * Replace the plugin's `data.json`.
   * @param value - JSON-serializable document.
   */
  async saveData(value: unknown): Promise<void> {
    await this.app.bridge.request('plugin.saveData', { value: value ?? null })
  }

  /**
   * Register a palette command; the host merges it while the view is mounted.
   * @param command - the command entry.
   */
  addCommand(command: ShimCommand): void {
    this.commands.set(command.id, command)
    this.app.bridge.emit('commands.register', {
      commands: [...this.commands.values()].map(entry => ({ id: entry.id, name: entry.name })),
    })
  }

  /**
   * Run one registered command; the host's `command.run` event calls this.
   * @param id - the command id.
   */
  runCommand(id: string): void {
    this.commands.get(id)?.callback?.()
  }

  /**
   * Ribbon icons have no frame surface yet; the registration is stored so the
   * call succeeds and the callback stays invocable for P9-4.
   * @returns a detached element, matching Obsidian's return type.
   */
  addRibbonIcon(_icon: string, _title: string, _callback: () => void): HTMLElement {
    return document.createElement('div')
  }

  /**
   * Register a settings tab; stored until the host grows a frame settings
   * surface.
   * @param tab - the setting tab instance.
   */
  addSettingTab(tab: unknown): void {
    this.app.settingTabs.push(tab)
  }

  /**
   * Register a view type.
   * @param type - the view type id.
   * @param factory - builds the view for a leaf.
   */
  registerView(type: string, factory: ViewFactory): void {
    this.register(this.app.views.register(type, factory))
  }

  /**
   * Markdown post-processors run in the host's React reading view, which the
   * frame cannot reach; the registration is accepted and dropped.
   */
  registerMarkdownPostProcessor(_processor: unknown): void {}

  /** Unload: the plugin's own teardown, then every tracked disposer. */
  async unloadPlugin(): Promise<void> {
    await this.onunload()
    this.unload()
  }
}
