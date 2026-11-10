/**
 * The Chromium-facing JSON API: `/obsidian/api/*`. The route layer only
 * parses requests, rejects untrusted callers, and shapes responses; every
 * answer comes from the vault index.
 * @module dsh-obsidian-vault/routes
 */
import { readFile, appendFile, mkdir } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { readJson, send } from './http.ts'
import { API_BASE } from './protocol.ts'
import { serveBridgeRoute } from './bridge-endpoints.ts'
import { serveNoteSave } from './note-write.ts'
import { serveConfigRoute } from './config-endpoints.ts'
import { servePluginRoute } from './plugin-endpoints.ts'
import { VaultFiles } from './vault/files.ts'
import { planAssetWrite } from './vault/asset-write.ts'
import { rewriteTag, validTagName } from './vault/tag-rewrite.ts'
import { renderPdf } from './pdf-export.ts'
import { resolvePurImage } from './vault/pur-image.ts'
import { PACKAGE_ROOT, PLUGIN_DATA_FOLDER, PUR_ASSETS_FOLDER, SETTINGS_FILE } from './package-root.ts'
import { launchProgram, listOpenPrograms, resolveOpenTarget } from './system-open.ts'
import { deleteCodeSnippet, readCodeSnippets, saveCodeSnippet } from './code-snippets.ts'
import { importNativePur, importZipPur, isZipPur } from './vault/pur-import.ts'
import { storePurBytes } from './vault/pur-store.ts'
import type { CodeSnippet } from './code-snippets.ts'
import { findEmbeddingNotes } from './vault/pur-embedders.ts'
import { externalizeCanvas } from './vault/pur-externalize.ts'
import { mergeSettings, readSettingsPatch, settingsDialogOf, writeSettingsPatch } from './vault/plugin-settings.ts'
import { clientSettings } from './settings.ts'
import { runCodeSnippet } from './vault/run-code.ts'
import { PUR_ASSET_SCHEME, readPurImage, storePurImage } from './vault/pur-store.ts'
import { serveVaultRoute } from './vault-endpoints.ts'
import { readStoredViewMemory, writeStoredViewMemory } from './view-memory-store.ts'
import type { VaultIndex } from './vault/index.ts'
import type { VaultRegistry } from './vault/registry.ts'
import { CONTENT_TYPES, dispositionOf, extensionOf, logNoteOpen } from './routes-shared.ts'
import type { RouteHost, TrustGate } from './routes-shared.ts'
import type { Settings } from './settings.ts'

/** Bundle the standalone popout page loads, shipped next to the workspace one. */
const POPOUT_BUNDLE = join(PACKAGE_ROOT, 'lib', 'popout.js')
export type { RouteHost } from './routes-shared.ts'


/**
 * Mount the vault API on the Web carrier.
 * @param host - plugin context exposes the carrier and the connection gate.
 * @param registry - live vault registry the routes read and switch.
 * @returns the disposer removing every route.
 */
export function mountVaultRoutes(host: RouteHost, registry: VaultRegistry, settings: Settings): () => void {
  const gate = host.get('connection') as TrustGate | undefined
  const handler = (request: IncomingMessage, response: ServerResponse): Promise<void> =>
    serve(host, registry, gate, settings, request, response)
  return host.webServer.register({ kind: 'prefix', path: API_BASE, handler })
}

