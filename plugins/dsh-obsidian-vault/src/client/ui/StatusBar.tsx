/**
 * The 24px status bar: vault identity, note measures, backlink counts, and the
 * index version. Values that only make sense while editing stay empty until the
 * editor lands in P7.
 * @module dsh-obsidian-vault/client/ui/StatusBar
 */
import { useMemo } from 'react'
import type { BacklinkDto, NoteDto, StatusDto } from '../../protocol.ts'
import type { Translate } from '../i18n.ts'
import { css } from './theme.ts'
import { textStats, vaultName } from './stats.ts'

/** Props for {@link StatusBar}. */
export interface StatusBarProps {
  readonly t: Translate
  readonly status: StatusDto | undefined
  readonly note: NoteDto | undefined
  readonly backlinks: readonly BacklinkDto[]
  readonly unlinked: readonly BacklinkDto[]
  readonly view: 'note' | 'graph' | 'plugin'
}

/**
 * Render the status bar.
 * @param props - index status, the open note, and its backlinks.
 */
export function StatusBar({ t, status, note, backlinks, unlinked, view }: StatusBarProps): JSX.Element {
  const stats = useMemo(() => textStats(note?.content ?? ''), [note?.content])
  const mentions = backlinks.length + unlinked.length
  const links = note?.links.length ?? 0
  const root = status?.root ?? ''
  const indexState = status?.error !== undefined ? 'error' : status === undefined ? 'stale' : 'ok'

  return (
    <footer className={css.statusBar}>
      <span className={css.statusGroup}>
        <span className={css.statusItem} title={root}>
          {root.length === 0 ? t('vault') : vaultName(root)}
        </span>
        {note === undefined
          ? null
          : (
            <>
              <span className={css.statusItem}>{stats.words} {t('words')}</span>
              <span className={`${css.statusItem} ${css.statusNarrowHide}`.trim()}>
                {stats.chars} {t('chars')}
              </span>
              <span className={`${css.statusItem} ${css.statusNarrowHide}`.trim()}>
                {stats.lines} {t('lines')}
              </span>
            </>
          )}
      </span>
      <span className={css.statusGroup}>
        {note === undefined
          ? null
          : (
            <>
              <span className={css.statusItem} title={t('backlinks')}>{mentions} {t('backlinks')}</span>
              <span className={`${css.statusItem} ${css.statusNarrowHide}`.trim()} title={t('linksOut')}>
                {links} {t('linksOut')}
              </span>
            </>
          )}
        <span className={css.statusItem} title={root}>
          <span className={css.statusDot} data-state={indexState} />
          {status === undefined
            ? t('loadingIndex')
            : status.error !== undefined
              ? t('indexError')
              : `${status.notes} ${t('notes')} · v${status.version}`}
        </span>
        <span className={`${css.statusItem} ${css.statusMuted} ${css.statusNarrowHide}`.trim()}>
          {view === 'graph' ? t('graph') : view === 'plugin' ? t('pluginView') : t('reading')}
        </span>
      </span>
    </footer>
  )
}
