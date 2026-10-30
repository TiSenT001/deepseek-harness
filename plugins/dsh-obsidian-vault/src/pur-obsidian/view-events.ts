/**
 * Canvas DOM-event wiring: pointer, wheel, keyboard, paste and drop events
 * become kernel calls whose effects drain into the view's sink. The wheel
 * listener is non-passive so zoom never scrolls the workspace.
 * @module dsh-obsidian-vault/pur-obsidian/view-events
 */
import { screenToWorld } from '../pur-kernel/index.ts'
import type { PurPointerEvent, PurWheelEvent } from '../pur-kernel/index.ts'
import { handleDrop, handlePaste } from './paste-drop.ts'
import { viewInsertHost } from './view-hosts.ts'
import type { PurStudioView } from './view.ts'

/** The kernel pointer event for a DOM event, with the canvas origin resolved. */
function pointerEvent(canvas: HTMLCanvasElement, event: MouseEvent): PurPointerEvent {
  const rect = canvas.getBoundingClientRect()
  return {
    clientX: event.clientX,
    clientY: event.clientY,
    rectLeft: rect.left,
    rectTop: rect.top,
    button: event.button,
    ctrlKey: event.ctrlKey,
    metaKey: event.metaKey,
    shiftKey: event.shiftKey,
  }
}

/** The kernel wheel event for a DOM event, with the canvas origin resolved. */
function wheelEvent(canvas: HTMLCanvasElement, event: WheelEvent): PurWheelEvent {
  const rect = canvas.getBoundingClientRect()
  return { clientX: event.clientX, clientY: event.clientY, rectLeft: rect.left, rectTop: rect.top, deltaY: event.deltaY }
}

/**
 * Attach every canvas event listener.
 * @param view - the canvas view.
 * @param canvas - the canvas to wire.
 */
export function wirePurCanvas(view: PurStudioView, canvas: HTMLCanvasElement): void {
  canvas.addEventListener('pointerdown', (event) => {
    canvas.setPointerCapture(event.pointerId)
    canvas.focus()
    const controller = view.controllerOrNull()
    if (controller !== null) view.runEffects(controller.pointerDown(pointerEvent(canvas, event)))
  })
  canvas.addEventListener('pointermove', (event) => {
    const controller = view.controllerOrNull()
    if (controller !== null) view.runEffects(controller.pointerMove(pointerEvent(canvas, event)))
  })
  canvas.addEventListener('pointerup', (event) => {
    const controller = view.controllerOrNull()
    if (controller !== null) view.runEffects(controller.pointerUp(pointerEvent(canvas, event)))
  })
  canvas.addEventListener(
    'wheel',
    (event) => {
      event.preventDefault()
      const controller = view.controllerOrNull()
      if (controller !== null) view.runEffects(controller.wheel(wheelEvent(canvas, event)))
    },
    { passive: false },
  )
  canvas.addEventListener('dblclick', (event) => {
    const controller = view.controllerOrNull()
    if (controller !== null) view.runEffects(controller.doubleClick(pointerEvent(canvas, event)))
  })
  canvas.addEventListener('contextmenu', (event) => event.preventDefault())
  canvas.addEventListener('keydown', (event) => {
    const controller = view.controllerOrNull()
    if (controller === null) return
    const result = controller.keyDown({ key: event.key, ctrlKey: event.ctrlKey, metaKey: event.metaKey })
    if (!result.handled) return
    event.preventDefault()
    view.runEffects(result.effects)
  })
  canvas.addEventListener('paste', (event) => {
    const controller = view.controllerOrNull()
    if (controller !== null) void handlePaste(viewInsertHost(view), event, controller.canvasCentreWorld())
  })
  canvas.addEventListener('dragover', (event) => event.preventDefault())
  canvas.addEventListener('drop', (event) => {
    const controller = view.controllerOrNull()
    if (controller === null) return
    const rect = canvas.getBoundingClientRect()
    void handleDrop(viewInsertHost(view), event, screenToWorld(controller.state.view, event.clientX - rect.left, event.clientY - rect.top))
  })
}
