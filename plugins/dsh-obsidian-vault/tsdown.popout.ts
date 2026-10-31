import type { UserConfig } from 'tsdown'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Standalone canvas window bundle. The plugin itself never depends on React — the
 * shell provides it — so a page without the shell must bundle its own copy. pnpm
 * keeps React outside this package's resolution scope, so the alias table points
 * at the store copies the shell itself uses.
 * @module dsh-obsidian-vault/tsdown.popout
 */

/** Repository root, two levels above this plugin. */
const REPO_ROOT = join(process.cwd(), '..', '..')

/** pnpm store, where the shell's React copies live. */
const STORE = join(REPO_ROOT, 'node_modules', '.pnpm')

/**
 * Resolve one dependency folder inside the pnpm store.
 * @param prefix - folder name prefix, e.g. `react-dom@`.
 * @returns the absolute folder, or undefined when the store has no match.
 */
function storeFolder(prefix: string): string | undefined {
  const candidates = [
    join(STORE, prefix === 'react-dom@' ? 'react-dom@18.3.1_react@18.3.1' : 'react@18.3.1', 'node_modules', prefix.replace(/@.*/, '')),
    join(STORE, 'react@18.3.1', 'node_modules', 'react'),
  ]
  return candidates.find((candidate) => existsSync(candidate))
}

const reactFolder = storeFolder('react@')
const reactDomFolder = storeFolder('react-dom@')

/** Import specifier to on-disk entry, so rolldown can bundle instead of externalize. */
const alias: Record<string, string> = {}
if (reactFolder !== undefined) {
  alias['react'] = join(reactFolder, 'index.js')
  alias['react/jsx-runtime'] = join(reactFolder, 'jsx-runtime.js')
  alias['react/jsx-dev-runtime'] = join(reactFolder, 'jsx-dev-runtime.js')
}
if (reactDomFolder !== undefined) {
  alias['react-dom'] = join(reactDomFolder, 'index.js')
  alias['react-dom/client'] = join(reactDomFolder, 'client.js')
}

const popoutBundle: UserConfig = {
  entry: { popout: 'src/client/popout.tsx' },
  outDir: 'lib',
  format: 'iife',
  platform: 'browser',
  dts: false,
  sourcemap: true,
  clean: false,
  alias,
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
  },
  deps: {
    neverBundle: [],
    alwaysBundle: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client'],
    onlyBundle: false,
  },
  outputOptions: { entryFileNames: 'popout.js' },
}

export default [popoutBundle]
