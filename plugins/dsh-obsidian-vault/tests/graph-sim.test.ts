import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  ALPHA_DECAY, ALPHA_MIN, DEFAULT_FORCES, REHEAT_ALPHA, seedPositions, Simulation,
  type GraphEdgeInput, type GraphNodeInput, type SimNode,
} from '../src/client/graph/layout.ts'
import { repelForce, repelForceNaive, type VelocityNode } from '../src/client/graph/quadtree.ts'

function nodesOf(count: number): GraphNodeInput[] {
  return Array.from({ length: count }, (_, index) => ({
    path: `n${index}.md`,
    title: `n${index}`,
    depth: index === 0 ? 0 : 1,
  }))
}

function ring(count: number): GraphEdgeInput[] {
  return Array.from({ length: count }, (_, index) => ({
    source: `n${index}.md`,
    target: `n${(index + 1) % count}.md`,
  }))
}

function start(nodes: GraphNodeInput[], edges: GraphEdgeInput[], forces = DEFAULT_FORCES): Simulation {
  return new Simulation(seedPositions(nodes, edges), edges, forces)
}

test('alpha decays below the sleep threshold in ~300 ticks', () => {
  const sim = start(nodesOf(4), ring(4))
  for (let i = 0; i < 150; i += 1) sim.tick()
  assert.ok(!sim.cooled)
  for (let i = 0; i < 250; i += 1) sim.tick()
  assert.ok(sim.cooled)
  assert.ok(sim.alpha < ALPHA_MIN)
  assert.ok(ALPHA_DECAY > 0 && ALPHA_DECAY < 0.05)
})

test('a small graph converges to finite, spread-out positions', () => {
  const sim = start(nodesOf(8), ring(8))
  for (let i = 0; i < 400; i += 1) sim.tick()
  let minX = Infinity
  let maxX = -Infinity
  for (const node of sim.nodes) {
    assert.ok(Number.isFinite(node.x) && Number.isFinite(node.y))
    minX = Math.min(minX, node.x)
    maxX = Math.max(maxX, node.x)
  }
  assert.ok(maxX - minX > 1)
})

test('one link settles near its resting distance', () => {
  const sim = start(nodesOf(2), [{ source: 'n0.md', target: 'n1.md' }], {
    center: 0,
    repel: 0,
    link: 1,
    linkDistance: 250,
  })
  for (let i = 0; i < 400; i += 1) sim.tick()
  const [a, b] = sim.nodes
  const distance = Math.hypot(a!.x - b!.x, a!.y - b!.y)
  assert.ok(Math.abs(distance - 250) < 25, `distance ${distance} should approach 250`)
})

test('Barnes-Hut matches the naive sum for a node far from a cluster', () => {
  const cluster: VelocityNode[] = []
  for (let i = 0; i < 60; i += 1) {
    const angle = i * 2.399963229728653
    cluster.push({ x: Math.cos(angle) * 40, y: Math.sin(angle) * 40, vx: 0, vy: 0 })
  }
  const viaTree: VelocityNode[] = [...cluster.map(node => ({ ...node })), { x: 100000, y: 0, vx: 0, vy: 0 }]
  const viaNaive: VelocityNode[] = [...cluster.map(node => ({ ...node })), { x: 100000, y: 0, vx: 0, vy: 0 }]
  repelForce(viaTree, 1, -10)
  repelForceNaive(viaNaive, 1, -10)
  const tree = viaTree[60]!
  const naive = viaNaive[60]!
  const magnitude = Math.hypot(naive.vx, naive.vy)
  const error = Math.hypot(tree.vx - naive.vx, tree.vy - naive.vy)
  assert.ok(error / magnitude < 1e-3, `relative error ${error / magnitude}`)
})

