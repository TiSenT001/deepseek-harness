/**
 * Image cards and note-link cards. Images draw from the caller's decoded cache
 * and report the key they need; a key the cache failed on, or an element with
 * no source at all, draws a geometric broken-image placeholder. Note links
 * render their title, optional note text and pins on the purple default card.
 * @module dsh-obsidian-vault/pur-kernel/render-cards
 */
import type { PurCanvasContext, PurScene } from './render-types.ts'
import { fillRoundedCard, roundedRectPath, wrappedLines } from './render-shared.ts'
import { bucketedKey, decodeBucket } from './decode-bucket.ts'
import type { PurImageElement, PurNoteLinkElement, PurPin } from './types.ts'

/** Card corner radius, in canvas pixels per zoom unit. */
const CARD_RADIUS = 8

/** Below this on-screen area a picture draws as a tile instead of decoding. */
const MIN_DECODE_AREA = 90 * 90

/** Inset of the broken-image frame inside the card, in canvas pixels per zoom unit. */
const PLACEHOLDER_INSET = 5

/** Dash segment of the broken-image frame, in canvas pixels per zoom unit. */
const PLACEHOLDER_DASH = 6

/** Gap between the broken-image frame's dash segments, in canvas pixels per zoom unit. */
const PLACEHOLDER_GAP = 4

/** Longest half-edge of the broken-image glyph, in canvas pixels. */
const PLACEHOLDER_GLYPH_MAX = 40

/**
 * Draw an image card: the decoded bitmap, the loading placeholder while the
 * caller still owes the decode, or the broken-image placeholder when the key
 * has no source and when the cache already failed it.
 * @param ctx - drawing surface.
 * @param scene - frame description.
 * @param element - the image element.
 * @param screenW - canvas width.
 * @param screenH - canvas height.
 * @param requestImage - receives a cache key the caller should decode.
 */
export function drawImageCard(
  ctx: PurCanvasContext,
  scene: PurScene,
  element: PurImageElement,
  screenW: number,
  screenH: number,
  requestImage: (key: string) => void,
): void {
  const key = element.dataURL || element.original
  // Zoomed out, a cheaper decode is indistinguishable and costs a fraction of the
  // memory, so the resolution follows the size the card is drawn at.
  const bucket = decodeBucket(screenW)
  const lookupKey = bucketedKey(key, bucket)
  // A full-resolution bitmap already in the cache is still the right pixels, so it
  // stands in while the cheaper decode is on its way.
  const image = scene.images?.get(lookupKey) ?? (bucket === undefined ? undefined : scene.images?.get(key))
  if (image !== undefined) {
    ctx.drawImage(image, 0, 0, screenW, screenH)
    return
  }
  // A picture drawn smaller than this reads as a tint at any zoom, so decoding
  // its full resolution would cost megabytes for a few dozen pixels. Zoomed-out
  // canvases therefore draw a flat tile and never request the bitmap.
  const tooSmall = scene.view.scale < 0.5 && screenW * screenH < MIN_DECODE_AREA
  if (tooSmall) {
    // A thumbnail keeps the board readable when zoomed out; only pictures without
    // one fall back to a flat tile.
    const thumb = element.thumb
    const thumbImage = thumb === undefined ? undefined : scene.images?.get(thumb)
    if (thumb !== undefined && thumbImage !== undefined) {
      ctx.drawImage(thumbImage, 0, 0, screenW, screenH)
      return
    }
    if (thumb !== undefined) {
      requestImage(thumb)
      ctx.fillStyle = 'rgba(140,140,150,0.35)'
      ctx.fillRect(0, 0, screenW, screenH)
      return
    }
    ctx.fillStyle = 'rgba(140,140,150,0.35)'
    ctx.fillRect(0, 0, screenW, screenH)
    return
  }
  if (key === '' || (scene.images?.failedKeys?.has(key) ?? false)) {
    drawBrokenImageCard(ctx, screenW, screenH, scene.view.scale)
    return
  }
  // While the full picture decodes, a stored thumbnail stands in for it: a slightly
  // soft card reads better than a grey loading box during a pan.
  const pendingThumb = element.thumb
  const pendingThumbImage = pendingThumb === undefined ? undefined : scene.images?.get(pendingThumb)
  if (pendingThumbImage !== undefined) {
    ctx.drawImage(pendingThumbImage, 0, 0, screenW, screenH)
    requestImage(lookupKey)
    return
  }
  ctx.fillStyle = '#333'
  ctx.fillRect(0, 0, screenW, screenH)
  ctx.fillStyle = '#888'
  ctx.font = '12px sans-serif'
  ctx.fillText(scene.labels.imageLoading, 10, 20)
  requestImage(lookupKey)
}

/**
 * Draw the subdued placeholder an image card shows when its reference cannot
 * be resolved: a dashed frame plus a centred broken-image glyph. Purely
 * geometric, so the kernel carries no user-visible copy of its own.
 * @param ctx - drawing surface.
 * @param screenW - canvas width.
 * @param screenH - canvas height.
 * @param scale - zoom, which sizes the strokes and dashes.
 */
