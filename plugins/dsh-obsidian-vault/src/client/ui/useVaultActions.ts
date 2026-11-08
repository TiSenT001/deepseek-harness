/**
 * The page's single action dispatcher: menus, the explorer, tabs, and the rail
 * all call these functions, so mutations, prompts, tab remapping, and reloads
 * happen in one place.
 * @module dsh-obsidian-vault/client/ui/useVaultActions
 */
import { useMemo, type Dispatch, type SetStateAction } from 'react'
import {
  createFolder as apiCreateFolder, createNote as apiCreateNote, deleteEntry, moveEntry, renameEntry,
} from '../api.ts'
import type { Translate } from '../i18n.ts'
import type { RailId } from './kit/index.ts'
import type { MenuActions } from './menu/types.ts'
import type { SplitDirection } from './panes.ts'
import { remapPath, removePath, type TabsState } from './tabs.ts'

/** Everything the dispatcher needs from the page. */
export interface VaultActionInput {
  readonly t: Translate
  readonly openPath: (path: string, options?: { readonly preview?: boolean; readonly newTab?: boolean }) => void
  readonly createTarget: (target: string) => void
  /** Apply a tab transition to every pane, so renames and deletes retarget all. */
  readonly mapTabs: (fn: (tabs: TabsState) => TabsState) => void
  readonly reload: () => Promise<void>
  readonly setError: (message: string | undefined) => void
  readonly closeTab: (index: number) => void
  readonly closeOthers: (index: number) => void
  readonly closeAllTabs: () => void
  readonly pinTab: (index: number) => void
  /** Split the active pane, moving its active tab into a new one. */
  readonly splitPane: (direction: SplitDirection) => void
  /** Close the active pane; the last pane stays. */
  readonly closePane: () => void
  readonly setView: (view: 'note' | 'graph') => void
  readonly setTreeOpen: Dispatch<SetStateAction<boolean>>
  readonly setRailOpen: Dispatch<SetStateAction<boolean>>
  readonly setRail: (rail: RailId) => void
  readonly setFilter: (value: string) => void
  readonly openQuickSwitcher: () => void
  /** A new tab is requested: the next quick-switcher pick opens in one. */
  readonly newTabPending: { current: boolean }
  /** Append and focus an empty new-tab page. */
  readonly addEmptyTab: () => void
  /** Collapse All, wired to the explorer's own expand state. */
  readonly collapseRef: { current: (() => void) | null }
  /** Add or remove one file's bookmark. */
  readonly toggleBookmark: (path: string) => void
  /** In-app text prompt; embedded webviews block the native one. */
  readonly askText: (title: string, initial?: string) => Promise<string | null>
  /** In-app confirmation, for the same reason. */
  readonly askConfirm: (message: string) => Promise<boolean>
}

const failMessage = (cause: unknown): string => cause instanceof Error ? cause.message : String(cause)

/**
 * Build the menu action object.
 * @param input - page callbacks and state setters.
 * @returns stable action functions for menus and explorer drag/drop.
 */
