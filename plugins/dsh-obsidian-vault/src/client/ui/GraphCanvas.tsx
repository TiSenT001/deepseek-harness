/**
 * Canvas host: owns the element, the frame loop, and pointer input. All drawing
 * lives in `graph/render/*`, so this file only wires React refs to that layer.
 * @module dsh-obsidian-vault/client/ui/GraphCanvas
 */
import { useEffect, useRef } from 'react'
import type { GraphNodeDto } from '../../protocol.ts'
import type { GraphEdgeInput, SimNode } from '../graph/layout.ts'
import { attachGraphInput } from '../graph/render/input.ts'
import { layoutLabels, type LabelBox } from '../graph/render/labels.ts'
import { LABEL_FONT, readPalette, type Palette } from '../graph/render/palette.ts'
import { drawScene, edgeKey, worldViewport } from '../graph/render/scene.ts'
import type { RevealPlan } from '../graph/reveal.ts'
import { revealEntrance } from '../graph/reveal.ts'
import { GraphStage } from '../graph/render/stage.ts'
import type { GraphSettings } from '../graph/settings.ts'

/** Camera state shared with the page. */
export interface GraphCamera {
  zoom: number
  panX: number
  panY: number
}

/** Props for {@link GraphCanvas}. */
export interface GraphCanvasProps {
  readonly positions: { current: readonly SimNode[] }
  readonly edges: { current: readonly GraphEdgeInput[] }
  readonly camera: { current: GraphCamera }
  readonly reveal: { current: number }
  readonly plan: { current: RevealPlan }
  readonly nodeInfo: { current: ReadonlyMap<string, GraphNodeDto> }
  readonly settings: { current: GraphSettings }
  /** False while the layout is still moving; keeps the full frame rate. */
  readonly settled: { current: boolean }
  /** True for the local graph, where the opened note is the centre. */
  readonly hasCenter: boolean
  readonly onHover: (path: string | undefined, clientX: number, clientY: number) => void
  readonly onActivate: (node: GraphNodeDto) => void
  readonly onDragStart: (path: string) => void
  readonly onDragMove: (clientX: number, clientY: number) => void
  readonly onDragEnd: () => void
  readonly onPan: (dx: number, dy: number) => void
  /** Fling inertia after a pan, velocity in px/s. */
  readonly onPanFling: (vx: number, vy: number) => void
  readonly onZoom: (factor: number, clientX: number, clientY: number) => void
  /** Right click on a node; `undefined` means empty space. */
  readonly onContext: (node: GraphNodeDto | undefined, clientX: number, clientY: number) => void
  /**
   * Wake slot: the canvas stores its frame-loop waker here so the page can
   * poke it when state the stage cannot see changes (simulation ticks, camera
   * targets, settings).
   */
  readonly loop: { current: (() => void) | null }
}

/** Frames between two label re-layouts. */
const LABEL_INTERVAL = 6
/** While nothing changes the loop still draws, but at roughly 15 fps. */
const IDLE_FRAME_MS = 66

/**
 * Render the graph surface and forward pointer gestures.
 * @param props - refs the page mutates plus pointer callbacks.
 */
