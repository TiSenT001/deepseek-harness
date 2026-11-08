/**
 * Scene → menu registry. Each surface names a scene; this module decides which
 * commands it offers, in which group, and what they call. Components never
 * build menu items themselves.
 * @module dsh-obsidian-vault/client/ui/menu/registry
 */
import type { GraphNodeDto } from '../../../protocol.ts'
import type { Translate } from '../../i18n.ts'
import { RAIL_SURFACES, type RailId } from '../kit/index.ts'
import type { MenuActions, MenuGroup, MenuItem } from './types.ts'

/** Every surface the menu knows how to describe. */
export type MenuScene =
  | { readonly kind: 'tree-file'; readonly path: string }
  | { readonly kind: 'tree-dir'; readonly path: string }
  | { readonly kind: 'tree-selection'; readonly paths: readonly string[] }
  | { readonly kind: 'tree-empty'; readonly folder: string }
  | { readonly kind: 'tab'; readonly index: number; readonly path: string; readonly preview: boolean }
  | { readonly kind: 'tabbar-empty' }
  | { readonly kind: 'editor'; readonly path: string; readonly selection: string }
  | { readonly kind: 'graph-node'; readonly node: GraphNodeDto }
  | { readonly kind: 'panel'; readonly rail: RailId }

/** Everything a menu needs besides the scene. */
export interface MenuContext {
  readonly t: Translate
  readonly actions: MenuActions
  /** Every folder path in the vault; `''` is the root. */
  readonly folders: readonly string[]
  /** Bookmarked file paths, so the file menu offers the right toggle label. */
  readonly bookmarks: readonly string[]
  /** Number of open tabs, for Close All's disabled state. */
  readonly tabs: number
  /** Number of open panes, for Close Pane's disabled state. */
  readonly panes: number
}

/**
 * Build the grouped menu for one scene.
 * @param scene - what was right-clicked.
 * @param context - translator, actions, and vault facts.
 * @returns groups separated by rules; empty groups are dropped.
 */
export function buildMenu(scene: MenuScene, context: MenuContext): readonly MenuGroup[] {
  const groups = sceneGroups(scene, context)
  return groups.filter(group => group.length > 0)
}

function sceneGroups(scene: MenuScene, { t, actions, folders, bookmarks, tabs, panes }: MenuContext): readonly MenuGroup[] {
  switch (scene.kind) {
    case 'tree-file':
      return [
        [
          leaf('open', t('open'), () => actions.open(scene.path)),
          leaf('open-new-tab', t('openInNewTab'), () => actions.open(scene.path, { newTab: true })),
        ],
        [
          leaf('rename', t('rename'), () => actions.rename(scene.path)),
          moveEntry([scene.path], folders, actions, t),
          leaf('copy-link', t('copyWikilink'), () => actions.copy(wikilink(scene.path))),
          leaf('graph', t('openInGraph'), () => actions.openGraph(scene.path)),
        ],
        [
          leaf(
            'bookmark',
            bookmarks.includes(scene.path) ? t('bookmarkRemove') : t('bookmarkAdd'),
            () => actions.toggleBookmark(scene.path),
          ),
          leaf('copy-path', t('copyPath'), () => actions.copy(scene.path)),
        ],
        [leaf('delete', t('delete'), () => actions.remove([scene.path]), { danger: true })],
      ]
    case 'tree-dir':
      return [
        [
          leaf('new-note', t('newNoteHere'), () => actions.createNote(scene.path)),
          leaf('new-folder', t('newFolderHere'), () => actions.createFolder(scene.path)),
        ],
        [
          leaf('rename', t('rename'), () => actions.rename(scene.path)),
          moveEntry([scene.path], folders, actions, t),
          leaf('copy-path', t('copyPath'), () => actions.copy(scene.path)),
        ],
        [leaf('delete', t('delete'), () => actions.remove([scene.path]), { danger: true })],
      ]
    case 'tree-selection':
      return [
        [leaf('open-tabs', t('openAllTabs'), () => {
          for (const path of scene.paths) actions.open(path, { newTab: true })
        })],
        [
          moveEntry(scene.paths, folders, actions, t),
          leaf('copy-paths', t('copyPaths'), () => actions.copyPaths(scene.paths)),
        ],
        [leaf('delete', `${t('delete')} · ${scene.paths.length}`, () => actions.remove(scene.paths), { danger: true })],
      ]
    case 'tree-empty':
      return [
        [
          leaf('new-note', scene.folder.length === 0 ? t('newNote') : t('newNoteHere'), () => actions.createNote(scene.folder)),
          leaf('new-folder', scene.folder.length === 0 ? t('newFolder') : t('newFolderHere'), () => actions.createFolder(scene.folder)),
        ],
        [
          leaf('collapse', t('collapseAll'), actions.collapseTree, { icon: 'collapseAll' }),
          leaf('refresh', t('refresh'), actions.reload, { icon: 'refresh' }),
        ],
      ]
    case 'tab':
      return [
        [
          leaf('close', t('closeTab'), () => actions.closeTab(scene.index), { shortcut: 'Ctrl W' }),
          leaf('close-others', t('closeOthers'), () => actions.closeOthers(scene.index)),
          leaf('close-all', t('closeAll'), actions.closeAllTabs, { disabled: tabs === 0 }),
        ],
        scene.preview
          ? [leaf('pin', t('pinTab'), () => actions.pinTab(scene.index))]
          : [],
        [
          leaf('split-right', t('splitRight'), () => actions.splitPane('row')),
          leaf('split-down', t('splitDown'), () => actions.splitPane('column')),
          leaf('close-pane', t('closePane'), actions.closePane, { disabled: panes <= 1 }),
        ],
        [
          leaf('copy-path', t('copyPath'), () => actions.copy(scene.path)),
          leaf('copy-link', t('copyWikilink'), () => actions.copy(wikilink(scene.path))),
          leaf('graph', t('openInGraph'), () => actions.openGraph(scene.path)),
        ],
      ]
    case 'tabbar-empty':
      return [
        [
          leaf('new-tab', t('newTab'), actions.newTab),
          leaf('quick', t('quickSwitch'), actions.quickSwitch, { shortcut: 'Ctrl O' }),
        ],
        [
          leaf('split-right', t('splitRight'), () => actions.splitPane('row')),
          leaf('split-down', t('splitDown'), () => actions.splitPane('column')),
          leaf('close-pane', t('closePane'), actions.closePane, { disabled: panes <= 1 }),
        ],
        [leaf('close-all', t('closeAll'), actions.closeAllTabs, { disabled: tabs === 0 })],
      ]
    case 'editor':
      return [
        [
          leaf('copy-selection', t('copySelection'), () => actions.copy(scene.selection), {
            disabled: scene.selection.trim().length === 0,
            shortcut: 'Ctrl C',
          }),
          leaf('copy-path', t('copyPath'), () => actions.copy(scene.path)),
          leaf('copy-link', t('copyWikilink'), () => actions.copy(wikilink(scene.path))),
        ],
        [
          leaf('graph', t('openInGraph'), () => actions.openGraph(scene.path), { icon: 'graph' }),
          leaf('refresh', t('refresh'), actions.reload, { icon: 'refresh' }),
        ],
      ]
    case 'graph-node':
      return graphGroups(scene.node, actions, t)
    case 'panel':
      return [
        RAIL_SURFACES.map(surface =>
          leaf(surface.id, t(surface.label), () => actions.setRail(surface.id), { checked: scene.rail === surface.id })),
        [leaf('toggle-rail', t('toggleRail'), actions.toggleRail, { icon: 'panelRight' })],
      ]
  }
}

