/**
 * The search palette's option row: case sensitivity, regex mode, result order
 * and compact density. Buttons only; state lives in the palette.
 * @module dsh-obsidian-vault/client/ui/QuickSearchControls
 */
import type { Translate } from '../i18n.ts'
import { css } from './theme.ts'
import type { SearchOptions } from './searchPrefs.ts'

/** Props for {@link QuickSearchControls}. */
export interface QuickSearchControlsProps {
  /** Translator for labels and titles. */
  readonly t: Translate
  /** Active options. */
  readonly options: SearchOptions
  /** Flip one boolean option. */
  readonly onToggle: (key: 'matchCase' | 'regex' | 'compact') => void
  /** Flip the result order between relevance and title. */
  readonly onToggleSort: () => void
}

/**
 * Render the four search toggles.
 * @param props - options and their handlers.
 */
export function QuickSearchControls({ t, options, onToggle, onToggleSort }: QuickSearchControlsProps): JSX.Element {
  return (
    <>
      <button
        type="button"
        className={css.button}
        aria-pressed={options.matchCase}
        title={t('searchMatchCase')}
        onClick={() => onToggle('matchCase')}
      >
        Aa
      </button>
      <button
        type="button"
        className={css.button}
        aria-pressed={options.regex}
        title={t('searchRegex')}
        onClick={() => onToggle('regex')}
      >
        .*
      </button>
      <button
        type="button"
        className={css.button}
        aria-pressed={options.sort === 'name'}
        title={t('searchSort')}
        onClick={onToggleSort}
      >
        {options.sort === 'name' ? t('searchSortName') : t('searchSortRelevance')}
      </button>
      <button
        type="button"
        className={css.button}
        aria-pressed={options.compact}
        title={t('searchCompact')}
        onClick={() => onToggle('compact')}
      >
        {t('searchCompact')}
      </button>
    </>
  )
}
