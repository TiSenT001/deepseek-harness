/**
 * Simulation runner: one continuous session per graph, off the main thread
 * when possible. Force changes and drags reheat the running session; only a
 * changed node set starts a new one.
 * @module dsh-obsidian-vault/client/graph/simulation
 */
import { API_BASE } from '../../protocol.ts'
import {
  seedPositions, Simulation, type GraphEdgeInput, type GraphNodeInput, type LayoutForces,
  type LayoutSeed, type SimNode,
} from './layout.ts'
import type { SimulationRequest, SimulationResponse } from './simulation.worker.ts'

/** A running simulation; positions update in place on {@link nodes}. */
export interface SimulationHandle {
  /** Live nodes, seeded synchronously so the first paint needs no tick. */
  readonly nodes: SimNode[]
  /** Hot-update the force sliders and reheat (Obsidian's `{forces}` message). */
  setForces(forces: LayoutForces): void
  /** Pin a node for dragging; holds the simulation warm. */
  pin(path: string, x: number, y: number): void
  movePin(path: string, x: number, y: number): void
  unpin(path: string): void
  /** End the session; later messages for it are dropped. */
  stop(): void
}

export interface SimulationCallbacks {
  /** Fires after every tick; the handle's nodes already hold the new positions. */
  readonly onTick?: (nodes: readonly SimNode[]) => void
  /** Fires when the simulation cools to sleep. */
  readonly onCooled?: () => void
}

export interface SimulationOptions {
  /** Existing positions keyed by path. */
  readonly seed?: LayoutSeed
  /** Skip the worker for this run (used for the very first paint). */
  readonly forceInline?: boolean
}

/** Graph size above which the worker is worth its startup cost. */
const WORKER_THRESHOLD = 120
/** How long to wait for the first worker tick before falling back inline. */
const FIRST_TICK_TIMEOUT_MS = 1500

/**
 * Start a continuous simulation for one graph.
 * @param nodes - nodes with their hop distance from the centre.
 * @param edges - edges between node paths.
 * @param forces - forces in Obsidian units.
 * @param callbacks - tick and cool notifications.
 * @param options - seed positions and the inline override.
 */
export function startSimulation(
  nodes: readonly GraphNodeInput[],
  edges: readonly GraphEdgeInput[],
  forces: LayoutForces,
  callbacks: SimulationCallbacks,
  options: SimulationOptions = {},
): SimulationHandle {
  const templates = seedPositions(nodes, edges, options.seed)
  if (templates.length === 0) {
    return { nodes: templates, setForces: () => undefined, pin: () => undefined, movePin: () => undefined, unpin: () => undefined, stop: () => undefined }
  }
  if (options.forceInline === true || typeof Worker === 'undefined' || templates.length < WORKER_THRESHOLD) {
    return startInline(templates, edges, forces, callbacks)
  }
  try {
    return startWorker(nodes, edges, forces, templates, callbacks, options.seed)
  } catch {
    return startInline(templates, edges, forces, callbacks)
  }
}

/** In-thread session: same Simulation, pumped by rAF. */
function startInline(
  templates: SimNode[],
  edges: readonly GraphEdgeInput[],
  forces: LayoutForces,
  callbacks: SimulationCallbacks,
): SimulationHandle {
  const sim = new Simulation(templates, edges, forces)
  let running = false
  let frame = 0
  const pump = (): void => {
    if (!running) return
    sim.tick()
    callbacks.onTick?.(templates)
    if (sim.cooled) {
      running = false
      callbacks.onCooled?.()
      return
    }
    frame = requestAnimationFrame(pump)
  }
  const wake = (): void => {
    if (running) return
    running = true
    frame = requestAnimationFrame(pump)
  }
  wake()
  return {
    nodes: templates,
    setForces: (next) => {
      sim.setForces(next)
      wake()
    },
    pin: (path, x, y) => {
      sim.pin(path, x, y)
      wake()
    },
    movePin: (path, x, y) => sim.movePin(path, x, y),
    unpin: (path) => {
      sim.unpin(path)
      wake()
    },
    stop: () => {
      running = false
      cancelAnimationFrame(frame)
    },
  }
}

