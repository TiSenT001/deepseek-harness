/**
 * Lazy package-local chunk entry for the Pur Studio pane. The main client
 * loads it through the module loader's `require.async` only when a
 * `.PurStudio` document is opened.
 * @module dsh-obsidian-vault/client/pur/pur-chunk
 */
export { PurStudioPane, type PurStudioPaneProps } from './PurStudioPane.tsx'
