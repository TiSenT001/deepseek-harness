/**
 * The Pur canvas controller: a host-neutral state machine that turns pointer,
 * wheel and keyboard events into element mutations plus adapter effects, and
 * exposes every toolbar/menu command. Compose with the pure modules; this
 * class only wires them to shared state.
 *
 * This is the one file exempt from the 300-line budget (see PLAN §7): it
 * aggregates 49 public methods, nearly all one-line forwards into the
 * `controller-*` modules. Splitting it would need prototype mixing or a state
 * object layer, which lengthens the call chain without removing logic. New
 * behavior belongs in those modules; this class only wires them up.
 * @module dsh-obsidian-vault/pur-kernel/controller
 */
import {
  alignElements,
  arrangeElements,
  connectSelected,
  deleteSelected,
  scaleElements,
} from './controller-commands.ts'
import {
  bringForward,
  bringToFront,
  resetTransform,
  sendBackward,
  sendToBack,
  setSelectionLocked,
  setSelectionOpacity,
  toggleLock,
} from './controller-layers.ts'
import { fitToView, resetZoom, selectAll, zoomByStep } from './controller-view.ts'
import { autoPanStep } from './controller-autopan.ts'
import { cancelGesture } from './controller-cancel.ts'
import { NUDGE_STEP, NUDGE_STEP_LARGE, nudgeSelection } from './controller-nudge.ts'
import {
  addCodeNode,
  addTextBlock,
  commitCodeNode,
  commitTextEdit,
  deleteElementWithLines,
} from './controller-edits.ts'
import {
  copySelected,
  cutSelected,
  duplicateSelected,
  groupSelected,
  pasteClipboard,
  ungroupSelected,
} from './controller-clipboard.ts'
import { addInputPin, addOutputPin, removeInputPin, removeOutputPin } from './controller-pins.ts'
import { updateElementProps } from './controller-props.ts'
import { contextMenuModel } from './controller-menu.ts'
import { pointerDown, pointerMove, pointerUp } from './controller-pointer.ts'
import { momentumStep, wheel } from './controller-gestures.ts'
import { applyNoteRaw } from './note-raw.ts'
import { elementAt } from './hit-test.ts'
import { createHistory, pushHistory, redoHistory, undoHistory } from './history.ts'
import type { PurAlignMode } from './controller-commands.ts'
import type { PurCodeNodeCommit, PurCodeNodeDraft } from './controller-edits.ts'
import type { PurElementPatch } from './controller-props.ts'
import type {
  PurControllerEffect,
  PurControllerEnv,
  PurControllerLabels,
  PurControllerState,
  PurControllerTools,
  PurHistory,
  PurKeyEvent,
  PurMenuContext,
  PurMenuModel,
  PurPointerEvent,
  PurWheelEvent,
} from './controller-types.ts'
import type { PurNoteRawOptions } from './note-raw.ts'
import type { PurPinDragPreview } from './render-types.ts'
import type { PurElement, PurNoteLinkElement, PurViewState } from './types.ts'

/** Result of a key press: whether the adapter should `preventDefault`. */
export interface PurKeyResult {
  /** True when the key was consumed. */
  handled: boolean
  /** The effects the key produced. */
  effects: PurControllerEffect[]
}

/**
 * The host-neutral Pur canvas controller.
 */
export class PurController {
  /** Shared tool bundle handed to every module function. */
  private readonly tools: PurControllerTools

  /**
   * Create a controller over an optional initial document.
   * @param env - adapter-supplied environment.
   * @param labels - adapter-supplied display copy.
   * @param elements - initial top-level elements.
   * @param view - initial pan and zoom.
   */
  constructor(env: PurControllerEnv, labels: PurControllerLabels, elements: PurElement[] = [], view: PurViewState = { offsetX: 0, offsetY: 0, scale: 1 }) {
    this.tools = {
      state: {
        elements,
        view,
        selectedIds: new Set<string>(),
        hoveredLineId: null,
        hoverPin: null,
        selectionRect: null,
        pinDrag: null,
        lastMouse: { x: 0, y: 0 },
        lastLocal: { x: 0, y: 0 },
        selectionBefore: null,
        panStart: null,
        nudgeAt: null,
        panning: false,
        selecting: false,
        dragging: false,
        dragStart: null,
        resizing: false,
        resize: null,
        panVel: { x: 0, y: 0 },
        rightClickStart: null,
        showZoomUntil: null,
        clipboard: [],
        lockPulseIds: new Set<string>(),
      },
      history: createHistory(),
      env,
      labels,
    }
  }

