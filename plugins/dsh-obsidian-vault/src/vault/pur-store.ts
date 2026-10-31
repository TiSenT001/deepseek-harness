/**
 * Store one pasted or dropped image in the vault instead of inside the canvas
 * document. The bytes are content-addressed, so pasting the same picture twice
 * reuses one attachment and the `.PurStudio` file keeps only a path.
 * @module dsh-obsidian-vault/vault/pur-store
 */
import { createHash } from 'node:crypto'

/** Root-confined file access for reading and writing attachments. */
export interface PurAssetStore {
  /** @param path - vault-relative path. @returns the bytes, or undefined when absent. */
  readBytes(path: string): Promise<Uint8Array | undefined>
  /** @param path - vault-relative path. @param bytes - content to write. */
  writeBytes(path: string, bytes: Uint8Array): Promise<void>
}

/** Folder Pur-owned attachments land in, keeping every canvas asset under the plugin's area. */
const ATTACHMENT_DIR = 'Pur画布/附件'

/** Store one data URL as a vault attachment, keyed by its content hash. */
export async function storePurImage(
  store: PurAssetStore,
  name: string,
  dataUrl: string,
): Promise<string | undefined> {
  const bytes = decodeDataUrl(dataUrl)
  if (bytes === undefined) return undefined
  const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 16)
  // Content-addressed name: the same bytes always land on one attachment, which
  // is what keeps a repeatedly pasted picture from multiplying in the vault.
  const extension = extensionOf(name)
  const fileName = extension.length === 0 ? hash : `${hash}.${extension}`
  const path = `${ATTACHMENT_DIR}/${fileName}`
  const existing = await store.readBytes(path)
  if (existing !== undefined) return path
  await store.writeBytes(path, bytes)
  return path
}

/** Lowercase extension of a file name, or an empty string. @param name - file name. */
function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  if (dot < 0 || dot === name.length - 1) return ''
  return name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '')
}

/** Decode the base64 payload of a data URL. @param dataUrl - the data URL. @returns bytes. */
function decodeDataUrl(dataUrl: string): Uint8Array | undefined {
  const comma = dataUrl.indexOf(',')
  if (!dataUrl.startsWith('data:') || comma < 0) return undefined
  const meta = dataUrl.slice(5, comma)
  if (!meta.endsWith(';base64')) return undefined
  try {
    return Buffer.from(dataUrl.slice(comma + 1), 'base64')
  } catch {
    return undefined
  }
}