export function GraphCanvas(props: GraphCanvasProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const propsRef = useRef(props)
  propsRef.current = props

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return
    const context = canvas.getContext('2d')
    if (context === null) return

    let palette: Palette = readPalette()
    let labels: readonly LabelBox[] = []
    let frame = 0
    let ticks = 0
    let running = false
    /** Set by every interaction and data change; the loop never sleeps. */
    let dirty = true
    let idleFrames = 0
    let lastDraw = 0
    let lastCamera = { zoom: Number.NaN, panX: Number.NaN, panY: Number.NaN }
    const drag = { current: '', hover: undefined as string | undefined }
    const stage = new GraphStage()

    const wake = (): void => {
      dirty = true
      if (!running) {
        running = true
        frame = requestAnimationFrame(draw)
      }
    }

    const resize = (): void => {
      const parent = canvas.parentElement
      if (parent === null) return
      const ratio = window.devicePixelRatio || 1
      canvas.width = Math.max(1, Math.round(parent.clientWidth * ratio))
      canvas.height = Math.max(1, Math.round(parent.clientHeight * ratio))
      canvas.style.width = `${parent.clientWidth}px`
      canvas.style.height = `${parent.clientHeight}px`
      wake()
    }

    const draw = (now: number): void => {
      const current = propsRef.current
      const camera = current.camera.current
      const moved = camera.zoom !== lastCamera.zoom || camera.panX !== lastCamera.panX || camera.panY !== lastCamera.panY
      if (!dirty && !moved && idleFrames > 2 && now - lastDraw < IDLE_FRAME_MS) {
        frame = requestAnimationFrame(draw)
        return
      }
      lastCamera = { zoom: camera.zoom, panX: camera.panX, panY: camera.panY }
      lastDraw = now
      dirty = false
      const ratio = window.devicePixelRatio || 1
      const width = canvas.width / ratio
      const height = canvas.height / ratio
      const { zoom, panX, panY } = current.camera.current
      canvas.dataset.zoom = zoom.toFixed(3)
      canvas.dataset.pan = `${Math.round(panX)},${Math.round(panY)}`
      canvas.dataset.drag = drag.current
      canvas.dataset.hover = drag.hover ?? ''
      canvas.dataset.positions = String(current.positions.current.length)
      canvas.dataset.edges = String(current.edges.current.length)
      canvas.dataset.frames = String(ticks)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      if (ticks % LABEL_INTERVAL === 0) {
        const labelScale = zoom < 1 ? 1 / zoom : 1
        context.font = LABEL_FONT
        // Labels outside the viewport (plus a screen-space margin so panning
        // does not pop them in) never reach the overlap layout.
        const margin = 300 / zoom
        const view = worldViewport(width, height, zoom, panX, panY)
        const labelNodes = current.positions.current.filter(node =>
          node.x >= view.left - margin && node.x <= view.right + margin
          && node.y >= view.top - margin && node.y <= view.bottom + margin)
        const hovered = drag.hover
        const neighbours = hovered === undefined
          ? undefined
          : new Set(current.edges.current.flatMap(edge =>
            edge.source === hovered ? [edge.target] : edge.target === hovered ? [edge.source] : []))
        labels = layoutLabels(
          labelNodes,
          text => context.measureText(text).width * labelScale,
          {
            zoom,
            hover: hovered,
            textFade: current.settings.current.display.textFade,
            labelScale,
            ...(neighbours === undefined ? {} : { neighbours }),
          },
        )
      }
      if (ticks % 30 === 0) {
        const paths = new Set(current.positions.current.map(node => node.path))
        const keys = new Set(current.edges.current.map(edge => edgeKey(edge.source, edge.target)))
        stage.prune(paths, keys)
      }
      ticks += 1
      stage.beginFrame()
      const stats = drawScene({
        ctx: context,
        width,
        height,
        zoom,
        panX,
        panY,
        positions: current.positions.current,
        edges: current.edges.current,
        reveal: current.reveal.current,
        plan: current.plan.current,
        nodeInfo: current.nodeInfo.current,
        settings: current.settings.current,
        labels,
        hover: drag.hover,
        hasCenter: current.hasCenter,
        palette,
        stage,
      })
      canvas.dataset.drawnNodes = String(stats.drawnNodes)
      canvas.dataset.drawnEdges = String(stats.drawnEdges)
      // Keep the loop running while the view is visible: the graph must react
      // continuously to hover, camera animation and incoming simulation ticks
      // instead of sleeping and waiting for a wake that some interactions miss.
      // Motion keeps the full frame rate; a still scene drops to ~15 fps instead
      // of stopping completely.
      idleFrames = !current.settled.current || stage.frameMoved() ? 0 : idleFrames + 1
      if (document.visibilityState === 'hidden') {
        running = false
        return
      }
      frame = requestAnimationFrame(draw)
    }

    const onThemeChange = (): void => {
      palette = readPalette()
      wake()
    }

    resize()
    const observer = new ResizeObserver(resize)
    if (canvas.parentElement !== null) observer.observe(canvas.parentElement)
    const wakeHover = (path: string | undefined, x: number, y: number): void => {
      drag.hover = path
      wake()
      propsRef.current.onHover(path, x, y)
    }
    const detachInput = attachGraphInput(canvas, {
      positions: () => propsRef.current.positions.current,
      camera: () => propsRef.current.camera.current,
      nodeScale: () => propsRef.current.settings.current.display.nodeScale,
      nodeInfo: () => propsRef.current.nodeInfo.current,
      interactive: (path) => revealEntrance(
        propsRef.current.reveal.current,
        propsRef.current.plan.current.thresholds.get(path) ?? 0,
      ) >= 0.6,
    }, {
      onHover: wakeHover,
      onActivate: (node) => {
        wake()
        propsRef.current.onActivate(node)
      },
      onDragStart: (path) => {
        wake()
        propsRef.current.onDragStart(path)
      },
      onDragMove: (x, y) => {
        wake()
        propsRef.current.onDragMove(x, y)
      },
      onDragEnd: () => {
        wake()
        propsRef.current.onDragEnd()
      },
      onPan: (dx, dy) => {
        wake()
        propsRef.current.onPan(dx, dy)
      },
      onPanFling: (vx, vy) => {
        wake()
        propsRef.current.onPanFling(vx, vy)
      },
      onZoom: (factor, x, y) => {
        wake()
        propsRef.current.onZoom(factor, x, y)
      },
      onContext: (node, x, y) => {
        propsRef.current.onContext(node, x, y)
      },
    }, drag)
    const themeObserver = new MutationObserver(onThemeChange)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'style'],
    })
    propsRef.current.loop.current = wake
    wake()
    return () => {
      propsRef.current.loop.current = null
      running = false
      cancelAnimationFrame(frame)
      observer.disconnect()
      themeObserver.disconnect()
      detachInput()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="ov-graph-canvas"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none', cursor: 'grab' }}
    />
  )
}
