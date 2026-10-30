/**
 * The browser half's only transport: JSON over the plugin's own routes.
 * Split by area into `api-core`, `api-vault`, `api-registry` and
 * `api-plugins`; this module keeps the single import surface callers use.
 * @module dsh-obsidian-vault/client/api
 */
export * from './api-core.ts'
export * from './api-vault.ts'
export * from './api-registry.ts'
export * from './api-plugins.ts'