  /** The mutable state the adapter renders from. */
  get state(): PurControllerState {
    return this.tools.state
  }

  /** The undo/redo stack the adapter reflects in its UI. */
  get history(): PurHistory {
    return this.tools.history
  }

  /** Forward a pointer press. @param event - the pointer event. @returns the effects. */
  pointerDown(event: PurPointerEvent): PurControllerEffect[] {
    return pointerDown(this.tools, event)
  }

  /** Forward pointer motion. @param event - the pointer event. @returns the effects. */
  pointerMove(event: PurPointerEvent): PurControllerEffect[] {
    return pointerMove(this.tools, event)
  }

  /** Forward a pointer release. @param event - the pointer event. @returns the effects. */
  pointerUp(event: PurPointerEvent): PurControllerEffect[] {
    return pointerUp(this.tools, event)
  }

  /** Forward a wheel event. @param event - the wheel event. @returns the effects. */
  wheel(event: PurWheelEvent): PurControllerEffect[] {
    return wheel(this.tools, event)
  }

  /**
   * One momentum frame; `pointerUp` runs the first frame synchronously and
   * the adapter drives the rest from its animation frame.
   * @returns true while the pan velocity survives.
   */
  momentumStep(): boolean {
    return momentumStep(this.tools)
  }

  /** The pin-drag preview for the renderer, in the scene's shape. @returns the preview, or null. */
  pinDragPreview(): PurPinDragPreview | null {
    const drag = this.tools.state.pinDrag
    if (drag === null) return null
    const preview: PurPinDragPreview = { mode: drag.dragMode ?? 'new', pointerX: drag.mouseScreenX, pointerY: drag.mouseScreenY }
    if (drag.fromNodeId !== null && drag.fromPinId !== null) preview.from = { nodeId: drag.fromNodeId, pinId: drag.fromPinId }
    if (drag.toNodeId !== undefined && drag.toPinId !== undefined) preview.to = { nodeId: drag.toNodeId, pinId: drag.toPinId }
    return preview
  }

  /**
   * Advance one auto-pan frame while a drag or a rubber band is in flight.
   * @returns the effects, empty when the pointer is away from the edges.
   */
  autoPanStep(): PurControllerEffect[] {
    return autoPanStep(this.tools)
  }

  /**
   * Forward a key press.
   * @param event - the key event.
   * @returns whether the key was consumed, and its effects.
   */
  keyDown(event: PurKeyEvent): PurKeyResult {
    const { state, labels } = this.tools
    if (this.tools.env.hasOpenDialog()) return { handled: false, effects: [] }
    const ctrl = event.ctrlKey || event.metaKey
    // Escape backs out of whatever is in flight; the menu and editors handle their
    // own dismissal before the canvas ever sees the key.
    if (event.key === 'Escape') {
      const effects = cancelGesture(this.tools)
      return effects === undefined ? { handled: false, effects: [] } : { handled: true, effects }
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      if (state.selectedIds.size === 0) return { handled: false, effects: [] }
      const step = event.shiftKey === true ? NUDGE_STEP_LARGE : NUDGE_STEP
      const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0
      const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0
      return { handled: true, effects: nudgeSelection(this.tools, dx, dy) }
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (state.selectedIds.size === 0) return { handled: false, effects: [] }
      return { handled: true, effects: deleteSelected(this.tools) }
    }
    if (ctrl && event.key === 'z') {
      const effects = this.undo()
      return effects.length === 0 ? { handled: false, effects: [] } : { handled: true, effects }
    }
    if (ctrl && event.key === 'y') {
      const effects = this.redo()
      return effects.length === 0 ? { handled: false, effects: [] } : { handled: true, effects }
    }
    if (ctrl && event.key === 'a') return { handled: true, effects: selectAll(state) }
    if (ctrl && event.key === 'c') return { handled: true, effects: copySelected(this.tools) }
    if (ctrl && event.key === 'v') return { handled: true, effects: pasteClipboard(this.tools) }
    if (ctrl && event.key === 'g') return { handled: true, effects: groupSelected(this.tools) }
    if (ctrl && (event.key === 'G' || (event.shiftKey === true && event.key === 'g'))) {
      return { handled: true, effects: this.ungroup() }
    }
    if (ctrl && event.key === 'x') return { handled: true, effects: cutSelected(this.tools) }
    if (ctrl && event.key === 'd') return { handled: true, effects: this.duplicate() }
    if (!ctrl && (event.key === '0' || event.key === ')' || event.key === 'Insert')) {
      return { handled: true, effects: resetZoom(this.tools) }
    }
    if (!ctrl && (event.key === '+' || event.key === '=')) return { handled: true, effects: zoomByStep(this.tools, 1.15) }
    if (!ctrl && (event.key === '-' || event.key === '_')) return { handled: true, effects: zoomByStep(this.tools, 0.85) }
    if (ctrl && event.key === 's') return { handled: true, effects: [{ type: 'save' }, { type: 'notice', text: labels.saved }] }
    if (ctrl && event.key === 'm') return { handled: true, effects: [{ type: 'export-text' }] }
    if (event.key === 'f' && !event.ctrlKey && !event.metaKey) return { handled: true, effects: fitToView(this.tools) }
    return { handled: false, effects: [] }
  }

