/**
 * Code-node cards: a dark body with a header, a divider, and pin rows laid out
 * inside the body so a label never collides with the title or the type badge.
 * @module dsh-obsidian-vault/pur-kernel/render-code-node
 */
import type { PurCanvasContext, PurScene } from './render-types.ts'
import { fillRoundedCard, pillPath } from './render-shared.ts'
import type { PurCodeNodeElement, PurPin } from './types.ts'

/** Card corner radius, in canvas pixels per zoom unit. */
const CARD_RADIUS = 8

import { CODE_BODY_BOTTOM, CODE_BODY_TOP, CODE_HEADER_HEIGHT, codeNodeRowY } from './code-node-layout.ts'

/** Height of the header band, in world units. */
const HEADER_HEIGHT = CODE_HEADER_HEIGHT

/** Gap between the divider and the first pin row, in world units. */
const BODY_TOP = CODE_BODY_TOP

/** Space kept below the last pin row, in world units. */
const BODY_BOTTOM = CODE_BODY_BOTTOM

/** Horizontal inset of the header text and the divider, in world units. */
const INSET = 12

/** Gap between a pin's circle and its label pill, in world units. */
const PIN_GAP = 9

/** Horizontal padding inside a label pill, in world units. */
const PILL_PAD = 4

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
  const height = (element.h || 80) * scale
  ctx.fillStyle = element.bgColor || 'rgba(32, 34, 38, 0.92)'
  fillRoundedCard(ctx, 0, 0, screenW, screenH, CARD_RADIUS * scale)
  drawHeader(ctx, scene, element, screenW, scale)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(INSET * scale, HEADER_HEIGHT * scale)
  ctx.lineTo(screenW - INSET * scale, HEADER_HEIGHT * scale)
  ctx.stroke()

  const rows = Math.max(inputs.length, outputs.length, 1)
  /** Pin row centre in canvas pixels, using the layout hit-testing shares. */
  const rowY = (index: number): number => codeNodeRowY(element.h || 80, rows, index) * scale

  ctx.textBaseline = 'middle'
  inputs.forEach((pin, index) => {
    drawPin(ctx, scene, element, pin, rowY(index), false, screenW, scale)
  })
  outputs.forEach((pin, index) => {
    drawPin(ctx, scene, element, pin, rowY(index), true, screenW, scale)
  })
  drawPinCount(ctx, inputs.length, outputs.length, screenH - BODY_BOTTOM * scale + 4 * scale, screenH, screenW, scale)
}

/**
 * Truncate text to a pixel width using the current font.
 * @param ctx - drawing surface with the font already set.
 * @param text - the text to fit.
 * @param maxWidth - available width in canvas pixels.
 * @returns the text, with an ellipsis when it had to shrink.
 */
function fitText(ctx: PurCanvasContext, text: string, maxWidth: number): string {
  if (maxWidth <= 0) return ''
  if (ctx.measureText(text).width <= maxWidth) return text
  let shortened = text
  while (shortened.length > 1 && ctx.measureText(`${shortened}…`).width > maxWidth) shortened = shortened.slice(0, -1)
  return `${shortened}…`
}

/**
 * Draw the title and the type badge above the divider. The title is measured
 * against the badge's own width, so a long title cannot run under it.
 * @param ctx - drawing surface.
 * @param scene - frame description.
 * @param element - the code node.
 * @param screenW - canvas width.
 * @param scale - zoom.
 */
function drawHeader(ctx: PurCanvasContext, scene: PurScene, element: PurCodeNodeElement, screenW: number, scale: number): void {
  const baseline = (HEADER_HEIGHT / 2) * scale
  ctx.textBaseline = 'middle'
  ctx.font = `${10 * scale}px -apple-system, "SF Mono", monospace`
  const badge = scene.labels.codeNodeBadge
  const badgeWidth = ctx.measureText(badge).width
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
  ctx.textAlign = 'right'
  ctx.fillText(badge, screenW - INSET * scale, baseline)

  ctx.font = `600 ${13 * scale}px -apple-system, "Segoe UI", sans-serif`
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'left'
  const maxWidth = screenW - 2 * INSET * scale - badgeWidth - 10 * scale
  const title = fitText(ctx, element.title || scene.labels.codeNodeFallbackTitle, maxWidth)
  ctx.fillText(title, INSET * scale, baseline)
}

/**
 * Draw one pin: a hollow input circle on the left or a filled output circle on
 * the right, plus its label pill, truncated so two facing labels cannot overlap.
 * @param ctx - drawing surface.
 * @param scene - frame description.
 * @param element - the code node owning the pin.
 * @param pin - the pin.
 * @param pinY - row centre in canvas pixels.
 * @param isOutput - true for the right edge.
 * @param screenW - canvas width.
 * @param scale - zoom.
 */
function drawPin(ctx: PurCanvasContext, scene: PurScene, element: PurCodeNodeElement, pin: PurPin, pinY: number, isOutput: boolean, screenW: number, scale: number): void {
  const hover = scene.hoverPin
  const matched = hover !== null && hover !== undefined && hover.nodeId === element.id && hover.pinId === pin.id
  const hovering = matched && (isOutput ? hover.isOutput === true : hover.isOutput !== true)
  const radius = (hovering ? 7 : 5.5) * scale
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

  // An unlabelled pin stays a bare circle: the internal id is not something the
  // user wrote, and printing it made a half-filled node look broken.
  const text = (pin.label ?? '').trim()
  if (text === '') return
  ctx.font = `${11 * scale}px -apple-system, "Segoe UI", sans-serif`
  ctx.textBaseline = 'middle'
  ctx.textAlign = isOutput ? 'right' : 'left'
  // Each side owns half the card, so two facing labels stop short of each other.
  const half = screenW / 2 - (INSET + PIN_GAP + radius) * scale
  const label = fitText(ctx, text, Math.max(0, half - PILL_PAD * scale))
  const textWidth = ctx.measureText(label).width
  const anchorX = isOutput ? screenW - radius - PIN_GAP * scale : radius + PIN_GAP * scale
  const pillX = isOutput ? anchorX - textWidth - PILL_PAD * scale : anchorX - PILL_PAD * scale
  ctx.save()
  pillPath(ctx, pillX, pinY - 8 * scale, textWidth + PILL_PAD * 2 * scale, 16 * scale, 8 * scale)
  ctx.fillStyle = 'rgba(255,255,255,0.05)'
  ctx.fill()
  ctx.restore()
  ctx.fillStyle = 'rgba(210,210,215,0.85)'
  ctx.fillText(label, anchorX, pinY)
}

/**
 * Draw the `inputs ← · outputs →` footer when it fits inside the card.
 * @param ctx - drawing surface.
 * @param inputCount - number of input pins.
 * @param outputCount - number of output pins.
 * @param y - baseline, in canvas pixels.
 * @param screenH - canvas height.
 * @param screenW - canvas width.
 * @param scale - zoom.
 */
function drawPinCount(ctx: PurCanvasContext, inputCount: number, outputCount: number, y: number, screenH: number, screenW: number, scale: number): void {
  if (y >= screenH - 6 * scale) return
  if (inputCount + outputCount === 0) return
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)'
  ctx.font = `${9.5 * scale}px -apple-system, "SF Mono", monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(`${inputCount} ← · ${outputCount} →`, screenW / 2, y)
}
