/**
 * Card placement: flattening groups into absolute positions, viewport culling
 * and the per-element transform that carries rotation, flips, opacity and the
 * selection frame. Drawing the bodies themselves lives in the `render-text`,
 * `render-cards` and `render-code-node` modules.
 * @module dsh-obsidian-vault/pur-kernel/render-elements
 */
import { drawImageCard, drawNoteLinkCard } from './render-cards.ts'
import { drawCodeNodeCard } from './render-code-node.ts'
import { drawElementSelection } from './render-overlays.ts'
import type { PurCanvasContext, PurScene } from './render-types.ts'
import { screenX, screenY } from './render-shared.ts'
import { drawTextBody, drawTextPins, drawTitlePill } from './render-text.ts'
import type { PurElement, PurGroupElement, PurNodeElement } from './types.ts'

/** Element kinds a card position owns; groups only contribute their children. */
export type PurCardElement = Exclude<PurNodeElement, PurGroupElement>

/** An element with its absolute world position. */
export interface PurPlacedElement {
  /** The element; groups never appear here. */
  element: PurCardElement
  /** Absolute world x, with enclosing-group offsets applied. */
  x: number
  /** Absolute world y, with enclosing-group offsets applied. */
  y: number
}

/**
 * Flatten top-level groups into their children, keeping document order so the
 * z-order matches upstream.
 * @param elements - top-level elements.
 * @returns the placed cards, lines excluded.
 */
export function placeElements(elements: readonly PurElement[]): PurPlacedElement[] {
  const placed: PurPlacedElement[] = []
  const expand = (list: readonly PurElement[], offsetX: number, offsetY: number): void => {
    for (const element of list) {
      if (element.type === 'group') {
        if (element.collapsed !== true) expand(element.children, offsetX + element.x, offsetY + element.y)
        continue
      }
      if (element.type === 'line') continue
      placed.push({ element, x: element.x + offsetX, y: element.y + offsetY })
    }
  }
  expand(elements, 0, 0)
  return placed
}

/**
 * Draw every card inside the viewport.
 * @param ctx - drawing surface.
 * @param scene - frame description.
 * @param requestImage - receives a cache key the caller should decode.
 */
export function drawElements(ctx: PurCanvasContext, scene: PurScene, requestImage: (key: string) => void): void {
  const { view } = scene
  const scale = view.scale
  const worldLeft = -view.offsetX / scale
  const worldTop = -view.offsetY / scale
  const worldRight = (scene.width - view.offsetX) / scale
  const worldBottom = (scene.height - view.offsetY) / scale
  for (const placed of placeElements(scene.elements)) {
    const element = placed.element
    if (placed.x + element.w < worldLeft || placed.x > worldRight) continue
    if (placed.y + element.h < worldTop || placed.y > worldBottom) continue
    const screenW = element.w * scale
    const screenH = element.h * scale
    if (screenW < 2 || screenH < 2) continue
    drawCard(ctx, scene, placed, screenX(view, placed.x), screenY(view, placed.y), screenW, screenH, requestImage)
  }
}

/**
 * Draw one card: title pill, transform, body and selection frame.
 * @param ctx - drawing surface.
 * @param scene - frame description.
 * @param placed - element and absolute position.
 * @param x - canvas left edge.
 * @param y - canvas top edge.
 * @param screenW - canvas width.
 * @param screenH - canvas height.
 * @param requestImage - receives a cache key the caller should decode.
 */
function drawCard(
  ctx: PurCanvasContext,
  scene: PurScene,
  placed: PurPlacedElement,
  x: number,
  y: number,
  screenW: number,
  screenH: number,
  requestImage: (key: string) => void,
): void {
  const element = placed.element
  const scale = scene.view.scale
  // A code node already shows its title in the card header, so only plain text
  // cards get the pill above them.
  if (element.type === 'text' && element.title) {
    drawTitlePill(ctx, element.title, element, x, y, scale)
  }
  const editing = scene.editingIds?.has(element.id) ?? false
  ctx.save()
  ctx.translate(x + screenW / 2, y + screenH / 2)
  if (element.rotation) ctx.rotate((element.rotation * Math.PI) / 180)
  if (element.flipH) ctx.scale(-1, 1)
  if (element.flipV) ctx.scale(1, -1)
  ctx.translate(-screenW / 2, -screenH / 2)
  ctx.globalAlpha = element.opacity !== undefined ? element.opacity : 1
  if (!editing) drawBody(ctx, scene, element, screenW, screenH, requestImage)
  ctx.restore()
  const selected = scene.selectedIds?.has(element.id) ?? false
  if (selected && !editing) drawElementSelection(ctx, element, x, y, screenW, screenH, scene.view.scale)
}

/**
 * Draw the card body for one element kind.
 * @param ctx - drawing surface.
 * @param scene - frame description.
 * @param element - the card.
 * @param screenW - canvas width.
 * @param screenH - canvas height.
 * @param requestImage - receives a cache key the caller should decode.
 */
function drawBody(
  ctx: PurCanvasContext,
  scene: PurScene,
  element: PurCardElement,
  screenW: number,
  screenH: number,
  requestImage: (key: string) => void,
): void {
  if (element.type === 'text') {
    drawTextBody(ctx, scene, element, screenW, screenH)
    drawTextPins(ctx, scene, element, screenW, screenH)
    return
  }
  if (element.type === 'image') {
    drawImageCard(ctx, scene, element, screenW, screenH, requestImage)
    return
  }
  if (element.type === 'note-link') {
    drawNoteLinkCard(ctx, scene, element, screenW, screenH)
    return
  }
  drawCodeNodeCard(ctx, scene, element, screenW, screenH)
}