  /**
   * Forward a double click: empty canvas adds a text block, otherwise the
   * element's editor or link opens.
   * @param event - the pointer event.
   * @returns the effects.
   */
  doubleClick(event: PurPointerEvent): PurControllerEffect[] {
    const { state, labels } = this.tools
    const worldX = (event.clientX - event.rectLeft - state.view.offsetX) / state.view.scale
    const worldY = (event.clientY - event.rectTop - state.view.offsetY) / state.view.scale
    const element = elementAtForClick(state, worldX, worldY)
    if (element === null) return addTextBlock(this.tools, worldX, worldY)
    if (element.locked === true) return [{ type: 'notice', text: labels.lockedNotice }]
    if (element.type === 'text' || element.type === 'code-node') return [{ type: 'edit-text', id: element.id }]
    if (element.type === 'group') return [{ type: 'edit-group', id: element.id }]
    if (element.type === 'line') return [{ type: 'edit-line', id: element.id }]
    if (element.type === 'image') {
      if (element.link !== undefined) return [{ type: 'open-link', target: element.link }]
      if (element.original !== '') return [{ type: 'open-link', target: element.original }]
      return []
    }
    if (element.type === 'note-link' && element.link !== '') return [{ type: 'open-link', target: element.link }]
    return []
  }

  /**
   * Build the context menu model for a canvas point.
   * @param canvasX - menu x in canvas pixels.
   * @param canvasY - menu y in canvas pixels.
   * @param context - host facts the menu branches on.
   * @returns the model, plus a render effect when the selection moved.
   */
  contextMenu(canvasX: number, canvasY: number, context: PurMenuContext): { model: PurMenuModel; effects: PurControllerEffect[] } {
    return contextMenuModel(this.tools.state, canvasX, canvasY, context)
  }

  /** Align the selection. @param type - the mode. @returns the effects. */
  align(type: PurAlignMode): PurControllerEffect[] {
    return alignElements(this.tools, type)
  }

  /** Match the selection's width or height. @param type - the dimension. @returns the effects. */
  scaleUniform(type: 'width' | 'height'): PurControllerEffect[] {
    return scaleElements(this.tools, type)
  }

  /** Pack the selection (or canvas) into rows and fit the view. @returns the effects. */
  arrange(): PurControllerEffect[] {
    return arrangeElements(this.tools)
  }

  /** Connect exactly two selected elements. @returns the effects. */
  connect(): PurControllerEffect[] {
    return connectSelected(this.tools)
  }

  /** Delete the selection and its lines. @returns the effects. */
  deleteSelection(): PurControllerEffect[] {
    return deleteSelected(this.tools)
  }

  /** Copy the selection into the internal clipboard. @returns the effects. */
  copy(): PurControllerEffect[] {
    return copySelected(this.tools)
  }

  /** Paste the internal clipboard. @param worldX - paste x. @param worldY - paste y. @returns the effects. */
  paste(worldX?: number, worldY?: number): PurControllerEffect[] {
    return pasteClipboard(this.tools, worldX, worldY)
  }

