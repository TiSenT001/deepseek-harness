/**
 * Fit-to-view bounds: a child of a group stores a position relative to its parent,
 * so framing the child must use the accumulated offset rather than its own x/y.
 * @module dsh-obsidian-vault/tests/pur-view-bounds
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { PurElement } from '../src/pur-kernel/index.ts'
import { elementBounds, selectedBounds } from '../src/pur-kernel/view-bounds.ts'

/**
 * Build a group holding the given children.
 * @param children - group members.
 * @returns the group element.
 */
function group(children: readonly PurElement[]): PurElement {
  return { id: 'g', type: 'group', x: 1000, y: 2000, w: 400, h: 300, content: 'g', children, rotation: 0, opacity: 1 }
}

/**
 * Build an image card.
 * @param id - element id.
 * @param x - position inside its parent.
 * @param y - position inside its parent.
 * @returns the element.
 */
function image(id: string, x: number, y: number): PurElement {
  return { id, type: 'image', x, y, w: 200, h: 100, original: 'pur-asset:a.png', rotation: 0, opacity: 1 }
}

test('a selected child is framed at its absolute position', () => {
  const bounds = selectedBounds([group([image('child', 20, 30)])], new Set(['child']))
  assert.deepEqual(bounds, { minX: 1020, minY: 2030, maxX: 1220, maxY: 2130 })
})

test('a selected group brings its children into the frame', () => {
  // The group box is larger than its child, so it defines the frame.
  const bounds = selectedBounds([group([image('child', 20, 30)])], new Set(['g']))
  assert.deepEqual(bounds, { minX: 1000, minY: 2000, maxX: 1400, maxY: 2300 })
})

test('an empty selection has no bounds', () => {
  assert.equal(selectedBounds([group([image('child', 0, 0)])], new Set()), undefined)
})

test('the whole canvas keeps including grouped children', () => {
  assert.deepEqual(elementBounds([group([image('child', 20, 30)])]), {
    minX: 1000,
    minY: 2000,
    maxX: 1400,
    maxY: 2300,
  })
})
