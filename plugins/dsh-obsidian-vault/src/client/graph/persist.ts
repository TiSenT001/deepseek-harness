/**
 * Persisting the graph panel against the vault's `.obsidian/graph.json`, so a
 * vault shows the same graph here and in Obsidian. Local storage stays the
 * synchronous first paint; the vault document wins once it loads.
 * @module dsh-obsidian-vault/client/graph/persist
 */
import { readObsidianConfig, writeObsidianConfig } from '../api.ts'
import { graphJsonPatch, settingsPatchFromGraphJson } from './graph-json.ts'
import { mergeGraphSettings, type GraphSettings } from './settings.ts'

/** Coalescing window for graph.json writes; dragging a slider saves once. */
const SAVE_DELAY_MS = 400

/**
 * Read the vault graph settings.
 * @returns the settings `graph.json` specifies, or undefined when the vault
 * has none this plugin recognises.
 */
export async function loadHostGraphSettings(): Promise<GraphSettings | undefined> {
  try {
    const dto = await readObsidianConfig('graph')
    if (dto.value === null) return undefined
    const patch = settingsPatchFromGraphJson(dto.value)
    return Object.keys(patch).length === 0 ? undefined : mergeGraphSettings(patch)
  } catch {
    return undefined
  }
}

/** Debounced writer for the vault's graph.json. */
export interface GraphSettingsSaver {
  /** Queue a write; only the last value in the window reaches disk. */
  save(settings: GraphSettings): void
  /** Clear the pending timer, flushing the last queued value. */
  dispose(): void
}

/**
 * Create a writer scoped to one mounted graph view.
 * @returns the saver; call {@link GraphSettingsSaver.dispose} on unmount.
 */
export function createGraphSettingsSaver(): GraphSettingsSaver {
  let timer: ReturnType<typeof setTimeout> | undefined
  let queued: GraphSettings | undefined
  const flush = (): void => {
    const pending = queued
    queued = undefined
    if (pending === undefined) return
    void writeObsidianConfig('graph', graphJsonPatch(pending)).catch(() => {
      // A read-only vault keeps the local-storage copy; nothing else to do.
    })
  }
  return {
    save(settings) {
      queued = settings
      if (timer !== undefined) return
      timer = setTimeout(() => {
        timer = undefined
        flush()
      }, SAVE_DELAY_MS)
    },
    dispose() {
      if (timer !== undefined) {
        clearTimeout(timer)
        timer = undefined
      }
      flush()
    },
  }
}
