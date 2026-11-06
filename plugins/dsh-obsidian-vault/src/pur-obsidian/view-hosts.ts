/**
 * Host factories the view delegates to: the effect sink, the menu dispatch
 * context, the exporter and insert host adapters, the editor-overlay opener
 * and the context-menu builder.
 * @module dsh-obsidian-vault/pur-obsidian/view-hosts
 */
import { Notice } from 'obsidian'
import { createElementId, elementAt, executeEffects, screenToWorld } from '../pur-kernel/index.ts'
import type { PurEffectSink, PurMenuContext } from '../pur-kernel/index.ts'
import { openPurGroupEditor, openPurLineEditor, openPurNoteLinkEditor, openPurTextEditor } from './editors.ts'
import type { PurEditorHost } from './editors.ts'
import { exportMarkdown } from './exporter.ts'
import type { PurExporterHost } from './exporter.ts'
import { showPurMenu } from './menu.ts'
import type { PurMenuOptions } from './menu.ts'
import type { PurInsertHost } from './paste-drop.ts'
import type { PurMenuDeps, PurViewEditorKind } from './view-menu.ts'
import type { PurStudioView } from './view.ts'

/**
 * Create the view's effect sink.
 * @param view - the canvas view.
 * @returns the sink `executeEffects` drains into.
 */
export function createViewSink(view: PurStudioView): PurEffectSink {
  return {
    render: () => view.markDirty(),
    save: () => view.scheduleSave(),
    notice: (text) => new Notice(text),
    setCursor: (cursor) => view.setCursor(cursor),
    openLink: (target) => view.openLink(target),
    editText: (id) => openViewEditor(view, 'text', id),
    editGroup: (id) => openViewEditor(view, 'group', id),
    editLine: (id) => openViewEditor(view, 'line', id),
    editNoteLink: (id) => openViewEditor(view, 'note-link', id),
    showContextMenu: (clientX, clientY) => openViewContextMenu(view, clientX, clientY),
    exportText: () => void exportMarkdown(viewExporterHost(view), true, true),
    // The DSH pane evaluates snippets through its host route; the Obsidian view has
    // no such route, so running a node says so rather than doing nothing.
    runCode: () => new Notice('Run node needs the DSH pane'),
  }
}

/**
 * The menu host's view context, resolved at dispatch time.
 * @param view - the canvas view.
 * @returns the dispatch context.
 */
export function viewMenuDeps(view: PurStudioView): PurMenuDeps {
  return {
    app: view.app,
    controller: () => view.requireController(),
    sink: () => view.sink,
    labels: () => view.labels,
    read: (key) => view.read(key),
    insertHost: () => viewInsertHost(view),
    exporterHost: () => viewExporterHost(view),
    sourcePath: () => view.filePath(),
    adoptFile: (file) => view.adoptFile(file),
    openEditor: (kind, id) => openViewEditor(view, kind, id),
    openFile: (path) => view.openFile(path),
  }
}

/**
 * The exporter's view context.
 * @param view - the canvas view.
 * @returns the export context.
 */
export function viewExporterHost(view: PurStudioView): PurExporterHost {
  return {
    app: view.app,
    read: (key) => view.read(key),
    labels: view.labels,
    fileName: () => view.fileBaseName(),
    elements: () => view.requireController().state.elements,
    selectedIds: () => view.requireController().state.selectedIds,
    images: () => view.imagesMap(),
    preferences: () => view.preferences(),
  }
}

/**
 * The paste/drop flows' view context.
 * @param view - the canvas view.
 * @returns the insert context.
 */
export function viewInsertHost(view: PurStudioView): PurInsertHost {
  return {
    app: view.app,
    controller: view.requireController(),
    sink: view.sink,
    read: (key) => view.read(key),
    createId: createElementId,
  }
}

/**
 * Open an element editor overlay.
 * @param view - the canvas view.
 * @param kind - the editor.
 * @param id - the element id.
 */
export function openViewEditor(view: PurStudioView, kind: PurViewEditorKind, id: string): void {
  const controller = view.controllerOrNull()
  const surface = view.surfaceEl()
  if (controller === null || surface === null) return
  const host: PurEditorHost = {
    controller,
    sink: view.sink,
    read: (key) => view.read(key),
    parentEl: surface,
    dialogOpened: () => view.dialogOpened(),
    dialogClosed: () => view.dialogClosed(),
    focusCanvas: () => view.focusCanvas(),
  }
  if (kind === 'text') openPurTextEditor(host, id)
  else if (kind === 'group') openPurGroupEditor(host, id)
  else if (kind === 'line') openPurLineEditor(host, id)
  else openPurNoteLinkEditor(host, id)
}

/**
 * Build the kernel menu model at a viewport point and render it natively.
 * @param view - the canvas view.
 * @param clientX - viewport x.
 * @param clientY - viewport y.
 */
export function openViewContextMenu(view: PurStudioView, clientX: number, clientY: number): void {
  const canvas = view.canvasEl()
  const controller = view.controllerOrNull()
  const surface = view.surfaceEl()
  if (canvas === null || controller === null || surface === null) return
  const rect = canvas.getBoundingClientRect()
  const canvasX = clientX - rect.left
  const canvasY = clientY - rect.top
  const context: PurMenuContext = {
    activeFileIsMarkdown: view.app.workspace.getActiveFile()?.extension === 'md',
    isPopout: false,
    isPinned: false,
    supportsPopout: true,
    supportsPinTop: true,
    supportsReveal: true,
  }
  const { model, effects } = controller.contextMenu(canvasX, canvasY, context)
  executeEffects(effects, view.sink)
  const world = screenToWorld(controller.state.view, canvasX, canvasY)
  const target = elementAt(controller.state.elements, world.x, world.y, controller.state.view.scale)
  const options: PurMenuOptions = { controller, host: view.menuHost, sink: view.sink, labels: view.labels, world, parentEl: surface }
  if (target !== null) options.targetId = target.id
  showPurMenu(model, clientX, clientY, options)
}
