/**
 * Group frames: dashed rounded rectangles drawn inside-out, their title pills,
 * the lock badge shown right after a lock toggle and the selection frame.
 * @module dsh-obsidian-vault/pur-kernel/render-groups
 */
import type { PurCanvasContext, PurScene } from './render-types.ts'
import { pillPath, roundedRectPath } from './render-shared.ts'
import type { PurElement, PurGroupElement } from './types.ts'

/** Corner radius of the frame, in canvas pixels per zoom unit. */
const FRAME_RADIUS = 8

/**
 * Draw every group frame, nested groups first.
 * @param ctx - drawing surface.
 * @param scene - frame description.
 */
export function drawGroupFrames(ctx: PurCanvasContext, scene: PurScene): void {
  drawFrames(ctx, scene, scene.elements, 0, 0)
}

/**
 * Draw frames of one level, after their children.
 * @param ctx - drawing surface.
 * @param scene - frame description.
 * @param elements - elements at this level.
 * @param offsetX - summed `x` of the enclosing groups.
 * @param offsetY - summed `y` of the enclosing groups.
 */
function drawFrames(ctx: PurCanvasContext, scene: PurScene, elements: readonly PurElement[], offsetX: number, offsetY: number): void {
  for (const element of elements) {
    if (element.type !== 'group') continue
    if (element.collapsed !== true) drawFrames(ctx, scene, element.children, offsetX + element.x, offsetY + element.y)
    drawFrame(ctx, scene, element, offsetX, offsetY)
  }
}

/**
 * Draw one frame and its decorations.
 * @param ctx - drawing surface.
 * @param scene - frame description.
 * @param group - the group.
 * @param offsetX - summed `x` of the enclosing groups.
 * @param offsetY - summed `y` of the enclosing groups.
 */
function drawFrame(ctx: PurCanvasContext, scene: PurScene, group: PurGroupElement, offsetX: number, offsetY: number): void {
  const { view } = scene
  const scale = view.scale
  const x = (group.x + offsetX) * scale + view.offsetX
  const y = (group.y + offsetY) * scale + view.offsetY
  const w = group.w * scale
  const h = group.h * scale
  if (w < 2 || h < 2) return
  ctx.save()
  ctx.strokeStyle = group.borderColor || group.color || 'rgba(180, 200, 230, 0.5)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([8, 4])
  roundedRectPath(ctx, x, y, w, h, FRAME_RADIUS * scale)
  ctx.stroke()
  ctx.setLineDash([])
  if (group.content) drawFrameTitle(ctx, group, group.content, scale, x, y)
  if (group.collapsed === true) {
    ctx.fillStyle = '#cfd5de'
    ctx.font = `${Math.max(8, 12 * scale)}px -apple-system, sans-serif`
    ctx.fillText('▸', x + w - 16, y + 18)
  }
  ctx.restore()
  if (group.locked && (scene.lockPulseIds?.has(group.id) ?? false)) drawLockBadge(ctx, x + w, y)
  const selected = scene.selectedIds?.has(group.id) ?? false
  if (selected && !group.locked) drawFrameSelection(ctx, x, y, w, h)
}

/**
 * Draw the label pill that sits above the frame's top edge.
 * @param ctx - drawing surface.
 * @param group - the group.
 * @param title - the frame label; callers skip the pill when it is empty.
 * @param scale - zoom.
 * @param x - canvas left edge.
 * @param y - canvas top edge.
 */
function drawFrameTitle(ctx: PurCanvasContext, group: PurGroupElement, title: string, scale: number, x: number, y: number): void {
  const size = Math.max(8, (group.fontSize || 12) * scale)
  ctx.font = ['bold ', size, 'px ', group.fontFamily || 'sans-serif'].join('')
  const width = ctx.measureText(title).width
  pillPath(ctx, x + 4, y - size - 6, width + 12, size + 6, 4 * scale)
  ctx.fillStyle = 'rgba(32, 34, 38, 0.85)'
  ctx.fill()
  ctx.fillStyle = '#cfd5de'
  ctx.fillText(title, x + 10, y - 4)
}

/**
 * Draw the outline padlock, anchored to the frame's top-right corner.
 * @param ctx - drawing surface.
 * @param right - canvas x of the frame's right edge.
 * @param top - canvas y of the frame's top edge.
 */
function drawLockBadge(ctx: PurCanvasContext, right: number, top: number): void {
  ctx.save()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.strokeRect(right - 20, top + 6, 12, 10)
  ctx.moveTo(right - 17, top + 6)
  ctx.lineTo(right - 17, top + 3)
  ctx.arc(right - 14, top + 3, 3, Math.PI, 0)
  ctx.lineTo(right - 11, top + 6)
  ctx.stroke()
  ctx.restore()
}

/**
 * Draw the selection frame and its resize handle.
 * @param ctx - drawing surface.
 * @param x - canvas left edge.
 * @param y - canvas top edge.
 * @param w - canvas width.
 * @param h - canvas height.
 */
function drawFrameSelection(ctx: PurCanvasContext, x: number, y: number, w: number, h: number): void {
  const handleX = x + w - 8
  const handleY = y + h - 8
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(handleX, handleY, 14, 14)
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 1
  ctx.strokeRect(handleX, handleY, 14, 14)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1.5
  ctx.strokeRect(x, y, w, h)
}
