/**
 * Gesture subroutines the pointer dispatchers call: canvas-local coordinate
 * projection, pin-drag completion, group reparenting on drop, momentum decay
 * and wheel zoom.
 * @module dsh-obsidian-vault/pur-kernel/controller-gestures
 */
import { findElement, screenToWorld, worldRect } from './geometry.ts'
import { pinAt } from './hit-test.ts'
import { pushHistory } from './history.ts'
import type { PurControllerEffect, PurControllerTools, PurPointerEvent, PurWheelEvent } from './controller-types.ts'
import type { PurElement } from './types.ts'

/**
 * Canvas-local coordinates of a pointer or wheel event.
 * @param event - the event carrying client coordinates and the canvas rect.
 * @returns the coordinates relative to the canvas top-left.
 */
export function local(event: PurPointerEvent | PurWheelEvent): { sx: number; sy: number } {
  return { sx: event.clientX - event.rectLeft, sy: event.clientY - event.rectTop }
}

/**
 * Finish a pin drag, returning the branch effects, or null when no drag was
 * active.
 * @param tools - shared controller tools.
 * @param event - the release event.
 * @returns effects for the relink/create branch, or null when idle.
 */
export function finishPinDrag(tools: PurControllerTools, event: PurPointerEvent): PurControllerEffect[] | null {
  const { state, labels } = tools
  const drag = state.pinDrag
  if (drag === null) return null
  const { sx, sy } = local(event)
  const world = screenToWorld(state.view, sx, sy)
  const target = pinAt(state.elements, world.x, world.y, state.view.scale)
  state.pinDrag = null
  state.hoverPin = null
  const effects: PurControllerEffect[] = [{ type: 'cursor', cursor: 'default' }]

  if (drag.dragMode === 'relink-from') {
    if (target !== null && target.isOutput && target.nodeId !== drag.toNodeId) {
      const line = state.elements.find((el) => el.id === drag.lineId)
      if (line !== undefined && line.type === 'line') {
        line.from = target.nodeId
        line.fromPin = target.pinId
        pushHistory(tools.history, state.elements)
        effects.push({ type: 'save' }, { type: 'notice', text: labels.relinkedFrom })
      }
    }
    effects.push({ type: 'render' })
    return effects
  }
  if (drag.dragMode === 'relink-to') {
    if (target !== null && !target.isOutput && target.nodeId !== drag.fromNodeId) {
      const exists = state.elements.find((el) => el.id === drag.lineId)
      if (exists !== undefined) {
        state.elements = state.elements.filter((el) => {
          if (el.id === drag.lineId) return true
          if (el.type !== 'line') return true
          return !(el.to === target.nodeId && el.toPin === target.pinId)
        })
        const line = state.elements.find((el) => el.id === drag.lineId)
        if (line !== undefined && line.type === 'line') {
          line.to = target.nodeId
          line.toPin = target.pinId
        }
        pushHistory(tools.history, state.elements)
        effects.push({ type: 'save' }, { type: 'notice', text: labels.relinkedTo })
      }
    }
    effects.push({ type: 'render' })
    return effects
  }
  if (target !== null && !target.isOutput && target.nodeId !== drag.fromNodeId) {
    state.elements = state.elements.filter((el) => {
      if (el.type !== 'line') return true
      return !(el.to === target.nodeId && el.toPin === target.pinId)
    })
    state.elements.push({ id: tools.env.createId(), type: 'line', from: drag.fromNodeId ?? '', fromPin: drag.fromPinId ?? undefined, to: target.nodeId, toPin: target.pinId, content: '' })
    pushHistory(tools.history, state.elements)
    effects.push({ type: 'save' }, { type: 'notice', text: labels.lineCreated })
  }
  effects.push({ type: 'render' })
  return effects
}

/**
 * Reparent one dragged element into the deepest group containing its centre,
 * or back to top level.
 * @param state - controller state.
 * @param entryId - the dragged element id.
 */
export function reparentDragged(state: PurControllerTools['state'], entryId: string): void {
  const site = findElement(state.elements, entryId)
  if (site === null || site.element.type === 'line' || site.element.type === 'group') return
  const element = site.element
  const worldX = element.x + site.parentX
  const worldY = element.y + site.parentY
  const centreX = worldX + (element.w ?? 50) / 2
  const centreY = worldY + (element.h ?? 30) / 2
  let target: PurElement | null = null
  let targetDepth = -1
  const search = (elements: readonly PurElement[], depth: number): void => {
    for (const candidate of elements) {
      if (candidate.type !== 'group' || candidate.id === element.id) continue
      const rect = worldRect(state.elements, candidate.id)
      if (rect !== null && centreX >= rect.x && centreX <= rect.x + rect.w && centreY >= rect.y && centreY <= rect.y + rect.h) {
        if (depth > targetDepth) { target = candidate; targetDepth = depth }
        search(candidate.children, depth + 1)
      }
    }
  }
  search(state.elements, 0)
  const topIndex = state.elements.indexOf(element)
  if (topIndex > -1) state.elements.splice(topIndex, 1)
  else {
    const groups: PurElement[] = []
    const collect = (elements: readonly PurElement[]): void => {
      for (const candidate of elements) if (candidate.type === 'group') { groups.push(candidate); collect(candidate.children) }
    }
    collect(state.elements)
    for (const group of groups) {
      if (group.type !== 'group') continue
      const childIndex = group.children.indexOf(element)
      if (childIndex > -1) { group.children.splice(childIndex, 1); break }
    }
  }
  if (target !== null && (target as PurElement).type === 'group') {
    const group = target as PurElement & { x: number; y: number; children: PurElement[] }
    const rect = worldRect(state.elements, group.id)
    element.x = worldX - (rect !== null ? rect.x : group.x)
    element.y = worldY - (rect !== null ? rect.y : group.y)
    group.children.push(element)
  } else {
    element.x = worldX
    element.y = worldY
    state.elements.push(element)
  }
}

/**
 * One momentum frame after a pan: decay the velocity by 0.9 and apply it.
 * `pointerUp` runs the first frame synchronously, like upstream; the adapter
 * drives the rest from its animation frame until this returns false.
 * @param tools - shared controller tools.
 * @returns true while the velocity stays at or above 0.5 px per frame.
 */
export function momentumStep(tools: PurControllerTools): boolean {
  const { state } = tools
  if (Math.abs(state.panVel.x) < 0.5 && Math.abs(state.panVel.y) < 0.5) return false
  state.panVel.x *= 0.9
  state.panVel.y *= 0.9
  state.view.offsetX += state.panVel.x
  state.view.offsetY += state.panVel.y
  return true
}

/**
 * Zoom around the pointer, clamped to [0.05, 10], and show the zoom badge
 * for two seconds.
 * @param tools - shared controller tools.
 * @param event - the wheel event.
 * @returns the render effect.
 */
export function wheel(tools: PurControllerTools, event: PurWheelEvent): PurControllerEffect[] {
  const { state } = tools
  const mx = event.clientX - event.rectLeft
  const my = event.clientY - event.rectTop
  const worldX = (mx - state.view.offsetX) / state.view.scale
  const worldY = (my - state.view.offsetY) / state.view.scale
  const zoomFactor = event.deltaY > 0 ? 0.85 : 1.15
  state.view.scale = Math.min(10, Math.max(0.05, state.view.scale * zoomFactor))
  state.view.offsetX = mx - worldX * state.view.scale
  state.view.offsetY = my - worldY * state.view.scale
  state.showZoomUntil = tools.env.now() + 2000
  return [{ type: 'render' }]
}
