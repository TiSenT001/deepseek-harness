/**
 * The palette's full command list: daily-note and template commands plus the
 * pane commands, fed into the shared command surface. Keeps command assembly
 * out of the page component.
 * @module dsh-obsidian-vault/client/ui/useVaultCommands
 */
import { useMemo, useSyncExternalStore } from 'react'
import type { TreeNodeDto } from '../../protocol.ts'
import {
  getPurPaneHandlers,
  getPurPanePaths,
  subscribePurPaneCommands,
} from '../pur/integration.ts'
import { externalizeCanvas } from '../api.ts'
import { buildPurPaneCommands } from './commands.ts'
import type { CommandEntry } from './commands.ts'
import { folderPaths } from './paths.ts'
import type { useVaultBookmarks } from './useVaultBookmarks.ts'
import {
  useCommandSurface,
  type CommandSurface,
  type CommandSurfaceOptions,
} from './useCommandSurface.ts'
import { useVaultNotes } from './useVaultNotes.ts'
import type { useVaultTabs } from './useVaultTabs.ts'

/** Options for {@link useVaultCommands}. */
export interface VaultCommandsInput extends Omit<CommandSurfaceOptions, 'folders' | 'bookmarks' | 'extra'> {
  /** The vault tree; folders and template notes derive from it. */
  readonly tree: readonly TreeNodeDto[]
  /** Bookmark entries; only their paths reach the menu builder. */
  readonly bookmarkEntries: ReturnType<typeof useVaultBookmarks>['entries']
  readonly openPath: (path: string) => void
  readonly reload: () => Promise<void>
  readonly setError: (message: string | undefined) => void
  /** Active index root; daily/template configs are re-read when it changes. */
  readonly root: string | undefined
  readonly splitPane: ReturnType<typeof useVaultTabs>['splitPane']
  readonly closePane: ReturnType<typeof useVaultTabs>['closePane']
  /** Pane commands hide Close Pane while only one pane is open. */
  readonly paneCount: number
  /** Active `.PurStudio` document path; its pane's commands join the palette. */
  readonly purPath: string | undefined
  /** Page-owned commands, such as the workspace-layout manager. */
  readonly pageCommands: readonly CommandEntry[]
  /** In-app text prompt for the template command. */
  readonly askText: (title: string, initial?: string) => Promise<string | null>
}

/**
 * Assemble the daily-note, template, and pane commands and expose the shared
 * command surface built from them.
 * @param input - the action dispatcher, the surface inputs, and the pane verbs.
 * @returns the memoised menu groups, palette commands, and the runner.
 */
export function useVaultCommands(input: VaultCommandsInput): CommandSurface {
  const {
    tree, bookmarkEntries, openPath, reload, setError, root, splitPane, closePane, paneCount,
    purPath, pageCommands, t, askText, ...surface
  } = input
  const noteCommands = useVaultNotes({ t, openPath, reload, setError, root, tree, askText })
  const paneCommands = useMemo<readonly CommandEntry[]>(() => {
    const entries: CommandEntry[] = [
      { id: 'split.right', label: t('splitRight'), run: () => splitPane('row') },
      { id: 'split.down', label: t('splitDown'), run: () => splitPane('column') },
    ]
    if (paneCount > 1) entries.push({ id: 'pane.close', label: t('closePane'), run: closePane })
    return entries
  }, [t, splitPane, closePane, paneCount])
  const folders = useMemo(() => folderPaths(tree), [tree])
  const bookmarks = useMemo(() => bookmarkEntries.map(entry => entry.path), [bookmarkEntries])
  // A mounted Pur pane registers its verbs by document path; the palette
  // mirrors them while its file is the active tab.
  const purPanePaths = useSyncExternalStore(subscribePurPaneCommands, getPurPanePaths)
  const purCommands = useMemo<readonly CommandEntry[]>(
    () => (purPath === undefined ? [] : buildPurPaneCommands(t, getPurPaneHandlers(purPath))),
    // `purPanePaths` invalidates the memo when a pane (un)registers.
    [t, purPath, purPanePaths],
  )
  // Migration helper: rewrite a canvas' inline images into 附件/ so the document
  // keeps only layout. Registering it here keeps it next to the pane commands.
  const canvasCommands = useMemo<readonly CommandEntry[]>(() => {
    if (purPath === undefined) return []
    return [{
      id: 'pur.externalize',
      label: t('externalizeImages'),
      run: () => {
        void externalizeCanvas(purPath)
          .then((result) => {
            if (result.replaced === 0) return
            return reload()
          })
          .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : String(cause)))
      },
    }]
  }, [purPath, reload, setError, t])
  const extra = useMemo<readonly CommandEntry[]>(
    () => [
      ...noteCommands,
      ...paneCommands,
      ...purCommands,
      ...canvasCommands,
      ...pageCommands,
    ],
    [noteCommands, paneCommands, purCommands, canvasCommands, pageCommands],
  )
  return useCommandSurface({ ...surface, t, folders, bookmarks, extra, paneCount })
}
