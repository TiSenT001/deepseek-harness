import assert from 'node:assert/strict'
import { test } from 'node:test'
import { elementsToJsonCanvas, jsonCanvasToElements } from '../src/pur-kernel/index.ts'
import { findElement } from '../src/pur-kernel/geometry.ts'
import { elementAt } from '../src/pur-kernel/hit-test.ts'
import { placeElements } from '../src/pur-kernel/render-elements.ts'
import type { PurGroupElement } from '../src/pur-kernel/types.ts'

function collapsedGroup(): PurGroupElement {
  return {
    id: 'g', type: 'group', x: 0, y: 0, w: 400, h: 300, rotation: 0, opacity: 1,
    children: [{ id: 't', type: 'text', x: 20, y: 20, w: 100, h: 40, content: 'hidden' }],
    collapsed: true,
  }
}

test('collapsed survives a JSON Canvas round-trip', () => {
  const canvas = elementsToJsonCanvas([collapsedGroup()])
  assert.equal(canvas.nodes.find(node => node.id === 'g')?.collapsed, true)
  const imported = jsonCanvasToElements(canvas)
  const group = imported.find(element => element.id === 'g')
  assert.equal(group?.type === 'group' ? group.collapsed : undefined, true)
})

test('collapsed group children are not placed, found or hit', () => {
  const elements = [collapsedGroup()]
  assert.equal(placeElements(elements).length, 0)
  assert.equal(findElement(elements, 't'), null)
  const hit = elementAt(elements, 10, 10, 1)
  assert.equal(hit?.id, 'g')
})
