/**
 * Small drawing helpers shared by the render modules: rounded-rectangle paths,
 * canvas-space conversion and hover predicates. All coordinates are canvas
 * pixels unless a parameter says otherwise.
 * @module dsh-obsidian-vault/pur-kernel/render-shared
 */
import type { PurCanvasContext } from './render-types.ts'
import type { PurViewState } from './types.ts'
import { wrapText } from './wrap.ts'

/**
 * Horizontal canvas coordinate of a world x.
 * @param view - pan and zoom.
 * @param worldX - world x.
 * @returns the canvas x.
 */
export function screenX(view: PurViewState, worldX: number): number {
  return worldX * view.scale + view.offsetX
}

/**
 * Vertical canvas coordinate of a world y.
 * @param view - pan and zoom.
 * @param worldY - world y.
 * @returns the canvas y.
 */
export function screenY(view: PurViewState, worldY: number): number {
  return worldY * view.scale + view.offsetY
}

/**
 * Fill a card, using a rounded rectangle when the surface supports one and a
 * plain rectangle otherwise.
 * @param ctx - drawing surface.
 * @param x - left edge.
 * @param y - top edge.
 * @param w - width.
 * @param h - height.
 * @param radius - corner radius.
 */
export function fillRoundedCard(ctx: PurCanvasContext, x: number, y: number, w: number, h: number, radius: number): void {
  if (ctx.roundRect !== undefined) {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, radius)
    ctx.fill()
    return
  }
  ctx.fillRect(x, y, w, h)
}

/**
 * Build a rounded-rectangle path, falling back to tangent arcs where
 * `roundRect` is missing. Starts a new path either way.
 * @param ctx - drawing surface.
 * @param x - left edge.
 * @param y - top edge.
 * @param w - width.
 * @param h - height.
 * @param radius - requested corner radius, clamped by the helper.
 */
export function roundedRectPath(ctx: PurCanvasContext, x: number, y: number, w: number, h: number, radius: number): void {
  ctx.beginPath()
  if (ctx.roundRect !== undefined) {
    ctx.roundRect(x, y, w, h, radius)
    return
  }
  const r = Math.min(radius, w / 2, h / 2)
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

/**
 * Build a pill path: a rounded rectangle where possible, a plain rectangle
 * otherwise. Leaves the path open for `fill()`.
 * @param ctx - drawing surface.
 * @param x - left edge.
 * @param y - top edge.
 * @param w - width.
 * @param h - height.
 * @param radius - corner radius.
 */
export function pillPath(ctx: PurCanvasContext, x: number, y: number, w: number, h: number, radius: number): void {
  ctx.beginPath()
  if (ctx.roundRect !== undefined) ctx.roundRect(x, y, w, h, radius)
  else ctx.rect(x, y, w, h)
}

/**
 * Wrap text with the surface's own measurement, mirroring upstream's
 * `wrapText(ctx, …)`.
 * @param ctx - drawing surface, whose current font applies.
 * @param text - the text to wrap.
 * @param maxWidth - the widest line.
 * @returns one entry per rendered line.
 */
export function wrappedLines(ctx: PurCanvasContext, text: string | undefined, maxWidth: number): string[] {
  return wrapText(text, maxWidth, (line) => ctx.measureText(line).width)
}
