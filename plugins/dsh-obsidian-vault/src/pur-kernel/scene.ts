/**
 * Scene assembly: fold the controller state into the {@link PurScene} the
 * renderer consumes, resolving the zoom-badge window against the adapter's
 * clock. The adapter supplies canvas size, colours, copy and its image cache.
 * @module dsh-obsidian-vault/pur-kernel/scene
 */
import type { PurController } from './controller.ts'
import type { PurRenderLabels, PurRenderPreferences, PurScene } from './render-types.ts'

/** Milliseconds over which the zoom badge fades out, matching upstream. */
const ZOOM_BADGE_FADE_MS = 600

/** Host facts and resources one frame needs, beyond the controller state. */
export interface PurSceneHost {
  /** Canvas width in pixels. */
  width: number
  /** Canvas height in pixels. */
  height: number
  /** Resolved colours and grid toggle. */
  preferences: PurRenderPreferences
  /** Renderer copy bundle. */
  labels: PurRenderLabels
  /** Decoded images keyed by `dataURL || original`. */
  images?: ReadonlyMap<string, CanvasImageSource>
  /** Elements replaced by their editor, so no body is drawn. */
  editingIds?: ReadonlySet<string>
  /** Wall clock in ms, for the zoom badge window. */
  now: () => number
}

/**
 * Build the scene for one frame.
 * @param controller - the canvas controller.
 * @param host - canvas size, colours, copy, image cache and clock.
 * @returns the scene; `zoomBadgeAlpha` is absent once the badge window ends.
 */
export function buildPurScene(controller: PurController, host: PurSceneHost): PurScene {
  const state = controller.state
  return {
    elements: state.elements,
    view: state.view,
    width: host.width,
    height: host.height,
    preferences: host.preferences,
    labels: host.labels,
    images: host.images,
    selectedIds: state.selectedIds,
    hoveredLineId: state.hoveredLineId ?? undefined,
    hoverPin: state.hoverPin,
    selectionRect: state.selectionRect,
    pinDrag: controller.pinDragPreview(),
    zoomBadgeAlpha: zoomBadgeAlpha(state.showZoomUntil, host.now()),
    lockPulseIds: state.lockPulseIds,
    editingIds: host.editingIds,
  }
}

/**
 * The badge opacity for this frame: 1 while more than the fade window remains,
 * fading linearly afterwards, and absent once the window closes.
 * @param showZoomUntil - badge window end, null hides the badge.
 * @param now - current wall clock in ms.
 * @returns the alpha, or undefined when the badge is hidden.
 */
export function zoomBadgeAlpha(showZoomUntil: number | null, now: number): number | undefined {
  if (showZoomUntil === null) return undefined
  const remaining = showZoomUntil - now
  if (remaining <= 0) return undefined
  return Math.min(1, remaining / ZOOM_BADGE_FADE_MS)
}
