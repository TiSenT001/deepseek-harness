/**
 * Controller-layer tests: the kernel controller must match the upstream Pur
 * Studio view method-for-method over the recorded golden scenarios, the
 * context-menu model must match the upstream menu trees, and the history
 * stack must deduplicate and stop at its edges.
 * @module dsh-obsidian-vault/tests/pur-kernel-controller
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PurController, createHistory, pushHistory, redoHistory, undoHistory } from '../src/pur-kernel/index.ts'
import type { PurElement } from '../src/pur-kernel/index.ts'
import { CONTROLLER_SCENARIOS, MENU_SCENARIOS } from './helpers/pur-controller-golden.ts'
import { LABELS, envOf, replayMenu, runOp, snapshotOf } from './helpers/golden-harness.ts'

CONTROLLER_SCENARIOS.forEach((scenario) => {
  test(`controller scenario ${scenario.name} matches upstream`, () => {
    const controller = new PurController(
      envOf(),
      LABELS,
      JSON.parse(JSON.stringify(scenario.setup.elements)) as PurElement[],
      scenario.setup.view ?? { offsetX: 0, offsetY: 0, scale: 1 },
    )
    for (const id of scenario.setup.selected ?? []) controller.state.selectedIds.add(id)
    scenario.steps.forEach((step, stepIndex) => {
      const where = `${scenario.name} step ${stepIndex} (${step.op.op})`
      const { calls, handled } = runOp(controller, step.op)
      if (step.op.skipCompare === true) return
      const expected = step.snapshot
      const actual = snapshotOf(controller, calls)
      assert.deepEqual(actual.calls, expected.calls, `${where} calls`)
      assert.deepEqual(actual.elements, expected.elements, `${where} elements`)
      assert.deepEqual(actual.selected, [...expected.selected].sort(), `${where} selected`)
      assert.deepEqual(actual.view, expected.view, `${where} view`)
      assert.equal(actual.historyIndex, expected.historyIndex, `${where} historyIndex`)
      assert.equal(actual.historyLength, expected.historyLength, `${where} historyLength`)
      assert.deepEqual(actual.clipboard, expected.clipboard, `${where} clipboard`)
      assert.equal(actual.zoomUntil, expected.zoomUntil, `${where} zoomUntil`)
      if (expected.handled !== undefined) assert.equal(handled, expected.handled, `${where} handled`)
    })
  })
})

MENU_SCENARIOS.forEach((scenario) => {
  test(`menu scenario ${scenario.name} matches upstream`, () => {
    const expected = { menu: scenario.menu, calls: scenario.calls, selected: scenario.selected }
    assert.deepEqual(replayMenu(scenario), {
      menu: expected.menu,
      calls: expected.calls,
      selected: [...expected.selected].sort(),
    })
  })
})

/** A minimal text element for the history tests. */
function textAt(x: number): PurElement {
  return { id: 't', type: 'text', x, y: 0, w: 10, h: 10, content: '', bgColor: '', color: '', fontSize: 14, rotation: 0, opacity: 1 }
}

test('pushHistory skips a snapshot identical to the top', () => {
  const history = createHistory()
  assert.equal(pushHistory(history, [textAt(0)]), true)
  assert.equal(pushHistory(history, [textAt(0)]), false)
  assert.equal(history.stack.length, 1)
  assert.equal(pushHistory(history, [textAt(1)]), true)
  assert.equal(history.stack.length, 2)
})

test('undo and redo stop at the stack edges', () => {
  const history = createHistory()
  assert.equal(undoHistory(history), null)
  assert.equal(redoHistory(history), null)
  pushHistory(history, [textAt(0)])
  pushHistory(history, [textAt(1)])
  assert.equal(undoHistory(history)?.[0]?.x, 0)
  assert.equal(undoHistory(history), null)
  assert.equal(redoHistory(history)?.[0]?.x, 1)
  assert.equal(redoHistory(history), null)
})

test('controller undo/redo facade swaps the tree and clears the selection', () => {
  const controller = new PurController(envOf(), LABELS, [textAt(0)])
  assert.deepEqual(controller.undo(), [])
  assert.deepEqual(controller.redo(), [])
  pushHistory(controller.history, controller.state.elements)
  controller.state.elements = [textAt(1)]
  controller.state.selectedIds.add('t')
  pushHistory(controller.history, controller.state.elements)
  assert.deepEqual(controller.undo(), [{ type: 'save' }, { type: 'render' }])
  assert.deepEqual(controller.state.elements, [textAt(0)])
  assert.equal(controller.state.selectedIds.size, 0)
  assert.deepEqual(controller.redo(), [{ type: 'save' }, { type: 'render' }])
  assert.deepEqual(controller.state.elements, [textAt(1)])
  assert.equal(controller.state.selectedIds.size, 0)
})
