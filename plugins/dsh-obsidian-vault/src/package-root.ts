/**
 * Package-root resolution for host-side paths. The source entry
 * (`src/index.ts`) and the bundled entry (`lib/index.js`) both sit exactly one
 * directory below the package root, so one `..` lands there from either.
 * @module dsh-obsidian-vault/package-root
 */
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Absolute path of the dsh-obsidian-vault package directory. */
export const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Global folder holding the DSH-adapted plugins, shared by every vault. */
export const DSH_PLUGINS_FOLDER = join(PACKAGE_ROOT, 'plugins')

/** Folder holding canvas image assets, owned by the plugin rather than the vault. */
export const PUR_ASSETS_FOLDER = join(PACKAGE_ROOT, '.data', 'images')

/** Plugin-owned data folder: canvas assets and the code snippet library. */
export const PLUGIN_DATA_FOLDER = join(PACKAGE_ROOT, '.data')

/** Canvas settings the plugin's settings dialog writes. */
export const SETTINGS_FILE = join(PLUGIN_DATA_FOLDER, 'settings.json')
