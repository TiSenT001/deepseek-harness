/**
 * Pointer dispatch: press, motion and release. The three entry points turn
 * raw events into state mutations and effects; the subroutines they share live
 * in `controller-gestures`.
 * @module dsh-obsidian-vault/pur-kernel/controller-pointer
 */
import { findElement, screenToWorld, worldRect } from './geometry.ts'
import { handlePositions, RESIZE_HANDLES, resizeRect, type PurResizeHandle } from './resize-handles.ts'
import { elementAt, lineEndpointAt, pinAt } from './hit-test.ts'
import { pushHistory } from './history.ts'
import { finishPinDrag, local, momentumStep, reparentDragged } from './controller-gestures.ts'
import type { PurControllerEffect, PurControllerTools, PurPointerEvent } from './controller-types.ts'
import type { PurElement } from './types.ts'

/**
 * Handle a pointer press: pin drags first, then resize handles, then element
 * selection or rubber-band selection, and panning on middle/right buttons.
 * @param tools - shared controller tools.
 * @param event - the pointer event.
 * @returns the effects, empty while a dialog is open.
 */
export function pointerDown(tools: PurControllerTools, event: PurPointerEvent): PurControllerEffect[] {
  const { state } = tools
  if (tools.env.hasOpenDialog()) return []
  const { sx, sy } = local(event)
  const world = screenToWorld(state.view, sx, sy)
  state.lastMouse = { x: event.clientX, y: event.clientY }

  const clickedPin = pinAt(state.elements, world.x, world.y, state.view.scale)
  const clickedEndpoint = lineEndpointAt(state.elements, world.x, world.y, state.view.scale)

  if (clickedPin !== null && event.button === 0 && clickedPin.isOutput) {
    state.pinDrag = { fromNodeId: clickedPin.nodeId, fromPinId: clickedPin.pinId, mouseScreenX: sx, mouseScreenY: sy, lineId: null }
    return [{ type: 'cursor', cursor: 'crosshair' }, { type: 'render' }]
  }

  if (clickedEndpoint !== null && event.button === 0) {
    const line = state.elements.find((el) => el.id === clickedEndpoint.lineId)
    if (line !== undefined && line.type === 'line') {
      if (clickedEndpoint.isFrom) {
        state.pinDrag = { fromNodeId: null, fromPinId: null, toNodeId: line.to, toPinId: line.toPin, mouseScreenX: sx, mouseScreenY: sy, lineId: line.id, dragMode: 'relink-from' }
      } else {
        state.pinDrag = { fromNodeId: line.from, fromPinId: line.fromPin ?? null, mouseScreenX: sx, mouseScreenY: sy, lineId: line.id, dragMode: 'relink-to' }
      }
      return [{ type: 'cursor', cursor: 'crosshair' }, { type: 'render' }]
    }
  }

  for (const id of state.selectedIds) {
    const site = findElement(state.elements, id)
    const element = site?.element
    if (site === null || element === undefined || element.locked || element.type === 'line') continue
    const rect = {
      x: element.x + site.parentX,
      y: element.y + site.parentY,
      w: element.w ?? 0,
      h: element.h ?? 0,
    }
    const tolerance = 9 / state.view.scale
    const points = handlePositions(rect)
    for (const handle of RESIZE_HANDLES) {
      const point = points[handle]
      if (Math.abs(world.x - point.x) > tolerance || Math.abs(world.y - point.y) > tolerance) continue
      state.resizing = true
      state.resize = {
        elementId: element.id,
        handle,
        startX: event.clientX,
        startY: event.clientY,
        w: rect.w,
        h: rect.h,
        parentX: site.parentX,
        parentY: site.parentY,
      }
      return [{ type: 'cursor', cursor: cursorForHandle(handle) }]
    }
  }

  const element = elementAt(state.elements, world.x, world.y, state.view.scale)
  if (event.button === 0) {
    if (element !== null) {
      if (event.ctrlKey || event.metaKey) {
        if (state.selectedIds.has(element.id)) state.selectedIds.delete(element.id)
        else state.selectedIds.add(element.id)
      } else {
        if (!state.selectedIds.has(element.id)) {
          state.selectedIds.clear()
          state.selectedIds.add(element.id)
        }
        if (element.type === 'line') return [{ type: 'edit-line', id: element.id }]
        state.dragging = true
        state.dragStart = {
          clientX: event.clientX,
          clientY: event.clientY,
          elements: [...state.selectedIds].map((id) => {
            const site = findElement(state.elements, id)
            if (site === null) return null
            return { id: site.element.id, x: (site.element.x ?? NaN) + site.parentX, y: (site.element.y ?? NaN) + site.parentY, parentX: site.parentX, parentY: site.parentY }
          }),
        }
      }
    } else {
      if (!event.shiftKey && !event.ctrlKey && !event.metaKey) state.selectedIds.clear()
      state.selecting = true
      state.selectionRect = { x: sx, y: sy, w: 0, h: 0 }
    }
  } else if (event.button === 1 || event.button === 2) {
    state.rightClickStart = { x: event.clientX, y: event.clientY }
    state.panning = true
  }
  return [{ type: 'render' }]
}

