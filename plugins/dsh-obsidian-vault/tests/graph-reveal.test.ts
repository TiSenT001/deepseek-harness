/**
 * Replay reveal plan: deterministic waves, centre-first ordering, and monotonic
 * entrances that let every node fade and scale in on its own schedule.
 * @module dsh-obsidian-vault/tests/graph-reveal
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { GraphEdgeInput, SimNode } from '../src/client/graph/layout.ts'
import { buildRevealPlan, edgeEntrance, EMPTY_PLAN, revealEntrance } from '../src/client/graph/reveal.ts'

/** Minimal simulated node with the fields the plan reads. */
function node(path: string, degree: number, depth = 1): SimNode {
  return { path, title: path, depth, x: 0, y: 0, vx: 0, vy: 0, fx: null, fy: null, degree, radius: 3 }
}

const edges: GraphEdgeInput[] = [
  { source: 'h', target: 'a' },
  { source: 'h', target: 'b' },
  { source: 'a', target: 'c' },
  { source: 'c', target: 'd' },
]

const nodes: SimNode[] = [
  node('h', 3, 0),
  node('a', 2),
  node('b', 1),
  node('c', 2),
  node('d', 1),
]

test('the centre enters first and distance decides the wave', () => {
  const plan = buildRevealPlan(nodes, edges)
  assert.equal(plan.thresholds.get('h'), 0)
  assert.ok(plan.thresholds.get('a')! <= plan.thresholds.get('c')!)
  assert.ok(plan.thresholds.get('c')! <= plan.thresholds.get('d')!)
  assert.ok(plan.duration >= 1200 && plan.duration <= 2600)
})

test('the plan is deterministic', () => {
  const first = buildRevealPlan(nodes, edges)
  const second = buildRevealPlan(nodes, edges)
  assert.deepEqual([...first.thresholds.entries()], [...second.thresholds.entries()])
})

test('disconnected islands are scheduled too', () => {
  const plan = buildRevealPlan([...nodes, node('x', 0), node('y', 1)], edges)
  assert.ok(plan.thresholds.has('x'))
  assert.ok(plan.thresholds.has('y'))
})

test('reduced motion removes the stagger', () => {
  const plan = buildRevealPlan(nodes, edges, true)
  assert.equal(plan.duration, 0)
  for (const threshold of plan.thresholds.values()) assert.equal(threshold, 0)
})

test('an empty graph has an empty plan', () => {
  assert.deepEqual(buildRevealPlan([], []).thresholds.size, EMPTY_PLAN.thresholds.size)
})

test('entrance rises from zero to one and never regresses', () => {
  const threshold = 0.4
  assert.equal(revealEntrance(0, threshold), 0)
  assert.equal(revealEntrance(threshold, threshold), 0)
  let previous = 0
  for (let step = 1; step <= 20; step += 1) {
    const value = revealEntrance(step / 20, threshold)
    assert.ok(value >= previous, `entrance regressed at step ${step}`)
    previous = value
  }
  assert.equal(revealEntrance(1, threshold), 1)
})

test('an edge follows the later endpoint', () => {
  assert.equal(edgeEntrance(0.2, 0, 0), revealEntrance(0.2, 0))
  assert.equal(edgeEntrance(0.2, 0.9, 0), revealEntrance(0.2, 0.9))
})
