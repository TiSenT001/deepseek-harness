/**
 * `POST /asset/write`: store one pasted image inside the vault so a note can
 * embed it with a normal wikilink. Only image bytes are accepted, the target
 * folder stays vault-relative, and a timestamp keeps repeated pastes of the
 * same file name from overwriting each other.
 * @module dsh-obsidian-vault/vault/asset-write
 */

/** Folder new pasted images land in when the client names none. */
export const DEFAULT_ASSET_FOLDER = '附件图片'

/** Extensions an image embed can render. */
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif'])

/** Largest accepted paste, in bytes. */
const MAX_BYTES = 25 * 1024 * 1024

/** One image ready to be written. */
export interface AssetWritePlan {
  /** Vault-relative path to write. */
  readonly path: string
  /** Decoded image bytes. */
  readonly bytes: Buffer
}

/** A rejected write, already phrased for the client. */
export interface AssetWriteFailure {
  readonly error: string
}

/**
 * Reject a folder that could escape the vault or name a drive.
 * @param folder - authored folder, possibly with separators.
 * @returns the normalised vault-relative folder, or undefined when invalid.
 */
function folderOf(folder: string): string | undefined {
  const cleaned = folder.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '')
  if (cleaned.length === 0) return undefined
  const parts = cleaned.split('/')
  if (parts.some(part => part.length === 0 || part === '.' || part === '..' || part.includes(':'))) return undefined
  return parts.join('/')
}

/**
 * Keep a file name that is safe on Windows and still readable.
 * @param name - original file name.
 * @returns the sanitised stem without an extension.
 */
function stemOf(name: string): string {
  const base = name.replace(/\\/g, '/').split('/').pop() ?? ''
  const withoutExtension = base.replace(/\.[^.]+$/, '')
  const sanitised = withoutExtension.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').replace(/\s+/g, ' ').trim()
  return sanitised.length === 0 ? '图片' : sanitised.slice(0, 80)
}

/**
 * Read the image extension from a data URL's MIME type.
 * @param mime - MIME type from the data URL.
 * @returns the extension when it is one the renderer accepts.
 */
function extensionOf(mime: string): string | undefined {
  const map: Readonly<Record<string, string>> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/bmp': 'bmp',
    'image/avif': 'avif',
  }
  return map[mime.toLowerCase()]
}

/**
 * Timestamp prefix so two pastes with the same name both survive.
 * @param at - clock reading.
 * @returns `YYYYMMDD-HHmmss`.
 */
function stamp(at: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${at.getFullYear()}${pad(at.getMonth() + 1)}${pad(at.getDate())}-${pad(at.getHours())}${pad(at.getMinutes())}${pad(at.getSeconds())}`
}

/**
 * Validate one `asset/write` request and decode its image.
 * @param body - parsed request body.
 * @param now - clock reading; injectable for tests.
 * @returns the write plan, or the rejection message.
 */
export function planAssetWrite(body: Readonly<Record<string, unknown>>, now: Date = new Date()): AssetWritePlan | AssetWriteFailure {
  const rawName = typeof body['name'] === 'string' ? body['name'] : ''
  const rawData = typeof body['data'] === 'string' ? body['data'] : ''
  const rawFolder = typeof body['folder'] === 'string' && body['folder'].length > 0 ? body['folder'] : DEFAULT_ASSET_FOLDER
  if (rawData.length === 0) return { error: 'data is required' }
  const match = /^data:([^;,]+);base64,(.*)$/s.exec(rawData)
  if (match === null) return { error: 'data must be a base64 image data URL' }
  const extension = extensionOf(match[1] ?? '')
  if (extension === undefined || !IMAGE_EXTENSIONS.has(extension)) return { error: `unsupported image type ${match[1] ?? ''}` }
  const folder = folderOf(rawFolder)
  if (folder === undefined) return { error: 'folder must be a vault-relative directory' }
  let bytes: Buffer
  try {
    bytes = Buffer.from(match[2] ?? '', 'base64')
  } catch {
    return { error: 'data is not valid base64' }
  }
  if (bytes.length === 0) return { error: 'image is empty' }
  if (bytes.length > MAX_BYTES) return { error: `image exceeds ${Math.round(MAX_BYTES / (1024 * 1024))} MB` }
  const path = `${folder}/${stamp(now)}-${stemOf(rawName)}.${extension}`
  return { path, bytes }
}
