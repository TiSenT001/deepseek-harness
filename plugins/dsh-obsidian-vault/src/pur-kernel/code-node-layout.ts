/**
 * Code-node geometry shared by the renderer and by hit-testing. Keeping one
 * definition is what makes a visible pin the same pin the pointer can grab: the
 * card draws a header band and then distributes the rows inside the body, so any
 * other formula would put the hit circles somewhere the user cannot see.
 * @module dsh-obsidian-vault/pur-kernel/code-node-layout
 */

/** Height of the header band, in world units; the divider sits at its bottom. */
export const CODE_HEADER_HEIGHT = 38

/** Gap between the divider and the first pin row, in world units. */
export const CODE_BODY_TOP = 14

/** Space kept below the last pin row, in world units. */
export const CODE_BODY_BOTTOM = 14

/** Smallest row stride, in world units. */
export const CODE_ROW_MIN = 22

/**
 * Centre of one pin row, relative to the card's top edge.
 * @param height - card height in world units.
 * @param rows - number of pin rows, at least one.
 * @param index - zero-based row.
 * @returns the row centre in world units from the card's top.
 */
export function codeNodeRowY(height: number, rows: number, index: number): number {
  const safeRows = Math.max(rows, 1)
  // Rows live between the divider and the bottom padding. A card too short for its
  // pins compresses the rows instead of drawing them past its own edge.
  const start = Math.min(CODE_HEADER_HEIGHT + CODE_BODY_TOP, Math.max(height - 10, 0))
  const end = Math.max(start, height - 6)
  const available = end - start
  const stride = available / safeRows
  return start + stride * (index + 0.5)
}

/**
 * Height a code node needs so its rows keep the standard stride.
 * @param rows - number of pin rows, at least one.
 * @returns the minimum height in world units.
 */
export function codeNodeMinHeight(rows: number): number {
  const safeRows = Math.max(rows, 1)
  return CODE_HEADER_HEIGHT + CODE_BODY_TOP + safeRows * CODE_ROW_MIN + CODE_BODY_BOTTOM
}
