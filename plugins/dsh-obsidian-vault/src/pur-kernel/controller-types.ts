import type { PurResizeHandle } from './resize-handles.ts'
/**
 * Controller contracts: the events adapters forward, the environment and copy
 * they inject, the effects the kernel reports back, the menu model the
 * adapter renders, and the mutable state shared by the pointer, command and
 * menu modules. No DOM, Obsidian or host APIs.
 * @module dsh-obsidian-vault/pur-kernel/controller-types
 */
import type { PurPinHit } from './hit-test.ts'
import type { PurScreenRect } from './render-types.ts'
import type { PurElement, PurViewState } from './types.ts'

/** Mouse event the adapter forwards, with the canvas rect origin resolved. */
export interface PurPointerEvent {
  /** Viewport x of the pointer. */
  clientX: number
  /** Viewport y of the pointer. */
  clientY: number
  /** Left edge of the canvas in viewport coordinates. */
  rectLeft: number
  /** Top edge of the canvas in viewport coordinates. */
  rectTop: number
  /** 0 left, 1 middle, 2 right. */
  button: number
  /** Whether Ctrl was held. */
  ctrlKey: boolean
  /** Whether Meta was held. */
  metaKey: boolean
  /** Whether Shift was held. */
  shiftKey: boolean
}

/** Wheel event the adapter forwards, with the canvas rect origin resolved. */
export interface PurWheelEvent {
  /** Viewport x of the pointer. */
  clientX: number
  /** Viewport y of the pointer. */
  clientY: number
  /** Left edge of the canvas in viewport coordinates. */
  rectLeft: number
  /** Top edge of the canvas in viewport coordinates. */
  rectTop: number
  /** Wheel delta; positive zooms out. */
  deltaY: number
}

/** Keyboard event the adapter forwards. */
export interface PurKeyEvent {
  /** `KeyboardEvent.key`, compared case-sensitively exactly like upstream. */
  key: string
  /** Whether Ctrl was held. */
  ctrlKey: boolean
  /** Whether Meta was held. */
  metaKey: boolean
}

/** Environment the adapter supplies once at construction. */
export interface PurControllerEnv {
  /** Canvas width in pixels, for `fitToView` and paste centring. */
  canvasWidth: number
  /** Canvas height in pixels. */
  canvasHeight: number
  /** Element id source; tests pin it. */
  createId: () => string
  /** Wall clock in ms, for the zoom badge window and lock pulses. */
  now: () => number
  /** True while an edit or URL dialog is open, which swallows pointer-downs and keys. */
  hasOpenDialog: () => boolean
}

/** Display copy the controller interpolates, supplied by the adapter locale. */
export interface PurControllerLabels {
  /** Body of a freshly added text block (`双击编辑文本`). */
  textPlaceholder: string
  /** Title fallback for an unnamed code node (`节点`). */
  codeNodeFallbackTitle: string
  /** Notice after copying or duplicating (`已复制 N 个元素`). */
  copiedElements: (count: number) => string
  /** Notice after relinking a line start (`连线起点已重连`). */
  relinkedFrom: string
  /** Notice after relinking a line end (`连线终点已重连`). */
  relinkedTo: string
  /** Notice after creating a pin connection (`连线已创建`). */
  lineCreated: string
  /** Notice when connect is requested without exactly two elements. */
  connectNeedsTwo: string
  /** Notice when grouping fewer than two non-line elements. */
  selectTwoToGroup: string
  /** Notice after Ctrl+S persists the canvas. */
  saved: string
  /** Notice when double-clicking a locked element. */
  lockedNotice: string
  /** Notice after the code-node editor commits. */
  nodeUpdated: string
  /** Notice after the code-node editor deletes its node. */
  nodeDeleted: string
  /** Content of a dropped web link card (`网页链接`). */
  webLinkCard: string
}

/** What the adapter must do after a kernel call, in order. */
export type PurControllerEffect =
  | { type: 'render' }
  | { type: 'save' }
  | { type: 'notice'; text: string }
  | { type: 'cursor'; cursor: string }
  | { type: 'open-link'; target: string }
  | { type: 'edit-text'; id: string }
  | { type: 'edit-group'; id: string }
  | { type: 'edit-line'; id: string }
  | { type: 'edit-note-link'; id: string }
  | { type: 'context-menu'; clientX: number; clientY: number }
  | { type: 'export-text' }

/** A pin connection in flight (upstream `_pinDrag`). */
export interface PurPinDragState {
  /** Element the line leaves, null while a relink-from floats free. */
  fromNodeId: string | null
  /** Output pin the line leaves, null while a relink-from floats free. */
  fromPinId: string | null
  /** Element the line enters; present only while relinking a start. */
  toNodeId?: string
  /** Input pin the line enters; present only while relinking a start. */
  toPinId?: string
  /** Pointer x in canvas pixels, anchoring the free end. */
  mouseScreenX: number
  /** Pointer y in canvas pixels. */
  mouseScreenY: number
  /** Line being relinked, null while creating. */
  lineId: string | null
  /** Which end relinks; absent while creating a new line. */
  dragMode?: 'relink-from' | 'relink-to'
}

