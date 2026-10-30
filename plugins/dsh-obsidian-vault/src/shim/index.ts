/**
 * The shim bundle's entry, loaded by the frame document before the plugin
 * script: install `require` and the CommonJS `module` pair, prefetch the vault
 * file list (so the plugin's synchronous getters work), inject the plugin
 * script, instantiate its export, and run `onload`. `frame.ready` posts after
 * a successful load; any failure posts `frame.error` (the document's inline
 * handlers forward uncaught errors the same way).
 * @module dsh-obsidian-vault/shim
 */
import { UnsupportedObsidianApi } from './errors.ts'
import { buildNodeStubs, installBuffer } from './node-stubs.ts'
import { createShim } from './obsidian.ts'
import type { Plugin, ShimManifest } from './plugin.ts'
import { windowTransport } from './transport.ts'

/** Frame-local styles for the shim's own UI (notices, modals, menus, views). */
const SHIM_STYLES = `
#ov-shim-root{height:100%;overflow:auto;color:#dcddd8;background:#1e1e1e}
.ov-shim-view{height:100%;display:flex;flex-direction:column}
.ov-shim-view-content{flex:1;overflow:auto}
.ov-shim-notice{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#2a2a2a;color:#dcddd8;
  padding:8px 14px;border-radius:6px;font-size:12px;z-index:1000;box-shadow:0 2px 8px rgba(0,0,0,.5)}
.ov-shim-modal-layer{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;
  justify-content:center;z-index:900}
.ov-shim-modal{background:#242424;border:1px solid #363636;border-radius:8px;min-width:280px;max-width:90%;
  max-height:85%;display:flex;flex-direction:column}
.ov-shim-modal-title{font-weight:600;padding:10px 14px;border-bottom:1px solid #363636}
.ov-shim-modal-title:empty{display:none}
.ov-shim-modal-content{padding:10px 14px;overflow:auto}
.ov-shim-fuzzy-input{width:100%;box-sizing:border-box;background:#1e1e1e;border:1px solid #363636;
  color:#dcddd8;padding:6px 8px;border-radius:4px}
.ov-shim-fuzzy-list{margin-top:6px;max-height:50vh;overflow:auto}
.ov-shim-fuzzy-item{padding:5px 8px;border-radius:4px;cursor:pointer}
.ov-shim-fuzzy-item:hover,.ov-shim-fuzzy-active{background:#363636}
.ov-shim-menu{position:fixed;background:#242424;border:1px solid #363636;border-radius:6px;
  padding:4px;z-index:950;min-width:140px;box-shadow:0 4px 14px rgba(0,0,0,.5)}
.ov-shim-menu-item{padding:5px 10px;border-radius:4px;cursor:pointer;white-space:nowrap}
.ov-shim-menu-item:hover{background:#363636}
.ov-shim-menu-disabled{opacity:.45;cursor:default}
.ov-shim-menu-separator{height:1px;background:#363636;margin:4px 6px}
.ov-shim-setting{display:flex;align-items:center;justify-content:space-between;gap:12px;
  padding:8px 0;border-bottom:1px solid #2c2c2c}
.ov-shim-setting-name{font-size:13px}
.ov-shim-setting-desc{font-size:11px;color:#8b8b94;margin-top:2px}
.ov-shim-setting-controls{display:flex;gap:8px;align-items:center}
.ov-shim-cta{background:#483699;color:#fff}
`

interface FrameWindow extends Window {
  __OV_MANIFEST__?: ShimManifest
  __OV_GRAPH_JSON__?: unknown
  require?: (name: string) => unknown
  module?: { exports: unknown }
  exports?: unknown
}

interface PluginClass {
  new (app: unknown, manifest: ShimManifest): Plugin
}

/** The plugin class: `module.exports` itself, or its `default` (ESM-interop bundles). */
function pickPluginClass(exportsValue: unknown): PluginClass | undefined {
  if (typeof exportsValue === 'function') return exportsValue as PluginClass
  if (typeof exportsValue === 'object' && exportsValue !== null) {
    const fallback = (exportsValue as { readonly default?: unknown }).default
    if (typeof fallback === 'function') return fallback as PluginClass
  }
  return undefined
}

function boot(): void {
  const frameWindow: FrameWindow = window
  const frameDocument = window.document
  const pluginId = new URLSearchParams(window.location.search).get('id') ?? ''
  // The frame lives at `<api>/plugins/frame`; the API prefix is one level up.
  const apiBase = new URL('../', window.location.href).href.replace(/\/+$/, '')
  const manifest: ShimManifest = frameWindow.__OV_MANIFEST__ ?? { id: pluginId, name: pluginId }
  const transport = windowTransport(window)
  const stubs = buildNodeStubs(frameWindow.__OV_GRAPH_JSON__ ?? null)
  installBuffer(window)

  const root = frameDocument.createElement('div')
  root.id = 'ov-shim-root'
  frameDocument.body.appendChild(root)
  const style = frameDocument.createElement('style')
  style.textContent = SHIM_STYLES
  frameDocument.head.appendChild(style)

  const { app, obsidian } = createShim({ transport, apiBase, manifest, mountRoot: root, document: frameDocument })

  frameWindow.require = (name: string): unknown => {
    if (name === 'obsidian') return obsidian
    const stub = stubs[name]
    if (stub !== undefined) return stub
    throw new UnsupportedObsidianApi(`module ${name}`)
  }
  const cjsModule: { exports: unknown } = { exports: {} }
  frameWindow.module = cjsModule
  frameWindow.exports = cjsModule.exports

  const fail = (cause: unknown): void => {
    transport.emit('frame.error', { message: cause instanceof Error ? cause.message : String(cause) })
  }

  void (async () => {
    try {
      await app.vault.warmup()
      await new Promise<void>((resolve, reject) => {
        const script = frameDocument.createElement('script')
        script.crossOrigin = 'anonymous'
        script.src = `${apiBase}/plugins/script?id=${encodeURIComponent(pluginId)}`
        script.onload = () => resolve()
        script.onerror = () => reject(new Error(`plugin script failed to load: ${pluginId}`))
        frameDocument.head.appendChild(script)
      })
      const Exported = pickPluginClass(cjsModule.exports)
      if (Exported === undefined) throw new Error('plugin main.js did not export a Plugin class')
      const instance: Plugin = new Exported(app, manifest)
      transport.onEvent((event, params) => {
        if (event === 'command.run') {
          const commandId = params?.['id']
          if (typeof commandId === 'string') instance.runCommand(commandId)
          return
        }
        // Keeps the synchronous `getActiveFile` snapshot current; the plugin
        // may also receive the same change through its own workspace listener.
        if (event === 'file.open') {
          const path = params?.['path']
          app.workspace.setActiveFile(typeof path === 'string' ? path : null)
        }
      })
      await app.workspace.refreshActiveFile()
      await instance.onload()
      transport.emit('frame.ready')
    } catch (error) {
      fail(error)
    }
  })()
}

boot()
