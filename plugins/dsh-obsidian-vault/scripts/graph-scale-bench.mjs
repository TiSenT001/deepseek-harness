/**
 * Graph-scale gate: tick the force simulation on a synthetic graph and fail when
 * one tick exceeds the budget, so the continuous-animation cadence keeps pace
 * with the engine as the graph grows.
 *
 * Usage:
 *   node --experimental-strip-types scripts/graph-scale-bench.mjs [--nodes 5000] [--ticks 30] [--budget-ms 80] [--json]
 *
 * The budget is generous on purpose: the node-count cadence in `tickIntervalMs`
 * keeps a warm frame only when the measured tick fits; this bench detects an
 * order-of-magnitude regression, not machine noise.
 */
import { Simulation } from '../src/client/graph/layout.ts'
import { seedPositions } from '../src/client/graph/layout-seed.ts'
import { tickIntervalMs } from '../src/client/graph/layout-types.ts'

/** Read one numeric flag. */
function flag(name, fallback) {
  const index = process.argv.indexOf(name)
  if (index < 0) return fallback
  const value = Number(process.argv[index + 1])
  return Number.isFinite(value) ? value : fallback
}

const nodeCount = flag('--nodes', 5000)
const ticks = flag('--ticks', 30)
const budgetMs = flag('--budget-ms', 80)

const nodes = Array.from({ length: nodeCount }, (_, index) => ({
  path: `n${index}.md`,
  title: `n${index}`,
  depth: 1,
}))
const edges = []
for (let index = 0; index < nodeCount; index += 1) {
  edges.push({ source: `n${index}.md`, target: `n${(index * 7 + 3) % nodeCount}.md` })
  edges.push({ source: `n${index}.md`, target: `n${(index * 13 + 5) % nodeCount}.md` })
  edges.push({ source: `n${index}.md`, target: `n${(index + 1) % nodeCount}.md` })
}

const seed = seedPositions(nodes, edges)
const sim = new Simulation(seed, edges, { center: 0.1, repel: 10, link: 1, linkDistance: 250 })
sim.setAnimate(true)

const beforeHeap = process.memoryUsage().heapUsed
const started = performance.now()
for (let index = 0; index < ticks; index += 1) sim.tick()
const perTick = (performance.now() - started) / ticks
const heapMb = (process.memoryUsage().heapUsed - beforeHeap) / 1048576

const result = {
  nodes: nodeCount,
  edges: edges.length,
  ticks,
  msPerTick: Number(perTick.toFixed(2)),
  targetIntervalMs: Number(tickIntervalMs(nodeCount).toFixed(1)),
  heapMb: Number(heapMb.toFixed(1)),
  budgetMs,
}
const failures = []
if (perTick > budgetMs) failures.push(`tick ${result.msPerTick}ms > ${budgetMs}ms at ${nodeCount} nodes`)

if (process.argv.includes('--json')) console.log(JSON.stringify({ ...result, failures }, null, 1))
else {
  console.log(`nodes ${nodeCount} · edges ${edges.length} · ${result.msPerTick}ms/tick (budget ${budgetMs}) · cadence target ${result.targetIntervalMs}ms · heap ${result.heapMb}MB`)
  for (const failure of failures) console.error(`FAIL ${failure}`)
}
process.exitCode = failures.length === 0 ? 0 : 1
