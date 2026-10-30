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
import type {
  PurAlignMode,
  PurCodeNodeDraft,
  PurControllerEffect,
  PurControllerEnv,
  PurControllerLabels,
  PurElement,
  PurMenuEntry,
  PurPointerEvent,
} from '../src/pur-kernel/index.ts'
import { CATEGORY_TITLES, CONTROLLER_SCENARIOS, LITERAL_TITLES, MENU_SCENARIOS, PRESET_TITLES } from './helpers/pur-controller-golden.ts'
import type { ControllerOp, ControllerSnapshot, MenuNode } from './helpers/pur-controller-golden.ts'

/** Copy the adapter supplies in place of upstream's hardcoded strings. */
const LABELS: PurControllerLabels = {
  textPlaceholder: '双击编辑文本',
  codeNodeFallbackTitle: '节点',
  copiedElements: (count: number) => `已复制 ${count} 个元素`,
  relinkedFrom: '连线起点已重连',
  relinkedTo: '连线终点已重连',
  lineCreated: '连线已创建',
  connectNeedsTwo: '请选择两个元素进行连线',
  selectTwoToGroup: 'select2group',
  saved: 'saved',
  lockedNotice: 'lockedNotice',
  nodeUpdated: 'nodeUpdated',
  nodeDeleted: 'nodeDeleted',
  webLinkCard: '网页链接',
}

/** The pinned environment: 800x600 canvas, sequential ids, frozen clock. */
function envOf(): PurControllerEnv {
  let next = 0
  return {
    canvasWidth: 800,
    canvasHeight: 600,
    createId: () => `id${String(++next).padStart(4, '0')}`,
    now: () => 1000,
    hasOpenDialog: () => false,
  }
}

/** Serialize an effect the way the golden recorder serialized adapter calls. */
function callOf(effect: PurControllerEffect): string {
  switch (effect.type) {
    case 'render': return 'render'
    case 'save': return 'save'
    case 'notice': return `notice:${effect.text}`
    case 'cursor': return `cursor:${effect.cursor}`
    case 'open-link': return `open-link:${effect.target}`
    case 'edit-text': return `edit-text:${effect.id}`
    case 'edit-group': return `edit-group:${effect.id}`
    case 'edit-line': return `edit-line:${effect.id}`
    case 'edit-note-link': return `edit-note-link:${effect.id}`
    case 'context-menu': return `menu:${effect.clientX},${effect.clientY}`
    case 'export-text': return 'export-text'
  }
}

/** Command ops map to the controller methods of the same behaviour. */
const COMMANDS: Record<string, (controller: PurController, args: unknown[]) => PurControllerEffect[]> = {
  alignElements: (c, a) => c.align(a[0] as PurAlignMode),
  scaleElements: (c, a) => c.scaleUniform(a[0] as 'width' | 'height'),
  arrangeElements: (c) => c.arrange(),
  connectSelected: (c) => c.connect(),
  deleteSelected: (c) => c.deleteSelection(),
  copySelected: (c) => c.copy(),
  pasteClipboard: (c, a) => c.paste(...(a as [number?, number?])),
  duplicateSelected: (c) => c.duplicate(),
  groupSelected: (c) => c.group(),
  ungroupSelected: (c) => c.ungroup(),
  bringToFront: (c) => c.bringToFront(),
  sendToBack: (c) => c.sendToBack(),
  bringForward: (c) => c.bringForward(),
  sendBackward: (c) => c.sendBackward(),
  resetTransform: (c) => c.resetTransform(),
  toggleLock: (c) => c.toggleLock(),
  fitToView: (c) => c.fitToView(),
  addTextBlock: (c, a) => c.addTextBlock(a[0] as number, a[1] as number),
  addCodeNode: (c, a) => c.addCodeNode(a[0] as number, a[1] as number, a[2] as PurCodeNodeDraft),
}

/** The pointer event the adapter would forward for a golden event record. */
function pointerOf(event: NonNullable<ControllerOp['event']>): PurPointerEvent {
  return {
    clientX: event.clientX ?? 0,
    clientY: event.clientY ?? 0,
    rectLeft: 0,
    rectTop: 0,
    button: event.button ?? 0,
    ctrlKey: event.ctrlKey ?? false,
    metaKey: event.metaKey ?? false,
    shiftKey: event.shiftKey ?? false,
  }
}

