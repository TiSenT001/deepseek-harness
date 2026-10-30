/**
 * Transport core: the shared fetch wrapper and the error it throws.
 * @module dsh-obsidian-vault/client/api-core
 */
import { API_BASE } from '../protocol.ts'

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
