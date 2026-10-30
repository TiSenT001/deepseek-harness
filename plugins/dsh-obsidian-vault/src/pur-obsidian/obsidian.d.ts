/**
 * Minimal `obsidian` environment module declaration for the real-Obsidian
 * Pur Studio plugin shell. Only the surface the adapter consumes is declared,
 * typed just enough to keep call sites honest; the package itself is never
 * installed.
 * @module dsh-obsidian-vault/pur-obsidian/obsidian
 */
declare module 'obsidian' {
  /** Opaque handle returned by event registration. */
  export interface EventRef {}

  /** A vault entry, file or folder. */
  export interface TAbstractFile {
    /** Vault-relative path. */
    path: string
    /** File name with extension. */
    name: string
  }

  /** A vault file. */
  export class TFile implements TAbstractFile {
    /** Vault-relative path. */
    public path: string
    /** File name with extension. */
    public name: string
    /** File name without extension. */
    public basename: string
    /** Lowercased extension. */
    public extension: string
  }

  /** Low-level file adapter backing the vault. */
  export interface DataAdapter {
    /** Whether a vault-relative path exists. @param path - the path. @returns existence. */
    exists(path: string): Promise<boolean>
    /** Create a directory recursively. @param path - the path. */
    mkdir(path: string): Promise<void>
  }

  /** The vault: file content access plus change events. */
  export interface Vault {
    /** Low-level path operations. */
    adapter: DataAdapter
    /** Read a text file. @param file - the file. @returns its contents. */
    read(file: TFile): Promise<string>
    /** Read a binary file. @param file - the file. @returns its bytes. */
    readBinary(file: TFile): Promise<ArrayBuffer>
    /** Create a text file. @param path - vault-relative path. @param data - contents. @returns the file. */
    create(path: string, data: string): Promise<TFile>
    /** Create a binary file. @param path - vault-relative path. @param data - bytes. @returns the file. */
    createBinary(path: string, data: ArrayBuffer): Promise<TFile>
    /** Overwrite a text file. @param file - the file. @param data - new contents. */
    modify(file: TFile, data: string): Promise<void>
    /** Resolve a vault-relative path. @param path - the path. @returns the entry, or null. */
    getAbstractFileByPath(path: string): TAbstractFile | null
    /** Every file in the vault. @returns the files. */
    getFiles(): TFile[]
    /** Subscribe to vault events. @param name - the event name. @param callback - the handler. @returns the subscription. */
    on(name: 'modify', callback: (file: TAbstractFile) => unknown): EventRef
    /** Unsubscribe an event. @param ref - the subscription. */
    offref(ref: EventRef): void
  }

  /** The state a workspace leaf shows. */
  export interface ViewState {
    /** View type id. */
    type: string
    /** View-owned state bag. */
    state?: Record<string, unknown>
    /** Whether the leaf grabs focus. */
    active?: boolean
  }

  /** Result handed to `View.setState`. */
  export type ViewStateResult = Record<string, unknown>

  /** A workspace tab or pane. */
  export interface WorkspaceLeaf {
    /** The hosted view. */
    view: View
    /** Replace the hosted view. @param viewState - the new state. @returns completion. */
    setViewState(viewState: ViewState): Promise<void>
    /** The current view state. @returns the state. */
    getViewState(): ViewState
    /** Close the leaf. */
    detach(): void
  }

  /** The workspace: leaf management and link navigation. */
  export interface Workspace {
    /** The focused leaf, when any. */
    activeLeaf: WorkspaceLeaf | null
    /** All leaves hosting a view type. @param type - view type id. @returns the leaves. */
    getLeavesOfType(type: string): WorkspaceLeaf[]
    /** Open or reuse a leaf. @param newLeaf - where to open. @returns the leaf. */
    getLeaf(newLeaf: 'tab' | 'split' | false): WorkspaceLeaf
    /** Scroll a leaf into view. @param leaf - the leaf. */
    revealLeaf(leaf: WorkspaceLeaf): void
    /**
     * Open a vault link or URL. @param linktext - the target. @param sourcePath - resolving base.
     * @param newLeaf - 'tab', 'split' or false for the current tab. @returns completion.
     */
    openLinkText(linktext: string, sourcePath: string, newLeaf?: 'tab' | 'split' | boolean): Promise<void>
    /** The workspace's active file. @returns the file, or null. */
    getActiveFile(): TFile | null
  }

