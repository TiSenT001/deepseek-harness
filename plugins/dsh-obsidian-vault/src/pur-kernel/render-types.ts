/**
 * The draw contract: a minimal canvas 2D surface, the scene the renderer
 * consumes and the per-frame side effects it reports. The kernel never touches
 * a real canvas; adapters pass `CanvasRenderingContext2D`, which satisfies
 * {@link PurCanvasContext} structurally.
 * @module dsh-obsidian-vault/pur-kernel/render-types
 */
import type { PurElement, PurViewState } from './types.ts'

/**
 * The canvas 2D members the renderer uses. Declared here so a recording
 * context can implement the renderer without the DOM.
 */
export interface PurCanvasContext {
  /** Fill style used by `fill()` and `fillRect()`. */
  fillStyle: string | CanvasGradient | CanvasPattern
  /** Stroke style used by `stroke()` and `strokeRect()`. */
  strokeStyle: string | CanvasGradient | CanvasPattern
  /** Stroke width in pixels. */
  lineWidth: number
  /** End cap of open paths. */
  lineCap: CanvasLineCap
  /** Join style where path segments meet. */
  lineJoin: CanvasLineJoin
  /** Alpha applied to every draw. */
  globalAlpha: number
  /** CSS font shorthand. */
  font: string
  /** Horizontal text anchor. */
  textAlign: CanvasTextAlign
  /** Vertical text anchor. */
  textBaseline: CanvasTextBaseline
  /** Drop-shadow colour. */
  shadowColor: string
  /** Drop-shadow blur radius in pixels. */
  shadowBlur: number
  /** Erase a rectangle. */
  clearRect(x: number, y: number, w: number, h: number): void
  /** Fill a rectangle. */
  fillRect(x: number, y: number, w: number, h: number): void
  /** Stroke a rectangle. */
  strokeRect(x: number, y: number, w: number, h: number): void
  /** Push the drawing state. */
  save(): void
  /** Pop the drawing state. */
  restore(): void
  /** Offset the origin. */
  translate(x: number, y: number): void
  /** Rotate around the origin by radians. */
  rotate(angle: number): void
  /** Scale both axes. */
  scale(x: number, y: number): void
  /** Start a path. */
  beginPath(): void
  /** Close the current subpath. */
  closePath(): void
  /** Move the current point. */
  moveTo(x: number, y: number): void
  /** Add a straight segment. */
  lineTo(x: number, y: number): void
  /** Add a cubic Bézier segment. */
  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void
  /** Add a circular arc. */
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): void
  /** Add a tangent arc between two points. */
  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void
  /** Add a rectangular subpath. */
  rect(x: number, y: number, w: number, h: number): void
  /** Fill the current path. */
  fill(): void
  /** Stroke the current path. */
  stroke(): void
  /** Clip to the current path. */
  clip(): void
  /** Replace the dash pattern. */
  setLineDash(segments: number[]): void
  /** Draw text at a point. */
  fillText(text: string, x: number, y: number): void
  /** Measure a line of text with the current font. */
  measureText(text: string): { width: number }
  /** Draw an image into a rectangle. */
  drawImage(image: CanvasImageSource, dx: number, dy: number, dw: number, dh: number): void
  /** Add a rounded rectangle, when the surface supports it. */
  roundRect?(x: number, y: number, w: number, h: number, radii?: number): void
}

/**
 * Decoded images a scene draws from, keyed by `dataURL || original`. Adapters
 * that track decode failures report them through {@link PurImageLookup.failedKeys}
 * so the renderer can draw its broken-image placeholder instead of waiting for
 * an image that will never arrive; a plain `Map` without that record stays
 * valid and renders every missing key as loading.
 */
export interface PurImageLookup extends ReadonlyMap<string, CanvasImageSource> {
  /** Keys whose decode failed and whose placeholder the renderer draws. */
  readonly failedKeys?: ReadonlySet<string>
}

