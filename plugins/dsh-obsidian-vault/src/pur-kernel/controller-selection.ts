/**
 * Selection primitives shared by every structural command: the history commit
 * tail and the tree-ordered selection query.
 * @module dsh-obsidian-vault/pur-kernel/controller-selection
 */
import { pushHistory } from './history.ts'
import type { PurControllerEffect, PurControllerState, PurControllerTools } from './controller-types.ts'
import type { PurElement } from './types.ts'

/**
 * Push a history snapshot and report the usual save-then-render tail.
 * @param tools - shared controller tools.
 * @returns the save and render effects.
 */
export function commit(tools: PurControllerTools): PurControllerEffect[] {
  pushHistory(tools.history, tools.state.elements)
  return [{ type: 'save' }, { type: 'render' }]
}

/**
 * Selected elements in tree order, including group children (upstream
 * `getSelectedElements`).
 * @param state - controller state.
 * @returns the selected elements.
 */
export function getSelectedElements(state: PurControllerState): PurElement[] {
  const result: PurElement[] = []
  const search = (elements: readonly PurElement[]): void => {
    for (const element of elements) {
      if (state.selectedIds.has(element.id)) result.push(element)
      if (element.type === 'group') search(element.children)
    }
  }
  search(state.elements)
  return result
}
