/**
 * Graph layout: the force-simulation lifecycle, node positions, time-lapse
 * reveal, drag pinning, and the canvas loop waker.
 * @module dsh-obsidian-vault/client/ui/graph/useGraphLayout
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { GraphDto, GraphNodeDto } from '../../../protocol.ts'
import { type GraphNodeInput, type SimNode } from '../../graph/layout.ts'
import { startSimulation, type SimulationHandle } from '../../graph/simulation.ts'
import type { GraphSettings } from '../../graph/settings.ts'

const EMPTY_HIDDEN: ReadonlySet<string> = new Set()

/**
 * Deterministic fallback placement when the simulation fails to start.
 * @param nodes - graph nodes.
 */
function ringFallback(nodes: readonly GraphNodeInput[]): SimNode[] {
  const radius = 260
  return nodes.map((node, index) => {
    const angle = (index / Math.max(1, nodes.length)) * Math.PI * 2
    return {
      path: node.path,
      title: node.title,
      depth: node.depth,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
      fx: null,
      fy: null,
      degree: 0,
      radius: 3.2,
    }
  })
}

/** Input for {@link useGraphLayout}. */
export interface GraphLayoutInput {
  /** Graph after the orphan filter; its node set decides when to relayout. */
  readonly visible: GraphDto
  /** Live force values, hot-applied to the running simulation. */
  readonly forces: GraphSettings['forces']
  /** Keep the simulation warm so the graph animates continuously. */
  readonly animate: boolean
}

/** Positions and the verbs the canvas needs to draw and drag them. */
export interface GraphLayout {
  readonly positions: readonly SimNode[]
  readonly positionsRef: { current: readonly SimNode[] }
  readonly edgesRef: { current: GraphDto['edges'] }
  readonly nodeInfoRef: { current: ReadonlyMap<string, GraphNodeDto> }
  readonly hidden: ReadonlySet<string>
  readonly hiddenRef: { current: ReadonlySet<string> }
  /** False while the simulation is still moving. */
  readonly settledRef: { current: boolean }
  /** Frame-loop waker the canvas fills in on mount. */
  readonly loopRef: { current: (() => void) | null }
  /** Restart the time-lapse reveal. */
  readonly replay: () => void
  /** Pin a node at its current position when a drag begins. */
  readonly pin: (path: string) => void
  /** Move a pinned node to a world point during a drag. */
  readonly movePin: (path: string, x: number, y: number) => void
  /** Release a dragged node back into the live simulation. */
  readonly unpin: (path: string) => void
}

/**
 * Own the force simulation and the positions it produces.
 * @param input - the visible graph and current force values.
 * @returns positions, the refs the canvas reads, and drag verbs.
 */
