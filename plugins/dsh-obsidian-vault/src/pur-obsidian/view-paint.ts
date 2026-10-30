/**
 * The view's paint pipeline: a rAF loop that repaints on the dirty flag or
 * live pan momentum, keeps the canvas backing store matched to the surface at
 * device pixel ratio, and decodes referenced images into a cache keyed by
 * `dataURL || original` (vault paths load through `readBinary` as blob URLs).
 * @module dsh-obsidian-vault/pur-obsidian/view-paint
 */
import { TFile } from 'obsidian'
import type { App } from 'obsidian'
import { buildPurScene, drawScene } from '../pur-kernel/index.ts'
import type { PurController, PurControllerEnv, PurRenderLabels, PurRenderPreferences } from '../pur-kernel/index.ts'

/** What the painter pulls from the view, resolved per frame. */
export interface PurPainterSource {
  /** The controller, null before the first document load. @returns the controller. */
  controller(): PurController | null
  /** Resolved colours and grid toggle. @returns the preferences. */
  preferences(): PurRenderPreferences
  /** Renderer copy bundle. @returns the labels. */
  labels(): PurRenderLabels
}

/** Owns the canvas, the frame loop, the resize observer and the image cache. */
export class PurCanvasPainter {
  private readonly app: App
  private readonly env: PurControllerEnv
  private readonly source: PurPainterSource
  private canvas: HTMLCanvasElement | null = null
  private resizeObserver: ResizeObserver | null = null
  private dirty = true
  private frame = 0
  private readonly images = new Map<string, CanvasImageSource>()
  private readonly pendingImages = new Set<string>()

  /**
   * Create the painter.
   * @param app - the application.
   * @param env - the controller environment whose canvas size is kept in sync.
   * @param source - per-frame view state.
   */
  public constructor(app: App, env: PurControllerEnv, source: PurPainterSource) {
    this.app = app
    this.env = env
    this.source = source
  }

  /** Decoded images keyed by `dataURL || original`. @returns the cache. */
  get imageMap(): ReadonlyMap<string, CanvasImageSource> {
    return this.images
  }

  /**
   * Attach to the canvas, sync its size, observe resizes and start the loop.
   * @param surface - the sized wrapper element.
   * @param canvas - the canvas to paint.
   */
  public attach(surface: HTMLElement, canvas: HTMLCanvasElement): void {
    this.canvas = canvas
    this.resizeObserver = new ResizeObserver(() => this.syncSize(surface, canvas))
    this.resizeObserver.observe(surface)
    this.syncSize(surface, canvas)
    this.frame = requestAnimationFrame(this.tick)
  }

  /** Stop the loop and release the observer. */
  public detach(): void {
    cancelAnimationFrame(this.frame)
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    this.canvas = null
  }

  /** Mark the next frame for repaint. */
  public markDirty(): void {
    this.dirty = true
  }

  /** The frame loop: advance momentum, repaint when dirty. */
  private readonly tick = (): void => {
    this.frame = requestAnimationFrame(this.tick)
    const controller = this.source.controller()
    if (controller !== null && controller.momentumStep()) this.dirty = true
    if (!this.dirty) return
    this.dirty = false
    this.paint()
  }

  /** Draw one frame and kick off loads for images the scene references. */
  private paint(): void {
    const canvas = this.canvas
    const controller = this.source.controller()
    if (canvas === null || controller === null) return
    const ctx = canvas.getContext('2d')
    if (ctx === null) return
    const dpr = window.devicePixelRatio || 1
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const effects = drawScene(ctx, buildPurScene(controller, {
      width: canvas.clientWidth,
      height: canvas.clientHeight,
      preferences: this.source.preferences(),
      labels: this.source.labels(),
      images: this.images,
      now: () => Date.now(),
    }))
    for (const key of effects.loadImages) this.requestImage(key)
  }

  /** Decode an image once, repainting when it becomes drawable. */
  private requestImage(key: string): void {
    if (this.images.has(key) || this.pendingImages.has(key)) return
    this.pendingImages.add(key)
    const image = new Image()
    image.onload = () => {
      this.pendingImages.delete(key)
      this.images.set(key, image)
      this.dirty = true
    }
    image.onerror = () => {
      this.pendingImages.delete(key)
    }
    if (key.startsWith('data:') || /^https?:/i.test(key)) {
      image.src = key
      return
    }
    const entry = this.app.vault.getAbstractFileByPath(key)
    if (!(entry instanceof TFile)) {
      this.pendingImages.delete(key)
      return
    }
    void this.app.vault.readBinary(entry).then((bytes) => {
      image.src = URL.createObjectURL(new Blob([bytes]))
    })
  }

  /** Resize the backing store to the surface, keeping the env's CSS-pixel size. */
  private syncSize(surface: HTMLElement, canvas: HTMLCanvasElement): void {
    const width = surface.clientWidth
    const height = surface.clientHeight
    if (width === 0 || height === 0) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    this.env.canvasWidth = width
    this.env.canvasHeight = height
    this.dirty = true
  }
}
