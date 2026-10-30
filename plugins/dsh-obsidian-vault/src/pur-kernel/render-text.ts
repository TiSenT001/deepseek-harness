/**
 * Text cards: the dark rounded body, its wrapped paragraphs, the title pill
 * drawn above the card and the optional pins on either edge.
 * @module dsh-obsidian-vault/pur-kernel/render-text
 */
import type { PurCanvasContext, PurScene } from './render-types.ts'
import { fillRoundedCard, wrappedLines } from './render-shared.ts'
import type { PurElementBase, PurPin, PurTextElement } from './types.ts'

/** Card corner radius, in canvas pixels per zoom unit. */
const CARD_RADIUS = 8

/**
 * Draw a text card's body.
 * @param ctx - drawing surface.
 * @param scene - frame description.
 * @param element - the card.
 * @param screenW - canvas width.
 * @param screenH - canvas height.
 */
export function drawTextBody(ctx: PurCanvasContext, scene: PurScene, element: PurTextElement, screenW: number, screenH: number): void {
  const scale = scene.view.scale
  ctx.fillStyle = element.bgColor || 'rgba(32,34,38,0.9)'
  ctx.globalAlpha = element.bgOpacity ?? 0.92
  fillRoundedCard(ctx, 0, 0, screenW, screenH, CARD_RADIUS * scale)
  ctx.globalAlpha = element.opacity ?? 1
  ctx.fillStyle = element.color || '#e0e0e0'
  const fontSize = (element.fontSize || 14) * scale
  ctx.font = `${element.bold ? 'bold ' : ''}${fontSize}px ${element.fontFamily || 'sans-serif'}`
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, screenW, screenH)
  ctx.clip()
  let y = 10 * scale + fontSize
  for (const paragraph of (element.content || '...').split('\n')) {
    for (const line of wrappedLines(ctx, paragraph, screenW - 20 * scale)) {
      ctx.fillText(line, 10 * scale, y)
      y += fontSize * 1.3
    }
  }
  ctx.restore()
}

/**
 * Draw the pins a text card declares.
 * @param ctx - drawing surface.
 * @param scene - frame description.
 * @param element - the card.
 * @param screenW - canvas width.
 * @param screenH - canvas height.
 */
export function drawTextPins(ctx: PurCanvasContext, scene: PurScene, element: PurTextElement, screenW: number, screenH: number): void {
  const inputs = element.inputs ?? []
  const outputs = element.outputs ?? []
  if (inputs.length === 0 && outputs.length === 0) return
  const scale = scene.view.scale
  const rows = Math.max(inputs.length, outputs.length, 1)
  const startY = screenH * 0.15
  const endY = screenH * 0.85
  const spacing = rows > 1 ? (endY - startY) / (rows - 1) : screenH / 2
  const hover = scene.hoverPin
  inputs.forEach((pin, index) => {
    const y = rows === 1 ? screenH / 2 : startY + index * spacing
    const hovering = hover !== null && hover !== undefined && hover.nodeId === element.id && hover.pinId === pin.id && hover.isInput === true
    const radius = hovering ? 7 * scale : 5.5 * scale
    ctx.beginPath()
    ctx.arc(0, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(230,230,230,0.08)'
    ctx.fill()
    ctx.strokeStyle = hovering ? '#ffffff' : 'rgba(230,230,230,0.75)'
    ctx.lineWidth = 1.5 * scale
    ctx.stroke()
    drawPinLabel(ctx, pin, -radius * scale - 6 * scale, y + 4 * scale, true, scale)
  })
  outputs.forEach((pin, index) => {
    const y = rows === 1 ? screenH / 2 : startY + index * spacing
    const hovering = hover !== null && hover !== undefined && hover.nodeId === element.id && hover.pinId === pin.id && hover.isInput !== true
    const radius = hovering ? 7 * scale : 5.5 * scale
    ctx.beginPath()
    ctx.arc(screenW, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = hovering ? '#ffffff' : 'rgba(235,235,235,0.95)'
    ctx.fill()
    drawPinLabel(ctx, pin, screenW + radius * scale + 6 * scale, y + 4 * scale, false, scale)
  })
}

/**
 * Draw a pin label outside the card, measuring it with the font that is still
 * active — upstream measures before switching to the label font.
 * @param ctx - drawing surface.
 * @param pin - the pin.
 * @param anchorX - label edge, in canvas pixels.
 * @param y - label baseline.
 * @param leftSide - true when the label extends leftwards from the anchor.
 * @param scale - zoom.
 */
function drawPinLabel(ctx: PurCanvasContext, pin: PurPin, anchorX: number, y: number, leftSide: boolean, scale: number): void {
  const text = pin.label || ''
  const width = ctx.measureText(text).width
  const labelX = leftSide ? anchorX - width : anchorX
  ctx.fillStyle = 'rgba(210,210,215,0.7)'
  ctx.font = `${11 * scale}px -apple-system, "Segoe UI", sans-serif`
  ctx.fillText(text, labelX, y)
}

/**
 * Draw the optional title pill above a text or code-node card.
 * @param ctx - drawing surface.
 * @param title - the title text.
 * @param element - card supplying font size and position.
 * @param x - canvas left edge of the card.
 * @param y - canvas top edge of the card.
 * @param scale - zoom.
 */
export function drawTitlePill(ctx: PurCanvasContext, title: string, element: PurElementBase, x: number, y: number, scale: number): void {
  const size = Math.max(8, (element.fontSize || 12) * 0.8 * scale)
  ctx.save()
  ctx.font = 'bold ' + size + 'px sans-serif'
  const width = ctx.measureText(title).width
  ctx.beginPath()
  const pillY = y - size - 4
  if (ctx.roundRect !== undefined) ctx.roundRect(x, pillY, width + 10, size + 4, 4 * scale)
  else ctx.rect(x, pillY, width + 10, size + 4)
  ctx.fillStyle = 'rgba(32, 34, 38, 0.85)'
  ctx.fill()
  ctx.fillStyle = '#4a9eff'
  ctx.fillText(title, x + 5, pillY + size)
  ctx.restore()
}
