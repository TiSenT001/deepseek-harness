/**
 * Adapter glue: the effect sink every host implements, plus the menu-action
 * dispatcher that turns {@link PurMenuEntry} ids into controller commands or
 * host operations. Unknown ids throw, so a menu model and its dispatcher can
 * never drift apart silently.
 * @module dsh-obsidian-vault/pur-kernel/adapter
 */
import type { PurController } from './controller.ts'
import { findElement } from './geometry.ts'
import { pushHistory } from './history.ts'
import { PUR_CODE_PRESETS } from './presets.ts'
import type { PurControllerEffect } from './controller-types.ts'
import type { PurElement } from './types.ts'

/** What an adapter performs when the kernel reports effects, in order. */
export interface PurEffectSink {
  /** Repaint the canvas. */
  render(): void
  /** Persist the document. */
  save(): void
  /** Show a transient message. */
  notice(text: string): void
  /** Set the canvas CSS cursor. */
  setCursor(cursor: string): void
  /** Open a vault path or URL in the current tab. */
  openLink(target: string): void
  /** Open the text/code-node editor. */
  editText(id: string): void
  /** Open the group-label editor. */
  editGroup(id: string): void
  /** Open the line-label editor. */
  editLine(id: string): void
  /** Open the note-link editor. */
  editNoteLink(id: string): void
  /** Open the context menu at a viewport point. */
  showContextMenu(clientX: number, clientY: number): void
  /** Run the export-as-text flow. */
  exportText(): void
}

/**
 * Perform every effect in order.
 * @param effects - kernel-reported effects.
 * @param sink - the adapter's handlers.
 */
export function executeEffects(effects: readonly PurControllerEffect[], sink: PurEffectSink): void {
  for (const effect of effects) {
    switch (effect.type) {
      case 'render':
        sink.render()
        break
      case 'save':
        sink.save()
        break
      case 'notice':
        sink.notice(effect.text)
        break
      case 'cursor':
        sink.setCursor(effect.cursor)
        break
      case 'open-link':
        sink.openLink(effect.target)
        break
      case 'edit-text':
        sink.editText(effect.id)
        break
      case 'edit-group':
        sink.editGroup(effect.id)
        break
      case 'edit-line':
        sink.editLine(effect.id)
        break
      case 'edit-note-link':
        sink.editNoteLink(effect.id)
        break
      case 'context-menu':
        sink.showContextMenu(effect.clientX, effect.clientY)
        break
      case 'export-text':
        sink.exportText()
        break
      default:
        assertNever(effect)
    }
  }
}

/** A world-space point, for menu commands that create elements. */
export interface PurMenuPoint {
  /** World x. */
  x: number
  /** World y. */
  y: number
}

/** Where an open request goes. */
export type PurOpenDestination = 'current' | 'new-tab' | 'right'

/** Host operations the menu model triggers that the kernel cannot perform. */
export interface PurMenuHost {
  /** Localized title of a code-node preset. @param presetId - the preset id. @returns the title. */
  presetTitle(presetId: string): string
  /** Create a fresh canvas document. */
  newCanvas(): void
  /** Open the note picker and insert a note-link card at the point. */
  addNoteLink(at: PurMenuPoint): void
  /** Import a local image file at the point. */
  importLocal(at: PurMenuPoint): void
  /** Import a YAML/IR file at the point. */
  importIr(at: PurMenuPoint): void
  /** Import a JSON Canvas file at the point. */
  importCanvas(at: PurMenuPoint): void
  /** Import from a remote URL at the point. */
  importNet(at: PurMenuPoint): void
  /** Save the document under a new name. */
  savePur(): void
  /** Export the canvas as a Markdown outline. */
  exportMarkdown(): void
  /** Generate runnable code. @param format - the target language. */
  generateCode(format: 'js' | 'py'): void
  /** Export a canvas bitmap. @param format - the image format. */
  exportImage(format: 'png' | 'jpg'): void
  /** Export a JSON Canvas document. */
  exportCanvasDocument(): void
  /** Toggle the popout window. */
  togglePopout(): void
  /** Toggle always-on-top. */
  togglePinTop(): void
  /** Open an element's link target. */
  openLink(target: string, destination: PurOpenDestination): void
  /** Copy the element's link or image source to the clipboard. */
  copyLinkOf(element: PurElement): void
  /** Reveal the element's target in the file explorer. */
  revealInExplorer(element: PurElement): void
  /** Embed the image element in the active markdown note. */
  embedInActiveNote(element: PurElement): void
  /** Prompt for the note an image or group links to; `modify` pre-fills. */
  promptElementLink(element: PurElement, mode: 'link' | 'modify'): void
  /** Open the text/code-node editor. */
  editText(id: string): void
  /** Open the group-label editor. */
  editGroup(id: string): void
  /** Open the line-label editor. */
  editLine(id: string): void
  /** Open the note-link editor. */
  editNoteLink(id: string): void
}

