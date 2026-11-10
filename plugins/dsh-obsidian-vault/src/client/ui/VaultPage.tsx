/**
 * The vault workspace page: explorer, reading area, right rail, quick switcher,
 * and the graph. Owns shared view state, the data fetches, and the one action
 * dispatcher every surface calls; layout composition lives in VaultWorkspace.
 * @module dsh-obsidian-vault/client/ui/VaultPage
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createNote, fetchNote, saveNote } from '../api.ts'
import { createPurCanvas } from './newCanvas.ts'
import { createT } from '../i18n.ts'
import { fileTypeOf } from '../../filetypes.ts'
import { useVaultData } from './useVaultData.ts'
import { activeTab } from './tabs.ts'
import { panesFromSaved, savedFromPanes } from './panes.ts'
import type { PaneHandlers } from './PaneColumn.tsx'
import type { CommandEntry } from './commands.ts'
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
import { readHostViewMemory, readViewMemory, writeHostViewMemory, writeViewMemory, type ViewMemory, type WorkspaceLayout } from './viewMemory.ts'
import { WorkspaceLayoutsDialog } from './WorkspaceLayoutsDialog.tsx'
import { TemplatePickerDialog } from './TemplatePickerDialog.tsx'
import { applyTemplate, templateNotes, templateTargetPath } from './templates.ts'
import { type VaultEmptyAction } from './VaultEmptyState.tsx'
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
  /** Workspace restored before the first paint, so tabs never flash empty. */
  const restoredWorkspace = remembered.current?.workspace
  /** Last real tab path; kept while the graph view shows without a tab. */
  const lastPathRef = useRef(remembered.current?.path)
  const [activeHeading, setActiveHeading] = useState<string | undefined>()
  const [filter, setFilter] = useState('')
  const [rail, setRail] = useState<Rail>(() => railOf(remembered.current?.rail))
  const [view, setView] = useState<'note' | 'graph'>(() => (remembered.current?.view === 'graph' ? 'graph' : 'note'))
  /** Newest first; the empty start page lists these. */
  const [recent, setRecent] = useState<readonly string[]>(() => remembered.current?.recent ?? [])
  /** Obsidian-style named layouts saved for this vault. */
  const [layouts, setLayouts] = useState<readonly WorkspaceLayout[]>(() => remembered.current?.layouts ?? [])
  const [layoutsOpen, setLayoutsOpen] = useState(false)
  const [templatesOpen, setTemplatesOpen] = useState(false)
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
  const tabsApi = useVaultTabs(restoredWorkspace === undefined ? undefined : panesFromSaved(restoredWorkspace))
  const {
    tabs, panes, activePane, direction, openPath, goBack, goForward, closeTab, mapTabs, splitPane, closePane,
    reset: resetTabs, restore: restoreTabs, selectTab, newTab: addEmptyTab,
  } = tabsApi
  const current = activeTab(tabs)
  /** The empty new-tab page has no file; the reading area shows the start page. */
  const path = current?.path === '' ? undefined : current?.path
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
  const viewRestored = useRef(restoredWorkspace !== undefined)
  useEffect(() => {
    if (status === undefined) return
    const local = remembered.current
    // A record from another vault must not restore tabs, view, or a path.
    if (local?.root !== undefined && local.root !== status.root) {
      resetTabs()
      setView('note')
      setRail('outline')
      setLayouts([])
      viewRestored.current = true
      return
    }
    if (viewRestored.current) return
    const apply = (memory: ViewMemory, withTabs: boolean): void => {
      if (withTabs && memory.workspace !== undefined) restoreTabs(panesFromSaved(memory.workspace))
      if (memory.view !== undefined) setView(memory.view)
      if (memory.rail !== undefined) setRail(railOf(memory.rail))
      if (memory.recent !== undefined) setRecent(memory.recent)
      if (memory.layouts !== undefined) setLayouts(memory.layouts)
      // A legacy record has no workspace and only remembers the active path.
      if (memory.workspace === undefined && memory.path !== undefined) openPath(memory.path)
    }
    if (local !== undefined) {
      viewRestored.current = true
      apply(local, false)
      return
    }
    // No local record (another browser profile, or site data was cleared):
    // fall back to the Host copy before showing the empty tab.
    let cancelled = false
    void readHostViewMemory(status.root).then((host) => {
      if (cancelled || viewRestored.current) return
      viewRestored.current = true
      if (host !== undefined) apply(host, true)
    })
    return () => {
      cancelled = true
    }
  }, [openPath, resetTabs, restoreTabs, status])

  // Every visited document joins the recent list; reopening one moves it back
  // to the front instead of duplicating the entry.
  useEffect(() => {
    if (path === undefined) return
    setRecent(previous => [path, ...previous.filter(item => item !== path)].slice(0, 8))
  }, [path])

  // Persist whatever the reading area shows, including every pane and tab, so a
  // restart restores the workspace instead of only the active note.
  useEffect(() => {
    if (status === undefined) return
    // Until the remembered page is applied (local record or Host fallback), a
    // write would replace the Host copy with the first-paint state and lose it.
    if (!viewRestored.current) return
    if (path !== undefined) lastPathRef.current = path
    const memory = {
      root: status.root,
      ...(lastPathRef.current === undefined ? {} : { path: lastPathRef.current }),
      view,
      rail,
      workspace: savedFromPanes({ panes, active: activePane, direction, nextId: panes.length }),
      ...(recent.length === 0 ? {} : { recent }),
      ...(layouts.length === 0 ? {} : { layouts }),
    }
    writeViewMemory(memory)
    writeHostViewMemory(status.root, memory)
  }, [activePane, direction, layouts, panes, path, rail, recent, status, view])

  const overlays = useOverlayState({ openPath })
  const {
    menu, newTabPending, openQuick, openSearch, openCommands, openTagSearch, toggleQuick,
    closeQuick, openMenu, openVaults, openSettings, closeTransient,
  } = overlays
  const openEdit = useCallback(() => setSourceMode(true), [])
  const openReading = useCallback(() => setSourceMode(false), [])
  const openPurStudio = useCallback(() => { void createPurCanvas(t('purNewCanvas'), openPath).then(() => setView('note')) }, [openPath, t])
  const openNewTab = useCallback(() => {
    addEmptyTab()
  }, [addEmptyTab])
  /** Save the current panes, tabs, view, and rail under a name. */
  const saveLayout = useCallback((name: string) => {
    const layout: WorkspaceLayout = {
      name,
      workspace: savedFromPanes({ panes, active: activePane, direction, nextId: panes.length }),
      view,
      rail,
      savedAt: Date.now(),
    }
    setLayouts(previous => [layout, ...previous.filter(item => item.name !== name)].slice(0, 20))
  }, [activePane, direction, panes, rail, view])
  /** Replace the current arrangement with a saved one. */
  const applyLayout = useCallback((layout: WorkspaceLayout) => {
    restoreTabs(panesFromSaved(layout.workspace))
    setView(layout.view)
    setRail(railOf(layout.rail))
    setSourceMode(false)
  }, [restoreTabs])
  const deleteLayout = useCallback((name: string) => {
    setLayouts(previous => previous.filter(item => item.name !== name))
  }, [])
  /** Seeded notes under `模板/`, offered by the template dialog. */
  const templates = useMemo(() => templateNotes(tree), [tree])
  const createFromTemplate = useCallback((templatePath: string, title: string) => {
    void (async () => {
      try {
        const target = templateTargetPath(title)
        const source = await fetchNote(templatePath)
        const body = applyTemplate(source.content, { title, date: new Date() })
        if (!(await createNote(target))) {
          setError(t('createFailed'))
          return
        }
        await saveNote(target, body)
        await reload()
        openPath(target)
        setTemplatesOpen(false)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause))
      }
    })()
  }, [openPath, reload, setError, t])

  useVaultShortcuts({
    onToggleQuick: toggleQuick,
    onSearch: openSearch,
    onCommands: openCommands,
    onNewTab: openNewTab,
    onNextTab: () => {
      if (tabs.items.length > 1) selectTab((tabs.active + 1) % tabs.items.length)
    },
    onPrevTab: () => {
      if (tabs.items.length > 1) selectTab((tabs.active - 1 + tabs.items.length) % tabs.items.length)
    },
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
    setLayouts([])
    setTemplatesOpen(false)
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
    addEmptyTab,
    collapseRef,
    toggleBookmark: bookmarks.toggle,
    askText: ask.askText,
    askConfirm: ask.askConfirm,
  })

  const emptyActions = useMemo<readonly VaultEmptyAction[]>(() => [
    { id: 'new-note', label: t('newNote'), hint: 'Ctrl+N', icon: 'newNote', run: () => vaultActions.createNote('') },
    { id: 'open-note', label: t('openNote'), hint: 'Ctrl+O', icon: 'note', run: openQuick },
    { id: 'new-canvas', label: t('purNewCanvas'), icon: 'canvas', run: openPurStudio },
    { id: 'graph', label: t('graph'), icon: 'graph', run: () => setView('graph') },
    { id: 'search', label: t('searchAll'), hint: 'Ctrl+F', icon: 'search', run: openSearch },
    { id: 'switch-vault', label: t('switchVault'), icon: 'files', run: openVaults },
  ], [openPurStudio, openQuick, openSearch, openVaults, t, vaultActions])

  const layoutCommands = useMemo<readonly CommandEntry[]>(() => [
    { id: 'workspace.layouts', label: `${t('workspaces')}…`, run: () => setLayoutsOpen(true) },
    { id: 'templates.new', label: `${t('newFromTemplate')}…`, run: () => setTemplatesOpen(true) },
  ], [t])

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
    pageCommands: layoutCommands,
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
        emptyActions={emptyActions}
        onEmptySearch={openQuick}
        recentPaths={recent}
        onOpenRecent={openPath}
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
        onQuickReplaced={() => { void reload() }}
        onVaultSwitched={onVaultSwitched}
        variant={variant}
        onVariant={setVariant}
      />
      {templatesOpen
        ? (
          <TemplatePickerDialog
            t={t}
            templates={templates}
            onCreate={createFromTemplate}
            onClose={() => setTemplatesOpen(false)}
          />
        )
        : null}
      {layoutsOpen
        ? (
          <WorkspaceLayoutsDialog
            t={t}
            layouts={layouts}
            onSave={saveLayout}
            onApply={applyLayout}
            onDelete={deleteLayout}
            onClose={() => setLayoutsOpen(false)}
          />
        )
        : null}
      {ask.node}
    </div>
  )
}
