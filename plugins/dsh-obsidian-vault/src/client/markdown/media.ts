/**
 * Media embeds Obsidian renders in place: PDF documents, audio, and video.
 * Images stay in the image path; this module only classifies the rest.
 * @module dsh-obsidian-vault/client/markdown/media
 */

/** Kinds of attachment the reading view can embed natively. */
export type MediaKind = 'pdf' | 'audio' | 'video'

const PDF = /\.pdf$/i
const AUDIO = /\.(mp3|wav|m4a|ogg|oga|flac|aac)$/i
const VIDEO = /\.(mp4|webm|mov|ogv|m4v)$/i

/**
 * Classify one attachment path.
 * @param path - vault-relative path.
 * @returns the embed kind, or undefined for anything else.
 */
export function mediaKindOf(path: string): MediaKind | undefined {
  if (PDF.test(path)) return 'pdf'
  if (AUDIO.test(path)) return 'audio'
  if (VIDEO.test(path)) return 'video'
  return undefined
}

/**
 * File name without its directory.
 * @param path - vault-relative path.
 * @returns the last path segment.
 */
export function mediaNameOf(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1)
}
