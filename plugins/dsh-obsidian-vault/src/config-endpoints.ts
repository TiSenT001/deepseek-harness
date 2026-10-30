/**
 * `.obsidian` configuration routes: read one file, or merge a patch into it.
 * Kept separate from the vault routes so each dispatch table stays small.
 * @module dsh-obsidian-vault/config-endpoints
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { readJson, send } from './http.ts'
import type { ObsidianConfigDto } from './protocol.ts'
import { isConfigFile, readObsidianConfig, writeObsidianConfig } from './vault/obsidian-config.ts'
import type { VaultRegistry } from './vault/registry.ts'

/**
 * Serve one `config/*` route against the active vault.
 * @param registry - live vault registry; the active vault supplies the root.
 * @param route - path after the API prefix, e.g. `config/read`.
 * @param request - incoming request.
 * @param response - response to complete.
 */
export async function serveConfigRoute(
  registry: VaultRegistry,
  route: string,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const root = registry.active()?.path ?? registry.vault.status().root
  switch (route) {
    case 'config/read': {
      const file = new URL(request.url ?? '/', 'http://localhost').searchParams.get('file')
      if (!isConfigFile(file)) {
        send(response, 400, { error: 'unknown config file', file })
        return
      }
      const dto: ObsidianConfigDto = { file, value: await readObsidianConfig(root, file) ?? null }
      send(response, 200, dto)
      return
    }
    case 'config/write': {
      const body = await readJson(request)
      const file = body['file']
      if (!isConfigFile(file)) {
        send(response, 400, { error: 'unknown config file', file })
        return
      }
      const dto: ObsidianConfigDto = {
        file,
        value: await writeObsidianConfig(root, file, body['value'] ?? {}),
      }
      send(response, 200, dto)
      return
    }
    default:
      send(response, 404, { error: 'unknown config route', route })
  }
}
