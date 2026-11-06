/**
 * Canvas settings the user edits in the plugin's settings dialog. The values live
 * in the plugin's own data folder, override the loader config field by field, and
 * are validated through the same resolver the Loader config uses.
 * @module dsh-obsidian-vault/vault/plugin-settings
 */
import { readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { mkdir } from 'node:fs/promises'
import { DEFAULT_SETTINGS, resolveSettings } from '../settings.ts'
import type { ClientSettings, Settings } from '../settings.ts'

/** Fields the settings dialog may change. */
export interface SettingsPatch {
  /** Vault root; empty keeps auto-detection. Applies on the next start. */
  vault?: string
  /** Directory names skipped while walking. Applies on the next start. */
  ignore?: string[]
  /** Largest note parsed into the index, in bytes. Applies on the next start. */
  maxFileBytes?: number
  /** Total note text kept in memory, in bytes. Applies on the next start. */
  maxIndexBytes?: number
  /** Depth limit for the directory walk. Applies on the next start. */
  maxDepth?: number
  /** Wall-clock limit for one evaluation, in milliseconds. */
  runTimeoutMs?: number
  /** Whether code nodes may run. */
  allowCodeExecution?: boolean
  /** Delay before an edit is written to disk, in milliseconds. */
  saveDelayMs?: number
  /** Embedded-image size that triggers the externalize hint, in MB. */
  largeCanvasHintMb?: number
  /** Initial grid visibility. */
  showGrid?: boolean
}

/** Keys a patch may carry. */
const PATCH_KEYS = ['vault', 'ignore', 'maxFileBytes', 'maxIndexBytes', 'maxDepth', 'runTimeoutMs', 'allowCodeExecution', 'saveDelayMs', 'largeCanvasHintMb', 'showGrid'] as const

/**
 * Keep only the keys the dialog owns, dropping anything else the file may hold.
 * @param value - parsed file contents.
 * @returns the accepted patch; empty when the value is not an object.
 */
export function settingsPatchOf(value: unknown): SettingsPatch {
  if (value === null || typeof value !== 'object') return {}
  const source = value as Record<string, unknown>
  const patch: SettingsPatch = {}
  for (const key of PATCH_KEYS) {
    const entry = source[key]
    if (key === 'allowCodeExecution' || key === 'showGrid') {
      if (typeof entry === 'boolean') patch[key] = entry
      continue
    }
    if (key === 'vault') {
      if (typeof entry === 'string') patch.vault = entry
      continue
    }
    if (key === 'ignore') {
      if (Array.isArray(entry)) patch.ignore = entry.filter((item): item is string => typeof item === 'string')
      continue
    }
    if (typeof entry === 'number' && Number.isFinite(entry)) patch[key] = entry
  }
  return patch
}

/**
 * Read the saved patch, tolerating a missing or malformed file.
 * @param file - settings file path.
 * @returns the stored patch, empty when there is none.
 */
export async function readSettingsPatch(file: string): Promise<SettingsPatch> {
  try {
    return settingsPatchOf(JSON.parse(await readFile(file, 'utf8')))
  } catch {
    // A missing or broken file simply means "no overrides yet".
    return {}
  }
}

/**
 * Merge loader config with the saved patch: the dialog wins field by field.
 * @param loaderConfig - config the Loader handed to the plugin.
 * @param patch - saved overrides.
 * @returns the effective settings.
 */
export function mergeSettings(loaderConfig: unknown, patch: SettingsPatch): Settings {
  const base = loaderConfig !== null && typeof loaderConfig === 'object' ? (loaderConfig as Record<string, unknown>) : {}
  return resolveSettings({ ...base, ...patch })
}

/**
 * Persist a patch, creating the data folder when needed.
 * @param file - settings file path.
 * @param patch - values to store; empty fields are written as given.
 * @returns the stored patch.
 */
export async function writeSettingsPatch(file: string, patch: SettingsPatch): Promise<SettingsPatch> {
  const next = settingsPatchOf(patch)
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
  return next
}

/**
 * The fields the settings dialog displays: effective values plus the defaults it
 * can reset to.
 * @param settings - effective settings.
 * @returns the dialog payload.
 */
export interface SettingsDialog extends ClientSettings {
  /** Vault root; empty means auto-detect. */
  vault: string
  /** Directory names skipped while walking. */
  ignore: string[]
  /** Largest note parsed into the index, in bytes. */
  maxFileBytes: number
  /** Total note text kept in memory, in bytes. */
  maxIndexBytes: number
  /** Depth limit for the directory walk. */
  maxDepth: number
  /** Values the dialog's reset offers. */
  defaults: SettingsPatch
}

/**
 * The fields the settings dialog displays.
 * @param settings - effective settings.
 * @returns the dialog payload.
 */
export function settingsDialogOf(settings: Settings): SettingsDialog {
  return {
    vault: settings.vault,
    ignore: [...settings.ignore],
    maxFileBytes: settings.maxFileBytes,
    maxIndexBytes: settings.maxIndexBytes,
    maxDepth: settings.maxDepth,
    runTimeoutMs: settings.runTimeoutMs,
    saveDelayMs: settings.saveDelayMs,
    largeCanvasHintMb: settings.largeCanvasHintMb,
    showGrid: settings.showGrid,
    allowCodeExecution: settings.allowCodeExecution,
    defaults: {
      vault: DEFAULT_SETTINGS.vault,
      ignore: [...DEFAULT_SETTINGS.ignore],
      maxFileBytes: DEFAULT_SETTINGS.maxFileBytes,
      maxIndexBytes: DEFAULT_SETTINGS.maxIndexBytes,
      maxDepth: DEFAULT_SETTINGS.maxDepth,
      runTimeoutMs: DEFAULT_SETTINGS.runTimeoutMs,
      allowCodeExecution: DEFAULT_SETTINGS.allowCodeExecution,
      saveDelayMs: DEFAULT_SETTINGS.saveDelayMs,
      largeCanvasHintMb: DEFAULT_SETTINGS.largeCanvasHintMb,
      showGrid: DEFAULT_SETTINGS.showGrid,
    },
  }
}
