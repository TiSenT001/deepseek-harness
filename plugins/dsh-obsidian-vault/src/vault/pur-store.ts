/**
 * Canvas image assets, owned by the plugin instead of the vault. The knowledge
 * base stays a preview surface: it reads images through the plugin's own route
 * and never gains attachment files of its own.
 * @module dsh-obsidian-vault/vault/pur-store
 */
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

/** Scheme an element's `original` uses to name one plugin-owned asset. */
export const PUR_ASSET_SCHEME = 'pur-asset:'

/**
 * Store one data URL under the plugin's asset folder.
 * @param folder - absolute asset directory.
 * @param name - source file name, used for the extension.
 * @param dataUrl - base64 data URL.
 * @returns the asset id, or undefined when the payload is not a base64 data URL.
 */
export async function storePurImage(folder: string, name: string, dataUrl: string): Promise<string | undefined> {
  const decoded = decodeDataUrl(dataUrl)
  if (decoded === undefined) return undefined
  const id = assetId(decoded.bytes, decoded.extension.length > 0 ? decoded.extension : extensionOf(name))
  await mkdir(folder, { recursive: true })
  const target = join(folder, id)
  try {
    await readFile(target)
    return id
  } catch {
    // Absent: fall through and write it.
  }
  await writeFile(target, decoded.bytes)
  return id
}

/**
 * Read one stored asset.
 * @param folder - absolute asset directory.
 * @param id - asset id from an element reference.
 * @returns the bytes, or undefined when the id is absent or malformed.
 */
export async function readPurImage(folder: string, id: string): Promise<Buffer | undefined> {
  if (!/^[0-9a-f]{16}\.[a-z0-9]{1,8}$/.test(id)) return undefined
  try {
    return await readFile(join(folder, id))
  } catch {
    return undefined
  }
}

/** Whether an element's `original` names a plugin-owned asset. @param original - element reference. */
export function isPurAsset(original: string): boolean {
  return original.startsWith(PUR_ASSET_SCHEME)
}

/** The asset id inside a `pur-asset:` reference. @param original - element reference. */
export function purAssetId(original: string): string {
  return original.slice(PUR_ASSET_SCHEME.length)
}

/** Content address for one blob. @param bytes - content. @param extension - without the dot. */
function assetId(bytes: Buffer, extension: string): string {
  const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 16)
  const safe = extension.toLowerCase().replace(/[^a-z0-9]/g, '')
  return safe.length === 0 ? hash : `${hash}.${safe}`
}

/** Decode a base64 data URL. @param dataUrl - the data URL. */
function decodeDataUrl(dataUrl: string): { bytes: Buffer; extension: string } | undefined {
  const comma = dataUrl.indexOf(',')
  if (!dataUrl.startsWith('data:') || comma < 0) return undefined
  const meta = dataUrl.slice(5, comma)
  if (!meta.endsWith(';base64')) return undefined
  const mime = meta.slice(0, -';base64'.length)
  try {
    return { bytes: Buffer.from(dataUrl.slice(comma + 1), 'base64'), extension: extensionOfMime(mime) }
  } catch {
    return undefined
  }
}

/** Extension for a MIME type, empty when unknown. @param mime - `image/png` and friends. */
function extensionOfMime(mime: string): string {
  const subtype = mime.slice(mime.indexOf('/') + 1)
  if (subtype === 'jpeg') return 'jpg'
  if (subtype === 'svg+xml') return 'svg'
  return /^[a-z0-9]+$/.test(subtype) ? subtype : ''
}

/** Lowercase extension of a file name, or an empty string. @param name - file name. */
function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.')
  if (dot < 0 || dot === name.length - 1) return ''
  return name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '')
}


/**
 * Store raw picture bytes under their content address.
 * @param folder - asset folder.
 * @param name - source name, used for the extension.
 * @param bytes - picture bytes.
 * @returns the asset id, or undefined when the bytes carry no known type.
 */
export async function storePurBytes(folder: string, name: string, bytes: Uint8Array): Promise<string | undefined> {
  const buffer = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const id = assetId(buffer, extensionOf(name))
  await mkdir(folder, { recursive: true })
  const target = join(folder, id)
  try {
    await readFile(target)
    return id
  } catch {
    // Absent: write it below.
  }
  await writeFile(target, buffer)
  return id
}
