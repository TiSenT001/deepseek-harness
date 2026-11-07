/**
 * Graph simulation worker: one long-lived session per graph, ticked at 60Hz
 * while warm and sleeping when cool. Force changes and drags reheat the
 * session instead of rebuilding it, matching Obsidian's sim.js protocol.
 * @module dsh-obsidian-vault/client/graph/simulation.worker
 */
import {
  seedPositions, Simulation, type GraphEdgeInput, type GraphNodeInput, type LayoutForces,
} from './layout.ts'

/** Messages the page sends to a session. */
export type SimulationRequest =
  | {
    readonly id: number
    readonly type: 'start'
    readonly nodes: readonly GraphNodeInput[]
    readonly edges: readonly GraphEdgeInput[]
    readonly forces: LayoutForces
    /** Existing positions, so a partial change does not reshuffle the graph. */
    readonly seed?: ReadonlyArray<readonly [string, number, number]>
    /** Keep the session warm from the start. */
    readonly animate?: boolean
  }
  | { readonly id: number; readonly type: 'animate'; readonly animate: boolean }
  | { readonly id: number; readonly type: 'forces'; readonly forces: LayoutForces }
  | { readonly id: number; readonly type: 'pin'; readonly path: string; readonly x: number; readonly y: number }
  | { readonly id: number; readonly type: 'movePin'; readonly path: string; readonly x: number; readonly y: number }
  | { readonly id: number; readonly type: 'unpin'; readonly path: string }
  | { readonly id: number; readonly type: 'stop' }

/** Messages the worker posts back; positions are flat [x0, y0, x1, y1, ...]. */
export type SimulationResponse =
  | { readonly id: number; readonly type: 'tick'; readonly positions: number[] }
  | { readonly id: number; readonly type: 'cooled' }
  | { readonly id: number; readonly type: 'error'; readonly message: string }

interface Session {
  readonly sim: Simulation
  running: boolean
  timer: ReturnType<typeof setTimeout> | null
}

const sessions = new Map<number, Session>()

function post(response: SimulationResponse): void {
  self.postMessage(response)
}

function pump(id: number, session: Session): void {
  if (!session.running) return
  session.sim.tick()
  const flat: number[] = []
  for (const node of session.sim.nodes) {
    flat.push(node.x, node.y)
  }
  post({ id, type: 'tick', positions: flat })
  if (session.sim.cooled) {
    session.running = false
    session.timer = null
    post({ id, type: 'cooled' })
    return
  }
  session.timer = setTimeout(() => pump(id, session), 1000 / 60)
}

function wake(id: number, session: Session): void {
  if (session.running) return
  session.running = true
  session.timer = setTimeout(() => pump(id, session), 0)
}

self.addEventListener('message', (event: MessageEvent<SimulationRequest>) => {
  const message = event.data
  const id = message.id
  try {
    if (message.type === 'start') {
      const existing = sessions.get(id)
      if (existing !== undefined) {
        existing.running = false
        if (existing.timer !== null) clearTimeout(existing.timer)
      }
      const seed = message.seed === undefined
        ? undefined
        : new Map(message.seed.map(([path, x, y]) => [path, { x, y }]))
      const sim = new Simulation(seedPositions(message.nodes, message.edges, seed), message.edges, message.forces)
      sim.setAnimate(message.animate === true)
      const session: Session = { sim, running: false, timer: null }
      sessions.set(id, session)
      wake(id, session)
      return
    }
    const session = sessions.get(id)
    if (session === undefined) return
    if (message.type === 'stop') {
      session.running = false
      if (session.timer !== null) clearTimeout(session.timer)
      sessions.delete(id)
      return
    }
    if (message.type === 'forces') session.sim.setForces(message.forces)
    else if (message.type === 'animate') session.sim.setAnimate(message.animate)
    else if (message.type === 'pin') session.sim.pin(message.path, message.x, message.y)
    else if (message.type === 'movePin') session.sim.movePin(message.path, message.x, message.y)
    else if (message.type === 'unpin') session.sim.unpin(message.path)
    wake(id, session)
  } catch (error) {
    post({ id, type: 'error', message: error instanceof Error ? error.message : String(error) })
  }
})
