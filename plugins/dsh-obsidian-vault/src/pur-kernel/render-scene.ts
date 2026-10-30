/**
 * One render pass: background, grid, connections, group frames, cards, the
 * interaction overlays and the image loads the caller still owes.
 * @module dsh-obsidian-vault/pur-kernel/render-scene
 */
import { drawBackground, drawGrid } from './render-background.ts'
import { placeElements, drawElements } from './render-elements.ts'
import { drawGroupFrames } from './render-groups.ts'
import { drawLines, drawPinDragPreview, drawPinEndpointDots } from './render-lines.ts'
import { drawSelectionRect, drawZoomBadge } from './render-overlays.ts'
import type { PurCanvasContext, PurRenderEffects, PurScene } from './render-types.ts'

/** Canvas-widths beyond the viewport that still trigger an image preload. */
const PRELOAD_MARGIN = 2

/** Images preloaded per frame, matching upstream's cap. */
const PRELOAD_LIMIT = 20

/**
 * Draw one frame.
 * @param ctx - drawing surface, in canvas pixels.
 * @param scene - everything the frame shows.
 * @returns image keys the caller should decode before the next frame.
 */
export function drawScene(ctx: PurCanvasContext, scene: PurScene): PurRenderEffects {
  const loads: string[] = []
  const requestImage = (key: string): void => {
    loads.push(key)
  }
  drawBackground(ctx, scene)
  drawGrid(ctx, scene)
  drawLines(ctx, scene)
  drawGroupFrames(ctx, scene)
  drawElements(ctx, scene, requestImage)
  if (scene.selectionRect !== null && scene.selectionRect !== undefined) drawSelectionRect(ctx, scene.selectionRect)
  drawPinDragPreview(ctx, scene)
  drawPinEndpointDots(ctx, scene)
  drawZoomBadge(ctx, scene)
  collectPreloads(scene, loads)
  return { loadImages: loads }
}

/**
 * Append the images near the viewport that are still missing from the cache.
 * @param scene - frame description.
 * @param loads - image keys already requested this frame.
 */
function collectPreloads(scene: PurScene, loads: string[]): void {
  const { view } = scene
  const scale = view.scale
  const worldLeft = -view.offsetX / scale
  const worldTop = -view.offsetY / scale
  const left = worldLeft - (scene.width / scale) * PRELOAD_MARGIN
  const right = (scene.width - view.offsetX) / scale + (scene.width / scale) * PRELOAD_MARGIN
  const top = worldTop - (scene.height / scale) * PRELOAD_MARGIN
  const bottom = (scene.height - view.offsetY) / scale + (scene.height / scale) * PRELOAD_MARGIN
  let count = 0
  for (const placed of placeElements(scene.elements)) {
    const element = placed.element
    if (element.type !== 'image' || element.dataURL === undefined) continue
    if (placed.x + element.w < left || placed.x > right || placed.y + element.h < top || placed.y > bottom) continue
    if (scene.images?.get(element.dataURL) !== undefined) continue
    count++
    loads.push(element.dataURL)
    if (count > PRELOAD_LIMIT) break
  }
}
