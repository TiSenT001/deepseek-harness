import assert from 'node:assert/strict'
import { test } from 'node:test'
import { elementsToJsonCanvas } from '../src/pur-kernel/index.ts'
import { readJsonCanvasDocument } from '../src/client/pur/loader.ts'

const canvas = {
  nodes: [
    { id: 't', type: 'text', x: 10, y: 20, width: 200, height: 80, text: 'hello' },
    { id: 'g', type: 'group', x: 0, y: 0, width: 400, height: 300, label: 'group' },
  ],
  edges: [],
}

test('a native canvas loads into Pur elements and round-trips', () => {
  const document = readJsonCanvasDocument(JSON.stringify(canvas))
  assert.ok(document)
  assert.equal(document.elements.length, 2)
  const exported = elementsToJsonCanvas(document.elements)
  assert.deepEqual(exported.nodes.map(node => node.id), ['g', 't'])
  assert.equal(exported.nodes.find(node => node.id === 't')?.text, 'hello')
})

test('malformed canvas JSON loads as undefined', () => {
  assert.equal(readJsonCanvasDocument('{broken'), undefined)
})
