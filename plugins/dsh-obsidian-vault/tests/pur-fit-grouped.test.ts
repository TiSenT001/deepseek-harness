/**
 * Fit-to-view on a grouped element: the child stores a position relative to its
 * parent, so the viewport has to end up centred on the child's world position
 * rather than near the origin.
 * @module dsh-obsidian-vault/tests/pur-fit-grouped
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PurController } from '../src/pur-kernel/index.ts'
import { LABELS, envOf } from './helpers/pur-adapter-fixtures.ts'

test('fitting a grouped image centres the viewport on it', () => {
  const controller = new PurController(envOf(), LABELS)
  controller.state.elements.push({
    id: 'g',
    type: 'group',
    x: 1000,
    y: 2000,
    w: 600,
    h: 500,
    content: '组',
    rotation: 0,
    opacity: 1,
    children: [
      {
        id: 'child',
        type: 'image',
        x: 20,
        y: 30,
        w: 200,
        h: 100,
        original: 'pur-asset:a.png',
        rotation: 0,
        opacity: 1,
      },
    ],
  })
  controller.state.selectedIds.add('child')
  controller.fitToView()

  const { view } = controller.state
  const env = envOf()
  // The child's world centre is (1120, 2080); it must land at the canvas centre.
  const screenX = 1120 * view.scale + view.offsetX
  const screenY = 2080 * view.scale + view.offsetY
  assert.ok(Math.abs(screenX - env.canvasWidth / 2) < 0.5, `x landed at ${screenX}`)
  assert.ok(Math.abs(screenY - env.canvasHeight / 2) < 0.5, `y landed at ${screenY}`)
})

test('fitting a selected group frames its whole box', () => {
  const controller = new PurController(envOf(), LABELS)
  controller.state.elements.push({
    id: 'g',
    type: 'group',
    x: 1000,
    y: 2000,
    w: 600,
    h: 500,
    content: '组',
    rotation: 0,
    opacity: 1,
    children: [],
  })
  controller.state.selectedIds.add('g')
  controller.fitToView()
  const { view } = controller.state
  const env = envOf()
  // Group centre (1300, 2250) belongs at the canvas centre.
  assert.ok(Math.abs(1300 * view.scale + view.offsetX - env.canvasWidth / 2) < 0.5)
  assert.ok(Math.abs(2250 * view.scale + view.offsetY - env.canvasHeight / 2) < 0.5)
})
test('right-clicking the grouped image then fitting frames the image, not the group', () => {
  const controller = new PurController(envOf(), LABELS)
  controller.state.elements.push({
    id: 'g',
    type: 'group',
    x: 1000,
    y: 2000,
    w: 600,
    h: 500,
    content: '组',
    rotation: 0,
    opacity: 1,
    children: [
      {
        id: 'child',
        type: 'image',
        x: 20,
        y: 30,
        w: 200,
        h: 100,
        original: 'pur-asset:a.png',
        rotation: 0,
        opacity: 1,
      },
    ],
  })
  controller.fitToView()
  const view = controller.state.view
  // Right-click lands on the picture inside the group.
  const screenX = 1120 * view.scale + view.offsetX
  const screenY = 2080 * view.scale + view.offsetY
  controller.contextMenu(screenX, screenY, { activeFileIsMarkdown: true, isPopout: false, isPinned: false, supportsPopout: false, supportsPinTop: false, supportsReveal: false })
  assert.deepEqual([...controller.state.selectedIds], ['child'])
  controller.fitToView()
  const env = envOf()
  // The child is 200 wide with padding: the view must be much closer than the group.
  assert.ok(controller.state.view.scale > 2, `scale ${controller.state.view.scale}`)
  assert.ok(Math.abs(1120 * controller.state.view.scale + controller.state.view.offsetX - env.canvasWidth / 2) < 0.5)
})