export function useGraphLayout({ visible, forces, animate }: GraphLayoutInput): GraphLayout {
  const [positions, setPositions] = useState<readonly SimNode[]>([])
  const [reveal, setReveal] = useState(1)
  const positionsRef = useRef<readonly SimNode[]>([])
  const edgesRef = useRef<GraphDto['edges']>([])
  const hiddenRef = useRef<ReadonlySet<string>>(EMPTY_HIDDEN)
  const settledRef = useRef(true)
  const loopRef = useRef<(() => void) | null>(null)
  /** The live force session; null before the first graph arrives. */
  const simRef = useRef<SimulationHandle | null>(null)
  const forcesRef = useRef(forces)
  /** Latest animate flag for callbacks captured before its effect runs. */
  const animateRef = useRef(animate)
  const previousSignature = useRef('')
  const hasLayout = useRef(false)
  /** The forces effect skips its first run: a fresh simulation is already hot. */
  const forcesReady = useRef(false)

  forcesRef.current = forces
  animateRef.current = animate

  const nodeInfo = useMemo(() => new Map(visible.nodes.map(node => [node.path, node])), [visible.nodes])
  const nodeInfoRef = useRef<ReadonlyMap<string, GraphNodeDto>>(new Map())
  nodeInfoRef.current = nodeInfo

  useEffect(() => {
    edgesRef.current = visible.edges
    if (visible.nodes.length === 0) {
      // An empty result must clear the canvas too; otherwise stale positions
      // keep drawing a ghost graph while the stats read 0.
      simRef.current?.stop()
      simRef.current = null
      settledRef.current = true
      if (positionsRef.current.length > 0) {
        positionsRef.current = []
        setPositions([])
      }
      hasLayout.current = false
      previousSignature.current = ''
      return undefined
    }
    const signature = visible.nodes.map(node => node.path).sort().join('|')
    if (hasLayout.current && signature === previousSignature.current
      && positionsRef.current.length === visible.nodes.length && simRef.current !== null) {
      // Same node set (a filter or tag change): the running simulation stays.
      // `simRef.current !== null` also covers a remount after the unmount
      // cleanup stopped the session, which must be rebuilt instead of reused.
      return undefined
    }
    // Only reuse positions after a real layout; seeding a fresh graph with the
    // centered placeholders would collapse every node onto one point.
    const seed = hasLayout.current
      ? new Map(positionsRef.current.map(node => [node.path, { x: node.x, y: node.y }]))
      : undefined
    let handle: SimulationHandle
    try {
      handle = startSimulation(visible.nodes, visible.edges, forcesRef.current, {
        onTick: () => {
          // Node positions bypass the stage, so a live simulation must wake
          // the canvas loop itself.
          settledRef.current = false
          loopRef.current?.()
        },
        onCooled: () => {
          settledRef.current = true
        },
      }, {
        ...(seed === undefined ? {} : { seed }),
        // The first paint runs inline so the graph is visible immediately;
        // later restarts go to the worker.
        forceInline: !hasLayout.current,
        animate,
      })
    } catch {
      // Last-resort fallback: a stalled pipeline must never blank the canvas.
      const placed = ringFallback(visible.nodes)
      positionsRef.current = placed
      settledRef.current = true
      setPositions(placed)
      hasLayout.current = true
      previousSignature.current = signature
      return undefined
    }
    simRef.current?.stop()
    simRef.current = handle
    positionsRef.current = handle.nodes
    settledRef.current = false
    setPositions(handle.nodes)
    hasLayout.current = true
    previousSignature.current = signature
    return undefined
  }, [visible])

  // A refetch with the same node set keeps the running session: the layout
  // effect early-returns and must not run a cleanup that stops it. Only leaving
  // the view ends the session, so the graph never freezes after a refresh.
  useEffect(() => () => {
    simRef.current?.stop()
    simRef.current = null
  }, [])

  // Force sliders hot-update the running simulation instead of rebuilding it.
  useEffect(() => {
    if (!forcesReady.current) {
      forcesReady.current = true
      return
    }
    simRef.current?.setForces(forces)
  }, [forces])

  // Toggling continuous animation applies to the live session, including a
  // worker session that had already cooled.
  useEffect(() => {
    simRef.current?.setAnimate(animate)
  }, [animate])

  // Time-lapse reveal: nodes appear in degree order over a short window.
  useEffect(() => {
    if (reveal >= 1) {
      // The reveal just finished (or this is the first paint): re-arm the warm
      // session so a replay never ends with the continuous motion asleep.
      simRef.current?.setAnimate(animateRef.current)
      loopRef.current?.()
      return
    }
    let frame = 0
    const started = performance.now()
    const duration = Math.min(3000, Math.max(600, positions.length * 6))
    const tick = (now: number): void => {
      const ratio = Math.min(1, (now - started) / duration)
      setReveal(ratio)
      // Each reveal step unhides nodes, which the sleeping loop would miss.
      loopRef.current?.()
      if (ratio < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [reveal >= 1])

  const hidden = useMemo(() => {
    if (reveal >= 1) return EMPTY_HIDDEN
    const ranked = [...positions].sort((left, right) => right.degree - left.degree)
    const keep = Math.floor(ranked.length * reveal)
    return new Set(ranked.slice(keep).map(node => node.path))
  }, [positions, reveal])

  hiddenRef.current = hidden

  const replay = useCallback(() => setReveal(0), [])

  const pin = useCallback((path: string) => {
    const node = positionsRef.current.find(item => item.path === path)
    if (node !== undefined) simRef.current?.pin(path, node.x, node.y)
  }, [])

  const movePin = useCallback((path: string, x: number, y: number) => {
    simRef.current?.movePin(path, x, y)
  }, [])

  const unpin = useCallback((path: string) => {
    simRef.current?.unpin(path)
  }, [])

  return {
    positions, positionsRef, edgesRef, nodeInfoRef, hidden, hiddenRef, settledRef, loopRef, replay, pin, movePin, unpin,
  }
}
