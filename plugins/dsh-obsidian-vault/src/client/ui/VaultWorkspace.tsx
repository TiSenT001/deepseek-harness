/**
 * Pure layout composition for the vault workspace: top bar, ribbon, explorer,
 * main panes, right rail, scrim, status bar, and overlays. VaultPage owns all
 * state and data fetches; this component only places the pieces.
 * @module dsh-obsidian-vault/client/ui/VaultWorkspace
 */
import { useMemo, type ComponentProps, type CSSProperties } from 'react'
import type { Translate } from '../i18n.ts'
import { ExplorerColumn } from './ExplorerColumn.tsx'
import { MainColumn } from './MainColumn.tsx'
import { vaultNameOf } from './paths.ts'
import { RailColumn } from './RailColumn.tsx'
import { Ribbon } from './Ribbon.tsx'
import { StatusBar } from './StatusBar.tsx'
import { activeTab } from './tabs.ts'
import { TopBar } from './TopBar.tsx'
import type { useOverlayState } from './useOverlayState.ts'
import type { usePaneWidths } from './usePaneWidths.ts'
import type { useVaultBookmarks } from './useVaultBookmarks.ts'
import type { CommandSurface } from './useCommandSurface.ts'
import type { useVaultTabs } from './useVaultTabs.ts'
import { VaultOverlays } from './VaultOverlays.tsx'
import { css } from './theme.ts'

type TopBarProps = ComponentProps<typeof TopBar>
type RibbonProps = ComponentProps<typeof Ribbon>
type ExplorerProps = ComponentProps<typeof ExplorerColumn>
type MainProps = ComponentProps<typeof MainColumn>
type RailProps = ComponentProps<typeof RailColumn>
type StatusProps = ComponentProps<typeof StatusBar>
type OverlayProps = ComponentProps<typeof VaultOverlays>

/** Inline custom properties that size the docked columns. */
export type WidthVars = CSSProperties & {
  readonly '--ov-left-width': string
  readonly '--ov-right-width': string
}

/** Every value the workspace surfaces render, flat and grouped by surface. */
export interface VaultWorkspaceProps {
  readonly t: Translate
  readonly status: StatusProps['status']
  /** The whole tab/pane hook result; the columns read their slices from it. */
  readonly tabs: ReturnType<typeof useVaultTabs>
  /** Action cards shown while no tab is open. */
  readonly emptyActions?: MainProps['emptyActions']
  /** Open the quick switcher from the empty tab's search row. */
  readonly onEmptySearch?: MainProps['onEmptySearch']
  readonly bookmarks: ReturnType<typeof useVaultBookmarks>
  readonly overlays: ReturnType<typeof useOverlayState>
  readonly menuGroups: CommandSurface['menuGroups']
  readonly commands: CommandSurface['commands']
  readonly pickDirectory: OverlayProps['pickDirectory']
  readonly hasPicker: OverlayProps['hasPicker']
  readonly view: MainProps['view']
  readonly rail: RailProps['rail']
  readonly showRail: boolean
  readonly overlayOpen: boolean
  readonly railOpen: boolean
  readonly treeOpen: boolean
  readonly treeNarrow: boolean
  readonly railNarrow: boolean
  readonly widths: ReturnType<typeof usePaneWidths>
  /** Scene-based menu opener shared by the explorer, main column, and rail. */
  readonly openMenu: ExplorerProps['onMenu']
  readonly onToggleRail: TopBarProps['onToggleRail']
  readonly onSelectRibbon: RibbonProps['onSelect']
  readonly tree: ExplorerProps['nodes']
  readonly tags: ExplorerProps['tags']
  readonly path: ExplorerProps['activePath']
  readonly filter: ExplorerProps['filter']
  readonly onFilter: ExplorerProps['onFilter']
  readonly onTagSearch: ExplorerProps['onTag']
  readonly actions: ExplorerProps['actions']
  readonly collapseRef: ExplorerProps['collapseRef']
  readonly paneHandlers: MainProps['paneHandlers']
  readonly activeNote: MainProps['activeNote']
  readonly activeBacklinks: MainProps['activeBacklinks']
  readonly activeUnlinked: RailProps['unlinked']
  readonly sourceMode: MainProps['sourceMode']
  readonly error: MainProps['error']
  readonly onActiveHeading: MainProps['onActiveHeading']
  readonly onNewTab: MainProps['onNewTab']
  /** Index reload; the main column wraps it for Retry and Saved. */
  readonly reload: () => Promise<void>
  readonly onReading: MainProps['onReading']
  readonly onSource: MainProps['onSource']
  /** Switch the main column back from the graph to the note view. */
  readonly onShowNoteView: () => void
  readonly onOpenWithAnchor: MainProps['onOpen']
  readonly onCreateNote: MainProps['onCreate']
  readonly onOpenPath: (path: string, destination?: 'current' | 'new-tab' | 'right') => void
  readonly activeHeading: RailProps['activeHeading']
  readonly onRail: RailProps['onRail']
  readonly onHeading: RailProps['onHeading']
  readonly onShiftHeading: RailProps['onShiftHeading']
  /** Close both drawer panes; the narrow-layout scrim calls it. */
  readonly onClosePanes: () => void
  readonly onQuickCommand: OverlayProps['onQuickCommand']
  readonly onVaultSwitched: OverlayProps['onVaultSwitched']
  /** Active appearance variant shown in the settings dialog. */
  readonly variant: OverlayProps['variant']
  readonly onVariant: OverlayProps['onVariant']
}

