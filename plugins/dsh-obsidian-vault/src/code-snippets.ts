/**
 * The user's code-node snippets: the library that replaces keeping code as vault
 * notes. It lives in the plugin's own data folder, never in the knowledge base,
 * so a snippet is tooling data rather than a document.
 * @module dsh-obsidian-vault/code-snippets
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

/** One saved code node: the template the menu inserts. */
export interface CodeSnippet {
  /** Stable id, generated on save. */
  readonly id: string
  /** Card title, shown in the menu. */
  readonly title: string
  /** Body of `function process(inputs)`. */
  readonly code: string
  /** Input pins, in order. */
  readonly inputs: readonly { readonly id: string; readonly label: string }[]
  /** Output pins, in order. */
  readonly outputs: readonly { readonly id: string; readonly label: string }[]
}

/** File shape on disk. */
interface SnippetFile {
  readonly version: 1
  readonly nodes: readonly CodeSnippet[]
}

/** Current file format version. */
const VERSION = 1

/**
 * Path of the snippet file inside one data folder.
 * @param dataFolder - plugin data folder.
 * @returns absolute path.
 */
export function snippetFile(dataFolder: string): string {
  return join(dataFolder, 'code-nodes.json')
}

/**
 * Read the snippet library; a missing or damaged file reads as empty.
 * @param dataFolder - plugin data folder.
 * @returns the saved snippets.
 */
export async function readCodeSnippets(dataFolder: string): Promise<readonly CodeSnippet[]> {
  try {
    const text = await readFile(snippetFile(dataFolder), 'utf8')
    const parsed: unknown = JSON.parse(text)
    if (typeof parsed !== 'object' || parsed === null) return []
    const nodes = (parsed as { nodes?: unknown }).nodes
    if (!Array.isArray(nodes)) return []
    return nodes.filter(isSnippet)
  } catch {
    return []
  }
}

/**
 * Replace one snippet, or append it when it is new.
 * @param dataFolder - plugin data folder.
 * @param snippet - the snippet to store.
 * @returns the library after the write.
 */
export async function saveCodeSnippet(dataFolder: string, snippet: CodeSnippet): Promise<readonly CodeSnippet[]> {
  const current = await readCodeSnippets(dataFolder)
  const next = current.some((entry) => entry.id === snippet.id)
    ? current.map((entry) => (entry.id === snippet.id ? snippet : entry))
    : [...current, snippet]
  await writeLibrary(dataFolder, next)
  return next
}

/**
 * Remove one snippet by id.
 * @param dataFolder - plugin data folder.
 * @param id - snippet id.
 * @returns the library after the removal.
 */
export async function deleteCodeSnippet(dataFolder: string, id: string): Promise<readonly CodeSnippet[]> {
  const next = (await readCodeSnippets(dataFolder)).filter((entry) => entry.id !== id)
  await writeLibrary(dataFolder, next)
  return next
}

/**
 * Write the whole library, creating the folder on first use.
 * @param dataFolder - plugin data folder.
 * @param nodes - snippets to persist.
 */
async function writeLibrary(dataFolder: string, nodes: readonly CodeSnippet[]): Promise<void> {
  const file = snippetFile(dataFolder)
  await mkdir(dirname(file), { recursive: true })
  const body: SnippetFile = { version: VERSION, nodes }
  await writeFile(file, JSON.stringify(body, null, 2), 'utf8')
}

/**
 * Whether one parsed value is a snippet.
 * @param value - candidate.
 * @returns true when the required fields are present.
 */
function isSnippet(value: unknown): value is CodeSnippet {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return typeof record['id'] === 'string' && typeof record['title'] === 'string' && typeof record['code'] === 'string'
    && Array.isArray(record['inputs']) && Array.isArray(record['outputs'])
}
