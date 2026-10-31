/**
 * Vault-data endpoints: index status, tree, notes, files, backlinks, tags,
 * search, graph, and the write operations the explorer and editor call.
 * @module dsh-obsidian-vault/client/api-vault
 */
import {
  API_BASE,
  type BacklinkDto, type FileDto, type GraphDto, type NoteDto,
  type SearchHitDto, type StatusDto, type TagCountDto, type TreeNodeDto,
} from '../protocol.ts'
import { request } from './api-core.ts'

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
/**
 * Store one pasted or dropped image as a vault attachment.
 * @param name - the source file name, used for the extension.
 * @param dataUrl - base64 data URL of the bytes.
 * @returns the vault-relative path the canvas should reference.
 */
export async function storeImage(name: string, dataUrl: string): Promise<string> {
  const result = await request<{ path: string }>('pur/store-image', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name, dataUrl }),
  })
  return result.path
}
/** Result of one image externalization pass. */
export interface ExternalizeResultDto {
  readonly replaced: number
  readonly before: number
  readonly after: number
  readonly backup: string
}

/**
 * Move a canvas' inline images into `附件/`.
 * @param path - vault-relative `.PurStudio` path.
 * @returns how many images moved and the document size on both sides.
 */
export function externalizeCanvas(path: string): Promise<ExternalizeResultDto> {
  return request<ExternalizeResultDto>('pur/externalize', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path }),
  })
}
/**
 * Resolve one canvas image reference to a URL the browser can load.
 * @param original - element `original`, either `pur-asset:<id>` or a vault path.
 * @returns the absolute URL.
 */
export function purAssetUrl(original: string): string {
  if (!original.startsWith('pur-asset:')) return assetUrl(original)
  const relative = `${API_BASE}/pur/asset?id=${encodeURIComponent(original.slice('pur-asset:'.length))}`
  return typeof location === 'undefined' ? relative : new URL(relative, location.origin).href
}
/**
 * Notes that embed one canvas image.
 * @param canvas - canvas title as written in the reference.
 * @param file - image file name as written in the reference.
 * @returns vault-relative note paths.
 */
export async function findEmbeddingNotes(canvas: string, file: string): Promise<readonly string[]> {
  const result = await request<{ notes: readonly string[] }>(
    `pur/embedders?canvas=${encodeURIComponent(canvas)}&file=${encodeURIComponent(file)}`,
  )
  return result.notes
}
