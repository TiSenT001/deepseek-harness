/**
 * Pointer hit-testing over the element tree: which element, pin or line endpoint
 * sits under a world point. Mirrors upstream's reverse z-order and tolerance
 * rules, which scale with zoom so the target stays a constant screen size.
 * @module dsh-obsidian-vault/pur-kernel/hit-test
 */
import { pinPosition, pinWorldPosition, worldRect } from './geometry.ts'
import type { PurElement, PurLineElement, PurLineStyle, PurNodeElement } from './types.ts'

/** A pin found under the pointer. */
export interface PurPinHit {
  /** Element owning the pin. */
  nodeId: string
  /** Pin id. */
  pinId: string
  /** True for an output pin (right edge). */
  isOutput: boolean
}

/** A line endpoint found under the pointer. */
export interface PurLineEndpointHit {
  /** Line id. */
  lineId: string
  /** True when the start (output end) was hit rather than the end. */
  isFrom: boolean
  /** Element the endpoint attaches to. */
  nodeId: string
  /** Pin id the endpoint attaches to. */
  pinId: string
}

/** Screen pixels upstream allows around a line midpoint. */
const LINE_HIT_PX = 25

/** Screen pixels upstream allows around a pin. */
const PIN_HIT_PX = 14

/** Screen pixels upstream allows around a line endpoint. */
const ENDPOINT_HIT_PX = 16

/**
 * Find the topmost element under a world point.
 * @param elements - top-level elements.
 * @param worldX - world x of the pointer.
 * @param worldY - world y of the pointer.
 * @param scale - zoom, so the line-midpoint tolerance keeps a constant screen size.
 * @returns the element, the deepest unlocked group child, or null.
 */
export function elementAt(elements: readonly PurElement[], worldX: number, worldY: number, scale: number, lineTolerance: number = LINE_HIT_PX): PurElement | null {
  // Lines are drawn below cards, so a card always wins a point both cover; the
  // first line that matches is returned only when nothing else does.
  const lineHits: PurElement[] = []
  const check = (list: readonly PurElement[], offsetX: number, offsetY: number): PurElement | null => {
    for (let index = list.length - 1; index >= 0; index--) {
      const element = list[index]
      if (element === undefined) continue
      if (element.type === 'line') {
        // A detached line has its own segment; a bound one spans its two cards.
        const tolerance = lineTolerance / (scale || 1)
        if (element.from === '' && element.to === '') {
          if (element.x === undefined || element.y === undefined) continue
          const start = { x: element.x, y: element.y }
          const end = { x: element.x + (element.w ?? 0), y: element.y + (element.h ?? 0) }
          if (distanceToLinePath(element.style, start, end, worldX, worldY) < tolerance) lineHits.push(element)
          continue
        }
        const endpoints = boundLineEndpoints(elements, element)
        if (endpoints === null) continue
        if (distanceToLinePath(element.style, endpoints.start, endpoints.end, worldX, worldY) < tolerance) lineHits.push(element)
        continue
      }
      const left = element.x + offsetX
      const top = element.y + offsetY
      const inside = worldX >= left && worldX <= left + (element.w || 0) && worldY >= top && worldY <= top + (element.h || 0)
      if (!inside) continue
      if (element.type === 'group' && !element.locked) {
        const child = check(element.children, left, top)
        if (child !== null) return child
      }
      return element
    }
    return null
  }
  return check(elements, 0, 0) ?? lineHits[0] ?? null
}

/**
 * Find a pin under a world point; outputs are searched before inputs.
 * @param elements - top-level elements.
 * @param worldX - world x of the pointer.
 * @param worldY - world y of the pointer.
 * @param scale - zoom, so the tolerance keeps a constant screen size.
 * @returns the pin, or null.
 */
export function pinAt(elements: readonly PurElement[], worldX: number, worldY: number, scale: number): PurPinHit | null {
  const tolerance = PIN_HIT_PX / scale
  const candidates: { element: PurNodeElement; offsetX: number; offsetY: number }[] = []
  const collect = (list: readonly PurElement[], offsetX: number, offsetY: number): void => {
    for (let index = list.length - 1; index >= 0; index--) {
      const element = list[index]
      if (element === undefined) continue
      if (element.type === 'group') {
        collect(element.children, offsetX + element.x, offsetY + element.y)
        continue
      }
      if (element.type === 'line') continue
      if (!carriesPins(element)) continue
      candidates.push({ element, offsetX, offsetY })
    }
  }
  collect(elements, 0, 0)

  for (const { element, offsetX, offsetY } of candidates) {
    const outputs = element.outputs ?? []
    for (let index = 0; index < outputs.length; index++) {
      const pin = outputs[index]
      if (pin === undefined) continue
      const offset = pinPosition(element, false, index)
      if (distance(worldX, worldY, element.x + offsetX + offset.x, element.y + offsetY + offset.y) < tolerance) {
        return { nodeId: element.id, pinId: pin.id, isOutput: true }
      }
    }
    const inputs = element.inputs ?? []
    for (let index = 0; index < inputs.length; index++) {
      const pin = inputs[index]
      if (pin === undefined) continue
      const offset = pinPosition(element, true, index)
      if (distance(worldX, worldY, element.x + offsetX + offset.x, element.y + offsetY + offset.y) < tolerance) {
        return { nodeId: element.id, pinId: pin.id, isOutput: false }
      }
    }
  }
  return null
}

