/**
 * Ahead-of-time picture loading. Panning into a picture that has not been decoded
 * yet costs a frame, so while the canvas is idle the pictures just outside the
 * viewport are warmed first.
 * @module dsh-obsidian-vault/pur-kernel/prefetch
 */
import type { PurElement, PurViewState } from './types.ts'

/** How far outside the viewport, in screen pixels, a picture is still warmed. */
export const PREFETCH_MARGIN = 600

/** Most keys one prefetch pass asks for, so a huge canvas cannot flood the queue. */
export const PREFETCH_LIMIT = 24

/**
 * Collect the cache keys of pictures near the viewport, nearest last edge first.
 * @param elements - the element tree.
 * @param view - pan and zoom.
 * @param width - canvas width in screen pixels.
 * @param height - canvas height in screen pixels.
 * @returns keys to decode, at most `PREFETCH_LIMIT`.
 */
export function prefetchKeys(
  elements: readonly PurElement[],
  view: PurViewState,
  width: number,
  height: number,
): string[] {
  const keys: string[] = []
  const visit = (nodes: readonly PurElement[], parentX: number, parentY: number): void => {
    for (const element of nodes) {
      const x = parentX + (element.x ?? 0)
      const y = parentY + (element.y ?? 0)
      if (element.type === 'group') {
        visit(element.children, x, y)
        continue
      }
      if (element.type !== 'image') continue
      const left = x * view.scale + view.offsetX
      const top = y * view.scale + view.offsetY
      const right = left + (element.w ?? 0) * view.scale
      const bottom = top + (element.h ?? 0) * view.scale
      const inside = right >= -PREFETCH_MARGIN
        && left <= width + PREFETCH_MARGIN
        && bottom >= -PREFETCH_MARGIN
        && top <= height + PREFETCH_MARGIN
      if (!inside) continue
      const key = element.dataURL || element.original
      if (key !== '') keys.push(key)
      if (element.thumb !== undefined) keys.push(element.thumb)
      if (keys.length >= PREFETCH_LIMIT) return
    }
  }
  visit(elements, 0, 0)
  return keys.slice(0, PREFETCH_LIMIT)
}
