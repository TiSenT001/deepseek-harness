/**
 * Detaching a connection: the line keeps the path it had, loses both endpoints and
 * becomes a free annotation, so the user can keep it on the board without the link.
 * @module dsh-obsidian-vault/pur-kernel/controller-lines
 */
import { pinWorldPosition, worldRect } from './geometry.ts'
import { pushHistory } from './history.ts'
import type { PurControllerEffect, PurControllerTools } from './controller-types.ts'
import type { PurLineElement } from './types.ts'

/**
 * World point one end of a connection attaches to.
 * @param tools - shared controller tools.
 * @param nodeId - element the end names.
 * @param pinId - pin id, empty when the end uses the element centre.
 * @returns the world point, or null when the element is gone.
 */
function endWorld(tools: PurControllerTools, nodeId: string, pinId: string | undefined): { x: number; y: number } | null {
  const pin = pinId === undefined ? null : pinWorldPosition(tools.state.elements, nodeId, pinId)
  if (pin !== null) return { x: pin.x, y: pin.y }
  const rect = worldRect(tools.state.elements, nodeId)
  return rect === null ? null : { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 }
}

/**
 * Detach a bound line into a free line that keeps its current path.
 * @param tools - shared controller tools.
 * @param lineId - the line to detach.
 * @returns the commit effects, empty when the line is absent or already free.
 */
export function disconnectLine(tools: PurControllerTools, lineId: string): PurControllerEffect[] {
  const line = tools.state.elements.find((element) => element.id === lineId)
  if (line === undefined || line.type !== 'line') return []
  if (line.from === '' && line.to === '') return []
  const start = endWorld(tools, line.from, line.fromPin)
  const end = endWorld(tools, line.to, line.toPin)
  if (start === null || end === null) return []
  const free: PurLineElement = { ...line, x: start.x, y: start.y, w: end.x - start.x, h: end.y - start.y }
  delete free.fromPin
  delete free.toPin
  free.from = ''
  free.to = ''
  const index = tools.state.elements.indexOf(line)
  if (index < 0) return []
  tools.state.elements[index] = free
  tools.state.selectedIds.clear()
  tools.state.selectedIds.add(free.id)
  pushHistory(tools.history, tools.state.elements)
  return [{ type: 'save' }, { type: 'render' }, { type: 'notice', text: tools.labels.lineDisconnected }]
}
