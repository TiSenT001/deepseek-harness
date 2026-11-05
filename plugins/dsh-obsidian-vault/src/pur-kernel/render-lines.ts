/**
 * Connections: routed lines with arrows and labels, the dashed preview of a
 * pin drag and the endpoint dots that advertise a relinkable pin connection.
 * @module dsh-obsidian-vault/pur-kernel/render-lines
 */
import { pinWorldPosition, worldRect } from './geometry.ts'
import type { PurCanvasContext, PurPinDragPreview, PurScene } from './render-types.ts'
import { screenX, screenY } from './render-shared.ts'
import type { PurElement, PurLineElement, PurViewState } from './types.ts'

/** Dash pattern of a decorative connection, in world units. */
const DASH: readonly [number, number] = [10, 6]

/** Dash pattern of the pin-drag preview, in world units. */
const DRAG_DASH: readonly [number, number] = [8, 4]

/**
 * Collect every line in the element tree, groups included.
 * @param elements - top-level elements.
 * @returns the lines in document order.
 */
export function collectLines(elements: readonly PurElement[]): PurLineElement[] {
  const lines: PurLineElement[] = []
  for (const element of elements) {
    if (element.type === 'line') lines.push(element)
    if (element.type === 'group') lines.push(...collectLines(element.children))
  }
  return lines
}

/**
 * Canvas point a line endpoint attaches to.
 * @param elements - top-level elements.
 * @param nodeId - element the endpoint names.
 * @param pinId - pin id, empty when the endpoint uses the element centre.
 * @param view - pan and zoom.
 * @returns the canvas point, or null when the element is absent.
 */
function endpointOf(elements: readonly PurElement[], nodeId: string, pinId: string | undefined, view: PurViewState): { x: number; y: number } | null {
  const rect = worldRect(elements, nodeId)
  if (rect === null) return null
  if (pinId) {
    const pin = pinWorldPosition(elements, nodeId, pinId)
    if (pin !== null) return { x: screenX(view, pin.x), y: screenY(view, pin.y) }
  }
  return { x: screenX(view, rect.x + rect.w / 2), y: screenY(view, rect.y + rect.h / 2) }
}

/**
 * Draw every connection, below cards and groups.
 * @param ctx - drawing surface.
 * @param scene - frame description.
 */
export function drawLines(ctx: PurCanvasContext, scene: PurScene): void {
  const { view, elements } = scene
  const scale = view.scale
  for (const line of collectLines(elements)) {
    // A detached line carries its own rectangle instead of naming two cards.
    if (line.from === '' && line.to === '') {
      if (line.x === undefined || line.y === undefined) continue
      const endX = line.x + (line.w ?? 0)
      const endY = line.y + (line.h ?? 0)
      drawLine(ctx, line, { x: screenX(view, line.x), y: screenY(view, line.y) }, { x: screenX(view, endX), y: screenY(view, endY) }, scene)
      continue
    }
    const fromWP = worldRect(elements, line.from)
    const toWP = worldRect(elements, line.to)
    if (fromWP === null || toWP === null) continue
    const start = endpointOf(elements, line.from, line.fromPin, view)
    const end = endpointOf(elements, line.to, line.toPin, view)
    if (start === null || end === null) continue
    drawLine(ctx, line, start, end, scene)
  }
}

/**
 * Draw one connection with its arrowhead and label.
 * @param ctx - drawing surface.
 * @param line - the connection.
 * @param start - canvas start point.
 * @param end - canvas end point.
 * @param scene - frame description.
 */
function drawLine(ctx: PurCanvasContext, line: PurLineElement, start: { x: number; y: number }, end: { x: number; y: number }, scene: PurScene): void {
  const scale = scene.view.scale
  const hovered = scene.hoveredLineId === line.id
  const isPin = Boolean(line.fromPin || line.toPin)
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  if (isPin) {
    ctx.strokeStyle = hovered ? '#ffffff' : 'rgba(255, 255, 255, 0.9)'
    ctx.lineWidth = (hovered ? 4 : 2.5) * scale
  } else {
    ctx.strokeStyle = line.color || 'rgba(150, 150, 150, 0.55)'
    ctx.lineWidth = (hovered ? 5 : (line.width || 2)) * scale
    ctx.setLineDash([DASH[0] * scale, DASH[1] * scale])
  }
  ctx.beginPath()
  const dx = Math.abs(end.x - start.x)
  const style = line.style || 'curve'
  if (style === 'straight') {
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
  } else if (style === 'rect') {
    const midX = (start.x + end.x) / 2
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(midX, start.y)
    ctx.lineTo(midX, end.y)
    ctx.lineTo(end.x, end.y)
  } else {
    ctx.moveTo(start.x, start.y)
    const control = Math.max(50, dx * 0.5)
    ctx.bezierCurveTo(start.x + control, start.y, end.x - control, end.y, end.x, end.y)
  }
  ctx.stroke()
  if (line.arrow !== false) {
    const arrowSize = (line.arrowSize || 10) * scale
    const angle = Math.atan2(end.y - start.y, end.x - start.x)
    const tipX = end.x - Math.cos(angle) * arrowSize * 0.6
    const tipY = end.y - Math.sin(angle) * arrowSize * 0.6
    ctx.fillStyle = ctx.strokeStyle
    ctx.beginPath()
    ctx.moveTo(end.x, end.y)
    ctx.lineTo(tipX - Math.sin(angle) * arrowSize * 0.5, tipY + Math.cos(angle) * arrowSize * 0.5)
    ctx.lineTo(tipX + Math.sin(angle) * arrowSize * 0.5, tipY - Math.cos(angle) * arrowSize * 0.5)
    ctx.closePath()
    ctx.fill()
  }
  if (line.content) {
    const midX = start.x + (end.x - start.x) / 2
    const midY = start.y + (end.y - start.y) / 2
    const size = Math.max(10, (line.fontSize || 12) * scale)
    ctx.font = size + 'px ' + (line.fontFamily || 'sans-serif')
    const width = ctx.measureText(line.content).width
    ctx.fillStyle = line.textColor || line.color || 'rgba(200,200,200,0.9)'
    ctx.fillText(line.content, midX - width / 2, midY + size / 3)
  }
  ctx.restore()
}

