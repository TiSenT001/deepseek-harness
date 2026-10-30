/**
 * Assemble the `obsidian` module object the plugin's `require('obsidian')`
 * receives, plus the shim app behind it.
 * @module dsh-obsidian-vault/shim/obsidian
 */
import { UnsupportedObsidianApi } from './errors.ts'
import { ShimCommands } from './commands.ts'
import { ShimMetadataCache } from './metadata.ts'
import { addIcon, FuzzySuggestModal, Menu, Modal, Notice } from './modals.ts'
import { normalizePath } from './normalize.ts'
import { TFile, TFolder } from './files.ts'
import { Plugin, type ShimApp, type ShimManifest } from './plugin.ts'
import { PluginSettingTab, Setting } from './setting.ts'
import type { BridgeTransport } from './transport.ts'
import { ShimVault } from './vault.ts'
import { ItemView, ShimWorkspace, ViewRegistry } from './views.ts'

/** What the boot sequence gets from the frame document and transport. */
export interface ShimOptions {
  readonly transport: BridgeTransport
  /** The host API prefix, for `getResourcePath`. */
  readonly apiBase: string
  /** The manifest the host embedded into the frame document. */
  readonly manifest: ShimManifest
  /** The frame element plugin views render into. */
  readonly mountRoot: HTMLElement
  /** The frame document. */
  readonly document: Document
}

/** The assembled shim: the app plus the module object. */
export interface ShimRuntime {
  readonly app: ShimApp
  /** The exports `require('obsidian')` returns. */
  readonly obsidian: Record<string, unknown>
}

/**
 * Build the shim app and the obsidian module.
 * @param options - transport, identity, and DOM anchors.
 * @returns the runtime.
 */
export function createShim(options: ShimOptions): ShimRuntime {
  const { transport, apiBase, manifest, mountRoot, document: document_ } = options
  const vault = new ShimVault(transport, apiBase)
  const views = new ViewRegistry()
  const metadataCache = new ShimMetadataCache(vault, transport)
  // The workspace needs the app and the app exposes the workspace; a getter
  // breaks the cycle without a cast (it only runs after construction).
  const app: ShimApp = {
    vault,
    metadataCache,
    commands: new ShimCommands(),
    views,
    bridge: transport,
    settingTabs: [],
    get workspace(): ShimWorkspace {
      return workspace
    },
  }
  const workspace = new ShimWorkspace(transport, vault, views, app, mountRoot, document_)
  const obsidian: Record<string, unknown> = {
    Plugin,
    ItemView,
    Menu,
    Modal,
    FuzzySuggestModal,
    Notice,
    PluginSettingTab,
    Setting,
    normalizePath,
    addIcon,
    TFile,
    TFolder,
    requestUrl: () => {
      throw new UnsupportedObsidianApi('requestUrl')
    },
  }
  return { app, obsidian }
}
