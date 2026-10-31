/**
 * Content-addressed attachment naming for imported media: the leading content
 * hash characters, a hyphen, then the sanitized source file name. Identical
 * bytes therefore resolve to one vault path instead of accumulating `_N`
 * suffixes. No DOM, Obsidian or Node APIs.
 * @module dsh-obsidian-vault/pur-kernel/attachment-name
 */

/** Number of leading hash characters an attachment name carries. */
const HASH_PREFIX_LENGTH = 8

/** Characters a vault file name cannot hold on the platforms Obsidian runs on. */
const ILLEGAL_NAME_CHARS = /[<>:"/\\|?*\u0000-\u001f\u007f]/g

/** Name used when the source carries nothing addressable. */
const FALLBACK_NAME = 'image.png'

/**
 * Replace characters a vault file name cannot hold.
 * @param name - source file name, possibly carrying an extension.
 * @returns the name with every illegal character replaced by `_` and outer
 *   whitespace trimmed; {@link FALLBACK_NAME} when nothing addressable remains.
 */
function sanitizeFileName(name: string): string {
  const safe = name.replace(ILLEGAL_NAME_CHARS, '_').trim()
  return safe === '' ? FALLBACK_NAME : safe
}

/**
 * Content-addressed vault file name: the leading hash characters, a hyphen,
 * then the sanitized source name with its extension unchanged.
 * @param baseName - source file name, extension included.
 * @param hash - hex-encoded content hash of the bytes; only the leading
 *   characters are used, so full-length digests pass straight through.
 * @returns the file name to write under the attachment folder.
 */
export function attachmentName(baseName: string, hash: string): string {
  return `${hash.slice(0, HASH_PREFIX_LENGTH)}-${sanitizeFileName(baseName)}`
}