async function serve(
  host: RouteHost,
  registry: VaultRegistry,
  gate: TrustGate | undefined,
  settings: Settings,
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
    await dispatch(host, registry, route, url, request, response, settings)
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
  settings: Settings,
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
    case 'view-memory': {
      if (request.method === 'POST') {
        const body = await readJson(request) as { readonly root?: unknown; readonly memory?: unknown }
        if (typeof body.root !== 'string' || body.root.length === 0) {
          send(response, 400, { error: 'root is required' })
          return
        }
        await writeStoredViewMemory(body.root, body.memory)
        send(response, 200, { ok: true })
        return
      }
      const root = url.searchParams.get('root') ?? ''
      send(response, 200, { memory: await readStoredViewMemory(root) ?? null })
      return
    }
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
    case 'tags/rename': {
      if (request.method !== 'POST') {
        send(response, 405, { error: 'POST required' })
        return
      }
      const body = await readJson(request)
      const from = typeof body['from'] === 'string' ? validTagName(body['from']) : undefined
      const to = typeof body['to'] === 'string' ? validTagName(body['to']) : undefined
      if (from === undefined || to === undefined) {
        send(response, 400, { error: 'valid from and to tags are required' })
        return
      }
      const dryRun = body['dryRun'] === true
      const pending: Array<{ path: string; source: string; count: number }> = []
      let matches = 0
      for (const path of vault.paths) {
        const source = await vault.readSource(path)
        if (source === undefined) continue
        const rewrite = rewriteTag(source, from, to)
        if (rewrite.count === 0) continue
        pending.push({ path, source: rewrite.source, count: rewrite.count })
        matches += rewrite.count
      }
      if (dryRun) {
        send(response, 200, {
          files: pending.length,
          matches,
          changes: pending.slice(0, 20).map(change => ({ path: change.path, count: change.count })),
        })
        return
      }
      const failures: Array<{ path: string; error: string }> = []
      let files = 0
      for (const change of pending) {
        const result = await vault.saveNote(change.path, change.source)
        if (result.ok) files += 1
        else failures.push({ path: change.path, error: 'save rejected' })
      }
      send(response, 200, { files, matches, failures })
      return
    }
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
    case 'asset/write': {
      // Pasted images land in the vault so a note can embed them with a normal
      // wikilink; the client sends a data URL, the Host owns the file name.
      if (request.method !== 'POST') {
        send(response, 405, { error: 'POST required' })
        return
      }
      const body = await readJson(request)
      const plan = planAssetWrite(body)
      if ('error' in plan) {
        send(response, 400, plan)
        return
      }
      const root = registry.active()?.path ?? registry.vault.status().root
      await new VaultFiles(root).writeBytes(plan.path, plan.bytes)
      send(response, 200, { path: plan.path })
      return
    }
    case 'pdf': {
      // Export path: render the same standalone document the print window shows.
      if (request.method !== 'POST') {
        send(response, 405, { error: 'POST required' })
        return
      }
      const body = await readJson(request)
      const html = typeof body['html'] === 'string' ? body['html'] : ''
      if (html.length === 0) {
        send(response, 400, { error: 'html is required' })
        return
      }
      const host = request.headers.host ?? '127.0.0.1:3080'
      const origin = host.startsWith('http') ? host : `http://${host}`
      const paper = typeof body['paper'] === 'string' ? body['paper'] : undefined
      const orientation = body['orientation'] === 'portrait' || body['orientation'] === 'landscape'
        ? body['orientation']
        : undefined
      const margins = body['margins'] === 'default' || body['margins'] === 'narrow' || body['margins'] === 'wide' || body['margins'] === 'none'
        ? body['margins']
        : undefined
      const pdf = await renderPdf(html, request.headers.cookie, origin, {
        ...(paper === undefined ? {} : { paper }),
        ...(orientation === undefined ? {} : { orientation }),
        ...(margins === undefined ? {} : { margins }),
        ...(body['pageNumbers'] === true ? { pageNumbers: true } : {}),
        ...(body['backgrounds'] === false ? { backgrounds: false } : {}),
      })
      if (pdf === undefined) {
        send(response, 501, { error: 'pdf renderer unavailable' })
        return
      }
      response.writeHead(200, {
        'content-type': 'application/pdf',
        'content-disposition': 'attachment; filename="note.pdf"',
        'cache-control': 'no-store',
      })
      response.end(pdf)
      return
    }
    case 'pur/embedders': {
      const canvas = url.searchParams.get('canvas') ?? ''
      const file = url.searchParams.get('file') ?? ''
      if (canvas.length === 0 || file.length === 0) {
        send(response, 400, { error: 'canvas and file are required' })
        return
      }
      const notes = await findEmbeddingNotes(vault, canvas, file)
      send(response, 200, { notes })
      return
    }
    case 'pur/settings': {
      // The dialog's saved overrides win field by field over the Loader config.
      const stored = await readSettingsPatch(SETTINGS_FILE)
      const effective = mergeSettings(settings, stored)
      if (request.method === 'POST') {
        const body = await readJson(request)
        // A section submits only the fields it owns, so merge instead of
        // replacing: the canvas form and the vault/index form write the same file.
        const saved = await writeSettingsPatch(SETTINGS_FILE, { ...stored, ...body })
        send(response, 200, settingsDialogOf(mergeSettings(settings, saved)))
        return
      }
      send(response, 200, settingsDialogOf(effective))
      return
    }
    case 'pur/run-code': {
      const effective = mergeSettings(settings, await readSettingsPatch(SETTINGS_FILE))
      if (!effective.allowCodeExecution) {
        send(response, 403, { error: 'code execution is disabled in the plugin settings' })
        return
      }
      const body = await readJson(request)
      const code = typeof body['code'] === 'string' ? body['code'] : ''
      const result = runCodeSnippet(code, body['inputs'], effective.runTimeoutMs)
      send(response, 200, result)
      return
    }
    case 'pur/externalize': {
      const body = await readJson(request)
      const path = typeof body['path'] === 'string' ? body['path'] : ''
      if (path.length === 0 || !/\.PurStudio$/i.test(path)) {
        send(response, 400, { error: 'path must name a .PurStudio document', path })
        return
      }
      const root = registry.active()?.path ?? registry.vault.status().root
      const files = new VaultFiles(root)
      const result = await externalizeCanvas(PUR_ASSETS_FOLDER, {
        readText: candidate => files.readText(candidate).catch(() => undefined),
        writeText: (candidate, text) => files.writeText(candidate, text),
      }, path)
      if (result === undefined) {
        send(response, 404, { error: 'canvas not found', path })
        return
      }
      send(response, 200, result)
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
      const id = await storePurImage(PUR_ASSETS_FOLDER, name, dataUrl)
      if (id === undefined) {
        send(response, 400, { error: 'unsupported data URL' })
        return
      }
      send(response, 200, { id, ref: `${PUR_ASSET_SCHEME}${id}` })
      return
    }
    case 'pur/asset': {
      const id = url.searchParams.get('id') ?? ''
      const bytes = await readPurImage(PUR_ASSETS_FOLDER, id)
      if (bytes === undefined) {
        send(response, 404, { error: 'asset not found', id })
        return
      }
      response.writeHead(200, {
        'content-type': CONTENT_TYPES[extensionOf(id)] ?? 'application/octet-stream',
        'cache-control': 'no-cache',
      })
      response.end(bytes)
      return
    }    case 'pur/image': {
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
    case 'pur/import': {
      const body = await readJson(request)
      const name = typeof body['name'] === 'string' ? body['name'] : 'canvas.pur'
      const data = typeof body['data'] === 'string' ? body['data'] : ''
      if (data.length === 0) {
        send(response, 400, { error: 'data is required' })
        return
      }
      const bytes = Buffer.from(data, 'base64')
      const store = async (entryName: string, entryBytes: Uint8Array): Promise<string | undefined> => {
        const id = await storePurBytes(PUR_ASSETS_FOLDER, entryName, entryBytes)
        return id === undefined ? undefined : `${PUR_ASSET_SCHEME}${id}`
      }
      if (!isZipPur(bytes)) {
        // The native container stores each picture as a length-prefixed PNG or
        // JPEG; the scene coordinates stay unread, so the layout is approximate.
        const native = await importNativePur(bytes, store)
        send(response, 200, { elements: native.elements, unsupported: [], approximate: !native.placed, skipped: native.skipped })
        return
      }
      const result = await importZipPur(bytes, store)
      send(response, 200, { elements: result.elements, unsupported: result.unsupported, approximate: false })
      return
    }
    case 'pur/code-nodes': {
      if (request.method === 'GET') {
        send(response, 200, { nodes: await readCodeSnippets(PLUGIN_DATA_FOLDER) })
        return
      }
      // The snippet library is plugin data, never vault content, so these writes
      // stay out of the note index entirely.
      const body = await readJson(request)
      const action = body['action'] === 'delete' ? 'delete' : 'save'
      if (action === 'delete') {
        const id = typeof body['id'] === 'string' ? body['id'] : ''
        if (id.length === 0) {
          send(response, 400, { error: 'id is required' })
          return
        }
        send(response, 200, { nodes: await deleteCodeSnippet(PLUGIN_DATA_FOLDER, id) })
        return
      }
      const snippet = body['node']
      if (typeof snippet !== 'object' || snippet === null) {
        send(response, 400, { error: 'node is required' })
        return
      }
      const node = snippet as CodeSnippet
      if (typeof node.id !== 'string' || typeof node.title !== 'string' || typeof node.code !== 'string') {
        send(response, 400, { error: 'node needs id, title and code' })
        return
      }
      send(response, 200, { nodes: await saveCodeSnippet(PLUGIN_DATA_FOLDER, node) })
      return
    }
    case 'system/programs': {
      send(response, 200, { programs: await listOpenPrograms() })
      return
    }
    case 'system/open': {
      const body = await readJson(request)
      const target = typeof body['target'] === 'string' ? body['target'] : ''
      const program = typeof body['program'] === 'string' ? body['program'] : 'default'
      if (target.length === 0) {
        send(response, 400, { error: 'target is required' })
        return
      }
      const root = registry.active()?.path ?? registry.vault.status().root
      const absolute = await resolveOpenTarget(target, new VaultFiles(root), PUR_ASSETS_FOLDER)
      if (absolute === undefined) {
        send(response, 404, { error: 'open target not found', target })
        return
      }
      if (!launchProgram(absolute, program)) {
        send(response, 500, { error: 'program failed to start', program })
        return
      }
      send(response, 200, { ok: true, program })
      return
    }
    case 'pur/popout': {
      // A standalone window: the page carries its own token forward so the
      // bundle's asset requests stay authorised, and it loads the popout bundle
      // this plugin ships next to the workspace one.
      const documentPath = url.searchParams.get('path') ?? ''
      const token = url.searchParams.get('token') ?? ''
      if (documentPath.length === 0) {
        send(response, 400, { error: 'path is required' })
        return
      }
      const html = [
        '<!doctype html>',
        '<html lang="zh">',
        '<head>',
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        '<title>Pur Studio</title>',
        '<style>html,body,#root{margin:0;height:100%;background:#1e1e1e;color:#ddd;font-family:system-ui,sans-serif}</style>',
        '</head>',
        '<body><div id="root"></div>',
        `<script src="/obsidian/api/pur/popout-js${token === '' ? '' : `?token=${encodeURIComponent(token)}`}"></script>`,
        '</body>',
        '</html>',
      ].join('')
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
      response.end(html)
      return
    }
    case 'pur/popout-js': {
      // The workspace bundle is loaded by the shell; the popout page is not, so
      // the host serves its bundle directly.
      let script: Buffer
      try {
        script = readFileSync(POPOUT_BUNDLE)
      } catch {
        send(response, 404, { error: 'popout bundle missing', path: POPOUT_BUNDLE })
        return
      }
      response.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-cache' })
      response.end(script)
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
