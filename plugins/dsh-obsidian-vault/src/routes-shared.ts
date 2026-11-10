/**
 * Route-layer plumbing shared by the dispatcher: the mount surface, the
 * connection gate, the attachment content-type table, and the two helpers the
 * asset and note-open routes need.
 * @module dsh-obsidian-vault/routes-shared
 */
import { appendFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

/** The Web carrier surface the route module mounts on. */
export interface RouteHost {
  readonly webServer: {
    register(route: {
      readonly kind: 'prefix'
      readonly path: string
      readonly handler: (request: IncomingMessage, response: ServerResponse) => void | Promise<void>
    }): () => void
  }
  get(name: string): unknown
}

/** Trust decision the connection service supplies for every request. */
export interface TrustGate {
  requestRejection?(request: { readonly headers: IncomingMessage['headers'] }): 401 | 403 | undefined
}

/** Content types served for attachment downloads. */
export const CONTENT_TYPES: Readonly<Record<string, string>> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  ogv: 'video/ogg',
  m4v: 'video/mp4',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  flac: 'audio/flac',
  aac: 'audio/aac',
}

/** 写「笔记打开」事件到 DSH_HOME/logs/note-open.jsonl（统一骨架，brain 侧采集）。 */
export async function logNoteOpen(path: string): Promise<void> {
  const home = process.env.DSH_HOME
  if (!home) return
  const logDir = join(home, 'logs')
  const logPath = join(logDir, 'note-open.jsonl')
  try {
    await mkdir(logDir, { recursive: true })
    const record = JSON.stringify({
      ts: new Date().toISOString(),
      source: 'dsh_note_open',
      event: 'note_open',
      level: 'info',
      path,
    })
    await appendFile(logPath, record + '\n', 'utf8')
  } catch {
    // 日志失败不阻断主流程
  }
}

/**
 * Lower-case extension of a vault path.
 * @param path - vault-relative path.
 * @returns the extension without the dot, or an empty string.
 */
export function extensionOf(path: string): string {
  const dot = path.lastIndexOf('.')
  return dot === -1 ? '' : path.slice(dot + 1).toLowerCase()
}

/**
 * Attachment download header: an ASCII fallback plus the RFC 5987 UTF-8 name.
 * @param path - vault-relative path.
 * @returns the `content-disposition` value.
 */
export function dispositionOf(path: string): string {
  const name = path.slice(path.lastIndexOf('/') + 1)
  const fallback = name.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_')
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(name)}`
}