export function useVaultActions(input: VaultActionInput): MenuActions {
  const {
    t, openPath, createTarget, mapTabs, reload, setError, closeTab, closeOthers, closeAllTabs, pinTab,
    splitPane, closePane,
    setView, setTreeOpen, setRailOpen, setRail, setFilter, openQuickSwitcher, newTabPending, collapseRef,
    toggleBookmark, askText, askConfirm, addEmptyTab,
  } = input

  return useMemo<MenuActions>(() => {
    const run = (work: Promise<unknown>): void => {
      work.catch((cause: unknown) => setError(failMessage(cause)))
    }

    const createNote = (folder: string): void => {
      void askText(t('newNotePrompt'), t('untitled')).then((name) => {
        if (name === null || name.trim().length === 0) return
        const trimmed = name.trim()
        const file = /\.md$/i.test(trimmed) ? trimmed : `${trimmed}.md`
        const relative = folder.length === 0 ? file : `${folder}/${file}`
        run(apiCreateNote(relative).then((ok) => {
          if (!ok) {
            setError(t('createFailed'))
            return
          }
          return reload().then(() => openPath(relative))
        }))
      })
    }

    const createFolder = (folder: string): void => {
      void askText(t('newFolderPrompt'), t('untitled')).then((name) => {
        if (name === null || name.trim().length === 0) return
        const relative = folder.length === 0 ? name.trim() : `${folder}/${name.trim()}`
        run(apiCreateFolder(relative).then(() => reload()))
      })
    }

    const rename = (path: string): void => {
      const slash = path.lastIndexOf('/')
      const name = slash === -1 ? path : path.slice(slash + 1)
      const isNote = /\.md$/i.test(name)
      void askText(t('renamePrompt'), isNote ? name.replace(/\.md$/i, '') : name).then((next) => {
        if (next === null || next.trim().length === 0) return
        const trimmed = next.trim()
        const finalName = isNote && !/\.md$/i.test(trimmed) ? `${trimmed}.md` : trimmed
        const renamed = slash === -1 ? finalName : `${path.slice(0, slash)}/${finalName}`
        run(renameEntry(path, finalName).then(() => {
          mapTabs(previous => remapPath(previous, path, renamed))
          return reload()
        }))
      })
    }

    const remove = (paths: readonly string[]): void => {
      const targets = withoutNested(paths)
      if (targets.length === 0) return
      const label = targets.length === 1 ? targets[0] ?? '' : `${targets.length}`
      void askConfirm(`${t('delete')} ${label}?`).then((ok) => {
        if (!ok) return
        run(targets.reduce<Promise<unknown>>(
          (chain, path) => chain.then(() => deleteEntry(path)).then(() => {
            mapTabs(previous => removePath(previous, path))
          }),
          Promise.resolve(),
        ).then(() => reload()))
      })
    }

    const move = (paths: readonly string[], folder: string): void => {
      const targets = withoutNested(paths)
      run(targets.reduce<Promise<unknown>>((chain, path) => chain.then(() => {
        const name = path.slice(path.lastIndexOf('/') + 1)
        const dest = folder.length === 0 ? name : `${folder}/${name}`
        // Dropping into the current folder is a no-op; a folder can never move
        // into its own descendant.
        if (dest === path || dest.startsWith(`${path}/`)) return undefined
        return moveEntry(path, dest).then((result) => {
          mapTabs(previous => remapPath(previous, path, result.moved))
        })
      }), Promise.resolve()).then(() => reload()))
    }

    const copy = (text: string): void => {
      void navigator.clipboard?.writeText(text).catch(() => {
        // Clipboard access can be denied; the user still has the menu closed.
      })
    }

    return {
      open: (path, options) => openPath(path, options),
      openGraph: (path) => {
        openPath(path, { preview: true })
        setView('graph')
      },
      createNote,
      createFolder,
      createTarget,
      rename,
      remove,
      move,
      copy,
      copyPaths: paths => copy(paths.join('\n')),
      newTab: addEmptyTab,
      closeTab,
      closeOthers,
      closeAllTabs,
      pinTab,
      splitPane,
      closePane,
      reload: () => {
        run(reload())
      },
      collapseTree: () => collapseRef.current?.(),
      showGraph: () => setView('graph'),
      toggleExplorer: () => setTreeOpen(value => !value),
      toggleRail: () => setRailOpen(value => !value),
      quickSwitch: openQuickSwitcher,
      setRail,
      filterTag: tag => setFilter(`#${tag}`),
      toggleBookmark,
    }
  }, [
    addEmptyTab, collapseRef, closeAllTabs, closeOthers, closeTab, createTarget, mapTabs, newTabPending, openPath,
    openQuickSwitcher, pinTab, reload, setError, setFilter, setRail, setRailOpen,
    setTreeOpen, setView, splitPane, closePane, t, toggleBookmark,
  ])
}

/** Drop paths whose ancestor is also selected, so a batch edit never races itself. */
function withoutNested(paths: readonly string[]): readonly string[] {
  const ordered = [...new Set(paths)].sort((left, right) => left.length - right.length)
  return ordered.filter(path => !ordered.some(other => other !== path && path.startsWith(`${other}/`)))
}
