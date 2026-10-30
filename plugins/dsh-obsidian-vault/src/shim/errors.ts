/**
 * The error every blocked API raises inside the plugin frame. The plugin's own
 * try/catch degrades on it; uncaught ones surface in the host's frame error bar.
 * @module dsh-obsidian-vault/shim/errors
 */

/** Thrown when plugin code touches an API the bridge does not emulate. */
export class UnsupportedObsidianApi extends Error {
  /** @param label - the blocked surface, e.g. `child_process.exec`. */
  constructor(label: string) {
    super(`unsupported obsidian api in the DSH bridge: ${label}`)
    this.name = 'UnsupportedObsidianApi'
  }
}
