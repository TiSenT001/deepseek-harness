/**
 * Colour legend for the graph: the folders (or tags) that dominate the current
 * view, with the same colours the nodes use. Clicking a chip narrows the view to
 * that bucket, clicking it again clears the filter.
 * @module dsh-obsidian-vault/ui/graph/GraphLegend
 */
import { useState } from 'react'
import type { Translate } from '../../i18n.ts'
import { css } from '../theme.ts'

/** Buckets shown before the legend collapses the rest behind a counter. */
const VISIBLE_BUCKETS = 6

/** One legend bucket. */
export interface GraphLegendEntry {
  /** Folder name or tag text; also the filter value. */
  readonly key: string
  /** Colour matching the node tint. */
  readonly color: string
  /** Number of nodes in the bucket. */
  readonly count: number
}

/** Props for {@link GraphLegend}. */
export interface GraphLegendProps {
  readonly t: Translate
  readonly mode: 'folder' | 'tag' | 'uniform'
  readonly entries: readonly GraphLegendEntry[]
  /** The filter currently applied by the legend, if any. */
  readonly active: string | undefined
  readonly onFilter: (key: string | undefined) => void
}

/**
 * Render the legend row; nothing in uniform mode or without entries.
 * @param props - buckets, active filter and the filter callback.
 */
export function GraphLegend({ t, mode, entries, active, onFilter }: GraphLegendProps): JSX.Element | null {
  const [expanded, setExpanded] = useState(false)
  if (mode === 'uniform' || entries.length === 0) return null
  const shown = expanded ? entries : entries.slice(0, VISIBLE_BUCKETS)
  const hidden = entries.length - shown.length
  return (
    <div className={css.graphLegend} role="group" aria-label={t('nodeColor')}>
      {shown.map((entry) => {
        const selected = active === entry.key
        return (
          <button
            key={entry.key}
            type="button"
            className={`${css.graphLegendItem}${selected ? ` ${css.graphLegendItemActive}` : ''}`.trim()}
            title={selected ? t('colorLegendClear') : `${t('colorLegendFilter')} ${entry.key}`}
            aria-pressed={selected}
            onClick={() => onFilter(selected ? undefined : entry.key)}
          >
            <span className={css.graphLegendDot} style={{ background: entry.color }} aria-hidden="true" />
            <span className={css.graphLegendLabel}>{entry.key}</span>
            <span className={css.graphLegendCount}>{entry.count}</span>
          </button>
        )
      })}
      {hidden > 0 || expanded
        ? (
          <button
            type="button"
            className={css.graphLegendItem}
            aria-expanded={expanded}
            title={expanded ? t('colorLegendCollapse') : t('colorLegendMore')}
            onClick={() => setExpanded(value => !value)}
          >
            {expanded ? t('colorLegendCollapse') : `+${hidden}`}
          </button>
        )
        : null}
    </div>
  )
}