/** One dispatched menu action. */
export interface PurMenuAction {
  /** The entry id, including any `prefix:parameter` suffix. */
  id: string
  /** Menu origin in world coordinates, for creation commands. */
  world: PurMenuPoint
  /** Element the menu was opened on, when there is one. */
  targetId?: string
  /** Committed value, for the opacity entry. */
  value?: number
}

/** Entries that only open a submenu and never dispatch. */
const SUBMENU_PARENTS: ReadonlySet<string> = new Set(['code-node-root', 'import', 'save-export', 'gen-code', 'arrange', 'scale-uni', 'layer', 'del-in-pin', 'del-out-pin'])

/**
 * Dispatch a menu entry id: controller-owned commands run on the controller,
 * host-owned operations run on the host.
 * @param controller - the canvas controller.
 * @param host - host operations for the ids the kernel cannot perform.
 * @param action - the entry id plus its context.
 * @returns the effects the adapter must perform.
 * @throws {Error} when the id is unknown or a required target is missing.
 */
export function runMenuAction(controller: PurController, host: PurMenuHost, action: PurMenuAction): PurControllerEffect[] {
  const { id, world } = action
  if (SUBMENU_PARENTS.has(id) || id.startsWith('preset-cat:')) return []
  if (id.startsWith('preset:')) {
    const presetId = id.slice('preset:'.length)
    const preset = PUR_CODE_PRESETS.find((entry) => entry.id === presetId)
    if (preset === undefined) throw new Error(`unknown pur preset: ${presetId}`)
    return controller.addCodeNode(world.x, world.y, { inputs: preset.inputs, outputs: preset.outputs, code: preset.code, title: host.presetTitle(preset.id) })
  }
  if (id.startsWith('del-in-pin:')) return controller.removeInputPin(requireTarget(action), id.slice('del-in-pin:'.length))
  if (id.startsWith('del-out-pin:')) return controller.removeOutputPin(requireTarget(action), id.slice('del-out-pin:'.length))

  switch (id) {
    case 'new-text':
      return controller.addTextBlock(world.x, world.y)
    case 'add-in-pin':
      return controller.addInputPin(requireTarget(action))
    case 'add-out-pin':
      return controller.addOutputPin(requireTarget(action))
    case 'copy':
      return controller.copy()
    case 'duplicate':
      return controller.duplicate()
    case 'delete':
      return controller.deleteSelection()
    case 'ungroup':
      return controller.ungroup()
    case 'connect':
      return controller.connect()
    case 'group':
      return controller.group()
    case 'arrange-auto':
      return controller.arrange()
    case 'align-top':
      return controller.align('top')
    case 'align-left':
      return controller.align('left')
    case 'align-center':
      return controller.align('center')
    case 'dist-h':
      return controller.align('distribute-h')
    case 'same-height':
      return controller.scaleUniform('height')
    case 'same-width':
      return controller.scaleUniform('width')
    case 'bring-to-front':
      return controller.bringToFront()
    case 'bring-forward':
      return controller.bringForward()
    case 'send-backward':
      return controller.sendBackward()
    case 'send-to-back':
      return controller.sendToBack()
    case 'opacity':
      if (action.value === undefined) throw new Error('pur menu action opacity requires a value')
      return controller.setOpacity(action.value, 'commit')
    case 'toggle-lock':
      return controller.toggleLock()
    case 'fit-view':
      return controller.fitToView()
    case 'unlink-note':
      return unlinkNote(controller, requireTarget(action))
    case 'edit': {
      const element = requireElement(controller, action)
      if (element.type === 'text' || element.type === 'code-node') host.editText(element.id)
      else if (element.type === 'note-link') host.editNoteLink(element.id)
      return []
    }
    case 'edit-label':
      host.editGroup(requireTarget(action))
      return []
    case 'edit-line':
      host.editLine(requireTarget(action))
      return []
    case 'edit-note-link':
      host.editNoteLink(requireTarget(action))
      return []
    case 'open':
    case 'open-new-tab':
    case 'open-right': {
      const target = openTarget(requireElement(controller, action))
      if (target !== null) host.openLink(target, id === 'open' ? 'current' : id === 'open-new-tab' ? 'new-tab' : 'right')
      return []
    }
    case 'copy-link':
      host.copyLinkOf(requireElement(controller, action))
      return []
    case 'reveal':
      host.revealInExplorer(requireElement(controller, action))
      return []
    case 'embed-note':
      host.embedInActiveNote(requireElement(controller, action))
      return []
    case 'link-note':
      host.promptElementLink(requireElement(controller, action), 'link')
      return []
    case 'mod-link-note':
      host.promptElementLink(requireElement(controller, action), 'modify')
      return []
    case 'new-canvas':
      host.newCanvas()
      return []
    case 'add-note-link':
      host.addNoteLink(world)
      return []
    case 'import-local':
      host.importLocal(world)
      return []
    case 'import-ir':
      host.importIr(world)
      return []
    case 'import-canvas':
      host.importCanvas(world)
      return []
    case 'import-net':
      host.importNet(world)
      return []
    case 'save-pur':
      host.savePur()
      return []
    case 'export-md':
      host.exportMarkdown()
      return []
    case 'gen-js':
      host.generateCode('js')
      return []
    case 'gen-py':
      host.generateCode('py')
      return []
    case 'export-png':
      host.exportImage('png')
      return []
    case 'export-jpg':
      host.exportImage('jpg')
      return []
    case 'export-canvas':
      host.exportCanvasDocument()
      return []
    case 'popout':
      host.togglePopout()
      return []
    case 'pin-top':
      host.togglePinTop()
      return []
    default:
      throw new Error(`unknown pur menu action: ${id}`)
  }
}

