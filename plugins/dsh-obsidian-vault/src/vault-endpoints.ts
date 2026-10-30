/**
 * Vault-registry routes: list, open, create, and forget. Split from the note
 * API so each dispatch table stays small; the note routes keep reading
 * `registry.vault`.
 * @module dsh-obsidian-vault/vault-endpoints
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { readJson, send } from './http.ts'
import type { VaultRegistry } from './vault/registry.ts'

/**
 * Serve one `vault/*` route.
 * @param registry - live vault registry.
 * @param route - path after the API prefix, e.g. `vault/list`.
 * @param request - incoming request.
 * @param response - response to complete.
 */
export async function serveVaultRoute(
  registry: VaultRegistry,
  route: string,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  switch (route) {
    case 'vault/list':
      send(response, 200, registry.list())
      return
    case 'vault/inspect': {
      const path = (new URL(request.url ?? '/', 'http://localhost').searchParams.get('path') ?? '').trim()
      if (path.length === 0) {
        send(response, 400, { error: 'path is required' })
        return
      }
      send(response, 200, await registry.inspect(path))
      return
    }
    case 'vault/open': {
      const body = await readJson(request)
      const path = typeof body['path'] === 'string' ? body['path'].trim() : ''
      if (path.length === 0) {
        send(response, 400, { error: 'path is required' })
        return
      }
      const init = body['init'] === true
      try {
        send(response, 200, await registry.open(path, init))
      } catch (error) {
        send(response, 404, { error: messageOf(error), path })
      }
      return
    }
    case 'vault/create': {
      const body = await readJson(request)
      const path = typeof body['path'] === 'string' ? body['path'].trim() : ''
      if (path.length === 0) {
        send(response, 400, { error: 'path is required' })
        return
      }
      const name = typeof body['name'] === 'string' ? body['name'] : undefined
      try {
        send(response, 200, await registry.create(path, name))
      } catch (error) {
        send(response, 500, { error: messageOf(error), path })
      }
      return
    }
    case 'vault/forget': {
      const body = await readJson(request)
      const id = typeof body['id'] === 'string' ? body['id'].trim() : ''
      if (id.length === 0) {
        send(response, 400, { error: 'id is required' })
        return
      }
      try {
        await registry.forget(id)
        send(response, 200, registry.list())
      } catch (error) {
        send(response, 500, { error: messageOf(error) })
      }
      return
    }
    default:
      send(response, 404, { error: 'unknown vault route', route })
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
