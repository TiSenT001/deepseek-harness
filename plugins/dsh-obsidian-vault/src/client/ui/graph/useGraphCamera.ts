/**
 * Graph camera: zoom/pan state, inertial fling, zoom-to-fit, keyboard control,
 * and the world/screen conversion used by hit-testing and drag.
 * @module dsh-obsidian-vault/client/ui/graph/useGraphCamera
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { SimNode } from '../../graph/layout.ts'

const EASE = 0.16
/** Camera zoom smoothing, Obsidian's `mQ(scale, targetScale, .85)`. */
const ZOOM_DAMP = 0.85
/** Per-frame fling decay for pan inertia. */
const FLING_DECAY = 0.92

/** Zoom limits shared by the wheel handler and keyboard. */
export const ZOOM_MIN = 1 / 128
export const ZOOM_MAX = 8

/** Camera refs the canvas reads every frame. */
export interface CameraRef {
  zoom: number
  panX: number
  panY: number
}

/** Input for {@link useGraphCamera}. */
export interface GraphCameraInput {
  /** Where the SVG/Canvas surface lives; fit measures it. */
  readonly positionsRef: { readonly current: readonly SimNode[] }
  /** Frame-loop waker the canvas fills in on mount. */
  readonly loopRef: { readonly current: (() => void) | null }
  /** False while the simulation is still moving; a fit waits for it to cool. */
  readonly settledRef: { readonly current: boolean }
}

/** Camera values and verbs used by the graph view. */
export interface GraphCamera {
  readonly surfaceRef: { readonly current: HTMLDivElement | null }
  readonly cameraRef: { readonly current: CameraRef }
  readonly zoom: number
  readonly pan: { readonly x: number; readonly y: number }
  /** Convert a pointer position into world coordinates. */
  readonly toWorld: (event: { readonly clientX: number; readonly clientY: number }) => { x: number; y: number }
  /** Start framing the whole graph, centred on this path (or the bbox). */
  readonly fit: (focus: string | null) => void
  /** Glide the camera so a world point sits under the viewport centre. */
  readonly glideTo: (x: number, y: number) => void
  /** A manual gesture takes the camera over from any automatic follow. */
  readonly cancelFollow: () => void
  readonly panBy: (dx: number, dy: number) => void
  readonly fling: (vx: number, vy: number) => void
  /** Wheel zoom anchored at a client point. */
  readonly zoomAt: (factor: number, clientX: number, clientY: number) => void
  /** Stop any follow after a drag begins. */
  readonly dragBegins: () => void
}

/**
 * Own the graph camera.
 * @param input - surfaces and simulation state the camera observes.
 * @returns the camera refs plus every gesture verb.
 */
