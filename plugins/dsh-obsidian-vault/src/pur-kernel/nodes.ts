/**
 * Node sizing rules derived from pin counts.
 * @module dsh-obsidian-vault/pur-kernel/nodes
 */
import type { PurPin } from './types.ts'

/** Height of the fixed header above the pin rows, in px. */
const NODE_HEADER = 60

/** Height of one pin row, in px. */
const PIN_ROW = 28

/**
 * Height a code node needs to draw its pins without overlap.
 * @param node - the node; a missing pin list counts as empty.
 * @returns height in canvas units.
 */
export function codeNodeHeight(node: { readonly inputs?: readonly PurPin[]; readonly outputs?: readonly PurPin[] }): number {
  const rows = Math.max(node.inputs?.length ?? 0, node.outputs?.length ?? 0, 1)
  return NODE_HEADER + rows * PIN_ROW
}
