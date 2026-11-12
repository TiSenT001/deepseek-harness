/**
 * Graph node sizing: degree spread and screen-constant rendering across zoom.
 * @module dsh-obsidian-vault/tests/graph-node-size
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { screenRadius } from '../src/client/graph/render/node-size.ts'
import { seedPositions } from '../src/client/graph/layout-seed.ts'

/** Two notes, one with twelve inbound links, one with none. */
function seedOf(): ReturnType<typeof seedPositions> {
  const nodes = [
    { path: 'hub.md', title: 'hub', depth: 0 },
    { path: 'leaf.md', title: 'leaf', depth: 1 },
  ]
  const edges = Array.from({ length: 12 }, (_, index) => ({
    source: `n${index}.md`,
    target: 'hub.md',
  }))
  return seedPositions([...nodes, ...edges.map((edge, index) => ({ path: edge.source, title: `n${index}`, depth: 2 }))], edges)
}

test('degree increases the world radius', () => {
  const nodes = seedOf()
  const hub = nodes.find(node => node.path === 'hub.md')
  const leaf = nodes.find(node => node.path === 'leaf.md')
  assert.ok(hub !== undefined && leaf !== undefined)
  assert.ok(hub.radius > leaf.radius, `hub ${hub.radius} should exceed leaf ${leaf.radius}`)
})

test('screen radius stays constant across zoom', () => {
  assert.equal(screenRadius(20, 1, 0.25) * 0.25, 6)
  assert.equal(screenRadius(20, 1, 1), 6)
  assert.equal(screenRadius(20, 2, 1), 12)
})

test('the display multiplier still changes the screen size', () => {
  assert.equal(screenRadius(30, 0.5, 0.2) * 0.2, 4.5)
})