/**
 * Place the workspace surfaces.
 * @param props - every value the surfaces render, flat.
 */
export function VaultWorkspace(props: VaultWorkspaceProps): JSX.Element {
  const {
    t, status, tabs, bookmarks, overlays, menuGroups, commands, pickDirectory, hasPicker,
    view, rail, showRail, overlayOpen, railOpen, treeOpen, treeNarrow, railNarrow, widths,
    openMenu, onToggleRail, onSelectRibbon, tree, tags, path, filter, onFilter,
    onTagSearch, actions, collapseRef, paneHandlers, activeNote, activeBacklinks, activeUnlinked,
    sourceMode, error, onActiveHeading, onNewTab, reload, onReading, onSource, onShowNoteView,
    onOpenWithAnchor, onCreateNote, onOpenPath, activeHeading, onRail,
    onHeading, onShiftHeading, onClosePanes, onQuickCommand, onVaultSwitched, variant, onVariant,
    emptyActions, onEmptySearch,
  } = props
  const history = activeTab(tabs.tabs)?.history ?? { items: [], index: -1 }
  const labels = useMemo<MainProps['labels']>(() => ({
    code: { copyLabel: t('copyLabel'), copiedLabel: t('copiedLabel') },
    footnotes: t('footnotes'),
  }), [t])
  const widthVars: WidthVars = {
    '--ov-left-width': `${widths.left}px`,
    '--ov-right-width': `${widths.right}px`,
  }

  return (
    <>
      <TopBar
        t={t}
        vaultName={vaultNameOf(status?.root) ?? t('vault')}
        canBack={history.index > 0}
        canForward={history.index < history.items.length - 1}
        railOpen={railOpen}
        onBack={tabs.goBack}
        onForward={tabs.goForward}
        onRefresh={() => {
          void reload()
        }}
        onToggleRail={onToggleRail}
        onSwitchVault={overlays.openVaults}
      />
      <div className={css.shell}>
        <Ribbon
          t={t}
          active={treeOpen ? 'files' : undefined}
          graphOpen={view === 'graph'}
          railOpen={railOpen && showRail}
          onSelect={onSelectRibbon}
        />
        <div className={css.body} style={widthVars}>
          <ExplorerColumn
            t={t}
            nodes={tree}
            tags={tags}
            activePath={path}
            filter={filter}
            onFilter={onFilter}
            onTag={onTagSearch}
            actions={actions}
            onMenu={openMenu}
            collapseRef={collapseRef}
            narrow={treeNarrow}
            open={treeOpen}
            width={widths.left}
            onResize={(width) => widths.setWidth('left', width)}
            onResetWidth={() => widths.resetWidth('left')}
          />
          <MainColumn
            t={t}
            labels={labels}
            vaultName={vaultNameOf(status?.root) ?? t('vault')}
            emptyActions={emptyActions}
            onEmptySearch={onEmptySearch}
            panes={tabs.panes}
            activePane={tabs.activePane}
            direction={tabs.direction}
            paneHandlers={paneHandlers}
            onResizePane={tabs.resizePanePair}
            version={status?.version}
            view={view}
            activeNote={activeNote}
            activeBacklinks={activeBacklinks}
            anchor={tabs.anchor}
            sourceMode={sourceMode}
            error={error}
            onActivatePane={tabs.activatePane}
            onActiveHeading={onActiveHeading}
            onSelectTab={tabs.selectTab}
            onCloseTab={tabs.closeTab}
            onPinTab={tabs.pinTab}
            onNewTab={onNewTab}
            onMoveTab={tabs.moveTabTo}
            onSplitTab={(targetPaneId, sourcePaneId, sourceIndex, side) => {
              tabs.splitWithTab(targetPaneId, sourcePaneId, sourceIndex, side)
            }}
            onRetry={() => {
              void reload()
            }}
            onReading={onReading}
            onSwitchToReading={onShowNoteView}
            onSource={onSource}
            onSaved={() => {
              void reload()
            }}
            onOpen={(next, argument) => {
              // The canvas pane reuses this prop for its open destinations; a note
              // anchor arrives as a plain heading string instead.
              if (argument === 'current' || argument === 'new-tab' || argument === 'right') {
                onOpenPath(next, argument)
                return
              }
              onOpenWithAnchor(next, argument)
            }}
            onCreate={onCreateNote}
            onTag={onTagSearch}
            onPathFilter={onFilter}
            onMenu={openMenu}
            onCenter={onOpenPath}
            onCloseGraph={onShowNoteView}
            onOpenSettings={overlays.openSettings}
          />
          {showRail
            ? (
              <RailColumn
                t={t}
                rail={rail}
                note={activeNote}
                backlinks={activeBacklinks}
                unlinked={activeUnlinked}
                activeHeading={activeHeading}
                bookmarks={bookmarks.entries}
                onRail={onRail}
                onOpen={onOpenPath}
                onHeading={onHeading}
                onShiftHeading={onShiftHeading}
                onRemoveBookmark={bookmarks.remove}
                onMenu={openMenu}
                narrow={railNarrow}
                open={railOpen}
                width={widths.right}
                onResize={(width) => widths.setWidth('right', width)}
                onResetWidth={() => widths.resetWidth('right')}
              />
            )
            : null}
          {overlayOpen
            ? (
              <button
                type="button"
                className={css.scrim}
                aria-label={t('close')}
                onClick={onClosePanes}
              />
            )
            : null}
        </div>
      </div>
      <StatusBar
        t={t}
        status={status}
        note={activeNote}
        backlinks={activeBacklinks}
        unlinked={activeUnlinked}
        view={view}
      />
      <VaultOverlays
        t={t}
        quick={overlays.quick}
        menu={overlays.menu === undefined || menuGroups === undefined ? undefined : {
          x: overlays.menu.x,
          y: overlays.menu.y,
          groups: menuGroups,
        }}
        vaultOpen={overlays.vaultOpen}
        settingsOpen={overlays.settingsOpen}
        variant={variant}
        commands={commands}
        {...(pickDirectory === undefined ? {} : { pickDirectory })}
        {...(hasPicker === undefined ? {} : { hasPicker })}
        onQuickOpen={overlays.onQuickOpen}
        onQuickCommand={onQuickCommand}
        onQuickClose={overlays.closeQuick}
        onMenuClose={overlays.closeMenu}
        onVaultSwitched={onVaultSwitched}
        onVaultClose={overlays.closeVaults}
        onVariant={onVariant}
        onSettingsClose={overlays.closeSettings}
      />
    </>
  )
}
