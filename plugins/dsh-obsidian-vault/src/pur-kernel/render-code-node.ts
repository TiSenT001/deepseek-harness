/**
 * Code-node cards: the minimal dark body, a truncated title, the type badge,
 * a divider and pins whose labels sit in faint pills inside the card.
 * @module dsh-obsidian-vault/pur-kernel/render-code-node
 */
import type { PurCanvasContext, PurScene } from './render-types.ts'
import { fillRoundedCard, pillPath } from './render-shared.ts'
import type { PurCodeNodeElement, PurPin } from './types.ts'

/** Card corner radius, in canvas pixels per zoom unit. */
const CARD_RADIUS = 8

/** Distance from the card's top edge to the title baseline, in zoom units. */
const TITLE_Y = 19

/**
 * Draw a code-node card.
 * @param ctx - drawing surface.
 * @param scene - frame description.
 * @param element - the code node.
 * @param screenW - canvas width.
 * @param screenH - canvas height.
 */
export function drawCodeNodeCard(ctx: PurCanvasContext, scene: PurScene, element: PurCodeNodeElement, screenW: number, screenH: number): void {
  const scale = scene.view.scale
  const inputs = element.inputs ?? []
  const outputs = element.outputs ?? []
  const height = element.h || 80
  ctx.fillStyle = element.bgColor || 'rgba(32, 34, 38, 0.92)'
  fillRoundedCard(ctx, 0, 0, screenW, screenH, CARD_RADIUS * scale)
  drawHeader(ctx, scene, element, screenW, scale)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(12 * scale, 38 * scale)
  ctx.lineTo(screenW - 12 * scale, 38 * scale)
  ctx.stroke()
  const rows = Math.max(inputs.length, outputs.length, 1)
  const start = height * 0.15
  const end = height * 0.85
  const spacing = (end - start) / Math.max(rows - 1, 1)
  ctx.textAlign = 'left'
  inputs.forEach((pin, index) => {
    drawPin(ctx, scene, element, pin, rows === 1 ? height / 2 : start + index * spacing, false, screenW, scale)
  })
  ctx.textAlign = 'right'
  outputs.forEach((pin, index) => {
    drawPin(ctx, scene, element, pin, rows === 1 ? height / 2 : start + index * spacing, true, screenW, scale)
  })
  drawPinCount(ctx, inputs.length, outputs.length, end * scale + 16 * scale, screenH, screenW, scale)
}

/**
 * Draw the title and type badge above the divider.
 * @param ctx - drawing surface.
 * @param scene - frame description.
 * @param element - the code node.
 * @param screenW - canvas width.
 * @param scale - zoom.
 */
function drawHeader(ctx: PurCanvasContext, scene: PurScene, element: PurCodeNodeElement, screenW: number, scale: number): void {
  ctx.fillStyle = '#ffffff'
  ctx.font = `600 ${13 * scale}px -apple-system, "Segoe UI", sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  let title = element.title || scene.labels.codeNodeFallbackTitle
  const maxWidth = screenW - 70 * scale
  if (ctx.measureText(title).width > maxWidth) {
    while (ctx.measureText(title + '...').width > maxWidth && title.length > 1) title = title.substring(0, title.length - 1)
    title += '...'
  }
  ctx.fillText(title, 12 * scale, TITLE_Y * scale)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
  ctx.font = `${10 * scale}px -apple-system, "SF Mono", monospace`
  ctx.textAlign = 'right'
  ctx.fillText(scene.labels.codeNodeBadge, screenW - 12 * scale, TITLE_Y * scale)
}

/**
 * Draw one pin: a hollow input circle on the left or a filled output circle on
 * the right, plus its label pill.
 * @param ctx - drawing surface.
 * @param scene - frame description.
 * @param element - the code node owning the pin.
 * @param pin - the pin.
 * @param localY - pin row in element-local world units.
 * @param isOutput - true for the right edge.
 * @param screenW - canvas width.
 * @param scale - zoom.
 */
function drawPin(ctx: PurCanvasContext, scene: PurScene, element: PurCodeNodeElement, pin: PurPin, localY: number, isOutput: boolean, screenW: number, scale: number): void {
  const hover = scene.hoverPin
  const matched = hover !== null && hover !== undefined && hover.nodeId === element.id && hover.pinId === pin.id
  const hovering = matched && (isOutput ? hover.isOutput === true : hover.isOutput !== true)
  const radius = hovering ? 7 * scale : 5.5 * scale
  const pinY = localY * scale
  ctx.beginPath()
  ctx.arc(isOutput ? screenW : 0, pinY, radius, 0, Math.PI * 2)
  if (isOutput) {
    ctx.fillStyle = hovering ? '#ffffff' : 'rgba(235,235,235,0.95)'
    ctx.fill()
  } else {
    ctx.fillStyle = 'rgba(230,230,230,0.08)'
    ctx.fill()
    ctx.strokeStyle = hovering ? '#ffffff' : 'rgba(230,230,230,0.75)'
    ctx.lineWidth = 1.5 * scale
    ctx.stroke()
  }
  const label = pin.label || pin.id || ''
  const width = ctx.measureText(label).width
  const anchorX = isOutput ? screenW - radius - width - 10 * scale : (radius + 10) * scale
  ctx.save()
  pillPath(ctx, anchorX - 4 * scale, pinY - 8 * scale, width + 8 * scale, 16 * scale, 8 * scale)
  ctx.fillStyle = 'rgba(255,255,255,0.04)'
  ctx.fill()
  ctx.restore()
  ctx.fillStyle = 'rgba(210,210,215,0.85)'
  ctx.font = `${11 * scale}px -apple-system, "Segoe UI", sans-serif`
  ctx.fillText(label, anchorX, pinY + 4 * scale)
}

/**
 * Draw the `inputs ← · outputs →` footer when it fits above the bottom edge.
 * @param ctx - drawing surface.
 * @param inputCount - number of input pins.
 * @param outputCount - number of output pins.
 * @param y - baseline, in canvas pixels.
 * @param screenH - canvas height.
 * @param screenW - canvas width.
 * @param scale - zoom.
 */
function drawPinCount(ctx: PurCanvasContext, inputCount: number, outputCount: number, y: number, screenH: number, screenW: number, scale: number): void {
  if (y >= screenH - 8 * scale) return
  if (inputCount + outputCount === 0) return
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)'
  ctx.font = `${9.5 * scale}px -apple-system, "SF Mono", monospace`
  ctx.textAlign = 'center'
  ctx.fillText(`${inputCount} ← · ${outputCount} →`, screenW / 2, y)
}
