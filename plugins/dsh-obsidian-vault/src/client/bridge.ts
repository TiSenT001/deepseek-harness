/**
 * The host page's half of the plugin bridge: it listens for a sandboxed
 * frame's postMessage requests, answers them through the JSON API, and posts
 * the responses back. The dispatch itself lives in `bridge-dispatch.ts`.
 * @module dsh-obsidian-vault/client/bridge
 */
import {
  HOST_SOURCE,
  isFrameMessage,
  type HostMessage,
} from '../bridge-protocol.ts'
import {
  bridgeExists,
  bridgeListFiles,
  bridgeReadBinary,
  bridgeReadPluginData,
  bridgeReadText,
  bridgeWriteBinary,
  bridgeWritePluginData,
  bridgeWriteText,
  fetchNote,
} from './api.ts'
import { resolveBridgeRequest, type BridgeDeps } from './bridge-dispatch.ts'

/** The dispatch's network operations, wired to the plugin's JSON API. */
export const BRIDGE_API_DEPS = {
  readBinary: bridgeReadBinary,
  writeBinary: bridgeWriteBinary,
  readText: bridgeReadText,
  writeText: bridgeWriteText,
  listFiles: bridgeListFiles,
  exists: bridgeExists,
  loadData: bridgeReadPluginData,
  saveData: bridgeWritePluginData,
  fileCache: async (path: string) => {
    // A missing or unreadable note reads as "not indexed", which is what
    // Obsidian's cache returns before a file enters the index.
    const note = await fetchNote(path).catch(() => null)
    if (note === null) return null
    // Obsidian's tag cache carries the `#` prefix; the host index stores bare
    // tags, so the adapter adds it back.
    return { tags: note.tags.map(tag => ({ tag: tag.startsWith('#') ? tag : `#${tag}` })) }
  },
} as const

/** Handle to one attached bridge: teardown plus the host → frame channel. */
export interface PluginBridgeHandle {
  /** Remove the message listener. */
  readonly dispose: () => void
  /**
   * Post a host event to the frame, e.g. `command.run` for a palette command.
   * @param event - event name.
   * @param params - event payload.
   */
  readonly notify: (event: string, params?: Readonly<Record<string, unknown>>) => void
}

/**
 * Answer one sandboxed frame's messages until the handle is disposed. Messages
 * from any other source window are ignored.
 * @param frame - the plugin iframe.
 * @param pluginId - the frame's plugin id.
 * @param onEvent - sink for frame events (`frame.ready`, `frame.error`,
 * `commands.register`).
 * @param deps - vault operations plus the host-state callbacks.
 * @returns the bridge handle.
 */
export function attachPluginBridge(
  frame: HTMLIFrameElement,
  pluginId: string,
  onEvent: (event: string, params: Readonly<Record<string, unknown>> | undefined) => void,
  deps: BridgeDeps,
): PluginBridgeHandle {
  const post = (message: HostMessage): void => {
    frame.contentWindow?.postMessage(message, '*')
  }
  const listener = (event: MessageEvent): void => {
    if (event.source !== frame.contentWindow) return
    const data: unknown = event.data
    if (!isFrameMessage(data)) return
    if (data.kind === 'event') {
      onEvent(data.event, data.params)
      return
    }
    void resolveBridgeRequest(data.method, data.params, pluginId, deps)
      .then(result => post({ source: HOST_SOURCE, kind: 'response', id: data.id, result }))
      .catch((cause: unknown) => post({
        source: HOST_SOURCE,
        kind: 'response',
        id: data.id,
        error: cause instanceof Error ? cause.message : String(cause),
      }))
  }
  window.addEventListener('message', listener)
  return {
    dispose: () => window.removeEventListener('message', listener),
    notify: (event, params) => post({ source: HOST_SOURCE, kind: 'event', event, params }),
  }
}
