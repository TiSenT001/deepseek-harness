/**
 * Detaching a connection: the line keeps its path as a free line, can still be
 * selected and moved, and the menu offers the action only for a bound line.
 * @module dsh-obsidian-vault/tests/pur-line-disconnect
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PurController, drawScene, elementAt, pinWorldPosition, pushHistory } from '../src/pur-kernel/index.ts'
import type { PurElement, PurScene } from '../src/pur-kernel/index.ts'
import { LABELS, envOf } from './helpers/pur-adapter-fixtures.ts'
import { RenderRecorder } from './helpers/pur-render-recorder.ts'

/**
 * Two code nodes joined by a line.
 * @returns the controller.
 */
function controllerOf(): PurController {
  const a: PurElement = { id: 'a', type: 'code-node', title: 'a', x: 0, y: 0, w: 260, h: 116, inputs: [], outputs: [{ id: 'ao0', label: 'sum' }], code: '', content: '', rotation: 0, opacity: 1 }
  const b: PurElement = { id: 'b', type: 'code-node', title: 'b', x: 500, y: 0, w: 260, h: 88, inputs: [{ id: 'bi0', label: 'x' }], outputs: [], code: '', content: '', rotation: 0, opacity: 1 }
  const line: PurElement = { id: 'l1', type: 'line', from: 'a', to: 'b', fromPin: 'ao0', toPin: 'bi0', content: '', arrow: false }
  const controller = new PurController(envOf(), LABELS, [a, b, line])
  pushHistory(controller.history, controller.state.elements)
  return controller
}

test('disconnecting keeps the path and drops both endpoints', () => {
  const controller = controllerOf()
  const start = pinWorldPosition(controller.state.elements, 'a', 'ao0')
  const end = pinWorldPosition(controller.state.elements, 'b', 'bi0')
  assert.ok(start !== null && end !== null)
  const before = controller.history.stack.length
  controller.disconnectLine('l1')
  const line = controller.state.elements.find((element) => element.id === 'l1')
  assert.ok(line !== undefined && line.type === 'line')
  if (line === undefined || line.type !== 'line') return
  assert.equal(line.from, '')
  assert.equal(line.to, '')
  assert.equal(line.fromPin, undefined)
  assert.equal(line.toPin, undefined)
  assert.equal(line.x, start.x)
  assert.equal(line.y, start.y)
  assert.equal(line.w, end.x - start.x)
  assert.equal(line.h, end.y - start.y)
  assert.equal(controller.history.stack.length, before + 1)
  assert.deepEqual([...controller.state.selectedIds], ['l1'])
})

test('a detached line is still selectable on the canvas', () => {
  const controller = controllerOf()
  controller.disconnectLine('l1')
  const line = controller.state.elements.find((element) => element.id === 'l1')
  assert.ok(line !== undefined && line.type === 'line')
  if (line === undefined || line.type !== 'line') return
  const midX = (line.x ?? 0) + (line.w ?? 0) / 2
  const midY = (line.y ?? 0) + (line.h ?? 0) / 2
  assert.equal(elementAt(controller.state.elements, midX, midY, 1)?.id, 'l1')
})

test('a detached line can be dragged', () => {
  const controller = controllerOf()
  controller.disconnectLine('l1')
  const line = controller.state.elements.find((element) => element.id === 'l1')
  assert.ok(line !== undefined && line.type === 'line')
  if (line === undefined || line.type !== 'line') return
  const x = line.x ?? 0
  const y = line.y ?? 0
  const midX = x + (line.w ?? 0) / 2
  const midY = y + (line.h ?? 0) / 2
  const pointer = (px: number, py: number) => ({ clientX: px, clientY: py, rectLeft: 0, rectTop: 0, button: 0, ctrlKey: false, metaKey: false, shiftKey: false })
  controller.pointerDown(pointer(midX, midY))
  controller.pointerMove(pointer(midX + 40, midY + 20))
  const moved = controller.state.elements.find((element) => element.id === 'l1')
  assert.ok(moved !== undefined && moved.type === 'line')
  if (moved === undefined || moved.type !== 'line') return
  assert.equal(moved.x, x + 40)
  assert.equal(moved.y, y + 20)
})

test('a detached line is still drawn', () => {
  const controller = controllerOf()
  controller.disconnectLine('l1')
  const scene: PurScene = {
    elements: controller.state.elements,
    view: { offsetX: 0, offsetY: 0, scale: 1 },
    width: 800,
    height: 600,
    preferences: { backgroundColor: '#000', gridColor: '#111', showGrid: false },
    labels: { imageLoading: 'loading', codeNodeFallbackTitle: 'node', codeNodeBadge: 'node', noteLinkFallback: 'link', codeCardPrefix: '' },
  }
  const recorder = new RenderRecorder({ roundRect: true })
  drawScene(recorder, scene)
  assert.ok(recorder.calls.some((call) => call.startsWith('moveTo(')), 'the free line drew nothing')
})

test('the menu only offers disconnecting a bound line', () => {
  const controller = controllerOf()
  const menuOf = (): string[] => {
    const model = controller.contextMenu(380, 51, { activeFileIsMarkdown: true, isPopout: false, isPinned: false, supportsPopout: false, supportsPinTop: false, supportsReveal: false }).model
    const flatten = (entries: readonly { id: string; children?: readonly { id: string }[] }[]): string[] =>
      entries.flatMap((entry) => [entry.id, ...(entry.children === undefined ? [] : flatten(entry.children))])
    return flatten(model.entries)
  }
  controller.state.selectedIds.clear()
  controller.state.selectedIds.add('l1')
  assert.ok(menuOf().includes('disconnect-line'))
  controller.disconnectLine('l1')
  assert.ok(!menuOf().includes('disconnect-line'), 'a free line still offers the action')
})