  /** The command palette registry. */
  export interface CommandManager {
    /** Registered commands by id. */
    commands: Record<string, { id: string }>
    /** Run a command. @param id - the command id. */
    executeCommandById(id: string): void
  }

  /** The Obsidian application object. */
  export interface App {
    /** The vault. */
    vault: Vault
    /** The workspace. */
    workspace: Workspace
    /** The command registry, present on desktop builds. */
    commands?: CommandManager
    /** Reveal a vault path in the OS file explorer. @param path - the path. @returns completion. */
    showInFolder?(path: string): Promise<void>
  }

  /** A workspace view. */
  export abstract class View {
    /** The application. */
    public app: App
    /** The hosting leaf. */
    public leaf: WorkspaceLeaf
    /** The root element. */
    public containerEl: HTMLElement
    /** Create a view. @param leaf - the hosting leaf. */
    public constructor(leaf: WorkspaceLeaf)
    /** The view type id. @returns the id. */
    public abstract getViewType(): string
    /** The tab title. @returns the title. */
    public abstract getDisplayText(): string
    /** The tab icon name. @returns the icon. */
    public getIcon(): string
    /** Serialise navigation state. @returns the state. */
    public getState(): Record<string, unknown>
    /** Restore navigation state. @param state - saved state. @param result - load result. @returns completion. */
    public setState(state: Record<string, unknown>, result: ViewStateResult): Promise<void>
    /** Called when the view opens. @returns completion. */
    public onOpen(): Promise<void>
    /** Called when the view closes. @returns completion. */
    public onClose(): Promise<void>
  }

  /** A leaf-hosted content view. */
  export abstract class ItemView extends View {
    /** The content area below the tab header. */
    public contentEl: HTMLElement
  }

  /** One context-menu row. */
  export interface MenuItem {
    /** Set the row title. @param title - the text. @returns this. */
    setTitle(title: string): MenuItem
    /** Set the row icon. @param icon - a Lucide icon name, or null. @returns this. */
    setIcon(icon: string | null): MenuItem
    /** Set the click handler. @param callback - the handler. @returns this. */
    onClick(callback: (evt: MouseEvent) => void): MenuItem
    /** Attach a submenu. @param menu - the submenu. @returns this. */
    setSubmenu(menu: Menu): MenuItem
  }

  /** A native context menu. */
  export class Menu {
    /** Add a row. @param callback - configures the row. @returns this. */
    public addItem(callback: (item: MenuItem) => void): Menu
    /** Add a separator row. @returns this. */
    public addSeparator(): Menu
    /** Show at a viewport point. @param position - the point. */
    public showAtPosition(position: { x: number; y: number }): void
  }

  /** A transient toast message. */
  export class Notice {
    /** Show a toast. @param message - the text. @param timeout - ms before hiding. */
    public constructor(message: string, timeout?: number)
  }

  /** A single-line text input inside a `Setting`. */
  export interface TextComponent {
    /** Set the current text. @param value - the text. @returns this. */
    setValue(value: string): TextComponent
    /** Subscribe to edits. @param callback - the handler. @returns this. */
    onChange(callback: (value: string) => unknown): TextComponent
  }

  /** A boolean toggle inside a `Setting`. */
  export interface ToggleComponent {
    /** Set the state. @param value - on or off. @returns this. */
    setValue(value: boolean): ToggleComponent
    /** Subscribe to flips. @param callback - the handler. @returns this. */
    onChange(callback: (value: boolean) => unknown): ToggleComponent
  }