test('pin holds a node and unpin frees it', () => {
  const sim = start(nodesOf(3), ring(3))
  sim.pin('n1.md', 500, 400)
  for (let i = 0; i < 10; i += 1) sim.tick()
  const pinned = sim.nodes[1]!
  assert.equal(pinned.x, 500)
  assert.equal(pinned.y, 400)
  assert.ok(!sim.cooled)
  sim.unpin('n1.md')
  for (let i = 0; i < 10; i += 1) sim.tick()
  assert.ok(pinned.x !== 500 || pinned.y !== 400)
})

test('the centre node is not permanently pinned: release frees it too', () => {
  const sim = start(nodesOf(3), ring(3))
  sim.pin('n0.md', 300, 300)
  sim.tick()
  sim.unpin('n0.md')
  assert.equal(sim.nodes[0]!.fx, null)
  assert.equal(sim.nodes[0]!.fy, null)
})

test('setForces reheats a cooled simulation', () => {
  const sim = start(nodesOf(4), ring(4))
  for (let i = 0; i < 400; i += 1) sim.tick()
  assert.ok(sim.cooled)
  sim.setForces({ ...DEFAULT_FORCES, repel: 15 })
  assert.equal(sim.alpha, REHEAT_ALPHA)
  assert.ok(!sim.cooled)
})

test('a dense 320-node graph spreads out instead of collapsing (collide regression)', () => {
  // Regression: collide used to shift positions directly, which fought the
  // link velocities and crushed the real 400-node vault graph into a
  // ~200x280 blob. d3 spreads that graph to ~2300x2400; 1000 is a safe
  // floor. 320 nodes also exceeds the Barnes-Hut threshold (300).
  const count = 320
  const edges = ring(count)
  let state = 42
  const lcg = (): number => {
    state = (state * 1103515245 + 12345) % 2147483648
    return state
  }
  for (let i = 0; i < count * 4; i += 1) {
    const source = lcg() % count
    const target = lcg() % count
    if (source !== target) edges.push({ source: `n${source}.md`, target: `n${target}.md` })
  }
  const sim = start(nodesOf(count), edges)
  for (let i = 0; i < 400; i += 1) sim.tick()
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const node of sim.nodes) {
    minX = Math.min(minX, node.x)
    maxX = Math.max(maxX, node.x)
    minY = Math.min(minY, node.y)
    maxY = Math.max(maxY, node.y)
  }
  assert.ok(maxX - minX > 1000, `bbox width ${maxX - minX}`)
  assert.ok(maxY - minY > 1000, `bbox height ${maxY - minY}`)
})

test('layout is deterministic: same inputs settle identically', () => {
  const nodes = nodesOf(12)
  const edges = ring(12)
  const first = start(nodes, edges)
  const second = start(nodes, edges)
  for (let i = 0; i < 100; i += 1) {
    first.tick()
    second.tick()
  }
  for (let i = 0; i < nodes.length; i += 1) {
    assert.equal(first.nodes[i]!.x, second.nodes[i]!.x)
    assert.equal(first.nodes[i]!.y, second.nodes[i]!.y)
  }
})

test('seeding keeps existing nodes and lands new ones beside neighbours', () => {
  // A seed needs at least two spread-out points to be accepted; n2 supplies
  // the second point while n1 is the new node beside its neighbour n0.
  const nodes = nodesOf(3)
  const edges: GraphEdgeInput[] = [{ source: 'n0.md', target: 'n1.md' }]
  const seeded: SimNode[] = seedPositions(nodes, edges, new Map([
    ['n0.md', { x: 100, y: 100 }],
    ['n2.md', { x: 400, y: 100 }],
  ]))
  assert.equal(seeded[0]!.x, 100)
  assert.equal(seeded[0]!.y, 100)
  assert.ok(Math.hypot(seeded[1]!.x - 100, seeded[1]!.y - 100) < 150)
  // An all-coincident seed is rejected instead of collapsing the graph.
  const degenerate = seedPositions(nodes, edges, new Map([['n0.md', { x: 5, y: 5 }], ['n1.md', { x: 5, y: 5 }]]))
  assert.ok(Math.hypot(degenerate[1]!.x - degenerate[0]!.x, degenerate[1]!.y - degenerate[0]!.y) > 1)
})
