/**
 * Pane width preferences: the docked column limits, clamping, and the stored
 * JSON form. Pure so the drag and keyboard paths share one clamp.
 * @module dsh-obsidian-vault/client/ui/layoutPrefs
 */
import { CHROME } from './kit/tokens.ts'

/** Both docked column widths, in px. */
export interface PaneWidths {
  readonly left: number
  readonly right: number
}

/** Widths used until the user drags or a stored value is readable. */
export const DEFAULT_WIDTHS: PaneWidths = { left: CHROME.leftDefault, right: CHROME.rightDefault }

/** localStorage key holding the JSON widths. */
export const WIDTHS_KEY = 'ov.layout.widths.v1'

/**
 * Clamp one column to its allowed range.
 * @param side - which column the value belongs to.
 * @param value - proposed width in px.
 * @returns the nearest valid width.
 */
export function clampPane(side: 'left' | 'right', value: number): number {
  const [min, max] = side === 'left' ? [CHROME.leftMin, CHROME.leftMax] : [CHROME.rightMin, CHROME.rightMax]
  if (!Number.isFinite(value)) return side === 'left' ? CHROME.leftDefault : CHROME.rightDefault
  return Math.min(max, Math.max(min, Math.round(value)))
}

/**
 * Read stored widths, falling back per column.
 * @param raw - the stored JSON string, or null when absent.
 */
export function parseWidths(raw: string | null): PaneWidths {
  if (raw === null) return DEFAULT_WIDTHS
  try {
    const parsed = JSON.parse(raw) as { readonly left?: unknown; readonly right?: unknown }
    return {
      left: typeof parsed.left === 'number' ? clampPane('left', parsed.left) : DEFAULT_WIDTHS.left,
      right: typeof parsed.right === 'number' ? clampPane('right', parsed.right) : DEFAULT_WIDTHS.right,
    }
  } catch {
    // A truncated or hand-edited entry must not break the layout.
    return DEFAULT_WIDTHS
  }
}

/**
 * Serialize widths for storage.
 * @param widths - the current pane widths.
 */
export function serializeWidths(widths: PaneWidths): string {
  return JSON.stringify({ left: clampPane('left', widths.left), right: clampPane('right', widths.right) })
}
