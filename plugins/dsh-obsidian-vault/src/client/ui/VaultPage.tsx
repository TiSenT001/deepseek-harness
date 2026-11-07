/**
 * The vault workspace page: explorer, reading area, right rail, quick switcher,
 * and the graph. Owns shared view state, the data fetches, and the one action
 * dispatcher every surface calls; layout composition lives in VaultWorkspace.
 * @module dsh-obsidian-vault/client/ui/VaultPage
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createNote } from '../api.ts'
import { createPurCanvas } from './newCanvas.ts'
import { createT } from '../i18n.ts'
import { fileTypeOf } from '../../filetypes.ts'
import { useVaultData } from './useVaultData.ts'
import { activeTab } from './tabs.ts'
import type { PaneHandlers } from './PaneColumn.tsx'
import type { Rail } from './Panels.tsx'
import type { RibbonId } from './Ribbon.tsx'
import { useHeadingShift } from './useHeadingShift.ts'
import { useOverlayState } from './useOverlayState.ts'
import { usePaneWidths } from './usePaneWidths.ts'
import { useResponsivePanes } from './useResponsivePanes.ts'
import { useVaultActions } from './useVaultActions.ts'
import { useAsk } from './kit/index.ts'
import { useVaultAppearance } from './useVaultAppearance.ts'
import { useVaultBookmarks } from './useVaultBookmarks.ts'
import { useVaultCommands } from './useVaultCommands.ts'
import { useVaultShortcuts } from './useVaultShortcuts.ts'
import { useVaultTabs } from './useVaultTabs.ts'
import { readViewMemory, writeViewMemory } from './viewMemory.ts'
import { VaultWorkspace } from './VaultWorkspace.tsx'
import { css, STYLE } from './theme.ts'

/** Props for {@link VaultPage}. */
export interface VaultPageProps {
  /** Directory picking through the Host; absent where the shell has none. */
  readonly pickDirectory?: () => Promise<string | null>
  /** Probe for picker availability, evaluated when the vault manager opens. */
  readonly hasPicker?: () => boolean
}

/**
 * Validate a remembered rail id.
 * @param value - stored rail, possibly absent or stale.
 * @returns the rail when it is one of the panels.
 */
function railOf(value: string | undefined): Rail {
  return value === 'backlinks' || value === 'bookmarks' ? value : 'outline'
}

/**
 * Render the page registered as the `obsidian` main panel.
 */
