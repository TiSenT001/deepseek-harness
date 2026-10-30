/**
 * Menu item and action types shared by every context-menu scene. The registry
 * builds these; the renderer only renders them.
 * @module dsh-obsidian-vault/client/ui/menu/types
 */
import type { RailId } from '../kit/index.ts'
import type { IconName } from '../Icon.tsx'
import type { SplitDirection } from '../panes.ts'

/** One command in a context menu. Items with `children` open a submenu. */
export interface MenuItem {
  readonly id: string
  readonly label: string
  readonly icon?: IconName
  readonly shortcut?: string
  readonly disabled?: boolean
  /** Destructive entries render in the danger colour and sit last. */
  readonly danger?: boolean
  /** Renders a check mark in the icon column. */
  readonly checked?: boolean
  readonly onSelect?: () => void
  readonly children?: readonly MenuItem[]
}

/** Items between two separators. */
export type MenuGroup = readonly MenuItem[]

/** What a menu action can ask the page to do. */
export interface MenuActions {
  readonly open: (path: string, options?: { readonly preview?: boolean; readonly newTab?: boolean }) => void
  readonly openGraph: (path: string) => void
  readonly createNote: (folder: string) => void
  readonly createFolder: (folder: string) => void
  readonly createTarget: (target: string) => void
  readonly rename: (path: string) => void
  readonly remove: (paths: readonly string[]) => void
  readonly move: (paths: readonly string[], folder: string) => void
  readonly copy: (text: string) => void
  readonly copyPaths: (paths: readonly string[]) => void
  readonly newTab: () => void
  readonly closeTab: (index: number) => void
  readonly closeOthers: (index: number) => void
  readonly closeAllTabs: () => void
  readonly pinTab: (index: number) => void
  /** Split the active pane, moving its active tab into a new one. */
  readonly splitPane: (direction: SplitDirection) => void
  /** Close the active pane; the last pane stays. */
  readonly closePane: () => void
  readonly reload: () => void
  readonly collapseTree: () => void
  readonly showGraph: () => void
  readonly toggleExplorer: () => void
  readonly toggleRail: () => void
  readonly quickSwitch: () => void
  readonly setRail: (rail: RailId) => void
  readonly filterTag: (tag: string) => void
  /** Add or remove one file's bookmark in `bookmarks.json`. */
  readonly toggleBookmark: (path: string) => void
}
