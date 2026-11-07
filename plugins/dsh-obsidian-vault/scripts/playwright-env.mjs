/**
 * Resolve Playwright for the development scripts without pinning a machine path.
 *
 * Order: PLAYWRIGHT_MODULE (explicit override) → a workspace install → the pnpm
 * store used by this checkout. Fails with instructions instead of a file-URL
 * error when none is available.
 * @module dsh-obsidian-vault/scripts/playwright-env
 */
import { existsSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, '..', '..', '..')

/** Try one module specifier or path. */
async function attempt(specifier) {
  try {
    return await import(specifier)
  } catch {
    return null
  }
}

let module = await attempt('playwright')
if (module === null && process.env.PLAYWRIGHT_MODULE !== undefined) {
  module = await attempt(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href)
}
if (module === null) {
  // pnpm keeps Playwright in the virtual store when no direct dependency exists.
  const store = join(repoRoot, 'node_modules', '.pnpm')
  if (existsSync(store)) {
    const dir = readdirSync(store).find(name => name.startsWith('playwright@'))
    if (dir !== undefined) {
      module = await attempt(pathToFileURL(join(store, dir, 'node_modules', 'playwright', 'index.mjs')).href)
    }
  }
}

if (module === null || module.chromium === undefined) {
  throw new Error(
    'Playwright is required for this script. Install it (pnpm add -D playwright) or set '
    + 'PLAYWRIGHT_MODULE to the absolute path of playwright/index.mjs.',
  )
}

export const { chromium } = module