export function VaultPage({ pickDirectory, hasPicker }: VaultPageProps = {}): JSX.Element {
  // What the user left open last time; read once, before the first paint, so
  // the reading area opens on the same page instead of an empty state.
  const remembered = useRef(readViewMemory())
  const [activeHeading, setActiveHeading] = useState<string | undefined>()
  const [filter, setFilter] = useState('')
  const [rail, setRail] = useState<Rail>(() => railOf(remembered.current?.rail))
  const [view, setView] = useState<'note' | 'graph'>(() => (remembered.current?.view === 'graph' ? 'graph' : 'note'))
  // Reading and source are two views of the same Markdown file; attachments
  // and code files always render through the file view.
  const [sourceMode, setSourceMode] = useState(false)
  const collapseRef = useRef<(() => void) | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  // Each mounted pane registers its reading handlers here, keyed by pane id, so
  // page-level callbacks (outline clicks, vault switches) reach the right one.
  const paneHandlers = useRef<Map<number, PaneHandlers>>(new Map())

  const { lang, variant, setVariant } = useVaultAppearance(rootRef)
  const { railNarrow, treeNarrow, treeOpen, railOpen, setTreeOpen, setRailOpen } = useResponsivePanes()
  const widths = usePaneWidths()
  const tabsApi = useVaultTabs()
  const {
    tabs, panes, activePane, openPath, goBack, goForward, closeTab, mapTabs, splitPane, closePane,
    reset: resetTabs,
  } = tabsApi
  const current = activeTab(tabs)
  const path = current?.path
  const kind = path === undefined ? undefined : fileTypeOf(path).kind
  const isMarkdown = kind === 'markdown'
  const { status, tree, tags, note, backlinks, unlinked, error, setError, reload } = useVaultData(path)
  const t = useMemo(() => createT(lang), [lang])
  // A stale bundle must not render under a newly selected path.
  const activeNote = note !== undefined && note.path === path ? note : undefined
  const activeBacklinks = activeNote === undefined ? [] : backlinks
  const activeUnlinked = activeNote === undefined ? [] : unlinked
  const onHeading = useCallback((text: string) => {
    const pane = panes[activePane]
    if (pane !== undefined) paneHandlers.current.get(pane.id)?.onHeading(text)
  }, [panes, activePane])
  const clearScroll = useCallback(() => {
    for (const handlers of paneHandlers.current.values()) handlers.clear()
  }, [])
  const onShiftHeading = useHeadingShift({ path: isMarkdown ? path : undefined, reload, setError })

  // Restore the page the user left open. The status tells us which vault the
  // record belongs to; a mismatch keeps the first-paint state instead of
  // opening a path that may not exist in this vault.
  const viewRestored = useRef(false)
  useEffect(() => {
    if (viewRestored.current || status === undefined) return
    viewRestored.current = true
    const memory = remembered.current
    if (memory?.path === undefined) return
    if (memory.root !== undefined && memory.root !== status.root) return
    openPath(memory.path)
  }, [openPath, status])

  // Persist whatever the reading area shows. A closed tab keeps the last page,
  // so reopening the knowledge base still lands on it.
  useEffect(() => {
    if (path === undefined || status === undefined) return
    writeViewMemory({ root: status.root, path, view, rail })
  }, [path, rail, status, view])

  const overlays = useOverlayState({ openPath })
  const {
    menu, newTabPending, openQuick, openSearch, openCommands, openTagSearch, toggleQuick,
    closeQuick, openMenu, openVaults, openSettings, closeTransient,
  } = overlays
  const openEdit = useCallback(() => setSourceMode(true), [])
  const openReading = useCallback(() => setSourceMode(false), [])
  const openPurStudio = useCallback(() => { void createPurCanvas(t('purNewCanvas'), openPath).then(() => setView('note')) }, [openPath, t])
  const openNewTab = useCallback(() => {
    newTabPending.current = true
    openQuick()
  }, [newTabPending, openQuick])

  useVaultShortcuts({
    onToggleQuick: toggleQuick,
    onSearch: openSearch,
    onCommands: openCommands,
    onEscape: closeTransient,
    onBack: goBack,
    onForward: goForward,
  })

  // A vault switch invalidates every per-vault view: tabs, filter, and scroll.
  const onVaultSwitched = useCallback(() => {
    resetTabs()
    setFilter('')
    setView('note')
    setActiveHeading(undefined)
    setSourceMode(false)
    clearScroll()
    void reload()
  }, [clearScroll, reload, resetTabs])

  useEffect(() => {
    setSourceMode(false)
  }, [path])

  const selectRibbon = useCallback((id: RibbonId) => {
    if (id === 'graph') {
      setView(value => (value === 'graph' ? 'note' : 'graph'))
      return
    }
    if (id === 'settings') {
      // Settings is an action: it opens the dialog and never stays pressed.
      openSettings()
      return
    }
    if (id === 'rail') {
      // Toggling the rail never changes the main view (graph stays open).
      setRailOpen(value => !value)
      return
    }
    if (id === 'plugin') {
      // Action: write a fresh canvas file and open it in the reading area.
      openPurStudio()
      return
    }
    setView('note')
    if (id === 'search') {
      // Search is an action: it opens the switcher and never stays pressed.
      openSearch()
      return
    }
    const shouldOpen = !treeOpen
    setTreeOpen(shouldOpen)
    if (shouldOpen) setFilter('')
  }, [openPurStudio, openSettings, openSearch, setRailOpen, setTreeOpen, treeOpen])

  const createTarget = useCallback((target: string) => {
    const trimmed = target.trim()
    if (trimmed.length === 0) return
    const next = /\.md$/i.test(trimmed) ? trimmed : `${trimmed}.md`
    void createNote(next)
      .then(async (ok) => {
        if (!ok) {
          setError(t('createFailed'))
          return
        }
        // Publish the new index version before the reading view asks for the
        // note, so the first fetch cannot miss a just-created entry.
        await reload()
        openPath(next)
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : String(cause)))
  }, [openPath, reload, setError, t])

  const ask = useAsk(t)
  const bookmarks = useVaultBookmarks({ root: status?.root, setError })

  const vaultActions = useVaultActions({
    t,
    openPath,
    createTarget,
    mapTabs,
    reload,
    setError,
    closeTab,
    closeOthers: tabsApi.closeOthers,
    closeAllTabs: tabsApi.closeAll,
    pinTab: tabsApi.pinTab,
    splitPane,
    closePane,
    setView,
    setTreeOpen,
    setRailOpen,
    setRail,
    setFilter,
    openQuickSwitcher: openQuick,
    newTabPending,
    collapseRef,
    toggleBookmark: bookmarks.toggle,
    askText: ask.askText,
    askConfirm: ask.askConfirm,
  })

  const { menuGroups, commands, runCommand } = useVaultCommands({
    askText: ask.askText,
    t,
    actions: vaultActions,
    menu,
    tabCount: tabs.items.length,
    closeQuick,
    openSearch,
    openEdit,
    openReading,
    openSettings,
    openVaults,
    openPurStudio,
    closeCurrentTab: () => closeTab(tabs.active),
    openBookmarks: () => {
      setRail('bookmarks')
      setRailOpen(true)
    },
    notePath: isMarkdown ? path : undefined,
    bookmarked: path !== undefined && bookmarks.has(path),
    toggleBookmark: bookmarks.toggle,
    editable: isMarkdown && path !== undefined,
    tree,
    bookmarkEntries: bookmarks.entries,
    openPath,
    reload,
    setError,
    root: status?.root,
    splitPane,
    closePane,
    paneCount: panes.length,
    purPath: path !== undefined && /\.purstudio$/i.test(path) ? path : undefined,
  })

  // The rail reads parsed notes only, so it hides for attachments and code
  // files.
  const showRail = path !== undefined && isMarkdown
  const overlayOpen = (treeNarrow && treeOpen) || (railNarrow && railOpen && showRail)

  return (
    <div className={css.root} ref={rootRef} data-ov-variant={variant}>
      <style>{STYLE}</style>
      <VaultWorkspace
        t={t}
        status={status}
        tabs={tabsApi}
        bookmarks={bookmarks}
        overlays={overlays}
        menuGroups={menuGroups}
        commands={commands}
        pickDirectory={pickDirectory}
        hasPicker={hasPicker}
        view={view}
        rail={rail}
        showRail={showRail}
        overlayOpen={overlayOpen}
        railOpen={railOpen}
        treeOpen={treeOpen}
        treeNarrow={treeNarrow}
        railNarrow={railNarrow}
        widths={widths}
        openMenu={openMenu}
        onToggleRail={() => setRailOpen(value => !value)}
        onSelectRibbon={selectRibbon}
        tree={tree}
        tags={tags}
        path={path}
        filter={filter}
        onFilter={setFilter}
        onTagSearch={openTagSearch}
        actions={vaultActions}
        collapseRef={collapseRef}
        paneHandlers={paneHandlers}
        activeNote={activeNote}
        activeBacklinks={activeBacklinks}
        activeUnlinked={activeUnlinked}
        sourceMode={sourceMode}
        error={error}
        onActiveHeading={setActiveHeading}
        onNewTab={openNewTab}
        reload={reload}
        onReading={openReading}
        onSource={openEdit}
        onShowNoteView={() => setView('note')}
        onOpenWithAnchor={(next, nextAnchor) => openPath(next, { anchor: nextAnchor })}
        onCreateNote={(target) => {
          setView('note')
          createTarget(target)
        }}
        onOpenPath={(next, destination) => {
          if (destination === 'right') {
            // Splitting moves the active tab into the new pane, so open first and
            // let the split carry it to the right half.
            openPath(next, { newTab: true })
            splitPane('row')
            return
          }
          openPath(next, destination === 'new-tab' ? { newTab: true } : {})
        }}
        activeHeading={activeHeading}
        onRail={setRail}
        onHeading={onHeading}
        onShiftHeading={onShiftHeading}
        onClosePanes={() => {
          setTreeOpen(false)
          setRailOpen(false)
        }}
        onQuickCommand={runCommand}
        onVaultSwitched={onVaultSwitched}
        variant={variant}
        onVariant={setVariant}
      />
      {ask.node}
    </div>
  )
}