/**
 * Handle pointer motion: pin-drag previews, pin and line hover, panning,
 * resizing, element drags and rubber-band updates.
 * @param tools - shared controller tools.
 * @param event - the pointer event.
 * @returns the effects, in upstream call order.
 */
export function pointerMove(tools: PurControllerTools, event: PurPointerEvent): PurControllerEffect[] {
  const { state } = tools
  const effects: PurControllerEffect[] = []
  const dx = event.clientX - state.lastMouse.x
  const dy = event.clientY - state.lastMouse.y
  state.lastMouse = { x: event.clientX, y: event.clientY }
  const { sx, sy } = local(event)
  const world = screenToWorld(state.view, sx, sy)

  if (state.pinDrag !== null) {
    state.pinDrag.mouseScreenX = sx
    state.pinDrag.mouseScreenY = sy
    const hovered = pinAt(state.elements, world.x, world.y, state.view.scale)
    if (state.pinDrag.dragMode === 'relink-from') state.hoverPin = hovered !== null && hovered.isOutput ? hovered : null
    else state.hoverPin = hovered !== null && !hovered.isOutput ? hovered : null
    return [{ type: 'render' }]
  }

  const hovered = pinAt(state.elements, world.x, world.y, state.view.scale)
  const current = state.hoverPin
  const changed = (hovered !== null && current === null) || (hovered === null && current !== null) ||
    (hovered !== null && current !== null && (hovered.nodeId !== current.nodeId || hovered.pinId !== current.pinId))
  if (changed) {
    state.hoverPin = hovered
    effects.push({ type: 'cursor', cursor: hovered !== null ? 'pointer' : 'default' }, { type: 'render' })
  }

  if (!state.panning && !state.dragging && !state.resizing && hovered === null) {
    let nearest: string | null = null
    let nearestDistance = 30 / (state.view.scale || 1)
    const lines: PurElement[] = []
    const collect = (elements: readonly PurElement[]): void => {
      for (const element of elements) {
        if (element.type === 'line') lines.push(element)
        if (element.type === 'group') collect(element.children)
      }
    }
    collect(state.elements)
    for (const line of lines) {
      if (line.type !== 'line') continue
      const from = worldRect(state.elements, line.from)
      const to = worldRect(state.elements, line.to)
      if (from === null || to === null) continue
      const cx1 = from.x + from.w / 2
      const cy1 = from.y + from.h / 2
      const cx2 = to.x + to.w / 2
      const cy2 = to.y + to.h / 2
      for (let t = 0; t <= 1; t += 0.05) {
        const bx = cx1 + (cx2 - cx1) * t
        const by = cy1 + (cy2 - cy1) * t
        const distance = Math.sqrt((world.x - bx) ** 2 + (world.y - by) ** 2)
        if (distance < nearestDistance) { nearest = line.id; nearestDistance = distance }
      }
    }
    if (state.hoveredLineId !== nearest) {
      state.hoveredLineId = nearest
      effects.push({ type: 'render' })
    }
  }

  if (state.panning) {
    state.panVel = { x: dx, y: dy }
    state.view.offsetX += dx
    state.view.offsetY += dy
    effects.push({ type: 'render' })
  } else if (state.resizing && state.resize !== null) {
    const site = findElement(state.elements, state.resize.elementId)
    if (site !== null && site.element.type !== 'line') {
      const moveX = (event.clientX - state.resize.startX) / state.view.scale
      const moveY = (event.clientY - state.resize.startY) / state.view.scale
      const start = {
        x: site.element.x,
        y: site.element.y,
        w: state.resize.w,
        h: state.resize.h,
      }
      // Images keep their ratio on corner drags; cards resize freely.
      const aspect = site.element.type === 'image' && state.resize.h > 0
        ? state.resize.w / state.resize.h
        : undefined
      const next = resizeRect(state.resize.handle, start, moveX, moveY, aspect)
      site.element.x = next.x
      site.element.y = next.y
      site.element.w = next.w
      site.element.h = next.h
    }
    effects.push({ type: 'render' })
  } else if (state.dragging && state.dragStart !== null) {
    const moveX = (event.clientX - state.dragStart.clientX) / state.view.scale
    const moveY = (event.clientY - state.dragStart.clientY) / state.view.scale
    for (const entry of state.dragStart.elements) {
      if (entry === null) continue
      const site = findElement(state.elements, entry.id)
      if (site === null || site.element.type === 'line') continue
      site.element.x = entry.x + moveX - entry.parentX
      site.element.y = entry.y + moveY - entry.parentY
    }
    effects.push({ type: 'render' })
  } else if (state.selecting && state.selectionRect !== null) {
    state.selectionRect.w = event.clientX - event.rectLeft - state.selectionRect.x
    state.selectionRect.h = event.clientY - event.rectTop - state.selectionRect.y
    effects.push({ type: 'render' })
  }
  return effects
}

