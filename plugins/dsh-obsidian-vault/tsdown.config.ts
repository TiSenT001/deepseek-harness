﻿import type { UserConfig } from 'tsdown'

/** Package id baked into the browser bundle registration. */
const PLUGIN_ID = 'dsh-obsidian-vault'

/**
 * Module-table identities the browser half requests instead of bundling them.
 * Every entry is a shell-seeded platform module, so the plugin never ships a
 * second React or a second Markdown renderer.
 */
const CLIENT_EXTERNALS = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/cordis',
]

const hostBundle: UserConfig = {
  entry: { index: 'src/index.ts' },
  outDir: 'lib',
  format: 'esm',
  platform: 'node',
  dts: false,
  sourcemap: true,
  clean: false,
  outputOptions: { entryFileNames: 'index.js' },
}

const clientBundle: UserConfig = {
  entry: { client: 'src/client/index.tsx' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  dts: false,
  sourcemap: true,
  clean: false,
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
  },
  deps: {
    neverBundle: [...CLIENT_EXTERNALS],
    alwaysBundle: (id: string) => !CLIENT_EXTERNALS.includes(id),
  },
  outputOptions: {
    entryFileNames: 'client.js',
    banner: 'window.__ModuleLoader__.load({ id: ' + JSON.stringify(PLUGIN_ID) + ', factory: (require) => {',
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
    codeSplitting: false,
  },
}

const workerBundle: UserConfig = {
  entry: { worker: 'src/client/graph/simulation.worker.ts' },
  outDir: 'lib',
  format: 'iife',
  platform: 'browser',
  dts: false,
  sourcemap: true,
  clean: false,
  outputOptions: { entryFileNames: 'worker.js' },
}

const shimBundle: UserConfig = {
  entry: { shim: 'src/shim/index.ts' },
  outDir: 'lib',
  format: 'iife',
  platform: 'browser',
  dts: false,
  sourcemap: true,
  clean: false,
  outputOptions: { entryFileNames: 'shim.js' },
}

const obsidianBundle: UserConfig = {
  entry: { 'pur-obsidian': 'src/pur-obsidian/index.ts' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'node',
  dts: false,
  sourcemap: true,
  clean: false,
  deps: { neverBundle: ['obsidian'] },
  outputOptions: { entryFileNames: 'pur-obsidian.js', exports: 'default' },
}

export default [hostBundle, clientBundle, workerBundle, shimBundle, obsidianBundle] satisfies UserConfig[]
