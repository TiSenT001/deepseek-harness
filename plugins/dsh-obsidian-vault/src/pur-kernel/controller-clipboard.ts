/**
 * Clipboard and grouping commands: copy, paste, duplicate, group and ungroup.
 * Each mutates the state and returns the effects the adapter must perform, in
 * upstream order.
 * @module dsh-obsidian-vault/pur-kernel/controller-clipboard
 */
import { commit } from './controller-selection.ts'
import type { PurControllerEffect, PurControllerTools } from './controller-types.ts'
import type { PurElement } from './types.ts'

/** Deep copy through JSON, like upstream's clipboard. */
function clone(element: PurElement): PurElement {
  return JSON.parse(JSON.stringify(element)) as PurElement
}

/**
 * Copy the selected elements into the internal clipboard and notice.
 * @param tools - shared controller tools.
 * @returns the notice effect.
 */
export function copySelected(tools: PurControllerTools): PurControllerEffect[] {
  const selected: PurElement[] = []
  const search = (elements: readonly PurElement[]): void => {
    for (const element of elements) {
      if (tools.state.selectedIds.has(element.id)) selected.push(element)
      if (element.type === 'group') search(element.children)
    }
  }
  search(tools.state.elements)
  tools.state.clipboard = selected.map(clone)
  return [{ type: 'notice', text: tools.labels.copiedElements(tools.state.clipboard.length) }]
}

/**
 * Paste the internal clipboard, offset by 50 units or placed at the given
 * world point, and select the copies.
 * @param tools - shared controller tools.
 * @param worldX - paste x; the offset position when omitted or zero.
 * @param worldY - paste y; the offset position when omitted or zero.
 * @returns effects, empty when the clipboard is empty.
 */
export function pasteClipboard(tools: PurControllerTools, worldX?: number, worldY?: number): PurControllerEffect[] {
  if (tools.state.clipboard.length === 0) return []
  const created = tools.state.clipboard.map((element) => ({
    ...element,
    id: tools.env.createId(),
    x: worldX ? worldX : (element.x ?? NaN) + 50,
    y: worldY ? worldY : (element.y ?? NaN) + 50,
  }))
  tools.state.elements.push(...created)
  tools.state.selectedIds.clear()
  for (const element of created) tools.state.selectedIds.add(element.id)
  return commit(tools)
}

/**
 * Duplicate the selected elements 30 units down-right and select the clones.
 * @param tools - shared controller tools.
 * @returns the commit effects plus the copy notice.
 */
export function duplicateSelected(tools: PurControllerTools): PurControllerEffect[] {
  const selected: PurElement[] = []
  const search = (elements: readonly PurElement[]): void => {
    for (const element of elements) {
      if (tools.state.selectedIds.has(element.id)) selected.push(element)
      if (element.type === 'group') search(element.children)
    }
  }
  search(tools.state.elements)
  const clones = selected.map((element) => ({ ...clone(element), id: tools.env.createId(), x: (element.x ?? NaN) + 30, y: (element.y ?? NaN) + 30 }))
  tools.state.elements.push(...clones)
  tools.state.selectedIds.clear()
  for (const element of clones) tools.state.selectedIds.add(element.id)
  return [...commit(tools), { type: 'notice', text: tools.labels.copiedElements(clones.length) }]
}

/**
 * Group the selected non-line elements into a new frame padded by 10 units,
 * converting the children to group-relative coordinates.
 * @param tools - shared controller tools.
 * @returns effects; a notice when fewer than two non-line elements qualify.
 */
export function groupSelected(tools: PurControllerTools): PurControllerEffect[] {
  if (tools.state.selectedIds.size < 2) return []
  const selected: PurElement[] = []
  const search = (elements: readonly PurElement[]): void => {
    for (const element of elements) {
      if (tools.state.selectedIds.has(element.id)) selected.push(element)
      if (element.type === 'group') search(element.children)
    }
  }
  search(tools.state.elements)
  const nodes = selected.filter((element) => element.type !== 'line')
  if (nodes.length < 2) return [{ type: 'notice', text: tools.labels.selectTwoToGroup }]
  const minX = Math.min(...nodes.map((el) => el.x ?? 0))
  const minY = Math.min(...nodes.map((el) => el.y ?? 0))
  const maxX = Math.max(...nodes.map((el) => (el.x ?? 0) + (el.w ?? 0)))
  const maxY = Math.max(...nodes.map((el) => (el.y ?? 0) + (el.h ?? 0)))
  const groupId = tools.env.createId()
  tools.state.elements = tools.state.elements.filter((el) => !tools.state.selectedIds.has(el.id))
  tools.state.elements.push({
    id: groupId,
    type: 'group',
    x: minX - 10,
    y: minY - 10,
    w: maxX - minX + 20,
    h: maxY - minY + 20,
    children: nodes.map((el) => ({ ...el, x: (el.x ?? 0) - minX + 10, y: (el.y ?? 0) - minY + 10 }) as PurElement),
    rotation: 0,
    opacity: 1,
  })
  tools.state.selectedIds.clear()
  tools.state.selectedIds.add(groupId)
  return commit(tools)
}

/**
 * Dissolve every selected top-level group, lifting its children to absolute
 * coordinates at the group's position in the list.
 * @param tools - shared controller tools.
 * @returns effects, empty when no top-level group is selected.
 */
export function ungroupSelected(tools: PurControllerTools): PurControllerEffect[] {
  const groups = tools.state.elements.filter((el) => tools.state.selectedIds.has(el.id) && el.type === 'group')
  if (groups.length === 0) return []
  for (const group of groups) {
    if (group.type !== 'group') continue
    const index = tools.state.elements.indexOf(group)
    if (index > -1) {
      tools.state.elements.splice(index, 1, ...group.children.map((child) => ({ ...child, x: (child.x ?? 0) + group.x, y: (child.y ?? 0) + group.y }) as PurElement))
    }
  }
  tools.state.selectedIds.clear()
  return commit(tools)
}
