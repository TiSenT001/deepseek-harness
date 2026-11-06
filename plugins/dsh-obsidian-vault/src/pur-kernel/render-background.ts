/**
 * Background fill and adaptive grid. The grid keeps roughly 50 canvas pixels
 * between lines by snapping the world step to 1/2/5×10ⁿ, matching upstream.
 * @module dsh-obsidian-vault/pur-kernel/render-background
 */
import { gridStep } from './geometry.ts'
import type { PurCanvasContext, PurScene } from './render-types.ts'

/**
 * Paint the canvas clear colour.
 * @param ctx - drawing surface.
 * @param scene - frame description.
 */
export function drawBackground(ctx: PurCanvasContext, scene: PurScene): void {
  ctx.clearRect(0, 0, scene.width, scene.height)
  const background = scene.preferences.backgroundColor
  if (background === 'transparent') return
  ctx.fillStyle = background
  ctx.fillRect(0, 0, scene.width, scene.height)
}

/**
 * Draw the grid, when the preferences enable it.
 * @param ctx - drawing surface.
 * @param scene - frame description.
 */
export function drawGrid(ctx: PurCanvasContext, scene: PurScene): void {
  if (!scene.preferences.showGrid) return
  const opacity = scene.preferences.gridOpacity
  const faded = opacity !== undefined && opacity < 1
  if (faded) {
    ctx.save()
    ctx.globalAlpha = Math.max(0, Math.min(1, opacity))
  }
  const { offsetX, offsetY, scale } = scene.view
  const step = gridStep(scale) * scale
  ctx.strokeStyle = scene.preferences.gridColor
  ctx.lineWidth = scale >= 1 ? 1 : 0.5
  const startX = -offsetX % step
  const startY = -offsetY % step
  ctx.beginPath()
  for (let x = startX; x < scene.width; x += step) {
    ctx.moveTo(x, 0)
    ctx.lineTo(x, scene.height)
  }
  for (let y = startY; y < scene.height; y += step) {
    ctx.moveTo(0, y)
    ctx.lineTo(scene.width, y)
  }
  ctx.stroke()
  if (faded) ctx.restore()
}
