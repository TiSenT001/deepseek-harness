/**
 * Obsidian's `normalizePath`: backslashes become `/`, duplicate slashes
 * collapse, and trailing slashes are stripped.
 * @module dsh-obsidian-vault/shim/normalize
 */

/**
 * Normalize a vault path the way Obsidian does.
 * @param path - the raw path.
 * @returns the normalized path.
 */
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/\/{2,}/g, '/').replace(/\/+$/, '')
}
