/**
 * Undo/redo as upstream implements it: a stack of JSON snapshots with a
 * moving index, deduplicated against the top, truncated on branch, capped at
 * fifty entries.
 * @module dsh-obsidian-vault/pur-kernel/history
 */
import type { PurHistory } from './controller-types.ts'
import type { PurElement } from './types.ts'

/** Snapshots upstream retains. */
const MAX_HISTORY = 50

/**
 * Create an empty history.
 * @returns a history with no snapshots.
 */
export function createHistory(): PurHistory {
  return { stack: [], index: -1, max: MAX_HISTORY }
}

/**
 * Push a snapshot of the current elements, unless it equals the current top.
 * @param history - the stack to push onto.
 * @param elements - the element tree to serialize.
 * @returns true when a snapshot was pushed.
 */
export function pushHistory(history: PurHistory, elements: readonly PurElement[]): boolean {
  const state = JSON.stringify(elements)
  if (history.stack.length > 0 && history.index >= 0 && history.stack[history.index] === state) return false
  history.stack = history.stack.slice(0, history.index + 1)
  history.stack.push(state)
  if (history.stack.length > history.max) history.stack.shift()
  history.index = history.stack.length - 1
  return true
}

/**
 * Step one snapshot back.
 * @param history - the stack to rewind.
 * @returns the restored element tree, or null at the bottom of the stack.
 */
export function undoHistory(history: PurHistory): PurElement[] | null {
  if (history.index <= 0) return null
  history.index--
  return JSON.parse(history.stack[history.index] ?? '[]') as PurElement[]
}

/**
 * Step one snapshot forward.
 * @param history - the stack to advance.
 * @returns the restored element tree, or null at the top of the stack.
 */
export function redoHistory(history: PurHistory): PurElement[] | null {
  if (history.index >= history.stack.length - 1) return null
  history.index++
  return JSON.parse(history.stack[history.index] ?? '[]') as PurElement[]
}
