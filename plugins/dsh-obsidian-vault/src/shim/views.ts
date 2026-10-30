/**
 * The frame's workspace model: one leaf, the registered view factories, and
 * Obsidian's `Component` lifecycle base. Mounting renders the plugin's
 * `ItemView` into the frame's own DOM — from the host's perspective that DOM
 * is the plugin view container.
 * @module dsh-obsidian-vault/shim/views
 */
import { TFile } from './files.ts'
import { normalizePath } from './normalize.ts'
import type { BridgeTransport } from './transport.ts'
import type { ShimVault } from './vault.ts'

/** Obsidian's `Component`: lifecycle-disposer bookkeeping. */
export class Component {
  private disposers: (() => void)[] = []

  /**
   * Track a disposer until unload.
   * @param disposer - the cleanup function.
   * @returns it, for symmetric deregistration.
   */
  register<T extends () => void>(disposer: T): T {
    this.disposers.push(disposer)
    return disposer
  }

  /**
   * Track a DOM listener until unload.
   * @param element - the event target.
   * @param type - event name.
   * @param handler - the callback.
   */
  registerDomEvent(element: EventTarget, type: string, handler: (event: Event) => void): void {
    element.addEventListener(type, handler)
    this.register(() => element.removeEventListener(type, handler))
  }

  /** Run every tracked disposer. */
  unload(): void {
    for (const disposer of this.disposers) disposer()
    this.disposers = []
  }
}

/** Obsidian's `ItemView`: plugin UI mounted inside the frame. */
export class ItemView extends Component {
  readonly leaf: WorkspaceLeaf
  readonly app: unknown
  readonly containerEl: HTMLElement
  readonly contentEl: HTMLElement

  /** @param leaf - the leaf hosting this view. */
  constructor(leaf: WorkspaceLeaf) {
    super()
    this.leaf = leaf
    this.app = leaf.app
    this.containerEl = leaf.document.createElement('div')
    this.containerEl.className = 'ov-shim-view'
    this.contentEl = leaf.document.createElement('div')
    this.contentEl.className = 'ov-shim-view-content'
    this.containerEl.appendChild(this.contentEl)
  }

  /** The registered view type. */
  getViewType(): string {
    return 'unknown'
  }

  /** The title Obsidian would show on the tab. */
  getDisplayText(): string {
    return 'view'
  }

  /** The icon id Obsidian would show on the tab. */
  getIcon(): string {
    return 'document'
  }

  /** Called when the view mounts. */
  async onOpen(): Promise<void> {}

  /** Called when the view unmounts. */
  async onClose(): Promise<void> {}
}

/** One registered view factory. */
export type ViewFactory = (leaf: WorkspaceLeaf) => ItemView

/** The `registerView` store. */
export class ViewRegistry {
  private readonly factories = new Map<string, ViewFactory>()

  /**
   * Register one view type.
   * @param type - the view type id.
   * @param factory - builds the view for a leaf.
   * @returns the disposer, for plugin unload.
   */
  register(type: string, factory: ViewFactory): () => void {
    this.factories.set(type, factory)
    return () => this.factories.delete(type)
  }

  /**
   * Instantiate one view type.
   * @param type - the view type id.
   * @param leaf - the hosting leaf.
   * @returns the view, or undefined for an unregistered type.
   */
  create(type: string, leaf: WorkspaceLeaf): ItemView | undefined {
    return this.factories.get(type)?.(leaf)
  }
}

/** Obsidian's `WorkspaceLeaf`: in the single-surface frame it mounts views. */
export class WorkspaceLeaf {
  readonly app: unknown
  readonly document: Document
  private readonly registry: ViewRegistry
  private readonly mountRoot: HTMLElement
  view: ItemView | undefined

  /**
   * @param app - the shim app.
   * @param registry - registered view factories.
   * @param mountRoot - the frame element views render into.
   * @param document_ - the frame document (avoids import-time DOM access).
   */
  constructor(app: unknown, registry: ViewRegistry, mountRoot: HTMLElement, document_: Document) {
    this.app = app
    this.registry = registry
    this.mountRoot = mountRoot
    this.document = document_
  }

  /**
   * Show one registered view in the frame, replacing whatever is mounted.
   * @param state - `{ type }` plus plugin state.
   */
  async setViewState(state: { readonly type: string }): Promise<void> {
    const previous = this.view
    if (previous !== undefined) {
      await previous.onClose()
      previous.unload()
      previous.containerEl.remove()
    }
    const view = this.registry.create(state.type, this)
    if (view === undefined) throw new Error(`unregistered view type: ${state.type}`)
    this.view = view
    this.mountRoot.textContent = ''
    this.mountRoot.appendChild(view.containerEl)
    await view.onOpen()
  }
}