  /** A dropdown inside a `Setting`. */
  export interface DropdownComponent {
    /** Add an option. @param value - the stored value. @param display - the label. @returns this. */
    addOption(value: string, display: string): DropdownComponent
    /** Set the current value. @param value - the value. @returns this. */
    setValue(value: string): DropdownComponent
    /** Subscribe to selection changes. @param callback - the handler. @returns this. */
    onChange(callback: (value: string) => unknown): DropdownComponent
  }

  /** A settings row. */
  export class Setting {
    /** Create a row. @param containerEl - the parent element. */
    public constructor(containerEl: HTMLElement)
    /** Set the row name. @param name - the text. @returns this. */
    public setName(name: string): Setting
    /** Set the row description. @param desc - the text. @returns this. */
    public setDesc(desc: string): Setting
    /** Append a text input. @param callback - configures the input. @returns this. */
    public addText(callback: (component: TextComponent) => void): Setting
    /** Append a toggle. @param callback - configures the toggle. @returns this. */
    public addToggle(callback: (component: ToggleComponent) => void): Setting
    /** Append a dropdown. @param callback - configures the dropdown. @returns this. */
    public addDropdown(callback: (component: DropdownComponent) => void): Setting
  }

  /** A plugin settings tab. */
  export abstract class PluginSettingTab {
    /** The application. */
    public app: App
    /** The tab content element. */
    public containerEl: HTMLElement
    /** Create a tab. @param app - the application. @param plugin - the owning plugin. */
    public constructor(app: App, plugin: Plugin)
    /** Render the tab contents. */
    public abstract display(): void
  }

  /** A centred modal window. */
  export abstract class Modal {
    /** The application. */
    public app: App
    /** The modal content element. */
    public contentEl: HTMLElement
    /** Create a modal. @param app - the application. */
    public constructor(app: App)
    /** Show the modal. */
    public open(): void
    /** Hide the modal. */
    public close(): void
    /** Called when the modal opens. */
    public onOpen(): void
    /** Called when the modal closes. */
    public onClose(): void
  }

  /** A fuzzy-search picker modal. */
  export abstract class FuzzySuggestModal<T> extends Modal {
    /** The candidates. @returns the items. */
    public abstract getItems(): T[]
    /** The display text of one candidate. @param item - the item. @returns the text. */
    public abstract getItemText(item: T): string
    /** Called with the chosen candidate. @param item - the item. @param evt - the triggering event. */
    public abstract onChooseItem(item: T, evt: MouseEvent | KeyboardEvent): void
  }

  /** A plugin. */
  export abstract class Plugin {
    /** The application. */
    public app: App
    /** Load persisted plugin data. @returns the saved value. */
    public loadData(): Promise<unknown>
    /** Persist plugin data. @param data - the value. @returns completion. */
    public saveData(data: unknown): Promise<void>
    /** Called when the plugin loads. @returns completion. */
    public onload(): void | Promise<void>
    /** Called when the plugin unloads. */
    public onunload(): void
    /** Register a view type. @param type - the id. @param creator - builds a view for a leaf. */
    public registerView(type: string, creator: (leaf: WorkspaceLeaf) => View): void
    /** Open files with a view type. @param extensions - file extensions. @param viewType - the view type id. */
    public registerExtensions(extensions: readonly string[], viewType: string): void
    /** Add a ribbon button. @param icon - a Lucide icon name. @param title - the tooltip. @param callback - the handler. @returns the button. */
    public addRibbonIcon(icon: string, title: string, callback: (evt: MouseEvent) => void): HTMLElement
    /** Add a palette command. @param command - id, name and callback. @returns the command. */
    public addCommand(command: { id: string; name: string; callback?: () => void }): unknown
    /** Add a settings tab. @param tab - the tab. */
    public addSettingTab(tab: PluginSettingTab): void
  }

  /** Normalise a vault path. @param path - the raw path. @returns the normalised path. */
  export function normalizePath(path: string): string

  /** Fetch a URL through Obsidian's request stack. @param param - the request. @returns the response. */
  export function requestUrl(param: { url: string }): Promise<{ status: number; text: string }>
}