/**
 * Find an endpoint of an existing pin connection under a world point.
 * @param elements - top-level elements.
 * @param worldX - world x of the pointer.
 * @param worldY - world y of the pointer.
 * @param scale - zoom, so the tolerance keeps a constant screen size.
 * @returns the endpoint, or null.
 */
export function lineEndpointAt(elements: readonly PurElement[], worldX: number, worldY: number, scale: number): PurLineEndpointHit | null {
  const tolerance = ENDPOINT_HIT_PX / scale
  const lines: PurElement[] = []
  const collect = (list: readonly PurElement[]): void => {
    for (const element of list) {
      if (element.type === 'line') lines.push(element)
      if (element.type === 'group') collect(element.children)
    }
  }
  collect(elements)

  for (const line of lines) {
    if (line.type !== 'line') continue
    if (line.fromPin === undefined && line.toPin === undefined) continue
    if (line.fromPin !== undefined) {
      const position = pinWorldPosition(elements, line.from, line.fromPin)
      if (position !== null && distance(worldX, worldY, position.x, position.y) < tolerance) {
        return { lineId: line.id, isFrom: true, nodeId: line.from, pinId: line.fromPin }
      }
    }
    if (line.toPin !== undefined) {
      const position = pinWorldPosition(elements, line.to, line.toPin)
      if (position !== null && distance(worldX, worldY, position.x, position.y) < tolerance) {
        return { lineId: line.id, isFrom: false, nodeId: line.to, pinId: line.toPin }
      }
    }
  }
  return null
}

/**
 * Tell whether upstream hit-tests pins on this element kind.
 * @param element - element to classify.
 * @returns true for code nodes, and for text and note links that declare pins.
 */
function carriesPins(element: PurNodeElement): boolean {
  if (element.type === 'code-node') return true
  if (element.type !== 'text' && element.type !== 'note-link') return false
  return (element.inputs?.length ?? 0) > 0 || (element.outputs?.length ?? 0) > 0
}

/**
 * Euclidean distance between two world points.
 * @param ax - first x.
 * @param ay - first y.
 * @param bx - second x.
 * @param by - second y.
 * @returns the distance.
 */
function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)
}

/**
 * World points a bound line's rendered path runs between: its pin when the end
 * names one, otherwise the card centre.
 * @param elements - top-level elements.
 * @param line - the connection.
 * @returns the endpoints, or null when a card is gone.
 */
function boundLineEndpoints(elements: readonly PurElement[], line: PurLineElement): { start: { x: number; y: number }; end: { x: number; y: number } } | null {
  const from = worldRect(elements, line.from)
  const to = worldRect(elements, line.to)
  if (from === null || to === null) return null
  const startPin = line.fromPin === undefined ? null : pinWorldPosition(elements, line.from, line.fromPin)
  const endPin = line.toPin === undefined ? null : pinWorldPosition(elements, line.to, line.toPin)
  return {
    start: startPin === null ? { x: from.x + from.w / 2, y: from.y + from.h / 2 } : { x: startPin.x, y: startPin.y },
    end: endPin === null ? { x: to.x + to.w / 2, y: to.y + to.h / 2 } : { x: endPin.x, y: endPin.y },
  }
}

/**
 * Distance from a point to the path a line is drawn along, in world units. The
 * curve is sampled with the same control points the renderer uses, so a click
 * anywhere on a long arc lands on the line instead of only near its midpoint.
 * @param style - stroke pattern; absent means the default curve.
 * @param start - path start in world units.
 * @param end - path end in world units.
 * @param px - point x.
 * @param py - point y.
 * @returns the shortest distance.
 */
export function distanceToLinePath(style: PurLineStyle | undefined, start: { x: number; y: number }, end: { x: number; y: number }, px: number, py: number): number {
  if (style === 'straight') return distanceToSegment(px, py, start.x, start.y, end.x, end.y)
  if (style === 'rect') {
    const midX = (start.x + end.x) / 2
    return Math.min(
      distanceToSegment(px, py, start.x, start.y, midX, start.y),
      distanceToSegment(px, py, midX, start.y, midX, end.y),
      distanceToSegment(px, py, midX, end.y, end.x, end.y),
    )
  }
  const control = Math.max(50, Math.abs(end.x - start.x) * 0.5)
  const p1 = { x: start.x + control, y: start.y }
  const p2 = { x: end.x - control, y: end.y }
  const samples = 24
  let best = Number.POSITIVE_INFINITY
  let previous = start
  for (let index = 1; index <= samples; index += 1) {
    const t = index / samples
    const u = 1 - t
    const point = {
      x: u * u * u * start.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * end.x,
      y: u * u * u * start.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * end.y,
    }
    best = Math.min(best, distanceToSegment(px, py, previous.x, previous.y, point.x, point.y))
    previous = point
  }
  return best
}

/**
 * Distance from a point to a line segment, in world units.
 * @param px - point x.
 * @param py - point y.
 * @param ax - segment start x.
 * @param ay - segment start y.
 * @param bx - segment end x.
 * @param by - segment end y.
 * @returns the distance.
 */
export function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax
  const dy = by - ay
  const length = dx * dx + dy * dy
  const t = length === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length))
  const closestX = ax + t * dx
  const closestY = ay + t * dy
  return Math.hypot(px - closestX, py - closestY)
}
