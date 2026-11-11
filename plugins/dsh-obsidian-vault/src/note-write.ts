/**
 * `POST /note`: the one write path for the editor. The route parses the body
 * and forwards the index's verdict so a stale editor sees 409 instead of
 * silently overwriting a file another program changed.
 * @module dsh-obsidian-vault/note-write
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import { snapshotNote } from './history-store.ts'
import { readJson, send } from './http.ts'
import type { VaultIndex } from './vault/index.ts'

/**
 * Save one note.
 * @param vault - live index owning the file.
 * @param request - request carrying `{ path, content, baseMtime? }`.
 * @param response - response completed with the save outcome.
 */
export async function serveNoteSave(
  vault: VaultIndex,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const body = await readJson(request)
  const path = typeof body['path'] === 'string' ? body['path'] : ''
  const content = typeof body['content'] === 'string' ? body['content'] : undefined
  if (path.length === 0 || content === undefined) {
    send(response, 400, { error: 'path and content are required' })
    return
  }
  const rawBase = body['baseMtime']
  const baseMtime = typeof rawBase === 'number' && Number.isFinite(rawBase) ? rawBase : undefined
  const previous = await vault.readSource(path)
  const result = await vault.saveNote(path, content, baseMtime)
  if (result.ok && previous !== undefined && previous !== content) {
    // Fire-and-forget: recovery snapshots must not delay or fail the save.
    void snapshotNote(vault.absoluteRoot, path, previous).catch(() => undefined)
  }
  if (result.ok) send(response, 200, result)
  else send(response, result.status, result)
}
