/**
 * WORKSPACE_STYLE rules, assembled from the shell, reading and panel section
 * files. Splitting the stylesheet keeps every file inside the line budget while
 * the emitted CSS stays byte-identical.
 * @module dsh-obsidian-vault/client/ui/kit/styles/workspace
 */
import { WORKSPACE_SHELL_STYLE } from './workspace-shell.ts'
import { WORKSPACE_NOTE_STYLE } from './workspace-note.ts'
import { WORKSPACE_PANEL_STYLE } from './workspace-panel.ts'

/** WORKSPACE_STYLE rules. */
export const WORKSPACE_STYLE = `${WORKSPACE_SHELL_STYLE}${WORKSPACE_NOTE_STYLE}${WORKSPACE_PANEL_STYLE}
`