function drawBrokenImageCard(ctx: PurCanvasContext, screenW: number, screenH: number, scale: number): void {
  const cx = screenW / 2
  const cy = screenH / 2
  const inset = Math.min(PLACEHOLDER_INSET * scale, screenW / 4, screenH / 4)
  const halfW = Math.min(screenW * 0.3, PLACEHOLDER_GLYPH_MAX)
  const halfH = Math.min(screenH * 0.3, PLACEHOLDER_GLYPH_MAX)
  ctx.save()
  ctx.fillStyle = 'rgba(120,120,120,0.12)'
  ctx.fillRect(0, 0, screenW, screenH)
  ctx.strokeStyle = 'rgba(150,150,150,0.55)'
  ctx.lineWidth = Math.max(1, scale)
  ctx.setLineDash([PLACEHOLDER_DASH * scale, PLACEHOLDER_GAP * scale])
  ctx.strokeRect(inset, inset, screenW - inset * 2, screenH - inset * 2)
  ctx.setLineDash([])
  ctx.strokeStyle = 'rgba(150,150,150,0.75)'
  ctx.beginPath()
  ctx.rect(cx - halfW, cy - halfH, halfW * 2, halfH * 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(cx - halfW, cy + halfH)
  ctx.lineTo(cx + halfW, cy - halfH)
  ctx.stroke()
  ctx.restore()
}

/**
 * Draw a note-link card and its pins.
 * @param ctx - drawing surface.
 * @param scene - frame description.
 * @param element - the note-link element.
 * @param screenW - canvas width.
 * @param screenH - canvas height.
 */
export function drawNoteLinkCard(ctx: PurCanvasContext, scene: PurScene, element: PurNoteLinkElement, screenW: number, screenH: number): void {
  const scale = scene.view.scale
  ctx.save()
  ctx.fillStyle = element.cardColor || 'rgba(72, 54, 153, 0.95)'
  fillRoundedCard(ctx, 0, 0, screenW, screenH, CARD_RADIUS * scale)
  // The card is a label, not a reader: it keeps the note's title and leaves the body
  // to the editor, so a long note can never spill past the card edge.
  ctx.beginPath()
  roundedRectPath(ctx, 0, 0, screenW, screenH, CARD_RADIUS * scale)
  ctx.clip()
  ctx.fillStyle = '#ffffff'
  const titleSize = 14 * scale
  ctx.font = `600 ${titleSize}px -apple-system, "Segoe UI", sans-serif`
  const lineHeight = titleSize * 1.3
  // A stale card may still carry the whole note; its first line minus any markdown
  // heading marker is the title the user expects to see.
  const firstLine = (element.content || '').split('\n').map((line) => line.trim()).find((line) => line !== '')
  const title = (firstLine ?? '').replace(/^#+\s*/, '') || scene.labels.noteLinkFallback
  let y = titleSize + 10
  const bottom = screenH - 10
  for (const line of wrappedLines(ctx, title, screenW - 24)) {
    if (y > bottom) break
    ctx.fillText(line, 12, y)
    y += lineHeight
  }
  ctx.restore()
  drawNoteLinkPins(ctx, element, screenW, screenH, scale)
}

/**
 * Draw the note-link card's pins: no hover state, fixed radius, clear labels.
 * @param ctx - drawing surface.
 * @param element - the note-link element.
 * @param screenW - canvas width.
 * @param screenH - canvas height.
 * @param scale - zoom.
 */
function drawNoteLinkPins(ctx: PurCanvasContext, element: PurNoteLinkElement, screenW: number, screenH: number, scale: number): void {
  const inputs = element.inputs ?? []
  const outputs = element.outputs ?? []
  if (inputs.length === 0 && outputs.length === 0) return
  const rows = Math.max(inputs.length, outputs.length, 1)
  const startY = screenH * 0.15
  const endY = screenH * 0.85
  const spacing = rows > 1 ? (endY - startY) / (rows - 1) : screenH / 2
  const radius = 5 * scale
  inputs.forEach((pin, index) => {
    const y = rows === 1 ? screenH / 2 : startY + index * spacing
    ctx.beginPath()
    ctx.arc(0, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(230,230,230,0.08)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(230,230,230,0.75)'
    ctx.lineWidth = 1.5 * scale
    ctx.stroke()
    drawNoteLinkPinLabel(ctx, pin, -radius * scale - 4 * scale, y + 3 * scale, true, scale)
  })
  outputs.forEach((pin, index) => {
    const y = rows === 1 ? screenH / 2 : startY + index * spacing
    ctx.beginPath()
    ctx.arc(screenW, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(235,235,235,0.95)'
    ctx.fill()
    drawNoteLinkPinLabel(ctx, pin, screenW + radius * scale + 4 * scale, y + 3 * scale, false, scale)
  })
}

/**
 * Draw one note-link pin label, skipping empty labels. Left-side labels are
 * right-aligned by measuring their width; right-side labels are drawn at the
 * anchor, as upstream does.
 * @param ctx - drawing surface.
 * @param pin - the pin.
 * @param anchorX - label edge, in canvas pixels.
 * @param y - label baseline.
 * @param leftSide - true when the label extends leftwards from the anchor.
 * @param scale - zoom.
 */
function drawNoteLinkPinLabel(ctx: PurCanvasContext, pin: PurPin, anchorX: number, y: number, leftSide: boolean, scale: number): void {
  const text = pin.label || ''
  if (!text) return
  ctx.fillStyle = 'rgba(210,210,215,0.7)'
  ctx.font = 10 * scale + 'px sans-serif'
  const labelX = leftSide ? anchorX - ctx.measureText(text).width : anchorX
  ctx.fillText(text, labelX, y)
}
