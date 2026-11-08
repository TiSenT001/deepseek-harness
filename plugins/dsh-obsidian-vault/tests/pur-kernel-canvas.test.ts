import assert from 'node:assert/strict'
import { test } from 'node:test'
import { elementsToJsonCanvas, jsonCanvasToElements, PUR_META, PurDocumentError } from '../src/pur-kernel/index.ts'
import type { PurElement, PurTextElement } from '../src/pur-kernel/index.ts'
import { GOLDEN_CANVAS, GOLDEN_ELEMENTS, GOLDEN_IMPORTED, GOLDEN_LEGACY_ELEMENTS } from './helpers/pur-expected.ts'

test('exports the upstream JSON Canvas document', () => {
  assert.deepEqual(elementsToJsonCanvas(GOLDEN_ELEMENTS), GOLDEN_CANVAS)
})

test('imports the upstream canvas back to the same elements', () => {
  assert.deepEqual(jsonCanvasToElements(GOLDEN_CANVAS), GOLDEN_IMPORTED)
})

test('keeps properties the element model does not declare', () => {
  const text: PurElement = { id: 't1', type: 'text', x: 1, y: 2, w: 3, h: 4, content: 'hi' }
  const extended = { ...text, custom: 'keep' }
  const canvas = elementsToJsonCanvas([extended])
  assert.equal(canvas.nodes[0]?.[PUR_META]?.['custom'], 'keep')
  const imported = jsonCanvasToElements(canvas)[0] as PurTextElement
  assert.equal(Reflect.get(imported, 'custom'), 'keep')
})

test('applies upstream defaults to a canvas without __pur', () => {
  const legacy = {
    nodes: [
      { id: 'f1', type: 'file', x: 0, y: 0, width: 100, height: 60, file: 'pic.jpg' },
      { id: 'f2', type: 'file', x: 0, y: 0, width: 160, height: 90, file: '笔记/a.md' },
      { id: 'l1', type: 'link', x: 0, y: 0, width: 50, height: 20, url: 'https://x.test' },
      { id: 'x1', type: 'text', x: 5, y: 5, width: 30, height: 20, text: 'plain', color: '#123456' },
      { id: 'g1', type: 'group', x: 0, y: 0, width: 10, height: 10, label: 'g' },
    ],
    edges: [{ id: 'e1', fromNode: '', toNode: 'x1', label: 'edge' }],
  }
  const imported = jsonCanvasToElements(legacy)
  assert.deepEqual(imported, GOLDEN_LEGACY_ELEMENTS)
})

test('a zero size takes the upstream fallback', () => {
  const [element] = jsonCanvasToElements({ nodes: [{ id: 'a', type: 'text', x: 0, y: 0, width: 0, height: 0, text: '' }] })
  assert.equal(element?.type, 'text')
  assert.deepEqual(element, { id: 'a', type: 'text', x: 0, y: 0, w: 250, h: 60, content: '', bgColor: 'rgba(30,30,30,0.8)', color: '#e0e0e0', fontSize: 14, rotation: 0, opacity: 1 })
})

test('rejects documents that are not JSON Canvas objects', () => {
  assert.throws(() => jsonCanvasToElements(null), PurDocumentError)
  assert.throws(() => jsonCanvasToElements('canvas'), PurDocumentError)
  assert.throws(() => jsonCanvasToElements({ nodes: 'nope' }), PurDocumentError)
  assert.throws(() => jsonCanvasToElements({ nodes: [1] }), PurDocumentError)
})

test('an imported canvas exports the same nodes again', () => {
  const reexported = elementsToJsonCanvas(GOLDEN_IMPORTED)
  assert.deepEqual(
    reexported.nodes.map((node) => node.id).sort(),
    GOLDEN_CANVAS.nodes.map((node) => node.id).sort(),
  )
  assert.deepEqual(reexported.edges, GOLDEN_CANVAS.edges)
  // Group membership survives even though nested nodes flatten into the list.
  const group = reexported.nodes.find((node) => node.id === 'g1')
  assert.equal(group?.[PUR_META]?.['type'], 'group')
  const child = reexported.nodes.find((node) => node.id === 't2')
  assert.equal(child?.[PUR_META]?.['parentGroupId'], 'g1')
})