  /** Duplicate the selection 30 units down-right. @returns the effects. */
  duplicate(): PurControllerEffect[] {
    return duplicateSelected(this.tools)
  }

  /** Group the selected non-line elements. @returns the effects. */
  group(): PurControllerEffect[] {
    return groupSelected(this.tools)
  }

  /** Dissolve the selected groups. @returns the effects. */
  ungroup(): PurControllerEffect[] {
    return ungroupSelected(this.tools)
  }

  /** Move the selection to the top. @returns the effects. */
  bringToFront(): PurControllerEffect[] {
    return bringToFront(this.tools)
  }

  /** Move the selection to the bottom. @returns the effects. */
  sendToBack(): PurControllerEffect[] {
    return sendToBack(this.tools)
  }

  /** Swap the selection one layer up. @returns the effects. */
  bringForward(): PurControllerEffect[] {
    return bringForward(this.tools)
  }

  /** Swap the selection one layer down. @returns the effects. */
  sendBackward(): PurControllerEffect[] {
    return sendBackward(this.tools)
  }

  /** Reset rotation and flips. @returns the effects. */
  resetTransform(): PurControllerEffect[] {
    return resetTransform(this.tools)
  }

  /** Toggle each selected element's lock. @returns the effects. */
  toggleLock(): PurControllerEffect[] {
    return toggleLock(this.tools)
  }

  /** Lock or unlock the whole selection, the menu behaviour. @param locked - the state to apply. @returns the effects. */
  setLocked(locked: boolean): PurControllerEffect[] {
    return setSelectionLocked(this.tools, locked)
  }

  /** Set the selection's opacity. @param value - 0–1. @param mode - preview or commit. @returns the effects. */
  setOpacity(value: number, mode: 'preview' | 'commit'): PurControllerEffect[] {
    return setSelectionOpacity(this.tools, value, mode)
  }

  /** Select every top-level element. @returns the effects. */
  selectAll(): PurControllerEffect[] {
    return selectAll(this.tools.state)
  }

  /**
   * Step one history snapshot back, clearing the selection; the command entry
   * behind Ctrl+Z.
   * @returns the effects, empty at the stack bottom.
   */
  undo(): PurControllerEffect[] {
    const elements = undoHistory(this.tools.history)
    if (elements === null) return []
    this.tools.state.elements = elements
    this.tools.state.selectedIds.clear()
    return [{ type: 'save' }, { type: 'render' }]
  }

  /**
   * Step one history snapshot forward, clearing the selection; the command
   * entry behind Ctrl+Y.
   * @returns the effects, empty at the stack top.
   */
  redo(): PurControllerEffect[] {
    const elements = redoHistory(this.tools.history)
    if (elements === null) return []
    this.tools.state.elements = elements
    this.tools.state.selectedIds.clear()
    return [{ type: 'save' }, { type: 'render' }]
  }

  /** Fit the view to the selection or canvas. @returns the effects. */
  fitToView(): PurControllerEffect[] {
    return fitToView(this.tools)
  }

  /** Add a text block. @param worldX - x. @param worldY - y. @returns the effects. */
  addTextBlock(worldX: number, worldY: number): PurControllerEffect[] {
    return addTextBlock(this.tools, worldX, worldY)
  }

  /** Add a code node from a preset. @param worldX - x. @param worldY - y. @param draft - the preset fields. @returns the effects. */
  addCodeNode(worldX: number, worldY: number, draft: PurCodeNodeDraft): PurControllerEffect[] {
    return addCodeNode(this.tools, worldX, worldY, draft)
  }

  /** Add an input pin. @param elementId - the element. @returns the effects. */
  addInputPin(elementId: string): PurControllerEffect[] {
    return addInputPin(this.tools, elementId)
  }

  /** Add an output pin. @param elementId - the element. @returns the effects. */
  addOutputPin(elementId: string): PurControllerEffect[] {
    return addOutputPin(this.tools, elementId)
  }

  /** Remove an input pin and its lines. @param elementId - the element. @param pinId - the pin. @returns the effects. */
  removeInputPin(elementId: string, pinId: string): PurControllerEffect[] {
    return removeInputPin(this.tools, elementId, pinId)
  }

