/**
 * Client conversion: an imported element becomes a canvas element with its stored
 * styling and nesting intact.
 * @module dsh-obsidian-vault/tests/pur-to-canvas
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { toCanvasElement } from '../src/client/pur/host.ts'
import type { ImportedPurElement } from '../src/client/api-vault.ts'

test('a text card keeps the colours it was imported with', () => {
  const imported: ImportedPurElement = { type: 'text', x: 10, y: 20, w: 220, h: 90, text: 'hello', bgColor: '#11223380', textColor: '#ff0000' }
  const element = toCanvasElement(imported, 'id', 0, 0)
  assert.ok(element.type === 'text')
  assert.equal(element.bgColor, '#11223380')
  assert.equal(element.color, '#ff0000')
  assert.equal(element.content, 'hello')
})

test('a text card without colours falls back to the canvas default', () => {
  const imported: ImportedPurElement = { type: 'text', x: 0, y: 0, w: 220, h: 90, text: 'plain' }
  const element = toCanvasElement(imported, 'id', 0, 0)
  assert.ok(element.type === 'text')
  assert.ok(element.bgColor !== undefined && element.bgColor !== '')
  assert.equal(element.color, '#e0e0e0')
})

test('a group keeps its children and layers the offset on the top level only', () => {
  const imported: ImportedPurElement = {
    type: 'group',
    x: 100,
    y: 200,
    w: 300,
    h: 200,
    name: '组',
    children: [
      { type: 'image', x: 10, y: 20, w: 50, h: 60, ref: 'pur-asset:a.png' },
      { type: 'text', x: 80, y: 20, w: 220, h: 90, text: 'inner' },
    ],
  }
  const element = toCanvasElement(imported, 'g', 30, 40)
  assert.equal(element.type, 'group')
  assert.equal(element.x, 130)
  assert.equal(element.y, 240)
  assert.equal(element.content, '组')
  assert.equal(element.children.length, 2)
  const child = element.children[0]
  assert.ok(child !== undefined)
  assert.equal(child.x, 10, 'the child keeps its group-relative position')
  assert.equal(child.y, 20)
})

test('rotation, opacity and lock carry over', () => {
  const imported: ImportedPurElement = { type: 'image', x: 0, y: 0, w: 10, h: 10, ref: 'pur-asset:a.png', rotation: 45, opacity: 0.5, locked: true }
  const element = toCanvasElement(imported, 'i', 0, 0)
  assert.equal(element.rotation, 45)
  assert.equal(element.opacity, 0.5)
  assert.equal(element.locked, true)
})
test('bold and a size from the source note reach the card', () => {
  const imported: ImportedPurElement = { type: 'text', x: 0, y: 0, w: 220, h: 90, text: 'bold', bold: true, fontSize: 21 }
  const element = toCanvasElement(imported, 'id', 0, 0)
  assert.ok(element.type === 'text')
  assert.equal(element.bold, true)
  assert.equal(element.fontSize, 21)
})

test('a note without a size keeps the canvas default', () => {
  const imported: ImportedPurElement = { type: 'text', x: 0, y: 0, w: 220, h: 90, text: 'plain' }
  const element = toCanvasElement(imported, 'id', 0, 0)
  assert.ok(element.type === 'text')
  assert.equal(element.fontSize, 14)
  assert.equal(element.bold, undefined)
})
