/**
 * The graph toolbar: scope switch, node/edge counts, query and tag filters,
 * hop limit, settings toggle, replay, reset view, and the way back to reading.
 * @module dsh-obsidian-vault/client/ui/GraphToolbar
 */
import type { TagCountDto } from '../../protocol.ts'
import type { Translate } from '../i18n.ts'
import { TagPicker } from './graph/TagPicker.tsx'
import { Icon } from './Icon.tsx'
import { css } from './theme.ts'

/** Props for {@link GraphToolbar}. */
export interface GraphToolbarProps {
  readonly t: Translate
  readonly center: string | undefined
  readonly nodes: number
  readonly edges: number
  readonly layingOut: boolean
  readonly query: string
  readonly tag: string
  readonly tagOptions: readonly TagCountDto[]
  readonly depth: number
  readonly panelOpen: boolean
  readonly onToggleScope: () => void
  readonly onQuery: (value: string) => void
  readonly onTag: (tag: string) => void
  readonly onDepth: (depth: number) => void
  readonly onTogglePanel: () => void
  readonly onReplay: () => void
  readonly onReset: () => void
  readonly onClose: () => void
}

/**
 * Render the graph toolbar.
 * @param props - graph counts, filter values, and controls.
 */
export function GraphToolbar(props: GraphToolbarProps): JSX.Element {
  const {
    t, center, nodes, edges, layingOut, query, tag, tagOptions, depth, panelOpen, onToggleScope,
    onQuery, onTag, onDepth, onTogglePanel, onReplay, onReset, onClose,
  } = props

  return (
    <div className={css.graphTools}>
      <button type="button" className={css.button} onClick={onToggleScope} title={t('graph')}>
        {center === undefined ? t('global') : t('local')}
      </button>
      <span className={css.graphStats}>{nodes} {t('nodes')} · {edges} {t('edges')}</span>
      {layingOut ? <span className={css.graphStats}>{t('layingOut')}</span> : null}
      <span className={css.grow} />
      <input
        className={css.graphFilter}
        value={query}
        placeholder={t('filterGraph')}
        aria-label={t('filterGraph')}
        onChange={(event) => onQuery(event.target.value)}
      />
      <TagPicker t={t} options={tagOptions} value={tag} onChange={onTag} />
      {center === undefined ? null : (
        <select
          className={css.graphSelect}
          value={depth}
          aria-label={t('hops')}
          onChange={(event) => onDepth(Number(event.target.value))}
        >
          {[1, 2, 3].map(value => <option key={value} value={value}>{value} {t('hops')}</option>)}
        </select>
      )}
      <button
        type="button"
        className={`${css.iconButton} ${panelOpen ? css.iconButtonActive : ''}`}
        aria-expanded={panelOpen}
        title={t('graphSettings')}
        aria-label={t('graphSettings')}
        onClick={onTogglePanel}
      >
        <Icon name="settings" />
      </button>
      <button type="button" className={css.iconButton} title={t('replay')} aria-label={t('replay')} onClick={onReplay}>
        <Icon name="replay" />
      </button>
      <button type="button" className={css.iconButton} title={t('resetView')} aria-label={t('resetView')} onClick={onReset}>
        <Icon name="reset" />
      </button>
      <button type="button" className={css.iconButton} title={t('reading')} aria-label={t('reading')} onClick={onClose}>
        <Icon name="close" />
      </button>
    </div>
  )
}
