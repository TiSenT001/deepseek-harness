/**
 * Shared replay harness for the recorded golden scenarios: the same controller
 * calls, the same pinned environment and the same serialization are used by the
 * tests and by {@link ../scripts/regen-expected.mjs}, so a re-record cannot drift
 * from what the tests compare against.
 * @module dsh-obsidian-vault/tests/helpers/expected-harness
 */
import assert from 'node:assert/strict'
import { PurController } from '../../src/pur-kernel/index.ts'
import type {
  PurAlignMode,
  PurCodeNodeDraft,
  PurControllerEffect,
  PurControllerEnv,
  PurControllerLabels,
  PurElement,
  PurMenuEntry,
  PurPointerEvent,
} from '../../src/pur-kernel/index.ts'
import { CATEGORY_TITLES, LITERAL_TITLES, PRESET_TITLES } from './pur-controller-expected.ts'
import type {
  ControllerOp,
  ControllerScenario,
  ControllerSnapshot,
  MenuScenario,
  MenuNode,
} from './pur-controller-expected.ts'

/** Copy the adapter supplies in place of upstream's hardcoded strings. */
export const LABELS: PurControllerLabels = {
  textPlaceholder: '双击编辑文本',
  codeNodeFallbackTitle: '节点',
  copiedElements: (count: number) => `已复制 ${count} 个元素`,
  relinkedFrom: '连线起点已重连',
  relinkedTo: '连线终点已重连',
  lineCreated: '连线已创建',
  lineDisconnected: '已取消连接',
  connectNeedsTwo: '请选择两个元素进行连线',
  selectTwoToGroup: 'select2group',
  saved: 'saved',
  lockedNotice: 'lockedNotice',
  nodeUpdated: 'nodeUpdated',
  nodeDeleted: 'nodeDeleted',
  webLinkCard: '网页链接',
}

/**
 * The pinned environment: 800x600 canvas, sequential ids, frozen clock.
 * @returns the environment.
 */
export function envOf(): PurControllerEnv {
  let next = 0
  return {
    canvasWidth: 800,
    canvasHeight: 600,
    createId: () => `id${String(++next).padStart(4, '0')}`,
    now: () => 1000,
    hasOpenDialog: () => false,
  }
}

/**
 * Serialize an effect the way the golden recorder serialized adapter calls.
 * @param effect - controller effect.
 * @returns the recorded call string.
 */
export function callOf(effect: PurControllerEffect): string {
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
    case 'run-code': return `run:${effect.id}`
  }
}

/** Command ops map to the controller methods of the same behaviour. */
export const COMMANDS: Record<string, (controller: PurController, args: unknown[]) => PurControllerEffect[]> = {
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

/**
 * The pointer event the adapter would forward for a golden event record.
 * @param event - recorded event fields.
 * @returns the pointer event.
 */
export function pointerOf(event: NonNullable<ControllerOp['event']>): PurPointerEvent {
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

/**
 * Run one golden op against the controller and collect the adapter calls.
 * @param controller - the controller under replay.
 * @param op - recorded op.
 * @returns the calls and, for key ops, whether the controller handled them.
 */
export function runOp(controller: PurController, op: ControllerOp): { calls: string[]; handled?: boolean } {
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

/**
 * The controller state serialized like the golden recorder serialized the upstream view.
 * @param controller - the controller under replay.
 * @param calls - adapter calls produced by the step.
 * @returns the snapshot.
 */
export function snapshotOf(controller: PurController, calls: string[]): ControllerSnapshot {
  const state = controller.state
  return {
    calls,
    elements: JSON.parse(JSON.stringify(state.elements)) as PurElement[],
    selected: [...state.selectedIds].sort(),
    view: { offsetX: state.view.offsetX, offsetY: state.view.offsetY, scale: state.view.scale },
    historyIndex: controller.history.index,
    historyLength: controller.history.stack.length,
    clipboard: JSON.parse(JSON.stringify(state.clipboard)) as PurElement[],
    zoomUntil: state.showZoomUntil ?? null,
  }
}

/**
 * Build the controller a scenario starts from.
 * @param scenario - recorded scenario.
 * @returns the controller.
 */
export function controllerOf(scenario: ControllerScenario | MenuScenario): PurController {
  const view = 'view' in scenario.setup ? scenario.setup.view : undefined
  const controller = new PurController(
    envOf(),
    LABELS,
    JSON.parse(JSON.stringify(scenario.setup.elements)) as PurElement[],
    view ?? { offsetX: 0, offsetY: 0, scale: 1 },
  )
  for (const id of scenario.setup.selected ?? []) controller.state.selectedIds.add(id)
  return controller
}

/**
 * Replay a controller scenario and recompute every step snapshot.
 * @param scenario - recorded scenario.
 * @returns the snapshots, in step order.
 */
export function replayScenario(scenario: ControllerScenario): ControllerSnapshot[] {
  const controller = controllerOf(scenario)
  return scenario.steps.map((step) => {
    const { calls, handled } = runOp(controller, step.op)
    const snapshot = snapshotOf(controller, calls)
    if (handled !== undefined) snapshot.handled = handled
    return snapshot
  })
}

/**
 * The title the adapter would show for a kernel entry, per the golden key maps.
 * @param entry - kernel menu entry.
 * @returns the title, or undefined for untitled entries.
 */
export function titleOf(entry: PurMenuEntry): string | undefined {
  if (entry.label !== undefined) return entry.label
  const key = entry.labelKey
  if (key === undefined) return undefined
  if (key.startsWith('preset.')) return PRESET_TITLES[key.slice('preset.'.length)]
  if (key.startsWith('presetCategory.')) return CATEGORY_TITLES[key.slice('presetCategory.'.length)]
  if (key === 'pinInputN') return `输入${entry.value ?? 0}`
  if (key === 'pinOutputN') return `输出${entry.value ?? 0}`
  return LITERAL_TITLES[key] ?? key
}

/**
 * Normalize a kernel menu entry into the golden tree node.
 * @param entry - kernel menu entry.
 * @returns the tree node.
 */
export function nodeOf(entry: PurMenuEntry): MenuNode {
  return { t: titleOf(entry), i: entry.icon, s: entry.separatorAfter ?? false, c: entry.children?.map(nodeOf) ?? null }
}

/**
 * Replay a menu scenario and recompute the tree, calls and selection.
 * @param scenario - recorded menu scenario.
 * @returns the tree, calls and selected ids.
 */
export function replayMenu(scenario: MenuScenario): { menu: MenuNode[] | null; calls: string[]; selected: string[] } {
  const controller = controllerOf(scenario)
  const { model, effects } = controller.contextMenu(scenario.event.clientX, scenario.event.clientY, scenario.context)
  return {
    menu: model.entries.map(nodeOf),
    calls: [...effects.map(callOf), `menu:${scenario.event.clientX},${scenario.event.clientY}`],
    selected: [...controller.state.selectedIds].sort(),
  }
}
