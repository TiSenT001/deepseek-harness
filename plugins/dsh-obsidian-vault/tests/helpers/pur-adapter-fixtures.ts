/**
 * Shared fixtures for the pur adapter tests: a pinned controller environment,
 * a recording effect sink, and a recording menu host.
 * @module dsh-obsidian-vault/tests/helpers/pur-adapter-fixtures
 */
import { PurController } from '../../src/pur-kernel/index.ts'
import type {
  PurControllerEnv,
  PurControllerLabels,
  PurEffectSink,
  PurMenuHost,
} from '../../src/pur-kernel/index.ts'

/** Stub controller copy; adapter tests assert behaviour, not wording. */
export const LABELS: PurControllerLabels = {
  textPlaceholder: 'text',
  codeNodeFallbackTitle: 'node',
  copiedElements: (count) => `copied ${count}`,
  relinkedFrom: 'from',
  relinkedTo: 'to',
  lineCreated: 'created',
  lineDisconnected: 'disconnected',
  connectNeedsTwo: 'need two',
  selectTwoToGroup: 'need two group',
  saved: 'saved',
  lockedNotice: 'locked',
  nodeUpdated: 'updated',
  nodeDeleted: 'deleted',
  webLinkCard: 'web',
}

/**
 * The pinned environment: 800x600 canvas, sequential ids, frozen clock.
 * @returns a fresh environment with its own id counter.
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
 * A controller with one text element and one code node, both pinned ids.
 * @returns the controller after both inserts settled.
 */
export function controllerOf(): PurController {
  const controller = new PurController(envOf(), LABELS)
  controller.addTextBlock(10, 20)
  controller.addCodeNode(100, 100, { inputs: ['a'], outputs: ['sum'], code: 'function process(inputs) { return {}; }', title: 'Add' })
  return controller
}

/**
 * A sink recording every call as `name` or `name:detail`.
 * @returns the sink plus its ordered call log.
 */
export function sinkOf(): { sink: PurEffectSink; calls: string[] } {
  const calls: string[] = []
  return {
    calls,
    sink: {
      render: () => calls.push('render'),
      save: () => calls.push('save'),
      notice: (text) => calls.push(`notice:${text}`),
      setCursor: (cursor) => calls.push(`cursor:${cursor}`),
      openLink: (target) => calls.push(`open:${target}`),
      editText: (id) => calls.push(`edit-text:${id}`),
      editGroup: (id) => calls.push(`edit-group:${id}`),
      editLine: (id) => calls.push(`edit-line:${id}`),
      editNoteLink: (id) => calls.push(`edit-note-link:${id}`),
      showContextMenu: (x, y) => calls.push(`menu:${x},${y}`),
      exportText: () => calls.push('export-text'),
      runCode: (id, code) => calls.push(`run-code:${id}:${code.length}`),
    },
  }
}

/**
 * A menu host recording calls; `presetTitle` echoes the id.
 * @returns the host plus its ordered call log.
 */
export function hostOf(): { host: PurMenuHost; calls: string[] } {
  const calls: string[] = []
  const record = (name: string) => (): void => {
    calls.push(name)
  }
  return {
    calls,
    host: {
      presetTitle: (id) => `title:${id}`,
      newCanvas: record('newCanvas'),
      runAllNodes: record('runAllNodes'),
      addNoteLink: record('addNoteLink'),
      importLocal: record('importLocal'),
      importPur: (at: { x: number; y: number }) => record('importPur') ?? `${at.x},${at.y}`,
      importPurAsCanvas: (at: { x: number; y: number }) => record('importPurAsCanvas') ?? `${at.x},${at.y}`,
  importIr: record('importIr'),
      importCanvas: record('importCanvas'),
      importNet: record('importNet'),
      savePur: record('savePur'),
      exportMarkdown: record('exportMarkdown'),
      generateCode: (format) => calls.push(`generateCode:${format}`),
      exportImage: (format) => calls.push(`exportImage:${format}`),
      exportCanvasDocument: record('exportCanvasDocument'),
      togglePopout: record('togglePopout'),
      togglePinTop: record('togglePinTop'),
      insertCodeSnippet: (id: string, at: { x: number; y: number }) => record('insertCodeSnippet') ?? `${id}@${at.x},${at.y}`,
  deleteCodeSnippet: (id: string) => record('deleteCodeSnippet') ?? id,
  saveCodeSnippet: (elementId: string) => record('saveCodeSnippet') ?? elementId,
  openFileWith: (target: string, program: string) => record('openFileWith') ?? `${target}:${program}`,
  openAsset: record('openAsset'),
      openEmbeddingNote: record('openEmbeddingNote'),
      openLink: (target, destination) => calls.push(`openLink:${target}:${destination}`),
      copyLinkOf: record('copyLinkOf'),
      revealInExplorer: record('revealInExplorer'),
      embedInActiveNote: record('embedInActiveNote'),
      promptElementLink: (element, mode) => calls.push(`promptElementLink:${element.id}:${mode}`),
      editText: (id) => calls.push(`editText:${id}`),
      editGroup: (id) => calls.push(`editGroup:${id}`),
      editLine: (id) => calls.push(`editLine:${id}`),
      editNoteLink: (id) => calls.push(`editNoteLink:${id}`),
    },
  }
}

/** The pinned canvas-world point menu actions receive. */
export const WORLD = { x: 50, y: 60 }