/** The action's target id, or throw when the entry requires one. */
function requireTarget(action: PurMenuAction): string {
  if (action.targetId === undefined) throw new Error(`pur menu action ${action.id} requires a target`)
  return action.targetId
}

/** Resolve the action's target element, or throw when absent. */
function requireElement(controller: PurController, action: PurMenuAction): PurElement {
  const site = findElement(controller.state.elements, requireTarget(action))
  if (site === null) throw new Error(`pur menu action ${action.id} target not found: ${action.targetId ?? ''}`)
  return site.element
}

/** What double-clicking or opening an element navigates to, when anything. */
function openTarget(element: PurElement): string | null {
  if (element.type === 'note-link') return element.link !== '' ? element.link : null
  if (element.type === 'image') {
    if (element.link !== undefined) return element.link
    return element.original !== '' ? element.original : null
  }
  if (element.type === 'group') return element.link ?? null
  return null
}

/** Detach an image or group from its note, the upstream unlink behaviour. */
function unlinkNote(controller: PurController, elementId: string): PurControllerEffect[] {
  const site = findElement(controller.state.elements, elementId)
  if (site === null) return []
  const element = site.element
  if (element.type === 'image' || element.type === 'group') delete element.link
  pushHistory(controller.history, controller.state.elements)
  return [{ type: 'save' }, { type: 'render' }]
}

/** Exhaustiveness guard for the effect union. */
function assertNever(value: never): never {
  throw new Error(`unhandled pur effect: ${JSON.stringify(value)}`)
}