/** Run one golden op against the controller and collect the adapter calls. */
function runOp(controller: PurController, op: ControllerOp): { calls: string[]; handled?: boolean } {
  const event = op.event ?? {}
  const pointer = pointerOf(event)
  switch (op.op) {
    case 'down': return { calls: controller.pointerDown(pointer).map(callOf) }
    case 'move': return { calls: controller.pointerMove(pointer).map(callOf) }
    case 'up': return { calls: controller.pointerUp(pointer).map(callOf) }
    case 'dblclick': return { calls: controller.doubleClick(pointer).map(callOf) }
    case 'wheel': return { calls: controller.wheel({ clientX: pointer.clientX, clientY: pointer.clientY, rectLeft: 0, rectTop: 0, deltaY: event.deltaY ?? 0 }).map(callOf) }
    case 'key': {
      const result = controller.keyDown({ key: event.key ?? '', ctrlKey: event.ctrlKey ?? false, metaKey: event.metaKey ?? false })
      return { calls: result.effects.map(callOf), handled: result.handled }
    }
    case 'momentum': {
      const calls: string[] = []
      while (controller.momentumStep()) calls.push('render')
      return { calls }
    }
    case 'select': {
      const ids = (op.args ?? [[]])[0] as string[]
      controller.state.selectedIds.clear()
      for (const id of ids) controller.state.selectedIds.add(id)
      return { calls: [] }
    }
    default: {
      const command = COMMANDS[op.op]
      assert.ok(command !== undefined, `unknown op ${op.op}`)
      return { calls: command(controller, op.args ?? []).map(callOf) }
    }
  }
}

/** The controller state serialized like the golden recorder serialized the upstream view. */
function snapshotOf(controller: PurController, calls: string[]): ControllerSnapshot {
  const state = controller.state
  return {
    calls,
    elements: JSON.parse(JSON.stringify(state.elements)) as PurElement[],
    selected: [...state.selectedIds].sort(),
    view: { offsetX: state.view.offsetX, offsetY: state.view.offsetY, scale: state.view.scale },
    historyIndex: controller.history.index,
    historyLength: controller.history.stack.length,
    clipboard: JSON.parse(JSON.stringify(state.clipboard)) as PurElement[],
    zoomUntil: state.showZoomUntil,
  }
}

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

/** The title the adapter would show for a kernel entry, per the golden key maps. */
function titleOf(entry: PurMenuEntry): string | undefined {
  if (entry.label !== undefined) return entry.label
  const key = entry.labelKey
  if (key === undefined) return undefined
  if (key.startsWith('preset.')) return PRESET_TITLES[key.slice('preset.'.length)]
  if (key.startsWith('presetCategory.')) return CATEGORY_TITLES[key.slice('presetCategory.'.length)]
  if (key === 'pinInputN') return `输入${entry.value ?? 0}`
  if (key === 'pinOutputN') return `输出${entry.value ?? 0}`
  return LITERAL_TITLES[key] ?? key
}

/** Normalize a kernel menu entry into the golden tree node. */
function nodeOf(entry: PurMenuEntry): MenuNode {
  return { t: titleOf(entry), i: entry.icon, s: entry.separatorAfter ?? false, c: entry.children?.map(nodeOf) ?? null }
}

MENU_SCENARIOS.forEach((scenario) => {
  test(`menu scenario ${scenario.name} matches upstream`, () => {
    const controller = new PurController(envOf(), LABELS, JSON.parse(JSON.stringify(scenario.setup.elements)) as PurElement[])
    for (const id of scenario.setup.selected ?? []) controller.state.selectedIds.add(id)
    const { model, effects } = controller.contextMenu(scenario.event.clientX, scenario.event.clientY, scenario.context)
    assert.deepEqual(model.entries.map(nodeOf), scenario.menu)
    assert.deepEqual([...effects.map(callOf), `menu:${scenario.event.clientX},${scenario.event.clientY}`], scenario.calls)
    assert.deepEqual([...controller.state.selectedIds].sort(), [...scenario.selected].sort())
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
