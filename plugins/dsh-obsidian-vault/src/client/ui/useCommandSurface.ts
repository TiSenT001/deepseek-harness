/**
 * The command palette and context-menu content for the current page state.
 * Both surfaces are pure projections of the same action dispatcher; this hook
 * keeps their memoised assembly out of the page component.
 * @module dsh-obsidian-vault/client/ui/useCommandSurface
 */
import { useCallback, useMemo } from 'react'
import type { Translate } from '../i18n.ts'
import { buildCommands, type CommandContext, type CommandEntry } from './commands.ts'
import { buildMenu } from './menu/registry.ts'
import type { MenuActions } from './menu/types.ts'
import type { MenuGroup } from './menu/types.ts'
import type { MenuState } from './useOverlayState.ts'

/** Options for {@link useCommandSurface}. */
export interface CommandSurfaceOptions extends Omit<CommandContext, 't' | 'actions'> {
  readonly t: Translate
  readonly actions: MenuActions
  /** The open context menu, if any. */
  readonly menu: MenuState | undefined
  /** Every folder path in the vault; `''` is the root. */
  readonly folders: readonly string[]
  /** Bookmarked file paths, so the file menu offers the right toggle label. */
  readonly bookmarks: readonly string[]
  /** Number of open tabs, for Close All's disabled state. */
  readonly tabCount: number
  /** Number of open panes, for Close Pane's disabled state. */
  readonly paneCount: number
  /** Close the palette before running a command. */
  readonly closeQuick: () => void
}

/** The memoised menu groups and palette commands for the page. */
export interface CommandSurface {
  readonly menuGroups: readonly MenuGroup[] | undefined
  readonly commands: readonly CommandEntry[]
  /** Run a palette command by id; unknown ids are ignored. */
  readonly runCommand: (id: string) => void
}

/**
 * Assemble the page's menu groups and palette commands.
 * @param options - the action dispatcher plus every surface input.
 */
export function useCommandSurface(options: CommandSurfaceOptions): CommandSurface {
  const {
    t, actions, menu, folders, bookmarks, tabCount, paneCount, closeQuick,
    openSearch, openEdit, openReading, openSettings, openVaults, openPurStudio, closeCurrentTab, openBookmarks,
    notePath, bookmarked, toggleBookmark, editable, extra,
  } = options
  const menuGroups = useMemo(
    () => (menu === undefined
      ? undefined
      : buildMenu(menu.scene, { t, actions, folders, bookmarks, tabs: tabCount, panes: paneCount })),
    [actions, bookmarks, folders, menu, t, tabCount, paneCount],
  )
  const commands = useMemo(
    () => buildCommands({
      t, actions, openSearch, openEdit, openReading, openSettings, openVaults, openPurStudio,
      closeCurrentTab, openBookmarks, notePath, bookmarked, toggleBookmark, editable, extra,
    }),
    [
      t, actions, openSearch, openEdit, openReading, openSettings, openVaults, openPurStudio,
      closeCurrentTab, openBookmarks, notePath, bookmarked, toggleBookmark, editable, extra,
    ],
  )
  // The palette closes first, so a command that reopens a surface (the file
  // switcher, a dialog) is not immediately closed by the same action.
  const runCommand = useCallback((id: string) => {
    closeQuick()
    commands.find(entry => entry.id === id)?.run()
  }, [closeQuick, commands])
  return { menuGroups, commands, runCommand }
}