  /** Remove an output pin and its lines. @param elementId - the element. @param pinId - the pin. @returns the effects. */
  removeOutputPin(elementId: string, pinId: string): PurControllerEffect[] {
    return removeOutputPin(this.tools, elementId, pinId)
  }

  /** Commit the code-node editor. @param nodeId - the node. @param draft - the fields. @returns the effects. */
  commitCodeNode(nodeId: string, draft: PurCodeNodeCommit): PurControllerEffect[] {
    return commitCodeNode(this.tools, nodeId, draft)
  }

  /** Delete an element and its lines, the editor's delete. @param elementId - the element. @returns the effects. */
  deleteElement(elementId: string): PurControllerEffect[] {
    return deleteElementWithLines(this.tools, elementId)
  }

  /** Commit the text editor. @param elementId - the element. @param content - the body. @param title - the title. @returns the effects. */
  commitTextEdit(elementId: string, content: string, title?: string): PurControllerEffect[] {
    return commitTextEdit(this.tools, elementId, content, title)
  }

  /**
   * Apply an editor dialog's committed fields to one element.
   * @param elementId - the element.
   * @param patch - the committed fields; only those its kind carries apply.
   * @returns the effects.
   */
  updateElement(elementId: string, patch: PurElementPatch): PurControllerEffect[] {
    return updateElementProps(this.tools, elementId, patch)
  }

  /**
   * Insert a 300x200 image card.
   * @param worldX - x. @param worldY - y. @param original - vault path or URL. @param dataURL - inline data, when imported.
   * @returns the effects.
   */
  insertImage(worldX: number, worldY: number, original: string, dataURL?: string, thumb?: string): PurControllerEffect[] {
    this.tools.state.elements.push({ id: this.tools.env.createId(), type: 'image', x: worldX, y: worldY, w: 300, h: 200, original, dataURL, ...(thumb === undefined ? {} : { thumb }), rotation: 0, opacity: 1 })
    pushSnapshot(this.tools)
    return [{ type: 'save' }, { type: 'render' }]
  }

  /**
   * Insert a note-link card, hydrating pins and content from raw note text.
   * @param worldX - x. @param worldY - y. @param link - vault path or URL. @param content - card text.
   * @param raw - note text when the adapter resolved it. @param options - the hydration variant. @param size - card size, default 280x80.
   * @returns the effects.
   */
  insertNoteLink(worldX: number, worldY: number, link: string, content: string, raw?: string, options?: PurNoteRawOptions, size: { w: number; h: number } = { w: 280, h: 80 }): PurControllerEffect[] {
    const element: PurNoteLinkElement = { id: this.tools.env.createId(), type: 'note-link', x: worldX, y: worldY, w: size.w, h: size.h, content, link, rotation: 0, opacity: 1 }
    if (raw !== undefined && options !== undefined) applyNoteRaw(element, raw, options)
    this.tools.state.elements.push(element)
    pushSnapshot(this.tools)
    return [{ type: 'save' }, { type: 'render' }]
  }

  /**
   * Insert a text card with a classified size.
   * @param worldX - x. @param worldY - y. @param content - the text. @param spec - width, height and background.
   * @returns the effects.
   */
  insertText(worldX: number, worldY: number, content: string, spec: { w: number; h: number; bgColor: string }): PurControllerEffect[] {
    this.tools.state.elements.push({ id: this.tools.env.createId(), type: 'text', x: worldX, y: worldY, w: spec.w, h: spec.h, content, bgColor: spec.bgColor, color: '#e0e0e0', fontSize: 14, rotation: 0, opacity: 1 })
    pushSnapshot(this.tools)
    return [{ type: 'save' }, { type: 'render' }]
  }

  /** The world point at the canvas centre, upstream's paste position. @returns the point. */
  canvasCentreWorld(): { x: number; y: number } {
    const { view } = this.tools.state
    return { x: (this.tools.env.canvasWidth / 2 - view.offsetX) / view.scale, y: (this.tools.env.canvasHeight / 2 - view.offsetY) / view.scale }
  }
}

/** Hit-test a double click. */
function elementAtForClick(state: PurControllerState, worldX: number, worldY: number): PurElement | null {
  return elementAt(state.elements, worldX, worldY, state.view.scale)
}

/** Push a history snapshot for the insertion helpers. */
function pushSnapshot(tools: PurControllerTools): void {
  pushHistory(tools.history, tools.state.elements)
}