/** One registered workspace event callback. */
type WorkspaceHandler = (...args: readonly unknown[]) => void

/** Obsidian's `app.workspace`, bridge-backed where the host owns the state. */
export class ShimWorkspace {
  private readonly transport: BridgeTransport
  private readonly vault: ShimVault
  private readonly registry: ViewRegistry
  private readonly handlers = new Map<string, Set<WorkspaceHandler>>()
  private leaf: WorkspaceLeaf | undefined
  private activePath: string | null = null

  /**
   * @param transport - the frame's bridge client.
   * @param vault - the shim vault, for TFile lookups.
   * @param registry - registered view factories.
   * @param app - the shim app object the views see.
   * @param mountRoot - the frame element views render into.
   * @param document_ - the frame document.
   */
  constructor(
    transport: BridgeTransport,
    vault: ShimVault,
    registry: ViewRegistry,
    app: unknown,
    mountRoot: HTMLElement,
    document_: Document,
  ) {
    this.transport = transport
    this.vault = vault
    this.registry = registry
    this.leaf = new WorkspaceLeaf(app, registry, mountRoot, document_)
  }

  /**
   * The frame's single leaf. Obsidian's `mode` ('tab', 'split') is accepted and
   * ignored: the frame owns exactly one surface.
   */
  getLeaf(_mode?: string | boolean): WorkspaceLeaf {
    if (this.leaf === undefined) throw new Error('workspace leaf is not initialized')
    return this.leaf
  }

  /**
   * All leaves whose view has the given type.
   * @param type - the view type id.
   */
  getLeavesOfType(type: string): WorkspaceLeaf[] {
    const view = this.leaf?.view
    return view !== undefined && view.getViewType() === type && this.leaf !== undefined ? [this.leaf] : []
  }

  /**
   * Focus one leaf. The frame has a single surface, so revealing is a no-op.
   * @param leaf - the leaf to reveal.
   */
  revealLeaf(_leaf: WorkspaceLeaf): void {}

  /** The frame's active leaf. */
  get activeLeaf(): WorkspaceLeaf | null {
    return this.leaf ?? null
  }

  /**
   * Refresh the cached active-note path from the host. The boot sequence calls
   * this before the plugin's `onload`, and `file.open` events keep it current.
   */
  async refreshActiveFile(): Promise<void> {
    const path = await this.transport.request('workspace.getActiveFile')
    this.setActiveFile(typeof path === 'string' ? path : null)
  }

  /**
   * Store a host-pushed active-note path; `file.open` events call this.
   * @param path - the newly opened vault path, or null for none.
   */
  setActiveFile(path: string | null): void {
    this.activePath = path === null || path.length === 0 ? null : normalizePath(path)
  }

  /**
   * The host page's active note. Synchronous like Obsidian's getter: the value
   * is the snapshot the bridge keeps current, so plugin code may read it
   * without awaiting.
   * @returns the TFile, or null when the host has no note open.
   */
  getActiveFile(): TFile | null {
    if (this.activePath === null) return null
    const file = this.vault.getAbstractFileByPath(this.activePath)
    return file instanceof TFile ? file : null
  }

  /**
   * Open a note in the host's reading view; the plugin view closes.
   * @param linktext - link text or vault path.
   * @param sourcePath - the linking note's path (unused by the host resolver).
   * @param newLeaf - whether Obsidian would open a new leaf.
   */
  async openLinkText(linktext: string, _sourcePath?: string, _newLeaf?: boolean | string): Promise<void> {
    await this.transport.request('workspace.openLinkText', { path: linktext })
  }

  /**
   * Subscribe to a workspace event. Host pushes land with P9-4; subscriptions
   * are stored so plugin code never crashes registering them.
   * @param name - event name.
   * @param handler - the callback.
   * @returns an event reference.
   */
  on(name: string, handler: WorkspaceHandler): { readonly name: string } {
    const set = this.handlers.get(name) ?? new Set<WorkspaceHandler>()
    set.add(handler)
    this.handlers.set(name, set)
    return { name }
  }

  /**
   * Invoke the stored handlers for one event.
   * @param name - event name.
   * @param args - event arguments.
   */
  trigger(name: string, ...args: readonly unknown[]): void {
    for (const handler of this.handlers.get(name) ?? []) handler(...args)
  }
}
