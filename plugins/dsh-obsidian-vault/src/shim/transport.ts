/**
 * The frame side of the bridge envelope: request/response correlation and the
 * host-event channel. The DOM wiring (parent.postMessage, window message
 * listener) is injected, so the transport is testable under plain Node.
 * @module dsh-obsidian-vault/shim/transport
 */
import {
  FRAME_SOURCE,
  HOST_SOURCE,
  type BridgeMethod,
  type FrameMessage,
  type HostMessage,
} from '../bridge-protocol.ts'

/** The DOM surface the transport needs; injected for tests. */
export interface TransportIO {
  /** Send one frame message to the host page. */
  readonly post: (message: FrameMessage) => void
  /**
   * Subscribe to host messages.
   * @param handler - receives every host-tagged message.
   * @returns the disposer removing the subscription.
   */
  readonly listen: (handler: (message: HostMessage) => void) => () => void
}

/** One pending request's settle callbacks. */
interface Pending {
  readonly resolve: (value: unknown) => void
  readonly reject: (error: Error) => void
}

/** The frame's bridge client. */
export class BridgeTransport {
  private readonly io: TransportIO
  private readonly pending = new Map<number, Pending>()
  private readonly eventHandlers = new Set<(event: string, params: Readonly<Record<string, unknown>> | undefined) => void>()
  private readonly stopListening: () => void
  private nextId = 1

  constructor(io: TransportIO) {
    this.io = io
    this.stopListening = io.listen(message => this.onHostMessage(message))
  }

  /**
   * Call one host-served bridge method.
   * @param method - the method name.
   * @param params - the payload.
   * @returns the host's result; rejects with the host's error text.
   */
  request(method: BridgeMethod, params?: Readonly<Record<string, unknown>>): Promise<unknown> {
    const id = this.nextId
    this.nextId += 1
    return new Promise<unknown>((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.io.post({ source: FRAME_SOURCE, kind: 'request', id, method, params })
    })
  }

  /**
   * Post one frame event to the host; nothing is returned.
   * @param event - event name.
   * @param params - event payload.
   */
  emit(event: string, params?: Readonly<Record<string, unknown>>): void {
    this.io.post({ source: FRAME_SOURCE, kind: 'event', event, params })
  }

  /**
   * Subscribe to host events (`command.run`, and later workspace pushes).
   * @param handler - receives event name and payload.
   * @returns the disposer.
   */
  onEvent(handler: (event: string, params: Readonly<Record<string, unknown>> | undefined) => void): () => void {
    this.eventHandlers.add(handler)
    return () => this.eventHandlers.delete(handler)
  }

  /** Tear down the transport; pending requests reject. */
  dispose(): void {
    this.stopListening()
    for (const pending of this.pending.values()) pending.reject(new Error('bridge disposed'))
    this.pending.clear()
  }

  private onHostMessage(message: HostMessage): void {
    if (message.kind === 'event') {
      for (const handler of this.eventHandlers) handler(message.event, message.params)
      return
    }
    const pending = this.pending.get(message.id)
    if (pending === undefined) return
    this.pending.delete(message.id)
    if (message.error !== undefined) pending.reject(new Error(message.error))
    else pending.resolve(message.result)
  }
}

/**
 * Build the transport over the frame's real window channel.
 * @param frameWindow - the frame's window; posts go to its parent.
 * @returns the live transport.
 */
export function windowTransport(frameWindow: Window): BridgeTransport {
  return new BridgeTransport({
    post: message => frameWindow.parent.postMessage(message, '*'),
    listen: handler => {
      const listener = (event: MessageEvent): void => {
        const data: unknown = event.data
        if (typeof data !== 'object' || data === null) return
        if ((data as { source?: unknown }).source !== HOST_SOURCE) return
        handler(data as HostMessage)
      }
      frameWindow.addEventListener('message', listener)
      return () => frameWindow.removeEventListener('message', listener)
    },
  })
}
