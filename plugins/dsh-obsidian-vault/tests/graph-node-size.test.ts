/**
 * Graph node sizing: degree spread and the screen-space floor that keeps hubs
 * visible when the camera fits a large graph.
 * @module dsh-obsidian-vault/tests/graph-node-size
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { MIN_NODE_SCREEN_PX, screenRadius } from '../src/client/graph/render/node-size.ts'
import { seedPositions } from '../src/client/graph/layout-seed.ts'

/** Two notes, one with five inbound links, one with none. */
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

test('zoomed-out nodes keep a minimum screen radius', () => {
  assert.equal(screenRadius(2, 1, 0.25), MIN_NODE_SCREEN_PX / 0.25)
  assert.equal(screenRadius(20, 1, 1), 20)
  assert.equal(screenRadius(20, 2, 1), 40)
})

test('the floor never shrinks an already large node', () => {
  assert.equal(screenRadius(30, 1, 0.2), 30)
})
