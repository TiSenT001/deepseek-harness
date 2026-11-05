/**
 * Import framing: cards imported at the source board's coordinates can land far
 * outside the viewport, so the insertion step selects them and fits the view.
 * @module dsh-obsidian-vault/tests/pur-import-framing
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PurController, pushHistory } from '../src/pur-kernel/index.ts'
import type { PurElement } from '../src/pur-kernel/index.ts'
import { LABELS, envOf } from './helpers/pur-adapter-fixtures.ts'

/**
 * Build one picture card.
 * @param id - element id.
 * @param x - world x.
 * @param y - world y.
 * @returns the element.
 */
function card(id: string, x: number, y: number): PurElement {
  return { id, type: 'image', x, y, w: 400, h: 300, original: `pur-asset:${id}.png`, rotation: 0, opacity: 1 }
}

test('importing far away frames the new cards instead of leaving the view empty', () => {
  const controller = new PurController(envOf(), LABELS)
  pushHistory(controller.history, controller.state.elements)
  const imported = [card('a', 8000, 6000), card('b', 8600, 6400)]
  // What insertElements does: append, snapshot, select the new cards, fit.
  controller.state.elements.push(...imported)
  pushHistory(controller.history, controller.state.elements)
  controller.state.selectedIds = new Set(imported.map((element) => element.id))
  controller.fitToView()

  const env = envOf()
  const { view } = controller.state
  // Every card must land inside the canvas, and together they must fill a good
  // share of it rather than sitting at the edge.
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY
  for (const element of imported) {
    const left = element.x * view.scale + view.offsetX
    const top = element.y * view.scale + view.offsetY
    minX = Math.min(minX, left)
    minY = Math.min(minY, top)
    maxX = Math.max(maxX, left + element.w * view.scale)
    maxY = Math.max(maxY, top + element.h * view.scale)
  }
  assert.ok(minX >= -1 && minY >= -1, `imported box starts outside the canvas at ${minX},${minY}`)
  assert.ok(maxX <= env.canvasWidth + 1 && maxY <= env.canvasHeight + 1, `imported box ends outside the canvas at ${maxX},${maxY}`)
  const covered = (maxX - minX) * (maxY - minY)
  assert.ok(covered / (env.canvasWidth * env.canvasHeight) >= 0.6, `covered only ${Math.round((covered / (env.canvasWidth * env.canvasHeight)) * 100)}%`)
})

test('framing an import does not move the existing cards', () => {
  const existing = card('old', 0, 0)
  const controller = new PurController(envOf(), LABELS, [existing])
  pushHistory(controller.history, controller.state.elements)
  const imported = [card('new', -5000, -4000)]
  controller.state.elements.push(...imported)
  controller.state.selectedIds = new Set(['new'])
  controller.fitToView()
  assert.equal(existing.x, 0)
  assert.equal(existing.y, 0)
  assert.equal(controller.state.elements.length, 2)
})
