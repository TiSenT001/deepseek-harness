/**
 * Plugin routes: inventory, built-in enablement, the bridge whitelist, the
 * sandboxed plugin frame, and opening the DSH plugin folder. Kept apart from
 * the vault routes so each dispatch table stays small.
 * @module dsh-obsidian-vault/plugin-endpoints
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { FRAME_SOURCE } from './bridge-protocol.ts'
import { readJson, send } from './http.ts'
import { DSH_PLUGINS_FOLDER } from './package-root.ts'
import { API_BASE } from './protocol.ts'
import { isPluginId, readPluginScript, setBridgeEnabled } from './vault/bridge.ts'
import { readObsidianConfig } from './vault/obsidian-config.ts'
import { listPlugins, revealPluginsFolder, setCorePluginEnabled } from './vault/plugins.ts'
import type { VaultRegistry } from './vault/registry.ts'

/**
 * Serve one `plugins/*` route against the active vault.
 * @param registry - live vault registry; the active vault supplies the root.
 * @param route - path after the API prefix, e.g. `plugins/list`.
 * @param request - incoming request.
 * @param response - response to complete.
 */
export async function servePluginRoute(
  registry: VaultRegistry,
  route: string,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const root = registry.active()?.path ?? registry.vault.status().root
  switch (route) {
    case 'plugins/list':
      send(response, 200, await listPlugins(root, DSH_PLUGINS_FOLDER))
      return
    case 'plugins/toggle': {
      const body = await readJson(request)
      const id = typeof body['id'] === 'string' ? body['id'].trim() : ''
      if (id.length === 0) {
        send(response, 400, { error: 'id is required' })
        return
      }
      const enabled = body['enabled'] === true
      await setCorePluginEnabled(root, id, enabled)
      send(response, 200, await listPlugins(root, DSH_PLUGINS_FOLDER))
      return
    }
    case 'plugins/bridge-toggle': {
      const body = await readJson(request)
      const id = body['id']
      if (!isPluginId(id)) {
        send(response, 400, { error: 'invalid plugin id', id })
        return
      }
      const inventory = await listPlugins(root, DSH_PLUGINS_FOLDER)
      if (!inventory.community.some(plugin => plugin.id === id)) {
        send(response, 404, { error: 'plugin is not installed in this vault', id })
        return
      }
      await setBridgeEnabled(root, id, body['enabled'] === true)
      send(response, 200, await listPlugins(root, DSH_PLUGINS_FOLDER))
      return
    }
    case 'plugins/script': {
      const id = query(request).searchParams.get('id') ?? ''
      if (!isPluginId(id) || !(await listPlugins(root, DSH_PLUGINS_FOLDER)).bridge.includes(id)) {
        send(response, 403, { error: 'plugin is not bridged', id })
        return
      }
      const script = await readPluginScript(root, id)
      if (script === undefined) {
        send(response, 404, { error: 'plugin has no main.js', id })
        return
      }
      response.writeHead(200, {
        'content-type': 'text/javascript; charset=utf-8',
        'cache-control': 'no-store',
        // The frame's origin is opaque, so the script only yields usable error
        // details when it loads in CORS mode.
        'access-control-allow-origin': '*',
      })
      response.end(script)
      return
    }
    case 'plugins/frame': {
      const id = query(request).searchParams.get('id') ?? ''
      const inventory = await listPlugins(root, DSH_PLUGINS_FOLDER)
      if (!isPluginId(id) || !inventory.bridge.includes(id)) {
        send(response, 403, { error: 'plugin is not bridged', id })
        return
      }
      const manifest = inventory.community.find(plugin => plugin.id === id)
      if (manifest === undefined) {
        send(response, 404, { error: 'plugin is not installed in this vault', id })
        return
      }
      // graph.json rides along so the shim's `fs` stub can answer the plugin's
      // synchronous color-group read without a postMessage round trip.
      const graph = await readObsidianConfig(root, 'graph') ?? null
      response.writeHead(200, {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      })
      response.end(frameDocument(id, manifest, graph))
      return
    }
    case 'plugins/reveal':
      send(response, 200, { folder: await revealPluginsFolder(DSH_PLUGINS_FOLDER) })
      return
    default:
      send(response, 404, { error: 'unknown plugin route', route })
  }
}

function query(request: IncomingMessage): URL {
  return new URL(request.url ?? '/', 'http://localhost')
}

/**
 * The frame document: a bare shell that forwards uncaught errors over the
 * bridge envelope, embeds the plugin manifest and graph.json for the shim, and
 * loads the shim bundle. The shim then installs `require('obsidian')`,
 * prefetches the vault file list, injects the plugin script, and posts
 * `frame.ready` once the plugin's `onload` resolves.
 * @param id - whitelisted plugin id, already validated.
 * @param manifest - the plugin's manifest metadata from the community scan.
 * @param graph - the vault's graph.json document, or null when absent.
 */
function frameDocument(id: string, manifest: unknown, graph: unknown): string {
  const embed = (value: unknown): string => JSON.stringify(value).replace(/</g, '\\u003c')
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(id)}</title>
<style>html,body{margin:0;height:100%;background:transparent}body{font:13px/1.4 system-ui,sans-serif;color:#8b8b94;padding:0}</style>
</head>
<body>
<script>
window.__OV_MANIFEST__ = ${embed(manifest)}
window.__OV_GRAPH_JSON__ = ${embed(graph)}
;(function () {
  'use strict'
  function report(message) {
    parent.postMessage({ source: '${FRAME_SOURCE}', kind: 'event', event: 'frame.error', params: { message: String(message) } }, '*')
  }
  window.addEventListener('error', function (event) {
    // The error is forwarded to the host; keeping it out of the console too
    // would double-report the same failure.
    event.preventDefault()
    var error = event.error
    report(error && error.message ? error.message : event.message)
  })
  window.addEventListener('unhandledrejection', function (event) {
    event.preventDefault()
    var reason = event.reason
    report(reason && reason.message ? reason.message : reason)
  })
})()
</script>
<script crossorigin src="${API_BASE}/shim.js"></script>
</body>
</html>`
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => `&#${character.charCodeAt(0)};`)
}
