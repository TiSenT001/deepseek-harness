/**
 * The palette's command registry. Every entry runs through the page's action
 * dispatcher, so the command mode never introduces a second mutation path.
 * @module dsh-obsidian-vault/client/ui/commands
 */
import type { Translate } from '../i18n.ts'
import type { PurPaneHandlers } from '../pur/pane-commands.ts'
import type { MenuActions } from './menu/types.ts'

/** One runnable palette command. */
export interface CommandEntry {
  readonly id: string
  readonly label: string
  /** Secondary line, usually the matching keyboard shortcut. */
  readonly hint?: string
  readonly run: () => void
}

/** Page callbacks the registry needs beyond the menu actions. */
export interface CommandContext {
  readonly t: Translate
  readonly actions: MenuActions
  /** Open the palette in full-text search mode. */
  readonly openSearch: () => void
  /** Show the source editor for the active Markdown note. */
  readonly openEdit: () => void
  /** Leave the editor for the reading view. */
  readonly openReading: () => void
  /** Open the settings dialog (appearance and plugins). */
  readonly openSettings: () => void
  readonly openVaults: () => void
  /** Open the bridged Pur Studio view in the main column. */
  readonly openPurStudio: () => void
  readonly closeCurrentTab: () => void
  /** Open the rail on the bookmarks tab. */
  readonly openBookmarks: () => void
  /** Active Markdown note, or `undefined` when the tab cannot be bookmarked. */
  readonly notePath: string | undefined
  /** Whether {@link notePath} is already bookmarked. */
  readonly bookmarked: boolean
  readonly toggleBookmark: (path: string) => void
  /** Whether the active tab can be edited (a Markdown note is open). */
  readonly editable: boolean
  /** Commands contributed by other page modules, such as daily notes. */
  readonly extra: readonly CommandEntry[]
}

/**
 * Build the Pur Studio palette entries for the active `.PurStudio` pane,
 * mirroring upstream's command surface. Both save entries dispatch to the same
 * save-as verb, as upstream routes both ids through one flow.
 * @param t - the workspace translator.
 * @param handlers - the active pane's verbs, or undefined while it is not ready.
 * @returns the entries; empty without handlers.
 */
export function buildPurPaneCommands(t: Translate, handlers: PurPaneHandlers | undefined): readonly CommandEntry[] {
  if (handlers === undefined) return []
  return [
    { id: 'pur.newCanvas', label: t('pur.newCanvas'), run: handlers.newCanvas },
    { id: 'pur.saveStudioAs', label: t('pur.cmdSaveStudioAs'), run: handlers.saveStudioAs },
    { id: 'pur.saveAs', label: t('pur.cmdSaveAs'), run: handlers.saveStudioAs },
    { id: 'pur.delete', label: t('pur.cmdDelete'), run: handlers.deleteSelection },
    { id: 'pur.group', label: t('pur.cmdGroup'), run: handlers.group },
    { id: 'pur.ungroup', label: t('pur.cmdUngroup'), run: handlers.ungroup },
    { id: 'pur.duplicate', label: t('pur.cmdDuplicate'), run: handlers.duplicate },
    { id: 'pur.fitView', label: t('pur.cmdFitView'), run: handlers.fitView },
    { id: 'pur.exportMd', label: t('pur.cmdExportMd'), run: handlers.exportMarkdown },
    { id: 'pur.selectAll', label: t('pur.cmdSelectAll'), run: handlers.selectAll },
    { id: 'pur.undo', label: t('pur.cmdUndo'), run: handlers.undo },
    { id: 'pur.redo', label: t('pur.cmdRedo'), run: handlers.redo },
    { id: 'pur.copy', label: t('pur.cmdCopy'), run: handlers.copy },
    { id: 'pur.paste', label: t('pur.cmdPaste'), run: handlers.paste },
    { id: 'pur.popout', label: t('pur.cmdPopout'), run: handlers.popout },
  ]
}

/**
 * Build the command list for the current page state.
 * @param context - translator, the action dispatcher, and page callbacks.
 * @returns the commands the palette lists and runs.
 */
export function buildCommands(context: CommandContext): readonly CommandEntry[] {
  const {
    t, actions, openSearch, openEdit, openReading, openSettings, openVaults, openPurStudio,
    closeCurrentTab, openBookmarks,
    notePath, bookmarked, toggleBookmark, editable, extra,
  } = context
  const view: readonly CommandEntry[] = editable
    ? [
      { id: 'view.edit', label: t('modeEdit'), hint: 'Ctrl+E', run: openEdit },
      { id: 'view.reading', label: t('reading'), run: openReading },
    ]
    : []
  const bookmark: readonly CommandEntry[] = notePath === undefined
    ? []
    : [{
      id: 'bookmark.toggle',
      label: bookmarked ? t('bookmarkRemove') : t('bookmarkAdd'),
      run: () => toggleBookmark(notePath),
    }]
  return [
    { id: 'note.new', label: t('newNote'), run: () => actions.createNote('') },
    { id: 'folder.new', label: t('newFolder'), run: () => actions.createFolder('') },
    ...extra,
    { id: 'file.quick', label: t('quickSwitch'), hint: 'Ctrl+O', run: actions.quickSwitch },
    { id: 'search.full', label: t('search'), hint: 'Ctrl+F', run: openSearch },
    ...view,
    ...bookmark,
    { id: 'tab.close', label: t('closeTab'), run: closeCurrentTab },
    { id: 'graph.show', label: t('graph'), run: actions.showGraph },
    { id: 'plugin.purStudio', label: t('openPurStudio'), run: openPurStudio },
    { id: 'rail.backlinks', label: t('backlinks'), run: () => actions.setRail('backlinks') },
    { id: 'bookmarks.show', label: t('bookmarks'), run: openBookmarks },
    { id: 'explorer.toggle', label: t('toggleExplorer'), run: actions.toggleExplorer },
    { id: 'rail.toggle', label: t('toggleRail'), run: actions.toggleRail },
    { id: 'tree.collapse', label: t('collapseAll'), run: actions.collapseTree },
    { id: 'index.refresh', label: t('refresh'), run: actions.reload },
    { id: 'settings.open', label: t('settings'), run: openSettings },
    { id: 'vault.switch', label: t('switchVault'), run: openVaults },
  ]
}