/** One element snapshot taken when a drag starts (upstream `dragStart.elements`). */
export interface PurDragEntry {
  /** Element id. */
  id: string
  /** Absolute world x at drag start. */
  x: number
  /** Absolute world y at drag start. */
  y: number
  /** Enclosing-group x offset at drag start. */
  parentX: number
  /** Enclosing-group y offset at drag start. */
  parentY: number
}

/** A resize session (upstream `resizeStart` plus `resizeElement`). */
export interface PurResizeState {
  /** Element being resized. */
  elementId: string
  /** Pointer viewport x at resize start. */
  startX: number
  /** Pointer viewport y at resize start. */
  startY: number
  /** Which handle the drag started from. */
  handle: PurResizeHandle
  /** Width at resize start. */
  w: number
  /** Height at resize start. */
  h: number
  /** Enclosing-group x offset. */
  parentX: number
  /** Enclosing-group y offset. */
  parentY: number
}

/** Everything the controller mutates; the adapter renders from it. */
export interface PurControllerState {
  /** Top-level elements; groups own the rest. */
  elements: PurElement[]
  /** Pan and zoom. */
  view: PurViewState
  /** Selected element ids. */
  selectedIds: Set<string>
  /** Line under the pointer, by id. */
  hoveredLineId: string | null
  /** Pin under the pointer. */
  hoverPin: PurPinHit | null
  /** Rubber-band selection in canvas pixels. */
  selectionRect: PurScreenRect | null
  /** Pin connection being dragged. */
  pinDrag: PurPinDragState | null
  /** Last pointer position in viewport coordinates. */
  lastMouse: { x: number; y: number }
  /** Whether a pan drag is active. */
  panning: boolean
  /** Whether a rubber-band selection is active. */
  selecting: boolean
  /** Whether an element drag is active. */
  dragging: boolean
  /** Drag start snapshots, null entries preserved like upstream. */
  dragStart: { clientX: number; clientY: number; elements: (PurDragEntry | null)[] } | null
  /** Whether a resize drag is active. */
  resizing: boolean
  /** Resize session. */
  resize: PurResizeState | null
  /** Pan velocity for momentum, in viewport px per frame. */
  panVel: { x: number; y: number }
  /** Right-button press point, for the click-vs-pan test. */
  rightClickStart: { x: number; y: number } | null
  /** Zoom badge visible until this timestamp, null hides it. */
  showZoomUntil: number | null
  /** Internal clipboard; deep copies of the last copied elements. */
  clipboard: PurElement[]
  /** Elements whose lock badge pulses, filled by lock commands. */
  lockPulseIds: Set<string>
}

/** Undo/redo stack of JSON snapshots (upstream `history` plus `historyIndex`). */
export interface PurHistory {
  /** Serialized element trees. */
  stack: string[]
  /** Index of the current snapshot. */
  index: number
  /** Maximum retained snapshots; upstream keeps 50. */
  max: number
}

/** Shared tool bundle every controller operation receives. */
export interface PurControllerTools {
  /** Mutable controller state. */
  state: PurControllerState
  /** Undo/redo stack. */
  history: PurHistory
  /** Adapter-supplied environment. */
  env: PurControllerEnv
  /** Adapter-supplied display copy. */
  labels: PurControllerLabels
}

/** One entry of the context-menu model the adapter renders. */
export interface PurMenuEntry {
  /** Stable action id; adapters dispatch on it. */
  id: string
  /** Icon name, upstream's `setIcon` argument. */
  icon: string
  /** Locale key for the title, when upstream translates or the kernel owns the copy. */
  labelKey?: string
  /** Literal title, for pin names and other data-driven entries. */
  label?: string
  /** Submenu entries. */
  children?: PurMenuEntry[]
  /** Whether a separator follows this entry. */
  separatorAfter?: boolean
  /** Current value, for the opacity slider entry. */
  value?: number
}

/** The context menu as data; the adapter turns it into a native menu. */
export interface PurMenuModel {
  /** Entries in display order. */
  entries: PurMenuEntry[]
}

/** Host facts the menu model branches on. */
export interface PurMenuContext {
  /** Whether the workspace active file is a markdown note (embed entry). */
  activeFileIsMarkdown: boolean
  /** Whether the canvas already lives in a popout window. */
  isPopout: boolean
  /** Whether the window is pinned always-on-top. */
  isPinned: boolean
  /** Whether the host can move the canvas into its own window. */
  supportsPopout: boolean
  /** Whether the host can pin the window always-on-top. */
  supportsPinTop: boolean
  /** Whether the host can reveal a file in the OS file manager. */
  supportsReveal: boolean
}
