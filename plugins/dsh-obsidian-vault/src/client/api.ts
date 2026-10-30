/**
 * The browser half's only transport: JSON over the plugin's own routes.
 * @module dsh-obsidian-vault/client/api
 */
import {
  API_BASE,
  type BacklinkDto, type BridgeFileDto, type FileDto, type GraphDto, type NoteDto, type ObsidianConfigDto, type ObsidianConfigFile,
  type PluginsDto,
  type SearchHitDto, type StatusDto,
  type TagCountDto, type TreeNodeDto, type VaultInspectDto, type VaultListDto, type VaultOpenDto,
} from '../protocol.ts'

/**
 * A failed vault route. Callers that branch on the outcome read `status`
 * instead of parsing the message.
 */
export class ApiError extends Error {
  /** The HTTP status the Host answered with. */
  readonly status: number

  /**
   * @param message - the Host's error text.
   * @param status - the HTTP status the Host answered with.
   */
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * Call one vault route.
 * @param route - path below the API base, including its query string.
 * @param init - optional fetch options.
 * @returns the decoded JSON body.
 * @throws ApiError carrying the Host's message and status when the route fails.
 */
export async function request<T>(route: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}/${route}`, {
    ...init,
    headers: { accept: 'application/json', ...(init?.headers ?? {}) },
    credentials: 'same-origin',
  })
  const body: unknown = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = typeof body === 'object' && body !== null && 'error' in body
      ? String((body as { error: unknown }).error)
      : `HTTP ${response.status}`
    throw new ApiError(message, response.status)
  }
  return body as T
}

/** Read index status. */
export function fetchStatus(): Promise<StatusDto> {
  return request<StatusDto>('status')
}

/** Read the explorer tree. */
export async function fetchTree(): Promise<readonly TreeNodeDto[]> {
  return (await request<{ nodes: readonly TreeNodeDto[] }>('tree')).nodes
}

/** Read one note. */
export function fetchNote(path: string): Promise<NoteDto> {
  return request<NoteDto>(`note?path=${encodeURIComponent(path)}`)
}

/**
 * Read one vault file for the file viewer.
 * @param path - vault-relative path.
 */
export function fetchFile(path: string): Promise<FileDto> {
  return request<FileDto>(`file?path=${encodeURIComponent(path)}`)
}

/**
 * URL that streams one attachment.
 * @param path - vault-relative path.
 * @param download - ask the browser to save instead of display.
 */
export function assetUrl(path: string, download = false): string {
  const query = `path=${encodeURIComponent(path)}`
  return `${API_BASE}/asset?${download ? `${query}&download=1` : query}`
}

/** Read the notes linking to one path. */
export async function fetchBacklinks(path: string): Promise<readonly BacklinkDto[]> {
  return (await request<{ items: readonly BacklinkDto[] }>(`backlinks?path=${encodeURIComponent(path)}`)).items
}

/**
 * Read the notes that mention one note without linking to it.
 * A Host that predates this route answers 404; the panel then shows nothing.
 */
export async function fetchUnlinked(path: string): Promise<readonly BacklinkDto[]> {
  try {
    return (await request<{ items: readonly BacklinkDto[] }>(`unlinked?path=${encodeURIComponent(path)}`)).items
  } catch {
    return []
  }
}

/** Read tag counts. */
export async function fetchTags(): Promise<readonly TagCountDto[]> {
  return (await request<{ items: readonly TagCountDto[] }>('tags')).items
}

/** Search titles, aliases, tags, paths, and content. */
export async function fetchSearch(query: string): Promise<readonly SearchHitDto[]> {
  return (await request<{ items: readonly SearchHitDto[] }>(`search?q=${encodeURIComponent(query)}`)).items
}

/** Graph request filter: query text, tag, and which synthetic node kinds appear. */
export interface GraphFilterRequest {
  readonly query?: string
  readonly tag?: string
  readonly includeUnresolved?: boolean
  readonly includeAttachments?: boolean
  readonly includeTags?: boolean
}

/** Read a local or global graph, optionally filtered. */
export function fetchGraph(
  center: string | undefined,
  depth: number,
  filter: GraphFilterRequest = {},
): Promise<GraphDto> {
  const params = new URLSearchParams({ depth: String(depth) })
  if (center !== undefined) params.set('center', center)
  if (filter.query !== undefined && filter.query.trim().length > 0) params.set('q', filter.query.trim())
  if (filter.tag !== undefined && filter.tag.length > 0) params.set('tag', filter.tag)
  params.set('unresolved', filter.includeUnresolved === false ? '0' : '1')
  params.set('attachments', filter.includeAttachments === false ? '0' : '1')
  params.set('tags', filter.includeTags === true ? '1' : '0')
  return request<GraphDto>(`graph?${params.toString()}`)
}

/**
 * Create an empty note.
 * @param path - vault-relative path ending in `.md`.
 */
export async function createNote(path: string): Promise<boolean> {
  const result = await request<{ ok: boolean }>('create', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path }),
  })
  return result.ok
}

/**
 * Replace one note's text.
 * @param path - vault-relative path.
 * @param content - complete new file text.
 * @param baseMtime - modification time the editor read; a mismatch rejects with 409.
 * @returns the fresh modification time.
 */
export async function saveNote(path: string, content: string, baseMtime?: number): Promise<number> {
  const body = await request<{ mtime: number }>('note', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(baseMtime === undefined ? { path, content } : { path, content, baseMtime }),
  })
  return body.mtime
}

/**
 * Rename one note or folder.
 * @param path - vault-relative path.
 * @param name - new file name (no separators).
 */
export async function renameEntry(path: string, name: string): Promise<void> {
  await request('rename', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path, name }),
  })
}

/**
 * Delete one note or folder.
 * @param path - vault-relative path.
 */
export async function deleteEntry(path: string): Promise<void> {
  await request('delete', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path }),
  })
}

/**
 * Create a folder.
 * @param path - vault-relative folder path.
 */
export async function createFolder(path: string): Promise<void> {
  await request('mkdir', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path }),
  })
}

/**
 * Move one note or folder, rewriting links that pointed at it.
 * @param path - current vault-relative path.
 * @param to - destination vault-relative path.
 */
export async function moveEntry(path: string, to: string): Promise<{ moved: string; rewritten: Array<{ path: string; count: number }> }> {
  return request<{ moved: string; rewritten: Array<{ path: string; count: number }> }>('move', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path, to }),
  })
}

/** 上报「打开笔记」事件到 Host 侧本地日志（fire-and-forget，brain 侧采集）。 */
export async function noteOpen(path: string): Promise<void> {
  try {
    await request('note-open', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path }),
    })
  } catch {
    // 打开上报失败不阻断
  }
}

/** Read the registered vaults and which one is active. */
export function fetchVaults(): Promise<VaultListDto> {
  return request<VaultListDto>('vault/list')
}

/**
 * Probe a candidate vault directory before opening it.
 * @param path - absolute directory.
 */
export function inspectVault(path: string): Promise<VaultInspectDto> {
  return request<VaultInspectDto>(`vault/inspect?path=${encodeURIComponent(path)}`)
}

/**
 * Register and activate a vault directory.
 * @param path - absolute directory.
 * @param init - create `.obsidian` when the folder has none.
 */
export function openVault(path: string, init = false): Promise<VaultOpenDto> {
  return request<VaultOpenDto>('vault/open', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path, init }),
  })
}

/**
 * Create a directory and register it as a vault.
 * @param path - absolute directory.
 * @param name - optional display name.
 */
export function createVault(path: string, name?: string): Promise<VaultOpenDto> {
  return request<VaultOpenDto>('vault/create', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(name === undefined ? { path } : { path, name }),
  })
}

/**
 * Drop one vault from the registry.
 * @param id - registry id.
 * @returns the remaining registry snapshot.
 */
export function forgetVault(id: string): Promise<VaultListDto> {
  return request<VaultListDto>('vault/forget', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id }),
  })
}

/**
 * Read one `.obsidian` configuration file.
 * @param file - configuration file name without its extension.
 * @returns the parsed document, with `null` when the file does not exist.
 */
export function readObsidianConfig(file: ObsidianConfigFile): Promise<ObsidianConfigDto> {
  return request<ObsidianConfigDto>(`config/read?file=${encodeURIComponent(file)}`)
}

/**
 * Merge a patch into one `.obsidian` configuration file.
 * @param file - configuration file name without its extension.
 * @param value - values to set; nested objects merge, arrays replace.
 * @returns the document as written, unknown keys included.
 */
export function writeObsidianConfig(file: ObsidianConfigFile, value: unknown): Promise<ObsidianConfigDto> {
  return request<ObsidianConfigDto>('config/write', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ file, value }),
  })
}

/** Read the DSH-adapted plugins and the built-in plugin states. */
export function fetchPlugins(): Promise<PluginsDto> {
  return request<PluginsDto>('plugins/list')
}

/**
 * Enable or disable one built-in plugin.
 * @param id - core plugin id.
 * @param enabled - desired state.
 * @returns the refreshed inventory.
 */
export function togglePlugin(id: string, enabled: boolean): Promise<PluginsDto> {
  return request<PluginsDto>('plugins/toggle', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id, enabled }),
  })
}

/** Create the DSH plugin folder when missing and open it in the OS file manager. */
export function revealPluginsFolder(): Promise<{ folder: string }> {
  return request<{ folder: string }>('plugins/reveal', { method: 'POST' })
}

/**
 * Allow or forbid one community plugin to run through the bridge.
 * @param id - plugin id.
 * @param enabled - desired state.
 * @returns the refreshed inventory.
 */
export function toggleBridge(id: string, enabled: boolean): Promise<PluginsDto> {
  return request<PluginsDto>('plugins/bridge-toggle', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id, enabled }),
  })
}

/**
 * URL of the sandboxed frame that loads one bridged plugin.
 * @param id - whitelisted plugin id.
 */
export function pluginFrameUrl(id: string): string {
  return `${API_BASE}/plugins/frame?id=${encodeURIComponent(id)}`
}

/**
 * Read one vault file as base64 bytes; parts of the bridge call this for the
 * plugin frame.
 * @param path - vault-relative path.
 */
export async function bridgeReadBinary(path: string): Promise<string> {
  return (await request<{ data: string }>(`bridge/read-binary?path=${encodeURIComponent(path)}`)).data
}

/**
 * Replace one vault file with base64 bytes.
 * @param path - vault-relative path.
 * @param data - base64-encoded content.
 */
export async function bridgeWriteBinary(path: string, data: string): Promise<void> {
  await request('bridge/write-binary', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path, data }),
  })
}

/**
 * Read one bridged plugin's `data.json`.
 * @param id - plugin id; the Host resolves it under `.obsidian/plugins`.
 */
export async function bridgeReadPluginData(id: string): Promise<unknown> {
  return (await request<{ value: unknown }>(`bridge/data?id=${encodeURIComponent(id)}`)).value
}

/**
 * Write one bridged plugin's `data.json`.
 * @param id - plugin id.
 * @param value - JSON-serializable document.
 */
export async function bridgeWritePluginData(id: string, value: unknown): Promise<void> {
  await request('bridge/data', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id, value }),
  })
}

/**
 * Read one vault file as text, on the frame's behalf.
 * @param path - vault-relative path.
 */
export async function bridgeReadText(path: string): Promise<string> {
  return (await request<{ content: string }>(`bridge/read-text?path=${encodeURIComponent(path)}`)).content
}

/**
 * Replace one vault file's text content, on the frame's behalf.
 * @param path - vault-relative path.
 * @param content - new file content.
 */
export async function bridgeWriteText(path: string, content: string): Promise<void> {
  await request('bridge/write-text', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path, content }),
  })
}

/** List every vault file with stats; the frame builds its TFile cache from it. */
export async function bridgeListFiles(): Promise<readonly BridgeFileDto[]> {
  return (await request<{ files: BridgeFileDto[] }>('bridge/list')).files
}

/**
 * Whether one vault path exists, on the frame's behalf.
 * @param path - vault-relative path.
 */
export async function bridgeExists(path: string): Promise<boolean> {
  return (await request<{ exists: boolean }>(`bridge/exists?path=${encodeURIComponent(path)}`)).exists
}