/**
 * Handle a pointer release: finish pin drags, resizes, selections, drags
 * (with group reparenting) and pans (with the right-click menu test and the
 * first momentum frame, which upstream applies synchronously).
 * @param tools - shared controller tools.
 * @param event - the pointer event.
 * @returns the effects, in upstream call order.
 */
export function pointerUp(tools: PurControllerTools, event: PurPointerEvent): PurControllerEffect[] {
  const { state } = tools
  const pinEffects = finishPinDrag(tools, event)
  if (pinEffects !== null) return pinEffects
  const effects: PurControllerEffect[] = []

  if (state.resizing) {
    state.resizing = false
    state.resize = null
    pushHistory(tools.history, state.elements)
    return [{ type: 'save' }, { type: 'render' }]
  }

  if (state.selecting && state.selectionRect !== null) {
    let { x, y } = state.selectionRect
    let { w, h } = state.selectionRect
    if (w < 0) { x += w; w = Math.abs(w) }
    if (h < 0) { y += h; h = Math.abs(h) }
    const start = screenToWorld(state.view, x, y)
    const end = screenToWorld(state.view, x + w, y + h)
    const selected = state.elements.filter(
      (el) => el.type !== 'line' && el.x < end.x && el.x + el.w > start.x && el.y < end.y && el.y + el.h > start.y,
    )
    if (!event.shiftKey && !event.ctrlKey && !event.metaKey) state.selectedIds.clear()
    for (const element of selected) state.selectedIds.add(element.id)
    state.selectionRect = null
    state.selecting = false
  }

  if (state.dragging) {
    state.dragging = false
    const start = state.dragStart
    const hasMoved = start !== null && start.elements.some((entry) => {
      if (entry === null) return false
      const site = findElement(state.elements, entry.id)
      if (site === null) return false
      return Math.abs((site.element.x ?? NaN) + site.parentX - entry.x) > 1 || Math.abs((site.element.y ?? NaN) + site.parentY - entry.y) > 1
    })
    if (hasMoved && start !== null) {
      for (const entry of start.elements) if (entry !== null) reparentDragged(state, entry.id)
    }
    pushHistory(tools.history, state.elements)
    effects.push({ type: 'save' })
  }

  if (state.panning) {
    state.panning = false
    if (event.button === 2 && state.rightClickStart !== null) {
      const distance = Math.abs(event.clientX - state.rightClickStart.x) + Math.abs(event.clientY - state.rightClickStart.y)
      if (distance < 5) effects.push({ type: 'context-menu', clientX: event.clientX, clientY: event.clientY })
    }
    if (momentumStep(tools)) effects.push({ type: 'render' })
  }
  effects.push({ type: 'cursor', cursor: 'default' }, { type: 'render' })
  return effects
}

/**
 * Cursor the pointer should show over one resize handle.
 * @param handle - the handle under the pointer.
 * @returns a CSS cursor name.
 */
function cursorForHandle(handle: PurResizeHandle): string {
  if (handle === 'n' || handle === 's') return 'ns-resize'
  if (handle === 'e' || handle === 'w') return 'ew-resize'
  if (handle === 'nw' || handle === 'se') return 'nwse-resize'
  return 'nesw-resize'
}
