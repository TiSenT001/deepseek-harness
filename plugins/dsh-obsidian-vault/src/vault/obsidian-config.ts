/**
 * The `.obsidian` JSON files Obsidian itself maintains. Reads fall back to
 * `undefined` when a file is absent or unparsable; writes merge the patch into
 * whatever is already on disk, so keys this plugin does not model survive.
 * @module dsh-obsidian-vault/vault/obsidian-config
 */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, resolve as resolvePath } from 'node:path'
import type { ObsidianConfigFile } from '../protocol.ts'

/** Obsidian's configuration folder, relative to the vault root. */
export const CONFIG_DIRECTORY = '.obsidian'

/** Files this plugin is allowed to touch, each stored as `<file>.json`. */
const CONFIG_FILES: readonly ObsidianConfigFile[] = [
  'app',
  'graph',
  'appearance',
  'core-plugins',
  'hotkeys',
  'daily-notes',
  'templates',
  'bookmarks',
  'plugins-bridge',
]

/** Whether a wire value names a configuration file this plugin serves. */
export function isConfigFile(value: unknown): value is ObsidianConfigFile {
  return typeof value === 'string' && (CONFIG_FILES as readonly string[]).includes(value)
}

/**
 * Read one configuration file.
 * @param root - vault directory holding `.obsidian`.
 * @param file - configuration file name without its extension.
 * @returns the parsed document, or `undefined` when absent or unparsable.
 */
export async function readObsidianConfig(
  root: string,
  file: ObsidianConfigFile,
): Promise<unknown> {
  let text: string
  try {
    text = await readFile(configPath(root, file), 'utf8')
  } catch (error) {
    if ((error as { readonly code?: string }).code === 'ENOENT') return undefined
    throw error
  }
  try {
    // Windows editors and PowerShell prepend a UTF-8 BOM; JSON.parse rejects it
    // and every configuration file would silently fall back to its defaults.
    return JSON.parse(text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text)
  } catch {
    // A corrupt document is treated as absent: the caller uses its defaults
    // and the next write replaces the unparsable file.
    return undefined
  }
}

/**
 * Merge a patch into one configuration file and write it back atomically.
 * @param root - vault directory holding `.obsidian`.
 * @param file - configuration file name without its extension.
 * @param patch - values to set; nested objects merge, arrays replace.
 * @returns the document as written.
 */
export async function writeObsidianConfig(
  root: string,
  file: ObsidianConfigFile,
  patch: unknown,
): Promise<unknown> {
  const target = configPath(root, file)
  const previous = await readObsidianConfig(root, file)
  const merged = mergeJson(previous, patch)
  await mkdir(dirname(target), { recursive: true })
  const temporary = `${target}.tmp`
  await writeFile(temporary, `${JSON.stringify(merged, undefined, 2)}\n`, 'utf8')
  await rename(temporary, target)
  return merged
}

/**
 * Deep-merge `patch` over `previous`. Plain objects merge key by key; any other
 * pair, arrays included, replaces wholesale.
 */
export function mergeJson(previous: unknown, patch: unknown): unknown {
  if (!isPlainObject(previous) || !isPlainObject(patch)) return patch
  const merged: Record<string, unknown> = { ...previous }
  for (const [key, value] of Object.entries(patch)) {
    merged[key] = mergeJson(previous[key], value)
  }
  return merged
}

function configPath(root: string, file: ObsidianConfigFile): string {
  return resolvePath(root, CONFIG_DIRECTORY, `${file}.json`)
}

function isPlainObject(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
