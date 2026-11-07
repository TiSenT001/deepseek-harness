/**
 * The vault explorer: collapse-all, multi-select, the scene-based context menu,
 * inline creation of notes and folders, drag-to-move, a local name/path filter,
 * and a collapsible tag section whose chips open full-text search.
 * @module dsh-obsidian-vault/client/ui/Explorer
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { TagCountDto, TreeNodeDto } from '../../protocol.ts'
import { ExplorerToolbar } from './explorer/Toolbar.tsx'
import { collectPaths, filterTree, flatten, folderOf, pruneToNotes, sorted, type Row } from './explorer/model.ts'
import { readNotesOnly, writeNotesOnly } from './explorer/prefs.ts'
import { EmptyState } from './kit/index.ts'
import type { Translate } from '../i18n.ts'
import type { MenuScene } from './menu/registry.ts'
import type { MenuActions } from './menu/types.ts'
import { css } from './theme.ts'

/** Props for {@link Explorer}. */
export interface ExplorerProps {
  readonly t: Translate
  readonly nodes: readonly TreeNodeDto[]
  readonly tags: readonly TagCountDto[]
  readonly activePath: string | undefined
  /** Local tree filter text; never triggers a search request. */
  readonly filter: string
  readonly onFilter: (value: string) => void
  /** Tag chips search the vault for `#tag`. */
  readonly onTag: (tag: string) => void
  readonly actions: MenuActions
  /** Ask the page to open the shared context menu for one scene. */
  readonly onMenu: (scene: MenuScene, x: number, y: number) => void
  /** Lets the page's Collapse All command reach the tree's expand state. */
  readonly collapseRef: { current: (() => void) | null }
  /** Extra classes, used by the narrow-screen drawer state. */
  readonly className?: string
}

/**
 * Render the note tree.
 * @param props - tree data, filter text, and file actions.
 */