function graphGroups(node: GraphNodeDto, actions: MenuActions, t: Translate): readonly MenuGroup[] {
  const kind = node.kind ?? 'note'
  if (kind === 'unresolved') {
    return [
      [leaf('create', t('create'), () => actions.createTarget(node.title))],
      [leaf('copy-link', t('copyWikilink'), () => actions.copy(wikilink(node.title)))],
    ]
  }
  if (kind === 'tag') {
    const tag = node.tags?.[0] ?? node.title.replace(/^#/, '')
    return [[leaf('filter-tag', t('filterTag'), () => actions.filterTag(tag))]]
  }
  if (kind === 'attachment') {
    return [[leaf('copy-path', t('copyPath'), () => actions.copy(node.path))]]
  }
  const tag = node.tags?.[0]
  return [
    [
      leaf('open', t('open'), () => actions.open(node.path)),
      leaf('open-new-tab', t('openInNewTab'), () => actions.open(node.path, { newTab: true })),
    ],
    [
      leaf('copy-path', t('copyPath'), () => actions.copy(node.path)),
      leaf('copy-link', t('copyWikilink'), () => actions.copy(wikilink(node.path))),
      ...(tag === undefined ? [] : [leaf('filter-tag', t('filterTag'), () => actions.filterTag(tag))]),
    ],
  ]
}

/** The Move To submenu, or a disabled row when no other folder exists. */
function moveEntry(
  paths: readonly string[],
  folders: readonly string[],
  actions: MenuActions,
  t: Translate,
): MenuItem {
  const parents = new Set(paths.map(parentOf))
  const targets = folders
    .filter(folder => paths.every(path => folder !== path && !folder.startsWith(`${path}/`)))
    .filter(folder => !parents.has(folder))
    .sort((left, right) => (left === '' ? -1 : right === '' ? 1 : left.localeCompare(right, 'zh')))
  const children: readonly MenuItem[] = targets.map(folder =>
    leaf(`move:${folder}`, folder.length === 0 ? t('vaultRoot') : folder, () => actions.move(paths, folder)))
  return {
    id: 'move',
    label: t('moveTo'),
    disabled: children.length === 0,
    children,
  }
}

function parentOf(path: string): string {
  const slash = path.lastIndexOf('/')
  return slash === -1 ? '' : path.slice(0, slash)
}

/** `[[stem]]`, the form Obsidian's Copy Wikilink writes for a vault path. */
function wikilink(path: string): string {
  const stem = path.replace(/\.md$/i, '')
  return `[[${stem}]]`
}

function leaf(
  id: string,
  label: string,
  onSelect: () => void,
  extra: Omit<MenuItem, 'id' | 'label' | 'onSelect'> = {},
): MenuItem {
  return { id, label, onSelect, ...extra }
}
