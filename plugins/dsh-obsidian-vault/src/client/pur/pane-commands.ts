/**
 * The palette's Pur pane registry: while a `.PurStudio` pane has its document
 * loaded it registers its command verbs here, keyed by document path, and the
 * command palette projects them into entries. Kept React-free so the store is
 * testable and usable from any surface.
 * @module dsh-obsidian-vault/client/pur/pane-commands
 */
import type { PurController, PurControllerEffect, PurMenuHost } from '../../pur-kernel/index.ts'
import type { PurMenuHostDeps } from './host.ts'
import { exportMarkdownFlow } from './host-export.ts'

/** Fixed file name of the no-prompt Markdown export command, mirroring upstream. */
const COMMAND_EXPORT_NAME = 'pur-studio-export'

/** One Pur pane's palette-facing verbs. */
export interface PurPaneHandlers {
  /** Create a fresh canvas without prompting and open it. */
  readonly newCanvas: () => void
  /** Save the document under a prompted new name. */
  readonly saveStudioAs: () => void
  /** Export the full canvas as Markdown without prompting, under the fixed name. */
  readonly exportMarkdown: () => void
  /** Pop the canvas out; degrades to the unsupported notice in this client. */
  readonly popout: () => void
  readonly undo: () => void
  readonly redo: () => void
  readonly selectAll: () => void
  readonly copy: () => void
  readonly paste: () => void
  readonly deleteSelection: () => void
  readonly group: () => void
  readonly ungroup: () => void
  readonly duplicate: () => void
  readonly fitView: () => void
}

const listeners = new Set<() => void>()
const panes = new Map<string, PurPaneHandlers>()
let pathsSnapshot: readonly string[] = []

/**
 * Register one pane's verbs.
 * @param path - the pane's document path.
 * @param handlers - the verbs the palette dispatches to.
 * @returns the disposer removing the pane's commands (on unmount or path change).
 */
export function registerPurPaneCommands(path: string, handlers: PurPaneHandlers): () => void {
  // Re-registering the same path (the pane's effect re-runs when a prop changes
  // identity) must not notify: the path set did not change, and notifying would
  // re-render the palette holder, which re-runs the effect — an update loop
  // React aborts with "Maximum update depth exceeded".
  const first = !panes.has(path)
  panes.set(path, handlers)
  if (first) {
    pathsSnapshot = [...panes.keys()]
    for (const listener of listeners) listener()
  }
  return () => {
    if (panes.get(path) !== handlers) return
    panes.delete(path)
    pathsSnapshot = [...panes.keys()]
    for (const listener of listeners) listener()
  }
}

/**
 * The verbs registered for one document path.
 * @param path - the pane's document path.
 * @returns the handlers, or undefined when the pane is not ready or unmounted.
 */
export function getPurPaneHandlers(path: string): PurPaneHandlers | undefined {
  return panes.get(path)
}

/** The registered document paths; the useSyncExternalStore snapshot. @returns the paths. */
export function getPurPanePaths(): readonly string[] {
  return pathsSnapshot
}

/**
 * Subscribe to registry changes.
 * @param listener - called after every registration change.
 * @returns the unsubscribe function.
 */
export function subscribePurPaneCommands(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * Build one pane's verbs over its live controller and menu host references.
 * Controller verbs drain through `run`, mirroring the pane's event handlers.
 * @param controller - resolves the live controller, or null before load.
 * @param hostDeps - resolves the menu host context, or null before load.
 * @param menuHost - the pane's menu host.
 * @param run - drains controller effects into the pane's sink.
 * @returns the handlers to register.
 */
export function createPurPaneHandlers(
  controller: () => PurController | null,
  hostDeps: () => PurMenuHostDeps | null,
  menuHost: PurMenuHost,
  run: (effects: readonly PurControllerEffect[]) => void,
): PurPaneHandlers {
  const dispatch = (effects: (c: PurController) => readonly PurControllerEffect[]): void => {
    const c = controller()
    if (c !== null) run(effects(c))
  }
  return {
    newCanvas: () => menuHost.newCanvas(),
    saveStudioAs: () => menuHost.savePur(),
    exportMarkdown: () => {
      const deps = hostDeps()
      if (deps !== null) void exportMarkdownFlow(deps, false, false, COMMAND_EXPORT_NAME)
    },
    popout: () => menuHost.togglePopout(),
    undo: () => dispatch((c) => c.undo()),
    redo: () => dispatch((c) => c.redo()),
    selectAll: () => dispatch((c) => c.selectAll()),
    copy: () => dispatch((c) => c.copy()),
    paste: () => dispatch((c) => c.paste()),
    deleteSelection: () => dispatch((c) => c.deleteSelection()),
    group: () => dispatch((c) => c.group()),
    ungroup: () => dispatch((c) => c.ungroup()),
    duplicate: () => dispatch((c) => c.duplicate()),
    fitView: () => dispatch((c) => c.fitToView()),
  }
}
