/**
 * Continuous graph animation: with `animate`, the simulation never cools, so the
 * layout keeps drifting; without it, energy decays to the sleep threshold.
 * @module dsh-obsidian-vault/tests/graph-animate
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Simulation } from '../src/client/graph/layout.ts'

/** Two linked nodes. */
function simulation(): Simulation {
  return new Simulation(
    [
      { path: 'a.md', title: 'a', depth: 0, x: 0, y: 0, vx: 0, vy: 0, fx: null, fy: null, degree: 1, radius: 4 },
      { path: 'b.md', title: 'b', depth: 1, x: 40, y: 0, vx: 0, vy: 0, fx: null, fy: null, degree: 1, radius: 4 },
    ],
    [{ source: 'a.md', target: 'b.md' }],
    { center: 0.1, repel: 10, link: 1, linkDistance: 250 },
  )
}

test('without animation the simulation cools to sleep', () => {
  const sim = simulation()
  for (let index = 0; index < 800; index += 1) sim.tick()
  assert.equal(sim.cooled, true)
})

test('continuous animation keeps the simulation awake', () => {
  const sim = simulation()
  sim.setAnimate(true)
  for (let index = 0; index < 800; index += 1) sim.tick()
  assert.equal(sim.cooled, false)
  assert.ok(sim.alpha > 0.001, `alpha should stay above the sleep threshold, got ${sim.alpha}`)
})

test('disabling animation lets a warm simulation cool again', () => {
  const sim = simulation()
  sim.setAnimate(true)
  for (let index = 0; index < 50; index += 1) sim.tick()
  sim.setAnimate(false)
  for (let index = 0; index < 800; index += 1) sim.tick()
  assert.equal(sim.cooled, true)
})