export function useGraphCamera({ positionsRef, loopRef, settledRef }: GraphCameraInput): GraphCamera {
  const surfaceRef = useRef<HTMLDivElement>(null)
  const cameraRef = useRef<CameraRef>({ zoom: 1, panX: 0, panY: 0 })
  const zoomRef = useRef(1)
  const zoomTargetRef = useRef(1)
  const flingRef = useRef({ x: 0, y: 0 })
  /** Optional pan target the camera damps toward (click recentre / zoom-fit). */
  const panTargetRef = useRef<{ x: number; y: number } | null>(null)
  /** While true the camera continuously frames the whole graph. */
  const fitRef = useRef(false)
  /** Node the camera centres on while fitting; null centres the bounding box. */
  const focusRef = useRef<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  cameraRef.current = { zoom, panX: pan.x, panY: pan.y }

  const cancelFollow = useCallback(() => {
    fitRef.current = false
    panTargetRef.current = null
  }, [])

  const fit = useCallback((focus: string | null) => {
    focusRef.current = focus
    fitRef.current = true
  }, [])

  const glideTo = useCallback((x: number, y: number) => {
    panTargetRef.current = { x: -x * zoomRef.current, y: -y * zoomRef.current }
  }, [])

  const panBy = useCallback((dx: number, dy: number) => {
    flingRef.current = { x: 0, y: 0 }
    fitRef.current = false
    panTargetRef.current = null
    setPan(current => ({ x: current.x + dx, y: current.y + dy }))
  }, [])

  const fling = useCallback((vx: number, vy: number) => {
    flingRef.current = { x: vx, y: vy }
  }, [])

  const zoomAt = useCallback((factor: number, clientX: number, clientY: number) => {
    const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoomTargetRef.current * factor))
    const rect = surfaceRef.current?.getBoundingClientRect()
    if (rect === undefined || rect.width === 0 || rect.height === 0) {
      // A collapsed surface would compute a huge pan and push the graph
      // off-screen, so only the zoom factor changes here.
      zoomTargetRef.current = next
      return
    }
    fitRef.current = false
    panTargetRef.current = null
    const sx = clientX - rect.left - rect.width / 2
    const sy = clientY - rect.top - rect.height / 2
    const worldX = (sx - pan.x) / zoomRef.current
    const worldY = (sy - pan.y) / zoomRef.current
    setPan({ x: sx - worldX * next, y: sy - worldY * next })
    zoomTargetRef.current = next
  }, [pan.x, pan.y])

  const dragBegins = useCallback(() => {
    fitRef.current = false
    panTargetRef.current = null
  }, [])

  const toWorld = useCallback((event: { readonly clientX: number; readonly clientY: number }) => {
    const element = surfaceRef.current
    if (element === null) return { x: 0, y: 0 }
    const rect = element.getBoundingClientRect()
    return {
      x: (event.clientX - rect.left - rect.width / 2 - pan.x) / zoom,
      y: (event.clientY - rect.top - rect.height / 2 - pan.y) / zoom,
    }
  }, [pan.x, pan.y, zoom])

  useEffect(() => {
    let frame = 0
    let last = performance.now()
    const tick = (now: number): void => {
      const delta = Math.min(64, now - last)
      last = now

      const currentZoom = zoomRef.current
      const goalZoom = zoomTargetRef.current
      if (Math.abs(goalZoom - currentZoom) > 0.002) {
        zoomRef.current = currentZoom * ZOOM_DAMP + goalZoom * (1 - ZOOM_DAMP)
        setZoom(zoomRef.current)
      }

      const inertial = flingRef.current
      if (inertial.x !== 0 || inertial.y !== 0) {
        const decay = Math.pow(FLING_DECAY, delta / 16.7)
        setPan(current => ({ x: current.x + inertial.x * (delta / 1000), y: current.y + inertial.y * (delta / 1000) }))
        flingRef.current = { x: inertial.x * decay, y: inertial.y * decay }
        if (Math.hypot(flingRef.current.x, flingRef.current.y) < 8) flingRef.current = { x: 0, y: 0 }
      }

      // Zoom-to-fit: while active the camera frames the whole graph, chasing
      // the bounding box until the simulation cools or the user takes over.
      if (fitRef.current) {
        const rect = surfaceRef.current?.getBoundingClientRect()
        const nodes = positionsRef.current
        if (rect !== undefined && rect.width > 0 && rect.height > 0 && nodes.length > 0) {
          let minX = Infinity
          let maxX = -Infinity
          let minY = Infinity
          let maxY = -Infinity
          for (const node of nodes) {
            minX = Math.min(minX, node.x)
            maxX = Math.max(maxX, node.x)
            minY = Math.min(minY, node.y)
            maxY = Math.max(maxY, node.y)
          }
          const padding = 76
          const fitZoom = Math.min(
            (rect.width - padding * 2) / Math.max(1, maxX - minX),
            (rect.height - padding * 2) / Math.max(1, maxY - minY),
          )
          const target = Math.max(ZOOM_MIN, Math.min(1, fitZoom))
          zoomTargetRef.current = target
          // A local graph centres on its focus node; the global graph centres
          // on the bounding box.
          const focus = focusRef.current === null
            ? undefined
            : nodes.find(node => node.path === focusRef.current)
          const centerX = focus === undefined ? (minX + maxX) / 2 : focus.x
          const centerY = focus === undefined ? (minY + maxY) / 2 : focus.y
          panTargetRef.current = { x: -centerX * target, y: -centerY * target }
        }
      }

      // Smoothly glide the camera toward a requested pan (click recentre or
      // zoom-to-fit).
      const panTarget = panTargetRef.current
      if (panTarget !== null) {
        setPan((current) => {
          const dx = panTarget.x - current.x
          const dy = panTarget.y - current.y
          if (Math.hypot(dx, dy) < 0.5) {
            if (!fitRef.current) panTargetRef.current = null
            return { x: panTarget.x, y: panTarget.y }
          }
          return { x: current.x + dx * EASE, y: current.y + dy * EASE }
        })
      }

      // End zoom-to-fit once the settled camera has reached its target. A cool
      // notification that fired before the fit request would otherwise leave
      // the loop chasing a still image forever.
      if (fitRef.current && settledRef.current) {
        const camera = cameraRef.current
        const target = panTargetRef.current
        const panDone = target === null
          || Math.hypot(target.x - camera.panX, target.y - camera.panY) < 0.5
        if (panDone && Math.abs(zoomTargetRef.current - camera.zoom) <= 0.002) {
          fitRef.current = false
          panTargetRef.current = null
        }
      }

      // Any camera motion above keeps the canvas loop awake; a sleeping loop
      // would freeze the frame mid-glide.
      if (
        Math.abs(zoomTargetRef.current - zoomRef.current) > 0.002
        || flingRef.current.x !== 0 || flingRef.current.y !== 0
        || fitRef.current || panTargetRef.current !== null
      ) {
        loopRef.current?.()
      }

      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [loopRef, positionsRef, settledRef])

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null
      if (target !== null && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
      if (event.key === '+' || event.key === '=') {
        cancelFollow()
        zoomTargetRef.current = Math.min(ZOOM_MAX, zoomTargetRef.current * 1.1)
        event.preventDefault()
        return
      }
      if (event.key === '-') {
        cancelFollow()
        zoomTargetRef.current = Math.max(ZOOM_MIN, zoomTargetRef.current / 1.1)
        event.preventDefault()
        return
      }
      const step = event.shiftKey ? 140 : 48
      const moves: Record<string, { dx: number; dy: number }> = {
        ArrowLeft: { dx: step, dy: 0 },
        ArrowRight: { dx: -step, dy: 0 },
        ArrowUp: { dx: 0, dy: step },
        ArrowDown: { dx: 0, dy: -step },
      }
      const move = moves[event.key]
      if (move === undefined) return
      event.preventDefault()
      // The keyboard takes over the camera like a pointer drag does: cancel
      // the follow target or the next frame glides the pan right back.
      cancelFollow()
      setPan(current => ({ x: current.x + move.dx, y: current.y + move.dy }))
      loopRef.current?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cancelFollow, loopRef])

  return {
    surfaceRef, cameraRef, zoom, pan, toWorld, fit, glideTo, cancelFollow, panBy, fling, zoomAt, dragBegins,
  }
}