let sharedWorker: Worker | null = null
let nextSessionId = 1

interface Session {
  readonly templates: SimNode[]
  readonly callbacks: SimulationCallbacks
  readonly onFirstTick: () => void
  readonly onFail: () => void
}

const sessions = new Map<number, Session>()

function worker(): Worker | null {
  if (typeof Worker === 'undefined') return null
  if (sharedWorker !== null) return sharedWorker
  try {
    sharedWorker = new Worker(`${API_BASE}/worker.js`)
    sharedWorker.addEventListener('message', (event: MessageEvent<SimulationResponse>) => {
      const data = event.data
      const session = sessions.get(data.id)
      if (session === undefined) return
      if (data.type === 'tick') {
        session.onFirstTick()
        const flat = data.positions
        const templates = session.templates
        for (let index = 0; index < templates.length && index * 2 + 1 < flat.length; index += 1) {
          templates[index]!.x = flat[index * 2]!
          templates[index]!.y = flat[index * 2 + 1]!
        }
        session.callbacks.onTick?.(templates)
        return
      }
      if (data.type === 'cooled') {
        session.callbacks.onCooled?.()
        return
      }
      session.onFail()
    })
    return sharedWorker
  } catch {
    sharedWorker = null
    return null
  }
}

function startWorker(
  nodes: readonly GraphNodeInput[],
  edges: readonly GraphEdgeInput[],
  forces: LayoutForces,
  templates: SimNode[],
  callbacks: SimulationCallbacks,
  seed?: LayoutSeed,
): SimulationHandle {
  const instance = worker()
  if (instance === null) return startInline(templates, edges, forces, callbacks)
  const id = nextSessionId
  nextSessionId += 1
  let currentForces = forces
  let inline: SimulationHandle | null = null
  let stopped = false

  const fail = (): void => {
    if (stopped || inline !== null) return
    sessions.delete(id)
    try {
      instance.postMessage({ id, type: 'stop' } satisfies SimulationRequest)
    } catch {
      // A dead worker cannot receive the stop; the session map is already clean.
    }
    inline = startInline(templates, edges, currentForces, callbacks)
  }

  const session: Session = {
    templates,
    callbacks,
    onFirstTick: () => window.clearTimeout(watchdog),
    onFail: fail,
  }
  sessions.set(id, session)
  const watchdog = window.setTimeout(fail, FIRST_TICK_TIMEOUT_MS)
  const seedPairs = seed === undefined ? undefined : [...seed.entries()].map(([path, point]) => [path, point.x, point.y] as const)
  instance.postMessage({ id, type: 'start', nodes, edges, forces, seed: seedPairs } satisfies SimulationRequest)

  const send = (message: SimulationRequest): void => {
    if (inline !== null) return
    try {
      instance.postMessage(message)
    } catch {
      fail()
    }
  }
  return {
    nodes: templates,
    setForces: (next) => {
      currentForces = next
      if (inline !== null) {
        inline.setForces(next)
        return
      }
      send({ id, type: 'forces', forces: next })
    },
    pin: (path, x, y) => {
      if (inline !== null) {
        inline.pin(path, x, y)
        return
      }
      send({ id, type: 'pin', path, x, y })
    },
    movePin: (path, x, y) => {
      if (inline !== null) {
        inline.movePin(path, x, y)
        return
      }
      send({ id, type: 'movePin', path, x, y })
    },
    unpin: (path) => {
      if (inline !== null) {
        inline.unpin(path)
        return
      }
      send({ id, type: 'unpin', path })
    },
    stop: () => {
      stopped = true
      window.clearTimeout(watchdog)
      sessions.delete(id)
      if (inline !== null) {
        inline.stop()
        return
      }
      try {
        instance.postMessage({ id, type: 'stop' } satisfies SimulationRequest)
      } catch {
        // Stopping a dead worker is a no-op.
      }
    },
  }
}
