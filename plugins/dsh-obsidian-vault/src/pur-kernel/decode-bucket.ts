/**
 * Decode resolution: a picture drawn small does not need its full bitmap, so the
 * renderer asks for a scaled decode and the cache keys it separately. This keeps a
 * board of large references from holding tens of megabytes per card.
 * @module dsh-obsidian-vault/pur-kernel/decode-bucket
 */

/**
 * Widths a zoomed-out picture may be decoded at, smallest first. The cap keeps the
 * scaled decode below the size of a typical original, so this path never spends
 * more memory than the plain decode it replaces.
 */
export const DECODE_BUCKETS = [256, 512] as const

/** Extra pixels per drawn pixel, so a slight zoom step does not look soft. */
const HEADROOM = 1.5

/**
 * Pick the decode width for a card drawn at the given screen width.
 * @param screenWidth - card width in canvas pixels.
 * @returns the bucket width, or undefined when the picture needs full resolution.
 */
export function decodeBucket(screenWidth: number): number | undefined {
  if (!Number.isFinite(screenWidth) || screenWidth <= 0) return undefined
  const needed = screenWidth * HEADROOM
  for (const bucket of DECODE_BUCKETS) {
    if (bucket >= needed) return bucket
  }
  return undefined
}

/**
 * Cache key for one decode resolution.
 * @param key - the picture's own cache key.
 * @param bucket - decode width, or undefined for full resolution.
 * @returns the key to look up and to request.
 */
export function bucketedKey(key: string, bucket: number | undefined): string {
  return bucket === undefined ? key : `${key}#w=${bucket}`
}

/**
 * Split a cache key back into its picture and decode width.
 * @param key - a key produced by {@link bucketedKey}.
 * @returns the base key and the width, when one was encoded.
 */
export function splitBucketedKey(key: string): { base: string; width?: number } {
  const marker = key.lastIndexOf('#w=')
  if (marker < 0) return { base: key }
  const width = Number(key.slice(marker + 3))
  if (!Number.isFinite(width) || width <= 0) return { base: key }
  return { base: key.slice(0, marker), width }
}