export function Explorer({
  t, nodes, tags, activePath, filter, onFilter, onTag, actions, onMenu, collapseRef, className,
}: ExplorerProps): JSX.Element {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set<string>())
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set<string>())
  const [dragging, setDragging] = useState<string | undefined>()
  const [dropTarget, setDropTarget] = useState<string | undefined>()
  const [tagsOpen, setTagsOpen] = useState(true)
  const [notesOnly, setNotesOnly] = useState(readNotesOnly)

  const toggleNotesOnly = useCallback(() => {
    setNotesOnly((current) => {
      const next = !current
      writeNotesOnly(next)
      return next
    })
  }, [])

  useEffect(() => {
    collapseRef.current = () => setExpanded(new Set())
    return () => {
      collapseRef.current = null
    }
  }, [collapseRef])

  useEffect(() => {
    if (activePath === undefined) return
    setExpanded((previous) => {
      const next = new Set(previous)
      const parts = activePath.split('/')
      for (let index = 1; index < parts.length; index += 1) next.add(parts.slice(0, index).join('/'))
      return next
    })
  }, [activePath])

  // Selected rows disappear with a filter, rename, or delete; dropping the
  // stale paths keeps the next multi-selection menu honest.
  useEffect(() => {
    setSelected((previous) => {
      const alive = new Set<string>()
      collectPaths(nodes, alive)
      const next = new Set([...previous].filter(path => alive.has(path)))
      return next.size === previous.size ? previous : next
    })
  }, [nodes])

  const query = filter.trim()
  const rows = useMemo(() => {
    const base = notesOnly ? pruneToNotes(sorted(nodes)) : sorted(nodes)
    const visible: Row[] = []
    // A filter reveals matches wherever they are, so every folder counts as
    // expanded while a query is active.
    flatten(filterTree(base, query), 0, query.length === 0 ? expanded : allFolders(nodes), visible)
    return visible
  }, [nodes, expanded, query, notesOnly])

  const label = (node: TreeNodeDto): string =>
    node.kind === 'dir' ? node.name : node.name.replace(/\.md$/i, '')

  const openNodeMenu = (node: TreeNodeDto, x: number, y: number): void => {
    if (selected.has(node.path) && selected.size > 1) {
      onMenu({ kind: 'tree-selection', paths: [...selected] }, x, y)
      return
    }
    onMenu(node.kind === 'dir'
      ? { kind: 'tree-dir', path: node.path }
      : { kind: 'tree-file', path: node.path }, x, y)
  }

  const toggleSelected = (path: string): void => {
    setSelected((previous) => {
      const next = new Set(previous)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const move = (from: string, folder: string): void => {
    setDragging(undefined)
    setDropTarget(undefined)
    if (from.length > 0 && from !== folder) actions.move([from], folder)
  }

  return (
    <section className={`${css.explorer} ${className ?? ''}`.trim()}>
      <ExplorerToolbar
        t={t}
        folder={folderOf(activePath)}
        onCreateNote={actions.createNote}
        onCreateFolder={actions.createFolder}
        onCollapseAll={() => setExpanded(new Set())}
        notesOnly={notesOnly}
        onToggleNotesOnly={toggleNotesOnly}
      />
      <input
        className={css.filter}
        value={filter}
        placeholder={t('filterPlaceholder')}
        aria-label={t('filterPlaceholder')}
        onChange={(event) => onFilter(event.target.value)}
      />
      <div
        className={`${css.tree} ${dropTarget === '' ? css.dropTarget : ''}`.trim()}
        onContextMenu={(event) => {
          event.preventDefault()
          onMenu({ kind: 'tree-empty', folder: folderOf(activePath) }, event.clientX, event.clientY)
        }}
        onDragOver={(event) => {
          if (dragging === undefined) return
          event.preventDefault()
          setDropTarget('')
        }}
        onDragLeave={() => setDropTarget(current => (current === '' ? undefined : current))}
        onDrop={(event) => {
          event.preventDefault()
          event.stopPropagation()
          move(dragging ?? event.dataTransfer.getData('text/plain'), '')
        }}
      >
        {rows.length === 0
          ? <EmptyState title={t('noResults')} />
          : rows.map((row) => (
            <button
              key={row.node.path}
              type="button"
              className={`${row.node.kind === 'dir' ? css.dir : css.file} ${row.node.path === activePath ? css.active : ''} ${selected.has(row.node.path) ? css.selected : ''} ${dropTarget === row.node.path ? css.dropTarget : ''} ${dragging === row.node.path ? css.dragging : ''}`.trim()}
              style={{ paddingLeft: `${6 + row.depth * 12}px` }}
              title={row.node.path}
              onClick={(event) => {
                if (event.ctrlKey || event.metaKey) {
                  toggleSelected(row.node.path)
                  return
                }
                setSelected(new Set())
                if (row.node.kind === 'dir') {
                  setExpanded((previous) => {
                    const next = new Set(previous)
                    if (next.has(row.node.path)) next.delete(row.node.path)
                    else next.add(row.node.path)
                    return next
                  })
                  return
                }
                actions.open(row.node.path, { preview: true })
              }}
              draggable
              onDragStart={(event) => {
                event.stopPropagation()
                event.dataTransfer.effectAllowed = 'move'
                event.dataTransfer.setData('text/plain', row.node.path)
                setDragging(row.node.path)
              }}
              onDragEnd={() => {
                setDragging(undefined)
                setDropTarget(undefined)
              }}
              onDragOver={row.node.kind === 'dir'
                ? (event) => {
                  if (dragging === undefined || dragging === row.node.path) return
                  event.preventDefault()
                  event.stopPropagation()
                  setDropTarget(row.node.path)
                }
                : undefined}
              onDragLeave={row.node.kind === 'dir'
                ? () => setDropTarget(current => (current === row.node.path ? undefined : current))
                : undefined}
              onDrop={row.node.kind === 'dir'
                ? (event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  move(dragging ?? event.dataTransfer.getData('text/plain'), row.node.path)
                }
                : undefined}
              onContextMenu={(event) => {
                event.preventDefault()
                event.stopPropagation()
                openNodeMenu(row.node, event.clientX, event.clientY)
              }}
            >
              {row.node.kind === 'dir' ? (
                <>
                  <span className={css.chevron}>{isExpanded(expanded, query, row.node.path) ? '▾' : '▸'}</span>
                  {label(row.node)}
                </>
              ) : (
                <>
                  <span className={css.fileIcon} aria-hidden="true" />
                  {label(row.node)}
                </>
              )}
            </button>
          ))}
      </div>
      {tags.length === 0
        ? null
        : (
          <div className={css.explorerTags}>
            <button
              type="button"
              className={css.explorerTagsHead}
              aria-expanded={tagsOpen}
              onClick={() => setTagsOpen(value => !value)}
            >
              <span className={css.chevron}>{tagsOpen ? '▾' : '▸'}</span>
              {t('tags')}
              <span className={css.itemMeta}>{tags.length}</span>
            </button>
            {tagsOpen
              ? (
                <div className={css.explorerTagsBody}>
                  {tags.map(item => (
                    <button
                      key={item.tag}
                      type="button"
                      className={css.tagChip}
                      title={`#${item.tag}`}
                      onClick={() => onTag(item.tag)}
                    >
                      #{item.tag}
                      <span className={css.tagChipCount}>{item.count}</span>
                    </button>
                  ))}
                </div>
              )
              : null}
          </div>
        )}
    </section>
  )
}

/** Every folder path, so a filtered tree shows matches at any depth. */
function allFolders(nodes: readonly TreeNodeDto[], out = new Set<string>()): ReadonlySet<string> {
  for (const node of nodes) {
    if (node.kind !== 'dir') continue
    out.add(node.path)
    allFolders(node.children ?? [], out)
  }
  return out
}

/** A folder shows as open while a query expands the whole tree. */
function isExpanded(expanded: ReadonlySet<string>, query: string, path: string): boolean {
  return query.length > 0 || expanded.has(path)
}
