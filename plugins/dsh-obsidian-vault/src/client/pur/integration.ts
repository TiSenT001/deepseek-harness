/**
 * The canvas's public surface for the vault workspace: the one module the
 * workspace may import. Everything else under `client/pur` is private to the
 * canvas and must not be reached from `client/ui`.
 * @module dsh-obsidian-vault/client/pur/integration
 */
export type { PurStudioPaneProps } from './PurStudioPane.tsx'
export {
  createPurPaneHandlers,
  getPurPaneHandlers,
  getPurPanePaths,
  registerPurPaneCommands,
  subscribePurPaneCommands,
  type PurPaneHandlers,
} from './pane-commands.ts'
