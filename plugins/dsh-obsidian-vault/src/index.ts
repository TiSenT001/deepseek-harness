/**
 * Host half: resolve the vault, build the index, mount `/obsidian/api`, and
 * keep the index fresh from directory watches.
 * @module dsh-obsidian-vault
 */
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve as resolvePath } from 'node:path'
import { mountVaultRoutes, type RouteHost } from './routes.ts'
import type { FsLike } from './vault/index.ts'
import { VaultRegistry } from './vault/registry.ts'
import { Config, clientSettings, resolveSettings } from './settings.ts'
import type { Settings } from './settings.ts'

/** Cordis plugin name. */
export const name = 'obsidian-vault'

/** Services the Host half needs before it can mount. */
export const inject = ['webServer', 'fs']

export { Config }
export type { Settings }
/** The plugin context members this Host half uses. */
export interface HostContext {
  readonly fs: FsLike
  readonly webServer: RouteHost['webServer']
  get(name: string): unknown
  effect(callback: () => () => void, label?: string): () => void
  logger?: { info?(message: string): void; warn(...args: unknown[]): void }
}

/**
 * Mount the vault workspace.
 * @param ctx - plugin context carrying the filesystem and Web carrier.
 * @param config - optional vault settings.
 */
export async function apply(ctx: HostContext, config?: unknown): Promise<void> {
  const settings = resolveSettings(config)
  const abort = new AbortController()
  const registry = new VaultRegistry(ctx.fs, {
    root: settings.vault.trim().length > 0 ? resolvePath(settings.vault) : detectVault(),
    ignore: settings.ignore,
    maxFileBytes: settings.maxFileBytes,
    maxIndexBytes: settings.maxIndexBytes,
    maxDepth: settings.maxDepth,
  }, {
    storePath: join(dshHome(), 'obsidian-vault', 'vaults.json'),
    emptyVaultPath: join(dshHome(), 'obsidian-vault', 'empty-vault'),
    report: (error) => { ctx.logger?.warn?.(`obsidian-vault: ${error.message}`) },
    signal: abort.signal,
  })

  ctx.effect(() => mountVaultRoutes(ctx as unknown as RouteHost, registry, settings), 'obsidian-vault: routes')
  ctx.effect(() => () => {
    abort.abort()
    void registry.close()
  }, 'obsidian-vault: cleanup')

  // Activation must not reject: a failed scan or watcher would dispose the
  // scope and unmount the routes that were just registered, leaving every API
  // call at 404.
  try {
    await registry.start()
  } catch (error) {
    ctx.logger?.warn?.(`obsidian-vault: initial scan failed: ${messageOf(error)}`)
  }
  const status = registry.vault.status()
  ctx.logger?.info?.(`obsidian-vault: ${status.notes} notes under ${status.root}`)
}

/** Directory the Host keeps its own vault registry under. */
function dshHome(): string {
  const configured = process.env.DSH_HOME
  return configured !== undefined && configured.trim().length > 0 ? resolvePath(configured) : join(homedir(), '.dsh')
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Walk up from the working directory looking for a vault marker. */
function detectVault(): string {
  let directory = process.cwd()
  for (let depth = 0; depth < 6; depth += 1) {
    if (existsSync(join(directory, '.obsidian'))) return directory
    const parent = dirname(directory)
    if (parent === directory) break
    directory = parent
  }
  return process.cwd()
}
