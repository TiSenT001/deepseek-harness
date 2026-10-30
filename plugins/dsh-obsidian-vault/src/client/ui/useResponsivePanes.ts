/**
 * Docked-column responsiveness: below the rail breakpoint the rail becomes a
 * drawer, and below the tree breakpoint so does the explorer.
 * @module dsh-obsidian-vault/client/ui/useResponsivePanes
 */
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

const RAIL_QUERY = '(max-width: 1100px)'
const TREE_QUERY = '(max-width: 860px)'

/** Drawer state for both docked columns. */
export interface ResponsivePanes {
  readonly railNarrow: boolean
  readonly treeNarrow: boolean
  readonly treeOpen: boolean
  readonly railOpen: boolean
  readonly setTreeOpen: Dispatch<SetStateAction<boolean>>
  readonly setRailOpen: Dispatch<SetStateAction<boolean>>
}

/**
 * Follow the two breakpoints and keep each pane open while it is docked.
 * @returns the drawer flags and the open setters.
 */
export function useResponsivePanes(): ResponsivePanes {
  const [railNarrow, setRailNarrow] = useState(false)
  const [treeNarrow, setTreeNarrow] = useState(false)
  const [treeOpen, setTreeOpen] = useState(true)
  const [railOpen, setRailOpen] = useState(true)

  useEffect(() => {
    const railQuery = window.matchMedia(RAIL_QUERY)
    const treeQuery = window.matchMedia(TREE_QUERY)
    const syncRail = (): void => {
      setRailNarrow(railQuery.matches)
      setRailOpen(!railQuery.matches)
    }
    const syncTree = (): void => {
      setTreeNarrow(treeQuery.matches)
      setTreeOpen(!treeQuery.matches)
    }
    syncRail()
    syncTree()
    railQuery.addEventListener('change', syncRail)
    treeQuery.addEventListener('change', syncTree)
    return () => {
      railQuery.removeEventListener('change', syncRail)
      treeQuery.removeEventListener('change', syncTree)
    }
  }, [])

  return { railNarrow, treeNarrow, treeOpen, railOpen, setTreeOpen, setRailOpen }
}
