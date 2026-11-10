import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseJsonCanvas } from '../src/client/ui/files/json-canvas.ts'

const SAMPLE = JSON.stringify({
  nodes: [
    { id: 'a', type: 'text', text: '# Hello', x: -100, y: 20, width: 250, height: 120 },
    { id: 'b', type: 'file', file: '笔记/Alpha.md', subpath: '#Part', x: 300, y: 0, width: 300, height: 100, color: '4' },
    { id: 'c', type: 'group', label: '组', x: -160, y: -40, width: 700, height: 260 },
    { id: 'd', type: 'link', url: 'https://example.com', x: 0, y: 300, width: 200, height: 60 },
  ],
  edges: [
    { id: 'e1', fromNode: 'a', toNode: 'b', fromSide: 'right', toSide: 'left', label: '依赖', color: '2' },
    { id: 'e2', fromNode: 'a', toNode: 'missing' },
  ],
})

test('parses nodes and edges with optional fields', () => {
  const parsed = parseJsonCanvas(SAMPLE)
  assert.equal(parsed.ok, true)
  if (!parsed.ok) return
  assert.equal(parsed.nodes.length, 4)
  assert.equal(parsed.nodes[1]?.type, 'file')
  assert.equal(parsed.nodes[1]?.subpath, '#Part')
  assert.equal(parsed.nodes[1]?.color, '4')
  assert.equal(parsed.nodes[2]?.label, '组')
  assert.equal(parsed.edges.length, 2)
  assert.equal(parsed.edges[0]?.fromSide, 'right')
  assert.equal(parsed.edges[0]?.label, '依赖')
})

test('rejects invalid JSON and non-object roots', () => {
  assert.equal(parseJsonCanvas('{').ok, false)
  assert.equal(parseJsonCanvas('null').ok, false)
  assert.equal(parseJsonCanvas('[]').ok, false)
  assert.equal(parseJsonCanvas('{"nodes":"x"}').ok, false)
})

test('drops malformed nodes and edges but keeps the document usable', () => {
  const parsed = parseJsonCanvas(JSON.stringify({
    nodes: [
      { id: 'ok', type: 'text', x: 0, y: 0, width: 10, height: 10 },
      { id: 'bad-type', type: 'unknown', x: 0, y: 0, width: 10, height: 10 },
      { id: 'missing-x', type: 'text', y: 0, width: 10, height: 10 },
      null,
    ],
    edges: [{ id: 'e', fromNode: 'ok' }, { id: 'no-target', fromNode: 'ok', toNode: 'ok' }],
  }))
  assert.equal(parsed.ok, true)
  if (!parsed.ok) return
  assert.deepEqual(parsed.nodes.map(node => node.id), ['ok'])
  assert.equal(parsed.edges.length, 1)
})
