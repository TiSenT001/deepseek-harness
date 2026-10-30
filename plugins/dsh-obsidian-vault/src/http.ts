/**
 * Small HTTP helpers shared by the route modules: JSON responses and body
 * parsing for the Chromium-facing API.
 * @module dsh-obsidian-vault/http
 */
import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * Write one JSON response.
 * @param response - server response to complete.
 * @param status - HTTP status code.
 * @param body - JSON-serializable payload.
 */
export function send(response: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body)
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  response.end(payload)
}

/**
 * Read a request body as a JSON object; malformed or empty bodies become `{}`.
 * @param request - incoming request.
 */
export async function readJson(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  for await (const chunk of request) chunks.push(Buffer.from(chunk as Uint8Array))
  if (chunks.length === 0) return {}
  try {
    const parsed: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : {}
  } catch {
    return {}
  }
}
