/**
 * Backlinks panel: mentions grouped by source note, with filtering and sorting.
 * @module dsh-obsidian-vault/client/ui/panels/Backlinks
 */
import { useState } from 'react'
import type { BacklinkDto } from '../../../protocol.ts'
import type { Translate } from '../../i18n.ts'
import { css } from '../theme.ts'
import { plainContext } from './shared.ts'

function mentions(
  t: Translate,
  backlinks: readonly BacklinkDto[],
  unlinked: readonly BacklinkDto[],
  onOpen: (path: string) => void,
  onRowMenu?: (path: string, x: number, y: number) => void,
): JSX.Element {
  return <BacklinksPanel t={t} backlinks={backlinks} unlinked={unlinked} onOpen={onOpen} onRowMenu={onRowMenu} />
}

/**
 * Backlinks grouped by source note: the header toggles the context lines, and
 * each row opens that note.
 */
function BacklinksPanel({
  t, backlinks, unlinked, onOpen, onRowMenu,
}: {
  readonly t: Translate
  readonly backlinks: readonly BacklinkDto[]
  readonly unlinked: readonly BacklinkDto[]
  readonly onOpen: (path: string) => void
  /** Open the shared context menu for one source note. */
  readonly onRowMenu?: (path: string, x: number, y: number) => void
}): JSX.Element {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set())
  const [filterText, setFilterText] = useState('')
  const [sortMode, setSortMode] = useState<'path' | 'count'>('path')
  if (backlinks.length === 0 && unlinked.length === 0) return <div className={css.empty}>{t('noBacklinks')}</div>
  const needle = filterText.trim().toLowerCase()
  const matchesFilter = (path: string, items: readonly BacklinkDto[]): boolean => {
    if (needle.length === 0) return true
    if (path.toLowerCase().includes(needle)) return true
    return items.some(item => item.title.toLowerCase().includes(needle)
      || item.context.toLowerCase().includes(needle))
  }
  const orderGroups = (groups: Array<[string, BacklinkDto[]]>): Array<[string, BacklinkDto[]]> =>
    sortMode === 'count'
      ? [...groups].sort((left, right) => right[1].length - left[1].length)
      : [...groups].sort((left, right) => left[0].localeCompare(right[0], 'zh'))
  const toggle = (path: string): void => {
    setExpanded((previous) => {
      const next = new Set(previous)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }
  return (
    <>
      <div className={css.explorerTools}>
        <input
          className={css.graphText}
          value={filterText}
          placeholder={t('filterPlaceholder')}
          aria-label={t('filterPlaceholder')}
          onChange={(event) => setFilterText(event.target.value)}
        />
        <select
          className={css.explorerSelect}
          value={sortMode}
          aria-label={t('sortBy')}
          onChange={(event) => setSortMode(event.target.value === 'count' ? 'count' : 'path')}
        >
          <option value="path">{t('sortName')}</option>
          <option value="count">{t('mentionCount')}</option>
        </select>
      </div>
      {backlinks.length > 0
        ? (
          <>
            <div className={css.sectionTitle}>{t('linkedMentions')} · {backlinks.length}</div>
            {orderGroups(groupByPath(backlinks).filter(([path, items]) => matchesFilter(path, items))).map(([path, items]) => {
              const open = expanded.has(path)
              const visible = open ? items : items.slice(0, 2)
              return (
                <div key={path} className={css.backlinkGroup}>
                  <button
                    type="button"
                    className={css.backlinkHead}
                    title={path}
                    onClick={() => toggle(path)}
                    onContextMenu={(event) => {
                      if (onRowMenu === undefined) return
                      event.preventDefault()
                      onRowMenu(path, event.clientX, event.clientY)
                    }}
                  >
                    <span className={css.backlinkName}>{items[0]!.title}</span>
                    {items[0]!.source === 'canvas'
                      ? <span className={css.backlinkCount}>{t('canvasSource')}</span>
                      : null}
                    <span className={css.backlinkCount}>{items.length}</span>
                  </button>
                  {visible.map((item, index) => (
                    <button
                      key={`${path}-${index}`}
                      type="button"
                      className={css.item}
                      title={`${path}:${item.line}`}
                      onClick={() => onOpen(path)}
                    >
                      <div className={css.itemMeta}>{plainContext(item.context)}</div>
                    </button>
                  ))}
                  {items.length > 2
                    ? (
                      <button type="button" className={css.backlinkMore} onClick={() => toggle(path)}>
                        {open ? t('showLess') : `${t('showMore')} ${items.length - 2}`}
                      </button>
                    )
                    : null}
                </div>
              )
            })}
          </>
        )
        : null}
      {unlinked.length > 0
        ? (
          <>
            <div className={css.sectionTitle}>{t('unlinkedMentions')} · {unlinked.length}</div>
            {orderGroups(groupByPath(unlinked).filter(([path, items]) => matchesFilter(path, items))).map(([path, items]) => (
              <div key={path} className={css.backlinkGroup}>
                <button type="button" className={css.backlinkHead} title={path} onClick={() => onOpen(path)}>
                  <span className={css.backlinkName}>{items[0]!.title}</span>
                  <span className={css.backlinkCount}>{items.length}</span>
                </button>
                {items.slice(0, 2).map((item, index) => (
                  <button
                    key={`${path}-unlinked-${index}`}
                    type="button"
                    className={css.item}
                    title={`${path}:${item.line}`}
                    onClick={() => onOpen(path)}
                  >
                    <div className={css.itemMeta}>{plainContext(item.context)}</div>
                  </button>
                ))}
              </div>
            ))}
          </>
        )
        : null}
    </>
  )
}

function groupByPath(items: readonly BacklinkDto[]): Array<[string, BacklinkDto[]]> {
  const groups = new Map<string, BacklinkDto[]>()
  for (const item of items) {
    const bucket = groups.get(item.path)
    if (bucket === undefined) groups.set(item.path, [item])
    else bucket.push(item)
  }
  return [...groups]
}

export { mentions as renderBacklinks }
