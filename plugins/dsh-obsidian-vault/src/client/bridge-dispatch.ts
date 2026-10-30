/**
 * The bridge's method dispatch: one pure function mapping a frame's request to
 * the vault operations the host page performs. Kept free of the network module
 * so unit tests run under Node's strip-only TypeScript mode.
 * @module dsh-obsidian-vault/client/bridge-dispatch
 */
import type { BridgeFileDto } from '../protocol.ts'
import type { BridgeMethod } from '../bridge-protocol.ts'

/** Vault operations the bridge dispatch calls; injectable for tests. */
export interface BridgeDeps {
  readonly readBinary: (path: string) => Promise<string>
  readonly writeBinary: (path: string, data: string) => Promise<void>
  readonly readText: (path: string) => Promise<string>
  readonly writeText: (path: string, content: string) => Promise<void>
  readonly listFiles: () => Promise<readonly BridgeFileDto[]>
  readonly exists: (path: string) => Promise<boolean>
  readonly loadData: (id: string) => Promise<unknown>
  readonly saveData: (id: string, value: unknown) => Promise<void>
  /** One note's tags as Obsidian's `CachedMetadata.tags`, or null when absent. */
  readonly fileCache: (path: string) => Promise<{ readonly tags: readonly { readonly tag: string }[] } | null>
  /** The host page's active note path, or null when none is open. */
  readonly activeFile: () => string | null
  /** Open a vault path in the host's reading view, replacing the plugin view. */
  readonly openLink: (path: string) => void
}

/**
 * Answer one bridge request.
 * @param method - requested method.
 * @param params - request payload.
 * @param pluginId - the frame's plugin id; `data.json` access is confined to
 * it, whatever `params` claims.
 * @param deps - vault operations the dispatch performs.
 * @returns the result posted back to the frame.
 * @throws Error with `unsupported bridge method` for anything else.
 */
export async function resolveBridgeRequest(
  method: BridgeMethod,
  params: Readonly<Record<string, unknown>> | undefined,
  pluginId: string,
  deps: BridgeDeps,
): Promise<unknown> {
  switch (method) {
    case 'vault.readBinary': {
      const path = params?.['path']
      if (typeof path !== 'string' || path.length === 0) throw new Error('path is required')
      return deps.readBinary(path)
    }
    case 'vault.writeBinary': {
      const path = params?.['path']
      const data = params?.['data']
      if (typeof path !== 'string' || path.length === 0 || typeof data !== 'string') {
        throw new Error('path and data are required')
      }
      await deps.writeBinary(path, data)
      return { ok: true }
    }
    case 'vault.readText': {
      const path = params?.['path']
      if (typeof path !== 'string' || path.length === 0) throw new Error('path is required')
      return deps.readText(path)
    }
    case 'vault.writeText': {
      const path = params?.['path']
      const content = params?.['content']
      if (typeof path !== 'string' || path.length === 0 || typeof content !== 'string') {
        throw new Error('path and content are required')
      }
      await deps.writeText(path, content)
      return { ok: true }
    }
    case 'vault.list':
      return deps.listFiles()
    case 'vault.exists': {
      const path = params?.['path']
      if (typeof path !== 'string' || path.length === 0) throw new Error('path is required')
      return deps.exists(path)
    }
    case 'plugin.loadData':
      return await deps.loadData(pluginId) ?? null
    case 'plugin.saveData':
      await deps.saveData(pluginId, params?.['value'] ?? null)
      return { ok: true }
    case 'metadata.fileCache': {
      const path = params?.['path']
      if (typeof path !== 'string' || path.length === 0) throw new Error('path is required')
      return deps.fileCache(path)
    }
    case 'workspace.getActiveFile':
      return deps.activeFile()
    case 'workspace.openLinkText': {
      const path = params?.['path']
      if (typeof path !== 'string' || path.length === 0) throw new Error('path is required')
      deps.openLink(path)
      return { ok: true }
    }
    default:
      throw new Error(`unsupported bridge method: ${String(method)}`)
  }
}
