/**
 * Plugin routes: the vault's community and core plugin inventory, built-in
 * enablement, and opening the DSH plugin folder. Kept apart from the vault
 * routes so each dispatch table stays small.
 * @module dsh-obsidian-vault/plugin-endpoints
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { readJson, send } from './http.ts'
import { DSH_PLUGINS_FOLDER } from './package-root.ts'
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
    case 'plugins/reveal':
      send(response, 200, { folder: await revealPluginsFolder(DSH_PLUGINS_FOLDER) })
      return
    default:
      send(response, 404, { error: 'unknown plugin route', route })
  }
}
