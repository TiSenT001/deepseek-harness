/**
 * Overlays drawn after all cards: the selection frame around an element, the
 * rubber-band selection rectangle and the zoom percentage badge.
 * @module dsh-obsidian-vault/pur-kernel/render-overlays
 */
import type { PurCanvasContext, PurScene, PurScreenRect } from './render-types.ts'
import type { PurElementBase } from './types.ts'

/**
 * Draw the selection frame around one element.
 * @param ctx - drawing surface.
 * @param element - the selected element.
 * @param x - canvas left edge.
 * @param y - canvas top edge.
 * @param w - canvas width.
 * @param h - canvas height.
 */
export function drawElementSelection(ctx: PurCanvasContext, element: PurElementBase, x: number, y: number, w: number, h: number): void {
  ctx.save()
  ctx.translate(x + w / 2, y + h / 2)
  if (element.rotation) ctx.rotate((element.rotation * Math.PI) / 180)
  ctx.translate(-w / 2, -h / 2)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1.5
  ctx.strokeRect(0, 0, w, h)
  if (element.locked) {
    drawLockGlyph(ctx, w)
  } else {
    drawResizeHandle(ctx, w, h)
  }
  ctx.restore()
}

/**
 * Draw the padlock at the card's top-right corner.
 * @param ctx - drawing surface.
 * @param w - canvas width.
 */
function drawLockGlyph(ctx: PurCanvasContext, w: number): void {
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.strokeRect(w - 20, 10, 12, 10)
  ctx.moveTo(w - 17, 10)
  ctx.lineTo(w - 17, 7)
  ctx.arc(w - 14, 7, 3, Math.PI, 0)
  ctx.lineTo(w - 11, 10)
  ctx.stroke()
}

/**
 * Draw the resize handle at the card's bottom-right corner.
 * @param ctx - drawing surface.
 * @param w - canvas width.
 * @param h - canvas height.
 */
function drawResizeHandle(ctx: PurCanvasContext, w: number, h: number): void {
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(w - 8, h - 8, 14, 14)
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 1
  ctx.strokeRect(w - 8, h - 8, 14, 14)
}

/**
 * Draw the rubber-band selection rectangle.
 * @param ctx - drawing surface.
 * @param rect - rectangle in canvas pixels, possibly with negative extents.
 */
export function drawSelectionRect(ctx: PurCanvasContext, rect: PurScreenRect): void {
  let { x, y, w, h } = rect
  if (w < 0) {
    x += w
    w = Math.abs(w)
  }
  if (h < 0) {
    y += h
    h = Math.abs(h)
  }
  ctx.strokeStyle = '#e0e0e0'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  ctx.fillRect(x, y, w, h)
  ctx.strokeRect(x, y, w, h)
  ctx.setLineDash([])
}

/**
 * Draw the zoom percentage in the bottom-left corner.
 * @param ctx - drawing surface.
 * @param scene - frame description; `zoomBadgeAlpha` gates the badge.
 */
export function drawZoomBadge(ctx: PurCanvasContext, scene: PurScene): void {
  const alpha = scene.zoomBadgeAlpha
  if (alpha === undefined) return
  ctx.save()
  ctx.fillStyle = `rgba(255,255,255,${(alpha * 0.55).toFixed(2)})`
  ctx.font = 'bold 15px -apple-system, sans-serif'
  ctx.textAlign = 'left'
  ctx.shadowColor = 'rgba(0,0,0,0.4)'
  ctx.shadowBlur = 3
  ctx.fillText(Math.round(scene.view.scale * 100) + '%', 16, scene.height - 16)
  ctx.restore()
}
