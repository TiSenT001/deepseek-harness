/**
 * Paint loop and native DOM wiring for the React Pur pane: rAF repainting on
 * the dirty flag or live pan momentum, backing-store resizing at device pixel
 * ratio, non-passive wheel zoom (zoom never scrolls the page), and native
 * drop routing (the kernel flow needs the container as `currentTarget`).
 * @module dsh-obsidian-vault/client/pur/pane-paint
 */
import { buildPurScene, drawScene, prefetchKeys } from '../../pur-kernel/index.ts'
import type { PurController, PurControllerEffect, PurControllerEnv, PurRenderLabels, PurRenderPreferences } from '../../pur-kernel/index.ts'
import type { PurImageCache } from './loader.ts'
import { dropIntoCanvas } from './paste-drop.ts'
import type { PurInsertDeps } from './paste-drop.ts'

/** What the paint loop pulls from the pane, resolved per frame. */
export interface PurPaintDeps {
  /** The mutable controller environment whose canvas size is kept in sync. */
  readonly env: PurControllerEnv
  /** Decoded-image cache. */
  readonly images: PurImageCache
  /** Resolved colours and grid toggle. */
  readonly preferences: PurRenderPreferences
  /** The controller, null before the document loads. @returns the controller. */
  controller(): PurController | null
  /** Renderer copy bundle. @returns the labels. */
  labels(): PurRenderLabels
  /** The pane's dirty flag. */
  readonly dirtyRef: { current: boolean }
}

/**
 * Run the frame loop until the returned cleanup is called: momentum frames
 * mark the pane dirty, dirty frames repaint and kick image loads, resizes
 * repaint.
 * @param container - the sized wrapper element.
 * @param canvas - the canvas to paint.
 * @param deps - per-frame pane state.
 * @returns the cleanup.
 */
export function startPurPaintLoop(container: HTMLElement, canvas: HTMLCanvasElement, deps: PurPaintDeps): () => void {
  const paint = (): void => {
    const controller = deps.controller()
    const ctx = canvas.getContext('2d')
    const width = container.clientWidth
    const height = container.clientHeight
    if (controller === null || ctx === null || width === 0 || height === 0) return
    const dpr = window.devicePixelRatio || 1
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      deps.env.canvasWidth = width
      deps.env.canvasHeight = height
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const effects = drawScene(ctx, buildPurScene(controller, { width, height, preferences: deps.preferences, labels: deps.labels(), images: deps.images.map, now: () => Date.now() }))
    for (const key of effects.loadImages) {
      deps.images.request(key, () => {
        deps.dirtyRef.current = true
      })
    }
  }
  let frame = 0
  /** Last moment a frame was painted, so prefetch only runs while idle. */
  let lastPaint = 0
  /** Last moment a prefetch pass ran. */
  let lastPrefetch = 0
  /**
   * Warm the pictures just outside the viewport while nothing is moving, so a pan
   * meets decoded bitmaps instead of starting a decode per new card.
   */
  const prefetch = (controller: PurController, width: number, height: number): void => {
    const now = performance.now()
    lastPrefetch = now
    for (const key of prefetchKeys(controller.state.elements, controller.state.view, width, height)) {
      deps.images.request(key, () => {
        deps.dirtyRef.current = true
      })
    }
  }
  const tick = (): void => {
    frame = requestAnimationFrame(tick)
    const controller = deps.controller()
    if (controller !== null && controller.momentumStep()) deps.dirtyRef.current = true
    const idleSince = performance.now() - lastPaint
    if (!deps.dirtyRef.current) {
      // Nothing to draw: spend the idle frame warming the next screenful.
      if (controller !== null && idleSince > 200 && performance.now() - lastPrefetch > 300) {
        prefetch(controller, container.clientWidth, container.clientHeight)
      }
      return
    }
    deps.dirtyRef.current = false
    lastPaint = performance.now()
    paint()
  }
  const observer = new ResizeObserver(() => {
    deps.dirtyRef.current = true
  })
  observer.observe(container)
  frame = requestAnimationFrame(tick)
  return () => {
    cancelAnimationFrame(frame)
    observer.disconnect()
  }
}

/**
 * Attach the non-passive wheel listener that forwards zoom to the controller.
 * @param canvas - the canvas.
 * @param controller - controller getter.
 * @param run - effect drain.
 * @returns the cleanup.
 */
export function wirePurPaneWheel(canvas: HTMLCanvasElement, controller: () => PurController | null, run: (effects: readonly PurControllerEffect[]) => void): () => void {
  const onWheel = (event: WheelEvent): void => {
    event.preventDefault()
    const active = controller()
    if (active === null) return
    const rect = canvas.getBoundingClientRect()
    run(active.wheel({ clientX: event.clientX, clientY: event.clientY, rectLeft: rect.left, rectTop: rect.top, deltaY: event.deltaY }))
  }
  canvas.addEventListener('wheel', onWheel, { passive: false })
  return () => canvas.removeEventListener('wheel', onWheel)
}

/**
 * Attach native drop and dragover listeners on the container.
 * @param container - the wrapper element.
 * @param controller - controller getter.
 * @param insertDeps - vault access and effect drain for the kernel flow.
 * @returns the cleanup.
 */
export function wirePurPaneDrop(container: HTMLElement, controller: () => PurController | null, insertDeps: PurInsertDeps): () => void {
  const onDrop = (event: DragEvent): void => {
    const active = controller()
    if (active !== null) dropIntoCanvas(active, event, insertDeps)
  }
  const onDragOver = (event: DragEvent): void => event.preventDefault()
  container.addEventListener('drop', onDrop)
  container.addEventListener('dragover', onDragOver)
  return () => {
    container.removeEventListener('drop', onDrop)
    container.removeEventListener('dragover', onDragOver)
  }
}
