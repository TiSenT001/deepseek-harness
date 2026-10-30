/**
 * The postMessage contract between a sandboxed plugin frame and the host page.
 * The frame runs with an opaque origin (`sandbox="allow-scripts"`, no
 * same-origin), so every message is plain JSON tagged with its sender. Requests
 * flow frame → host, responses and events host → frame, and events frame →
 * host. The host rejects methods it does not serve.
 * @module dsh-obsidian-vault/bridge-protocol
 */

/** `source` tag on messages the frame sends. */
export const FRAME_SOURCE = 'ov-bridge'

/** `source` tag on messages the host page sends. */
export const HOST_SOURCE = 'ov-bridge-host'

/** The plugin id the bridge runtime is built for first. */
export const PUR_STUDIO_PLUGIN_ID = 'pur-studio'

/** Bridge calls the host serves. */
export type BridgeMethod =
  | 'vault.readBinary'
  | 'vault.writeBinary'
  | 'vault.readText'
  | 'vault.writeText'
  | 'vault.list'
  | 'vault.exists'
  | 'plugin.loadData'
  | 'plugin.saveData'
  | 'metadata.fileCache'
  | 'workspace.getActiveFile'
  | 'workspace.openLinkText'

/** One frame → host call. */
export interface BridgeRequest {
  readonly source: typeof FRAME_SOURCE
  readonly kind: 'request'
  /** Correlates the response; unique per frame lifetime. */
  readonly id: number
  readonly method: BridgeMethod
  readonly params?: Readonly<Record<string, unknown>>
}

/** One frame → host notification; nothing is returned. */
export interface BridgeEvent {
  readonly source: typeof FRAME_SOURCE
  readonly kind: 'event'
  /** `frame.ready`, `frame.error`, and later workspace events. */
  readonly event: string
  readonly params?: Readonly<Record<string, unknown>>
}

/** One host → frame answer to a request. */
export interface BridgeResponse {
  readonly source: typeof HOST_SOURCE
  readonly kind: 'response'
  readonly id: number
  readonly result?: unknown
  /** Error text when the call failed; `result` is absent then. */
  readonly error?: string
}

/** One host → frame notification, e.g. a palette command the frame registered. */
export interface HostEvent {
  readonly source: typeof HOST_SOURCE
  readonly kind: 'event'
  /** `command.run`; further workspace events land with P9-4. */
  readonly event: string
  readonly params?: Readonly<Record<string, unknown>>
}

/** Every message the host page may send. */
export type HostMessage = BridgeResponse | HostEvent

/** Every message the frame may send. */
export type FrameMessage = BridgeRequest | BridgeEvent

/** Whether a message event payload is a frame message worth answering. */
export function isFrameMessage(value: unknown): value is FrameMessage {
  if (typeof value !== 'object' || value === null) return false
  const message = value as { readonly source?: unknown; readonly kind?: unknown }
  return message.source === FRAME_SOURCE && (message.kind === 'request' || message.kind === 'event')
}
