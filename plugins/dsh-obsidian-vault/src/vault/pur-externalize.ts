/**
 * Move the images a canvas carries inline into the vault. Old documents store
 * every picture as a base64 `dataURL`, which is what makes a moodboard canvas
 * 120 MB; rewriting them as `附件/<hash>.<ext>` references keeps the same
 * pixels and shrinks the document to its layout.
 * @module dsh-obsidian-vault/vault/pur-externalize
 */
import { parseStudioDocument, serializeStudioDocument } from '../pur-kernel/studio-file.ts'
import type { PurElement } from '../pur-kernel/types.ts'
import { storePurImage, type PurAssetStore } from './pur-store.ts'

/** What one externalization pass changed. */
export interface ExternalizeResult {
  /** Images rewritten to a stored path. */
  readonly replaced: number
  /** Document bytes before and after, for the report. */
  readonly before: number
  readonly after: number
  /** Backup written beside the document. */
  readonly backup: string
}

/** Root-confined document access. */
export interface PurDocumentStore extends PurAssetStore {
  /** @param path - vault-relative path. @returns the text, or undefined when absent. */
  readText(path: string): Promise<string | undefined>
  /** @param path - vault-relative path. @param text - content to write. */
  writeText(path: string, text: string): Promise<void>
}

/**
 * Externalize every inline image of one canvas document.
 * @param store - document and attachment access.
 * @param path - vault-relative `.PurStudio` path.
 * @returns the change report, or undefined when the document cannot be read.
 */
export async function externalizeCanvas(
  store: PurDocumentStore,
  path: string,
): Promise<ExternalizeResult | undefined> {
  const text = await store.readText(path)
  if (text === undefined) return undefined
  const document = parseStudioDocument(text)
  const replaced = await externalizeElements(store, document.elements, path)
  if (replaced === 0) {
    return { replaced: 0, before: text.length, after: text.length, backup: '' }
  }
  const backup = `${path}.bak`
  await store.writeText(backup, text)
  const next = serializeStudioDocument({ elements: document.elements, viewState: document.viewState })
  await store.writeText(path, next)
  return { replaced, before: text.length, after: next.length, backup }
}

/**
 * Rewrite the inline images of one element list, recursing into groups.
 * @param store - attachment access.
 * @param elements - the element tree, mutated in place.
 * @param path - owning document, for the attachment extension.
 * @returns how many images were rewritten.
 */
async function externalizeElements(store: PurAssetStore, elements: PurElement[], path: string): Promise<number> {
  let replaced = 0
  for (const element of elements) {
    if (element.type === 'group') {
      replaced += await externalizeElements(store, element.children, path)
      continue
    }
    if (element.type !== 'image') continue
    const dataURL = element.dataURL
    if (dataURL === undefined || !dataURL.startsWith('data:')) continue
    const name = element.original.length > 0 ? element.original : `${baseName(path)}.png`
    const stored = await storePurImage(store, name, dataURL)
    if (stored === undefined) continue
    element.original = stored
    delete element.dataURL
    replaced += 1
  }
  return replaced
}

/** File name without folders or extension. @param path - vault-relative path. */
function baseName(path: string): string {
  const file = path.slice(path.lastIndexOf('/') + 1)
  const dot = file.lastIndexOf('.')
  return dot < 0 ? file : file.slice(0, dot)
}
