/**
 * The palette's bridge-command registry: commands a sandboxed plugin frame
 * registered via `addCommand`, merged into the host's command palette while the
 * plugin view is mounted, and removed when it unmounts. Running one posts
 * `command.run` back to the owning frame. Kept React-free so the store is
 * testable and usable from any surface.
 * @module dsh-obsidian-vault/client/bridge-commands
 */

/** One command a bridged plugin registered. */
export interface BridgedCommand {
  readonly pluginId: string
  /** Display name of the plugin, prefixes the palette label. */
  readonly pluginName: string
  /** The plugin-side command id. */
  readonly id: string
  /** The plugin-side command label. */
  readonly name: string
}

const listeners = new Set<() => void>()
const runners = new Map<string, (id: string) => void>()
let commands: readonly BridgedCommand[] = []

/**
 * Replace one plugin's registered commands.
 * @param pluginId - the frame's plugin id.
 * @param pluginName - display name for palette labels.
 * @param list - the plugin's full command list; each registration replaces the
 * previous one, matching how the shim reposts on every `addCommand`.
 * @returns the disposer removing the plugin's commands (on view unmount).
 */
export function registerBridgedCommands(
  pluginId: string,
  pluginName: string,
  list: readonly { readonly id: string; readonly name: string }[],
): () => void {
  commands = [
    ...commands.filter(command => command.pluginId !== pluginId),
    ...list.map(command => ({ pluginId, pluginName, id: command.id, name: command.name })),
  ]
  for (const listener of listeners) listener()
  return () => {
    commands = commands.filter(command => command.pluginId !== pluginId)
    for (const listener of listeners) listener()
  }
}

/**
 * Register the channel that reaches one plugin's frame.
 * @param pluginId - the frame's plugin id.
 * @param runner - posts `command.run` to the frame.
 * @returns the disposer removing the runner.
 */
export function setCommandRunner(pluginId: string, runner: (id: string) => void): () => void {
  runners.set(pluginId, runner)
  return () => runners.delete(pluginId)
}

/**
 * Run one bridged command: the owning frame receives `command.run`.
 * @param command - the palette entry's command.
 */
export function runBridgedCommand(command: BridgedCommand): void {
  runners.get(command.pluginId)?.(command.id)
}

/** The current bridged commands; the useSyncExternalStore snapshot. */
export function getBridgedCommands(): readonly BridgedCommand[] {
  return commands
}

/**
 * Subscribe to registry changes.
 * @param listener - called after every registration change.
 * @returns the unsubscribe function.
 */
export function subscribeBridgedCommands(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
