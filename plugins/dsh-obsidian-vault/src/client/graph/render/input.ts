/**
 * Pointer input for the graph canvas: hover, drag, pan, wheel zoom. Kept apart
 * from the React host so the component stays a thin shell.
 * @module dsh-obsidian-vault/graph/render/input
 */
import type { GraphNodeDto } from '../../../protocol.ts'
import type { SimNode } from '../layout.ts'
import { hitTest } from './hit.ts'
import type { GraphCamera } from '../../ui/GraphCanvas.tsx'

/** Live state the handlers read on each event. */
export interface InputState {
  readonly positions: () => readonly SimNode[]
  readonly camera: () => GraphCamera
  readonly nodeScale: () => number
  readonly nodeInfo: () => ReadonlyMap<string, GraphNodeDto>
}

/** What the handlers report back. */
export interface InputCallbacks {
  readonly onHover: (path: string | undefined, clientX: number, clientY: number) => void
  readonly onActivate: (node: GraphNodeDto) => void
  readonly onDragStart: (path: string) => void
  readonly onDragMove: (clientX: number, clientY: number) => void
  readonly onDragEnd: () => void
  readonly onPan: (dx: number, dy: number) => void
  /**
   * Fling inertia on pan release: velocity in px/s, only when the last move
   * happened within 100 ms of the release, mirroring Obsidian's pan glide.
   */
  readonly onPanFling: (vx: number, vy: number) => void
  readonly onZoom: (factor: number, clientX: number, clientY: number) => void
  /** Right click: the node under the pointer, or undefined over empty space. */
  readonly onContext: (node: GraphNodeDto | undefined, clientX: number, clientY: number) => void
}

/** Drag state the frame loop mirrors onto the element for diagnostics. */
export interface DragState {
  current: string
}

/** Movement beyond this many pixels turns a press into a drag. */
const DRAG_THRESHOLD = 5
/** Release within this window of the last move keeps the pan velocity. */
const FLING_WINDOW_MS = 100

/**
 * Bind pointer handlers to one canvas.
 * @param canvas - the drawing surface.
 * @param state - live graph state.
 * @param callbacks - gesture reports.
 * @param drag - shared drag marker.
 * @returns the disposer removing every listener.
 */
export function attachGraphInput(
  canvas: HTMLCanvasElement,
  state: InputState,
  callbacks: InputCallbacks,
  drag: DragState,
): () => void {
  let hovered: string | undefined
  let dragging: string | null = null
  let panning: { x: number; y: number } | null = null
  let downAt: { x: number; y: number } | null = null
  let velocity = { x: 0, y: 0 }
  let lastMoveAt = 0

  const toWorld = (clientX: number, clientY: number): { x: number; y: number } => {
    const camera = state.camera()
    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left - rect.width / 2
    const y = clientY - rect.top - rect.height / 2
    return { x: (x - camera.panX) / camera.zoom, y: (y - camera.panY) / camera.zoom }
  }

  const pick = (clientX: number, clientY: number): SimNode | undefined =>
    hitTest(state.positions(), toWorld(clientX, clientY), state.camera().zoom, state.nodeScale())

  const movedBeyondThreshold = (event: PointerEvent): boolean =>
    downAt !== null && Math.hypot(event.clientX - downAt.x, event.clientY - downAt.y) > DRAG_THRESHOLD

  const onPointerMove = (event: PointerEvent): void => {
    if (dragging !== null) {
      if (movedBeyondThreshold(event)) {
        callbacks.onDragMove(event.clientX, event.clientY)
      }
      return
    }
    if (panning !== null) {
      const dx = event.clientX - panning.x
      const dy = event.clientY - panning.y
      const now = performance.now()
      const dt = Math.max(1, now - lastMoveAt)
      // Smoothed velocity, Obsidian's `panv = mQ(panv, delta, 0.8)`.
      velocity = {
        x: velocity.x * 0.8 + (dx / dt) * 0.2,
        y: velocity.y * 0.8 + (dy / dt) * 0.2,
      }
      lastMoveAt = now
      callbacks.onPan(dx, dy)
      panning = { x: event.clientX, y: event.clientY }
      return
    }
    const node = pick(event.clientX, event.clientY)
    if (node?.path !== hovered) {
      hovered = node?.path
      callbacks.onHover(hovered, event.clientX, event.clientY)
    }
    canvas.style.cursor = node === undefined ? 'grab' : 'pointer'
  }

  const onPointerDown = (event: PointerEvent): void => {
    downAt = { x: event.clientX, y: event.clientY }
    velocity = { x: 0, y: 0 }
    lastMoveAt = performance.now()
    canvas.setPointerCapture(event.pointerId)
    const node = pick(event.clientX, event.clientY)
    if (node !== undefined) {
      dragging = node.path
      drag.current = node.path
      callbacks.onDragStart(node.path)
      return
    }
    panning = { x: event.clientX, y: event.clientY }
    canvas.style.cursor = 'grabbing'
  }

  const onPointerUp = (event: PointerEvent): void => {
    const wasDragging = dragging
    const wasPanning = panning
    const moved = movedBeyondThreshold(event)
    dragging = null
    drag.current = ''
    panning = null
    downAt = null
    canvas.style.cursor = 'grab'
    if (wasDragging !== null && !moved) {
      const info = state.nodeInfo().get(wasDragging)
      if (info !== undefined) callbacks.onActivate(info)
    }
    if (wasPanning !== null && performance.now() - lastMoveAt < FLING_WINDOW_MS) {
      const speed = Math.hypot(velocity.x, velocity.y)
      if (speed > 0.05) callbacks.onPanFling(velocity.x * 1000, velocity.y * 1000)
    }
    velocity = { x: 0, y: 0 }
    callbacks.onDragEnd()
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
  }

  const onPointerLeave = (): void => {
    dragging = null
    drag.current = ''
    panning = null
    downAt = null
    velocity = { x: 0, y: 0 }
    hovered = undefined
    callbacks.onHover(undefined, 0, 0)
    callbacks.onDragEnd()
  }

  const onWheel = (event: WheelEvent): void => {
    event.preventDefault()
    callbacks.onZoom(event.deltaY < 0 ? 1.1 : 1 / 1.1, event.clientX, event.clientY)
  }

  const onContextMenu = (event: MouseEvent): void => {
    event.preventDefault()
    const node = pick(event.clientX, event.clientY)
    callbacks.onContext(node === undefined ? undefined : state.nodeInfo().get(node.path), event.clientX, event.clientY)
  }

  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointerleave', onPointerLeave)
  canvas.addEventListener('wheel', onWheel, { passive: false })
  canvas.addEventListener('contextmenu', onContextMenu)
  return () => {
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointerup', onPointerUp)
    canvas.removeEventListener('pointerleave', onPointerLeave)
    canvas.removeEventListener('wheel', onWheel)
    canvas.removeEventListener('contextmenu', onContextMenu)
  }
}
