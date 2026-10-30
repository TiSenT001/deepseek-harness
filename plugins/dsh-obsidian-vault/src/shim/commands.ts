/**
 * The frame's `app.commands` facade. Obsidian's desktop command ids are absent
 * by design: the browser frame has no window-management commands, so the id map
 * stays empty and callers that gate on membership degrade to the no-desktop
 * branch. Executing a command has no host surface yet and raises.
 * @module dsh-obsidian-vault/shim/commands
 */
import { UnsupportedObsidianApi } from './errors.ts'

/** Obsidian's `app.commands`. */
export class ShimCommands {
  /** Command ids the frame can enumerate; empty, matching the desktop gate. */
  readonly commands: Readonly<Record<string, unknown>> = {}

  /**
   * Run a command by id.
   * @param id - the Obsidian command id.
   * @throws UnsupportedObsidianApi always: the bridge serves no command runner.
   */
  executeCommandById(id: string): void {
    throw new UnsupportedObsidianApi(`commands.executeCommandById(${id})`)
  }
}