/**
 * Draw the dashed preview of a pin connection being dragged.
 * @param ctx - drawing surface.
 * @param scene - frame description.
 */
export function drawPinDragPreview(ctx: PurCanvasContext, scene: PurScene): void {
  const drag = scene.pinDrag
  if (drag === null || drag === undefined) return
  const scale = scene.view.scale
  const view = scene.view
  const fromPos = drag.from === undefined ? null : pinWorldPosition(scene.elements, drag.from.nodeId, drag.from.pinId)
  const toPos = drag.to === undefined ? null : pinWorldPosition(scene.elements, drag.to.nodeId, drag.to.pinId)
  let startX: number
  let startY: number
  let endX: number
  let endY: number
  if (drag.mode === 'relink-from') {
    startX = drag.pointerX
    startY = drag.pointerY
    endX = toPos === null ? drag.pointerX : screenX(view, toPos.x)
    endY = toPos === null ? drag.pointerY : screenY(view, toPos.y)
  } else {
    startX = fromPos === null ? drag.pointerX - 50 : screenX(view, fromPos.x)
    startY = fromPos === null ? drag.pointerY : screenY(view, fromPos.y)
    endX = drag.pointerX
    endY = drag.pointerY
  }
  drawDragCurve(ctx, drag, startX, startY, endX, endY, scale)
}

/**
 * Stroke the preview curve and mark its free end.
 * @param ctx - drawing surface.
 * @param drag - the drag description, which sets the control direction.
 * @param startX - canvas start x.
 * @param startY - canvas start y.
 * @param endX - canvas end x.
 * @param endY - canvas end y.
 * @param scale - zoom.
 */
function drawDragCurve(ctx: PurCanvasContext, drag: PurPinDragPreview, startX: number, startY: number, endX: number, endY: number, scale: number): void {
  ctx.save()
  ctx.setLineDash([DRAG_DASH[0] * scale, DRAG_DASH[1] * scale])
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2 * scale
  const control = Math.max(50, Math.abs(endX - startX) * 0.5)
  ctx.beginPath()
  ctx.moveTo(startX, startY)
  const c1x = drag.mode === 'relink-from' ? startX - control : startX + control
  const c2x = drag.mode === 'relink-from' ? endX + control : endX - control
  ctx.bezierCurveTo(c1x, startY, c2x, endY, endX, endY)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.arc(drag.pointerX, drag.pointerY, 6 * scale, 0, Math.PI * 2)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2 * scale
  ctx.stroke()
  ctx.restore()
}

/**
 * Draw a dot at both ends of every pin connection, hinting that they relink.
 * @param ctx - drawing surface.
 * @param scene - frame description.
 */
export function drawPinEndpointDots(ctx: PurCanvasContext, scene: PurScene): void {
  const scale = scene.view.scale
  for (const line of collectLines(scene.elements)) {
    if (!line.fromPin && !line.toPin) continue
    const fromPos = line.fromPin ? pinWorldPosition(scene.elements, line.from, line.fromPin) : null
    const toPos = line.toPin ? pinWorldPosition(scene.elements, line.to, line.toPin) : null
    if (fromPos === null && toPos === null) continue
    if (fromPos !== null) dot(ctx, screenX(scene.view, fromPos.x), screenY(scene.view, fromPos.y), scale)
    if (toPos !== null) dot(ctx, screenX(scene.view, toPos.x), screenY(scene.view, toPos.y), scale)
  }
}

/**
 * Draw one endpoint dot.
 * @param ctx - drawing surface.
 * @param x - canvas x.
 * @param y - canvas y.
 * @param scale - zoom.
 */
function dot(ctx: PurCanvasContext, x: number, y: number, scale: number): void {
  ctx.save()
  ctx.beginPath()
  ctx.arc(x, y, 3 * scale, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.fill()
  ctx.restore()
}
