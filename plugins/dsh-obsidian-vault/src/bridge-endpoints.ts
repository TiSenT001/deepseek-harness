/**
 * Bridge data routes: the vault calls a sandboxed plugin frame can ask for,
 * answered by the host page on the frame's behalf. Binary access is confined
 * to the vault root by `VaultFiles`; `data.json` access is confined to the
 * whitelisted plugin id the host attached the bridge for.
 * @module dsh-obsidian-vault/bridge-endpoints
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { readJson, send } from './http.ts'
import { isPluginId, readPluginData, writePluginData } from './vault/bridge.ts'
import { VaultFiles, VaultPathError } from './vault/files.ts'
import type { VaultRegistry } from './vault/registry.ts'

/**
 * Serve one `bridge/*` route against the active vault.
 * @param registry - live vault registry; the active vault supplies the root.
 * @param route - path after the API prefix, e.g. `bridge/data`.
 * @param request - incoming request.
 * @param response - response to complete.
 */
export async function serveBridgeRoute(
  registry: VaultRegistry,
  route: string,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const root = registry.active()?.path ?? registry.vault.status().root
  const files = new VaultFiles(root)
  try {
    switch (route) {
      case 'bridge/read-binary': {
        const path = new URL(request.url ?? '/', 'http://localhost').searchParams.get('path') ?? ''
        if (path.length === 0) {
          send(response, 400, { error: 'path is required' })
          return
        }
        const bytes = await files.readBytes(path)
        send(response, 200, { path, data: bytes.toString('base64') })
        return
      }
      case 'bridge/read-text': {
        const path = new URL(request.url ?? '/', 'http://localhost').searchParams.get('path') ?? ''
        if (path.length === 0) {
          send(response, 400, { error: 'path is required' })
          return
        }
        send(response, 200, { path, content: await files.readText(path) })
        return
      }
      case 'bridge/write-text': {
        const body = await readJson(request)
        const path = typeof body['path'] === 'string' ? body['path'] : ''
        const content = typeof body['content'] === 'string' ? body['content'] : undefined
        if (path.length === 0 || content === undefined) {
          send(response, 400, { error: 'path and content are required' })
          return
        }
        await files.writeText(path, content)
        send(response, 200, { ok: true, path })
        return
      }
      case 'bridge/list':
        send(response, 200, { files: await files.list() })
        return
      case 'bridge/exists': {
        const path = new URL(request.url ?? '/', 'http://localhost').searchParams.get('path') ?? ''
        if (path.length === 0) {
          send(response, 400, { error: 'path is required' })
          return
        }
        send(response, 200, { path, exists: await files.exists(path) })
        return
      }
      case 'bridge/raw': {
        // Asset bytes for the frame's <img> tags; CORS-enabled like the plugin
        // script so the opaque-origin canvas can read pixels back.
        const path = new URL(request.url ?? '/', 'http://localhost').searchParams.get('path') ?? ''
        if (path.length === 0) {
          send(response, 400, { error: 'path is required' })
          return
        }
        const bytes = await files.readBytes(path)
        response.writeHead(200, {
          'content-type': rawContentType(path),
          'cache-control': 'no-store',
          'access-control-allow-origin': '*',
        })
        response.end(bytes)
        return
      }
      case 'bridge/write-binary': {
        const body = await readJson(request)
        const path = typeof body['path'] === 'string' ? body['path'] : ''
        const data = typeof body['data'] === 'string' ? body['data'] : undefined
        if (path.length === 0 || data === undefined) {
          send(response, 400, { error: 'path and data are required' })
          return
        }
        await files.writeBytes(path, Buffer.from(data, 'base64'))
        send(response, 200, { ok: true, path })
        return
      }
      case 'bridge/data': {
        if (request.method === 'POST') {
          const body = await readJson(request)
          const id = body['id']
          if (!isPluginId(id)) {
            send(response, 400, { error: 'invalid plugin id', id })
            return
          }
          await writePluginData(root, id, body['value'] ?? {})
          send(response, 200, { ok: true, id })
          return
        }
        const id = new URL(request.url ?? '/', 'http://localhost').searchParams.get('id') ?? ''
        if (!isPluginId(id)) {
          send(response, 400, { error: 'invalid plugin id', id })
          return
        }
        send(response, 200, { id, value: await readPluginData(root, id) ?? null })
        return
      }
      default:
        send(response, 404, { error: 'unknown bridge route', route })
    }
  } catch (error) {
    if (error instanceof VaultPathError) {
      send(response, 400, { error: error.message })
      return
    }
    if ((error as { readonly code?: string }).code === 'ENOENT') {
      send(response, 404, { error: 'file not found' })
      return
    }
    throw error
  }
}

const RAW_TYPES: Readonly<Record<string, string>> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
}

/** Content type for `bridge/raw`, by lowercase file extension. */
function rawContentType(path: string): string {
  const extension = path.slice(path.lastIndexOf('.') + 1).toLowerCase()
  return RAW_TYPES[extension] ?? 'application/octet-stream'
}
