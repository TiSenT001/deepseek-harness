/**
 * Shared drag payload for tab strips and pane edge drop zones. Keeping it in
 * one module lets a pane read a drag that started in another pane's strip.
 * @module dsh-obsidian-vault/client/ui/tab-drag
 */

/** MIME type carrying {@link TabDragPayload} during a tab drag. */
export const TAB_DRAG_TYPE = 'application/x-ov-tab'

/** Source of the dragged tab. */
export interface TabDragPayload {
  readonly paneId: number
  readonly index: number
}

/**
 * Write the payload into a drag's data transfer.
 * @param transfer - HTML5 drag data transfer.
 * @param payload - source pane and tab index.
 */
export function writeTabDrag(transfer: DataTransfer, payload: TabDragPayload): void {
  transfer.setData(TAB_DRAG_TYPE, JSON.stringify(payload))
}

/**
 * Read a tab payload; foreign drags return undefined.
 * @param transfer - HTML5 drag data transfer.
 * @returns the source pane and index.
 */
export function readTabDrag(transfer: DataTransfer): TabDragPayload | undefined {
  try {
    const parsed = JSON.parse(transfer.getData(TAB_DRAG_TYPE)) as { readonly paneId?: unknown; readonly index?: unknown }
    if (typeof parsed.paneId !== 'number' || typeof parsed.index !== 'number') return undefined
    return { paneId: parsed.paneId, index: parsed.index }
  } catch {
    return undefined
  }
}

/**
 * Whether a drag carries a tab payload.
 * @param transfer - HTML5 drag data transfer.
 * @returns true for a tab drag.
 */
export function hasTabDrag(transfer: DataTransfer): boolean {
  return Array.from(transfer.types).includes(TAB_DRAG_TYPE)
}
