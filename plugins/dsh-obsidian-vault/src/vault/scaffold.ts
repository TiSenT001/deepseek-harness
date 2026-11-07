/**
 * Vault scaffolding: a new knowledge base is seeded with the owner's conventions
 * (the same structure, templates and writing rules) instead of an empty folder.
 * The seed only runs for a directory without Markdown files, so opening an
 * existing vault never injects files into it.
 * @module dsh-obsidian-vault/vault/scaffold
 */
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'

/** Result of one seeding attempt. */
export interface ScaffoldResult {
  /** False when the destination already contains Markdown notes. */
  readonly seeded: boolean
  /** Number of files written. */
  readonly files: number
}

/** Placeholder replaced with the vault's display name. */
const NAME = '{{VAULT_NAME}}'
/** Placeholder replaced with the seed date. */
const DATE = '{{DATE}}'

/**
 * Whether a directory already holds Markdown notes, in any subdirectory.
 * @param directory - destination vault root.
 * @returns true when at least one `.md` file exists.
 */
async function hasNotes(directory: string): Promise<boolean> {
  let entries
  try {
    entries = await readdir(directory, { withFileTypes: true })
  } catch {
    return false
  }
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.md')) return true
    if (entry.isDirectory() && entry.name !== '.obsidian' && entry.name !== '.trash') {
      if (await hasNotes(join(directory, entry.name))) return true
    }
  }
  return false
}

/**
 * List every file below a scaffold directory, as vault-relative paths.
 * @param root - scaffold root.
 * @param prefix - accumulated relative path.
 * @returns the relative file paths.
 */
async function listFiles(root: string, prefix = ''): Promise<string[]> {
  const entries = await readdir(join(root, prefix), { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const relative = prefix.length === 0 ? entry.name : `${prefix}/${entry.name}`
    if (entry.isDirectory()) files.push(...await listFiles(root, relative))
    else if (entry.isFile()) files.push(relative)
  }
  return files
}

/** Today's date as `YYYY-MM-DD` in the host's local zone. */
function today(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

/**
 * Seed a vault from the scaffold when the destination has no notes.
 * @param directory - absolute vault root.
 * @param name - display name used in titles and links.
 * @param scaffoldDir - absolute scaffold root (`scaffold/vault`).
 * @returns whether files were written and how many.
 */
export async function seedVault(directory: string, name: string, scaffoldDir: string): Promise<ScaffoldResult> {
  if (await hasNotes(directory)) return { seeded: false, files: 0 }
  const display = name.trim().length > 0 ? name.trim() : basename(directory)
  const safeFile = display.replace(/[\\/:*?"<>|]/g, '-')
  const files = await listFiles(scaffoldDir)
  let written = 0
  for (const relative of files) {
    const targetRelative = relative.split('/').map(part => part.replaceAll(NAME, safeFile)).join('/')
    const target = join(directory, targetRelative)
    const source = await readFile(join(scaffoldDir, relative), 'utf8')
    const content = source.replaceAll(NAME, display).replaceAll(DATE, today())
    await mkdir(dirname(target), { recursive: true })
    try {
      await writeFile(target, content, { encoding: 'utf8', flag: 'wx' })
      written += 1
    } catch (error) {
      // An existing file wins: seeding never overwrites user work.
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
    }
  }
  return { seeded: true, files: written }
}
