/**
 * Persisted pane widths for the docked explorer and rail.
 * @module dsh-obsidian-vault/client/ui/usePaneWidths
 */
import { useCallback, useEffect, useState } from 'react'
import {
  clampPane, DEFAULT_WIDTHS, parseWidths, serializeWidths, WIDTHS_KEY, type PaneWidths,
} from './layoutPrefs.ts'

/** Widths plus the setters the splitters call. */
export interface PaneWidthState extends PaneWidths {
  readonly setWidth: (side: 'left' | 'right', value: number) => void
  readonly resetWidth: (side: 'left' | 'right') => void
}

/**
 * Read and persist the docked column widths.
 * @returns the current widths and their setters.
 */
export function usePaneWidths(): PaneWidthState {
  const [widths, setWidths] = useState<PaneWidths>(() => {
    try {
      return parseWidths(window.localStorage.getItem(WIDTHS_KEY))
    } catch {
      return DEFAULT_WIDTHS
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(WIDTHS_KEY, serializeWidths(widths))
    } catch {
      // Storage can be unavailable in private contexts; the layout still works.
    }
  }, [widths])

  const setWidth = useCallback((side: 'left' | 'right', value: number) => {
    setWidths(previous => ({ ...previous, [side]: clampPane(side, value) }))
  }, [])

  const resetWidth = useCallback((side: 'left' | 'right') => {
    setWidths(previous => ({ ...previous, [side]: DEFAULT_WIDTHS[side] }))
  }, [])

  return { ...widths, setWidth, resetWidth }
}
