/**
 * The Chromium-facing JSON API: `/obsidian/api/*`. The route layer only
 * parses requests, rejects untrusted callers, and shapes responses; every
 * answer comes from the vault index.
 * @module dsh-obsidian-vault/routes
 */
import { readFile, appendFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { readJson, send } from './http.ts'
import { API_BASE } from './protocol.ts'
import { serveBridgeRoute } from './bridge-endpoints.ts'
import { serveNoteSave } from './note-write.ts'
import { serveConfigRoute } from './config-endpoints.ts'
import { servePluginRoute } from './plugin-endpoints.ts'
import { VaultFiles } from './vault/files.ts'
import { resolvePurImage } from './vault/pur-image.ts'
import { storePurImage } from './vault/pur-store.ts'
import { serveVaultRoute } from './vault-endpoints.ts'
import type { VaultIndex } from './vault/index.ts'
import type { VaultRegistry } from './vault/registry.ts'
import { CONTENT_TYPES, dispositionOf, extensionOf, logNoteOpen } from './routes-shared.ts'
import type { RouteHost, TrustGate } from './routes-shared.ts'
export type { RouteHost } from './routes-shared.ts'


/**
 * Mount the vault API on the Web carrier.
 * @param host - plugin context exposes the carrier and the connection gate.
 * @param registry - live vault registry the routes read and switch.
 * @returns the disposer removing every route.
 */
export function mountVaultRoutes(host: RouteHost, registry: VaultRegistry): () => void {
  const gate = host.get('connection') as TrustGate | undefined
  const handler = (request: IncomingMessage, response: ServerResponse): Promise<void> =>
    serve(host, registry, gate, request, response)
  return host.webServer.register({ kind: 'prefix', path: API_BASE, handler })
}

async function serve(
  host: RouteHost,
  registry: VaultRegistry,
  gate: TrustGate | undefined,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const rejection = gate?.requestRejection?.({ headers: request.headers })
  if (rejection !== undefined) {
    send(response, rejection, { error: 'forbidden' })
    return
  }
  const url = new URL(request.url ?? '/', 'http://localhost')
  const route = url.pathname.slice(API_BASE.length).replace(/^\//, '')
  try {
    if (route.startsWith('vault/')) {
      await serveVaultRoute(registry, route, request, response)
      return
    }
    if (route.startsWith('config/')) {
      await serveConfigRoute(registry, route, request, response)
      return
    }
    if (route.startsWith('plugins/')) {
      await servePluginRoute(registry, route, request, response)
      return
    }
    if (route.startsWith('bridge/')) {
      await serveBridgeRoute(registry, route, request, response)
      return
    }
    await dispatch(host, registry, route, url, request, response)
  } catch (error) {
    send(response, 500, { error: error instanceof Error ? error.message : String(error) })
  }
}

async function dispatch(
  host: RouteHost,
  registry: VaultRegistry,
  route: string,
  url: URL,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const vault = registry.vault
  switch (route) {
    case 'worker.js': {
      // The layout worker lives beside the host bundle and is served as its own
      // script so the browser can construct a real Worker from it.
      const source = await readFile(new URL('./worker.js', import.meta.url), 'utf8')
      response.writeHead(200, {
        'content-type': 'text/javascript; charset=utf-8',
        'cache-control': 'no-cache',
      })
      response.end(source)
      return
    }
    case 'status':
      send(response, 200, vault.status())
      return
    case 'tree':
      send(response, 200, { nodes: vault.tree() })
      return
    case 'note': {
      if (request.method === 'POST') {
        await serveNoteSave(vault, request, response)
        return
      }
      const path = url.searchParams.get('path') ?? ''
      const note = await vault.note(path)
      if (note === undefined) send(response, 404, { error: 'note not found', path })
      else send(response, 200, note)
      return
    }
    case 'file': {
      const path = url.searchParams.get('path') ?? ''
      const file = await vault.file(path)
      if (file === undefined) send(response, 404, { error: 'file not found', path })
      else send(response, 200, file)
      return
    }
    case 'backlinks': {
      const path = url.searchParams.get('path') ?? ''
      send(response, 200, { items: vault.backlinksOf(path) })
      return
    }
    case 'unlinked': {
      const path = url.searchParams.get('path') ?? ''
      send(response, 200, { items: vault.unlinkedMentions(path) })
      return
    }
    case 'tags':
      send(response, 200, { items: vault.tags() })
      return
    case 'search': {
      const query = url.searchParams.get('q') ?? ''
      send(response, 200, { items: vault.search(query) })
      return
    }
    case 'graph': {
      const center = url.searchParams.get('center') ?? undefined
      const depth = Number(url.searchParams.get('depth') ?? '2')
      const query = url.searchParams.get('q') ?? undefined
      const tag = url.searchParams.get('tag') ?? undefined
      const flag = (name: string, fallback: boolean): boolean => {
        const value = url.searchParams.get(name)
        if (value === null) return fallback
        return value === '1' || value === 'true'
      }
      send(response, 200, vault.graph(center, Number.isFinite(depth) ? depth : 2, 400, {
        ...(query === undefined || query.length === 0 ? {} : { query }),
        ...(tag === undefined || tag.length === 0 ? {} : { tag }),
        includeUnresolved: flag('unresolved', true),
        includeAttachments: flag('attachments', true),
        includeTags: flag('tags', false),
      }))
      return
    }
    case 'create': {
      const body = await readJson(request)
      const path = typeof body['path'] === 'string' ? body['path'] : ''
      const ok = await vault.create(path)
      send(response, ok ? 200 : 400, { ok, path })
      return
    }
    case 'rename': {
      const body = await readJson(request)
      const path = typeof body['path'] === 'string' ? body['path'] : ''
      const name = typeof body['name'] === 'string' ? body['name'] : ''
      if (path.length === 0 || name.length === 0) {
        send(response, 400, { error: 'path and name are required' })
        return
      }
      try {
        await vault.rename(path, name)
        send(response, 200, { ok: true, path })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        const status = /already exists/.test(message) ? 409 : /invalid name/.test(message) ? 400 : 500
        send(response, status, { error: message })
      }
      return
    }
    case 'delete': {
      const body = await readJson(request)
      const path = typeof body['path'] === 'string' ? body['path'] : ''
      if (path.length === 0) {
        send(response, 400, { error: 'path is required' })
        return
      }
      await vault.remove(path)
      send(response, 200, { ok: true, path })
      return
    }
    case 'move': {
      const body = await readJson(request)
      const path = typeof body['path'] === 'string' ? body['path'] : ''
      const to = typeof body['to'] === 'string' ? body['to'] : ''
      if (path.length === 0 || to.length === 0) {
        send(response, 400, { error: 'path and to are required' })
        return
      }
      try {
        const result = await vault.move(path, to)
        send(response, 200, { ok: true, ...result })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        const status = /already exists/.test(message) ? 409 : /into itself/.test(message) ? 400 : 500
        send(response, status, { error: message })
      }
      return
    }
    case 'mkdir': {
      const body = await readJson(request)
      const path = typeof body['path'] === 'string' ? body['path'] : ''
      if (path.length === 0) {
        send(response, 400, { error: 'path is required' })
        return
      }
      await vault.makeFolder(path)
      send(response, 200, { ok: true, path })
      return
    }
    case 'asset': {
      const path = url.searchParams.get('path') ?? ''
      const asset = await vault.readAsset(path)
      if (asset === undefined) {
        send(response, 404, { error: 'asset not found', path })
        return
      }
      const download = url.searchParams.get('download') === '1'
      response.writeHead(200, {
        'content-type': CONTENT_TYPES[extensionOf(path)] ?? 'application/octet-stream',
        'cache-control': 'no-cache',
        ...(download ? { 'content-disposition': dispositionOf(path) } : {}),
      })
      response.end(Buffer.from(asset))
      return
    }
    case 'pur/store-image': {
      const body = await readJson(request)
      const name = typeof body['name'] === 'string' ? body['name'] : 'image.png'
      const dataUrl = typeof body['dataUrl'] === 'string' ? body['dataUrl'] : ''
      if (dataUrl.length === 0) {
        send(response, 400, { error: 'dataUrl is required' })
        return
      }
      const root = registry.active()?.path ?? registry.vault.status().root
      const files = new VaultFiles(root)
      const path = await storePurImage({
        readBytes: candidate => files.readBytes(candidate).catch(() => undefined),
        writeBytes: (candidate, bytes) => files.writeBytes(candidate, bytes),
      }, name, dataUrl)
      if (path === undefined) {
        send(response, 400, { error: 'unsupported data URL' })
        return
      }
      send(response, 200, { path })
      return
    }
    case 'pur/image': {
      const canvas = url.searchParams.get('canvas') ?? ''
      const file = url.searchParams.get('file') ?? ''
      if (canvas.length === 0 || file.length === 0) {
        send(response, 400, { error: 'canvas and file are required' })
        return
      }
      // Read through the file service, not the index: a canvas saved a moment ago
      // is not indexed yet but its references must still resolve.
      const root = registry.active()?.path ?? registry.vault.status().root
      const files = new VaultFiles(root)
      const image = await resolvePurImage({
        readText: path => files.readText(path).catch(() => undefined),
        readBytes: path => files.readBytes(path).catch(() => undefined),
        locate: fileName => locateVaultFile(vault, fileName),
      }, canvas, file)
      if (image === undefined) {
        send(response, 404, { error: 'pur image not found', canvas, file })
        return
      }
      response.writeHead(200, { 'content-type': image.contentType, 'cache-control': 'no-cache' })
      response.end(image.bytes)
      return
    }
    case 'note-open': {      const body = await readJson(request)
      const path = typeof body['path'] === 'string' ? body['path'] : ''
      if (path.length === 0) {
        send(response, 400, { error: 'path is required' })
        return
      }
      void logNoteOpen(path)
      send(response, 200, { ok: true, path })
      return
    }
    default:
      send(response, 404, { error: 'unknown route', route })
  }
}
/**
 * Find one vault file by base name, for canvases that live in a subfolder.
 * @param vault - index over the active vault.
 * @param fileName - base name including the extension.
 * @returns the vault-relative path, or undefined when the name is absent.
 */
function locateVaultFile(vault: VaultIndex, fileName: string): string | undefined {
  const walk = (nodes: ReadonlyArray<{ readonly kind: string; readonly path: string; readonly children?: readonly unknown[] }>): string | undefined => {
    for (const node of nodes) {
      if (node.kind === 'file') {
        if (node.path === fileName || node.path.endsWith(`/${fileName}`)) return node.path
        continue
      }
      const nested = walk((node.children ?? []) as ReadonlyArray<{ readonly kind: string; readonly path: string; readonly children?: readonly unknown[] }>)
      if (nested !== undefined) return nested
    }
    return undefined
  }
  return walk(vault.tree() as never)
}
