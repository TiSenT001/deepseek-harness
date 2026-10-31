/**
 * "Open with" support: hand a vault file to a desktop program. The browser cannot
 * start processes, so the host does it behind a fixed allow-list — never an
 * arbitrary command line — and only for files that resolve inside the vault (or
 * a canvas asset this plugin owns).
 * @module dsh-obsidian-vault/system-open
 */
import { spawn } from 'node:child_process'
import { stat } from 'node:fs/promises'
import { join } from 'node:path'
import { PUR_ASSET_SCHEME, readPurImage } from './vault/pur-store.ts'
import type { VaultFiles } from './vault/files.ts'

/** One program the menu may offer. */
export interface OpenProgram {
  /** Stable id the menu and the route use. */
  readonly id: string
  /** Human label, in the user's language. */
  readonly label: string
  /** Whether the program was found on this machine. */
  readonly available: boolean
}

/** The fixed list, in menu order. `default` and `other` always work. */
const CANDIDATES: readonly { id: string; label: string; exe?: string }[] = [
  { id: 'default', label: '系统默认程序' },
  { id: 'photoshop', label: 'Photoshop', exe: 'photoshop.exe' },
  { id: 'wps', label: 'WPS', exe: 'wps.exe' },
  { id: 'mspaint', label: '画图', exe: 'mspaint.exe' },
  { id: 'other', label: '其他程序…' },
]

/** Cache of detected executables, so listing the menu never pays for a spawn twice. */
let detected: Map<string, boolean> | undefined

/**
 * Whether one executable can be found on PATH.
 * @param exe - executable name, extension included.
 * @returns true when `where` resolves it.
 */
async function hasExecutable(exe: string): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn('where', [exe], { windowsHide: true })
    child.on('error', () => resolve(false))
    child.on('close', (code) => resolve(code === 0))
  })
}

/**
 * List the fixed programs with their availability on this machine.
 * @returns the menu entries, `default` and `other` always available.
 */
export async function listOpenPrograms(): Promise<readonly OpenProgram[]> {
  if (detected === undefined) {
    const found = new Map<string, boolean>()
    for (const candidate of CANDIDATES) {
      if (candidate.exe === undefined) {
        found.set(candidate.id, true)
        continue
      }
      found.set(candidate.id, await hasExecutable(candidate.exe))
    }
    detected = found
  }
  return CANDIDATES.map((candidate) => ({
    id: candidate.id,
    label: candidate.label,
    available: detected?.get(candidate.id) ?? false,
  }))
}

/**
 * Resolve a menu target to an absolute file path: a vault path, or a canvas
 * asset id that lives in the plugin's own data folder.
 * @param target - vault-relative path or `pur-asset:<id>`.
 * @param files - vault file service.
 * @param assetsFolder - folder holding canvas assets.
 * @returns the absolute path, or undefined when the target is not a real file.
 */
export async function resolveOpenTarget(
  target: string,
  files: VaultFiles,
  assetsFolder: string,
): Promise<string | undefined> {
  if (target.startsWith(PUR_ASSET_SCHEME)) {
    const id = target.slice(PUR_ASSET_SCHEME.length)
    const bytes = await readPurImage(assetsFolder, id)
    if (bytes === undefined) return undefined
    return join(assetsFolder, id)
  }
  try {
    const absolute = files.absolute(target)
    const info = await stat(absolute)
    return info.isFile() ? absolute : undefined
  } catch {
    return undefined
  }
}

/**
 * Start the program for one file.
 * @param absolutePath - file to open, already validated by {@link resolveOpenTarget}.
 * @param program - one of the {@link listOpenPrograms} ids.
 * @returns true when the process was started.
 */
export function launchProgram(absolutePath: string, program: string): boolean {
  const [command, ...args] = commandFor(absolutePath, program)
  try {
    const child = spawn(command, args, { detached: true, stdio: 'ignore', windowsHide: true })
    child.unref()
    return true
  } catch {
    return false
  }
}

/**
 * Build the command line for one program. Arguments stay separate so a path with
 * spaces or quotes can never inject a second command.
 * @param absolutePath - file to open.
 * @param program - program id.
 * @returns the executable and its arguments.
 */
function commandFor(absolutePath: string, program: string): [string, ...string[]] {
  switch (program) {
    case 'photoshop':
      return ['photoshop.exe', absolutePath]
    case 'wps':
      return ['wps.exe', absolutePath]
    case 'mspaint':
      return ['mspaint.exe', absolutePath]
    case 'other':
      return ['rundll32.exe', 'shell32.dll,OpenAs_RunDLL', absolutePath]
    default:
      return ['rundll32.exe', 'url.dll,FileProtocolHandler', absolutePath]
  }
}
