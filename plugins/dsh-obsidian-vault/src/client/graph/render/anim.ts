/**
 * Animation primitives mirroring Obsidian's graph renderer (`mQ`/`vQ` in
 * app.js): one first-order exponential smoother drives every animated value,
 * scalars and colours alike. At 60 fps the default factor 0.9 is a ~150 ms
 * time constant.
 * @module dsh-obsidian-vault/graph/render/anim
 */

/** One RGB triplet. */
export type Rgb = readonly [number, number, number]

/**
 * Advance one frame of exponential smoothing.
 * @param current - current value.
 * @param target - value to approach.
 * @param factor - retention per frame; 0.9 keeps 90 % of the distance.
 * @returns the smoothed value.
 */
export function damp(current: number, target: number, factor = 0.9): number {
  return current * factor + target * (1 - factor)
}

/** True once a damped value is close enough to snap to its target. */
export function settled(current: number, target: number, epsilon = 0.005): boolean {
  return Math.abs(current - target) <= epsilon
}

const colorCache = new Map<string, Rgb | null>()

/**
 * Parse a CSS colour into RGB channels. Supports `#rgb`, `#rrggbb` and
 * `rgb(r, g, b)`; anything else (unresolvable tokens) yields null so the
 * caller can snap instead of interpolating garbage.
 * @param color - CSS colour string.
 */
export function parseColor(color: string): Rgb | null {
  const cached = colorCache.get(color)
  if (cached !== undefined) return cached
  const parsed = parseColorUncached(color)
  if (colorCache.size > 256) colorCache.clear()
  colorCache.set(color, parsed)
  return parsed
}

function parseColorUncached(color: string): Rgb | null {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim())
  if (hex !== null) {
    const body = hex[1]!
    if (body.length === 3) {
      return [
        parseInt(body[0]! + body[0]!, 16),
        parseInt(body[1]! + body[1]!, 16),
        parseInt(body[2]! + body[2]!, 16),
      ]
    }
    return [
      parseInt(body.slice(0, 2), 16),
      parseInt(body.slice(2, 4), 16),
      parseInt(body.slice(4, 6), 16),
    ]
  }
  const rgb = /^rgb\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*\)$/i.exec(color.trim())
  if (rgb !== null) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
  return null
}

/**
 * Interpolate two colours channel by channel and format the result. Channels
 * keep one decimal so repeated damping converges instead of stalling on
 * integer rounding.
 * @param current - start colour.
 * @param target - colour to approach.
 * @param factor - retention per frame, see {@link damp}.
 * @returns the interpolated `rgb()` string, or `target` when unparsable.
 */
export function dampColor(current: string, target: string, factor = 0.9): string {
  if (current === target) return target
  const from = parseColor(current)
  const to = parseColor(target)
  if (from === null || to === null) return target
  const r = damp(from[0], to[0], factor)
  const g = damp(from[1], to[1], factor)
  const b = damp(from[2], to[2], factor)
  if (settled(r, to[0], 0.6) && settled(g, to[1], 0.6) && settled(b, to[2], 0.6)) return target
  return `rgb(${r.toFixed(1)}, ${g.toFixed(1)}, ${b.toFixed(1)})`
}