/** Colours and grid toggles the adapter resolves before drawing. */
export interface PurRenderPreferences {
  /** Canvas fill; `transparent` leaves it unpainted. */
  backgroundColor: string
  /** Grid stroke colour. */
  gridColor: string
  /** Whether to draw the grid. */
  showGrid: boolean
}

/** Display copy the renderer interpolates, supplied by the adapter locale. */
export interface PurRenderLabels {
  /** Placeholder over an image still loading. */
  imageLoading: string
  /** Title of a code node that declares none. */
  codeNodeFallbackTitle: string
  /** Type badge drawn on the top-right of a code node. */
  codeNodeBadge: string
  /** Body of a note-link card with no content. */
  noteLinkFallback: string
  /** Prefix of a note-link card showing a code file name. */
  codeCardPrefix: string
}

/**
 * A pin the pointer hovers. Upstream stores `isOutput` for code nodes and
 * `isInput` for plain text pins, so both stay optional; passing a
 * {@link import('./hit-test.ts').PurPinHit} highlights code-node pins only,
 * which is the upstream behaviour.
 */
export interface PurPinHover {
  /** Element owning the pin. */
  nodeId: string
  /** Pin id. */
  pinId: string
  /** True when the pin sits on the right edge. */
  isOutput?: boolean
  /** True when the pin sits on the left edge. */
  isInput?: boolean
}

/** How a pin drag started, which sets which end follows the pointer. */
export type PurPinDragMode = 'new' | 'relink-to' | 'relink-from'

/** A pin connection being dragged, drawn as a dashed preview. */
export interface PurPinDragPreview {
  /** Which end is pinned to a node. */
  mode: PurPinDragMode
  /** Fixed endpoint, when the drag started from a pin. */
  from?: { nodeId: string; pinId: string }
  /** Fixed endpoint, when relinking an existing target. */
  to?: { nodeId: string; pinId: string }
  /** Pointer position in canvas pixels, which anchors the free end. */
  pointerX: number
  /** Pointer position in canvas pixels. */
  pointerY: number
}

/** An axis-aligned rectangle in canvas pixels. */
export interface PurScreenRect {
  /** Left edge. */
  x: number
  /** Top edge. */
  y: number
  /** Width; negative values are normalised before drawing. */
  w: number
  /** Height; negative values are normalised before drawing. */
  h: number
}

/** Everything one frame draws. */
export interface PurScene {
  /** Top-level elements; groups own the rest. */
  elements: readonly PurElement[]
  /** Pan and zoom. */
  view: PurViewState
  /** Canvas width in pixels. */
  width: number
  /** Canvas height in pixels. */
  height: number
  /** Resolved colours and grid toggle. */
  preferences: PurRenderPreferences
  /** Display copy the renderer interpolates. */
  labels: PurRenderLabels
  /** Decoded images keyed by `dataURL || original`, plus the failed keys. */
  images?: PurImageLookup
  /** Elements drawn with the selection frame. */
  selectedIds?: ReadonlySet<string>
  /** Line drawn in its hover style, by id. */
  hoveredLineId?: string
  /** Pin drawn enlarged under the pointer. */
  hoverPin?: PurPinHover | null
  /** Rubber-band selection rectangle, in canvas pixels. */
  selectionRect?: PurScreenRect | null
  /** Pin connection being dragged. */
  pinDrag?: PurPinDragPreview | null
  /** Opacity of the zoom badge, 0–1; absent hides it. */
  zoomBadgeAlpha?: number
  /** Elements whose lock badge pulses after a lock toggle. */
  lockPulseIds?: ReadonlySet<string>
  /** Elements replaced by their editor, so no body is drawn. */
  editingIds?: ReadonlySet<string>
}

/** What the caller must do after a frame. */
export interface PurRenderEffects {
  /** Image keys (`dataURL || original`) the caller should decode, in request order. */
  loadImages: readonly string[]
}
