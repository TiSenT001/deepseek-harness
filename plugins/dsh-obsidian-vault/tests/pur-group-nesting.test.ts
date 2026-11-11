import assert from 'node:assert/strict'
import { test } from 'node:test'
import { elementsToJsonCanvas } from '../src/pur-kernel/index.ts'
import { placeElements } from '../src/pur-kernel/render-elements.ts'
import { readJsonCanvasDocument } from '../src/client/pur/loader.ts'

const canvas = {
  nodes: [
    { id: 'outer', type: 'group', x: 0, y: 0, width: 800, height: 600, label: 'outer' },
    { id: 'inner', type: 'group', x: 50, y: 50, width: 300, height: 200, label: 'inner' },
    { id: 'card', type: 'text', x: 100, y: 100, width: 120, height: 60, text: 'card' },
  ],
  edges: [],
}

test('nested groups absorb cards into the deepest group', () => {
  const document = readJsonCanvasDocument(JSON.stringify(canvas))
  assert.ok(document)
  assert.equal(document.elements.length, 1)
  const outer = document.elements[0]
  assert.equal(outer?.type, 'group')
  const inner = outer?.type === 'group' ? outer.children[0] : undefined
  assert.equal(inner?.type, 'group')
  assert.equal(inner?.type === 'group' ? inner.children.length : -1, 1)
  const card = inner?.type === 'group' ? inner.children[0] : undefined
  assert.equal(card?.id, 'card')
  assert.equal(card?.x, 50)
  assert.equal(card?.y, 50)
  assert.equal(placeElements(document.elements).length, 1)
})

test('collapsing the outer group hides the nested subtree', () => {
  const document = readJsonCanvasDocument(JSON.stringify(canvas))
  assert.ok(document)
  const outer = document.elements[0]
  assert.equal(outer?.type, 'group')
  if (outer?.type === 'group') outer.collapsed = true
  assert.equal(placeElements(document.elements).length, 0)
})

test('nested groups survive a JSON Canvas export', () => {
  const document = readJsonCanvasDocument(JSON.stringify(canvas))
  assert.ok(document)
  const exported = elementsToJsonCanvas(document.elements)
  assert.deepEqual(exported.nodes.map(node => node.id).sort(), ['card', 'inner', 'outer'])
  assert.equal(exported.nodes.find(node => node.id === 'card')?.x, 100)
})
