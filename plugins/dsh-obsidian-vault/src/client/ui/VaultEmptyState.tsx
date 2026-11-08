/**
 * The workspace when no tab is open: the vault name, a quick-switch prompt, and
 * the few actions that are useful before a note exists. Mirrors Obsidian's empty
 * tab, but the destinations are this plugin's reading, canvas and graph views.
 * @module dsh-obsidian-vault/client/ui/VaultEmptyState
 */
import type { Translate } from '../i18n.ts'
import { Icon, type IconName } from './Icon.tsx'
import { css } from './theme.ts'

/** One card in the empty state. */
export interface VaultEmptyAction {
  readonly id: string
  readonly label: string
  /** Keyboard shortcut shown on the right of the card. */
  readonly hint?: string
  readonly icon: IconName
  readonly run: () => void
}

/** Props for {@link VaultEmptyState}. */
export interface VaultEmptyStateProps {
  readonly t: Translate
  /** Display name of the active vault, when the status has arrived. */
  readonly vaultName?: string
  readonly actions: readonly VaultEmptyAction[]
  /** Recently opened documents, newest first. */
  readonly recent?: readonly string[]
  /** Open one recent document. */
  readonly onOpenRecent?: (path: string) => void
  /** Open the quick switcher; the search row behaves as its trigger. */
  readonly onSearch: () => void
}

/**
 * Render the empty workspace.
 * @param props - translated labels, the vault name, and the action cards.
 */
export function VaultEmptyState({ t, vaultName, actions, recent, onOpenRecent, onSearch }: VaultEmptyStateProps): JSX.Element {
  return (
    <div className={css.vaultEmpty} role="region" aria-label={t('empty')}>
      <div className={css.vaultEmptyBody}>
        <h1 className={css.vaultEmptyTitle}>{vaultName ?? t('empty')}</h1>
        <button type="button" className={css.vaultEmptySearch} onClick={onSearch}>
          <Icon name="search" />
          <span className={css.vaultEmptySearchText}>{t('emptySearchPlaceholder')}</span>
          <kbd className={css.vaultEmptyKbd}>Ctrl+O</kbd>
        </button>
        <div className={css.vaultEmptyActions}>
          {actions.map(action => (
            <button key={action.id} type="button" className={css.vaultEmptyCard} onClick={action.run}>
              <Icon name={action.icon} />
              <span className={css.vaultEmptyCardLabel}>{action.label}</span>
              {action.hint === undefined ? null : <kbd className={css.vaultEmptyKbd}>{action.hint}</kbd>}
            </button>
          ))}
        </div>
        {recent === undefined || recent.length === 0 || onOpenRecent === undefined
          ? null
          : (
            <div className={css.vaultEmptyRecent}>
              <p className={css.vaultEmptyRecentTitle}>{t('recentlyOpened')}</p>
              <div className={css.vaultEmptyRecentList}>
                {recent.map(path => (
                  <button
                    key={path}
                    type="button"
                    className={css.vaultEmptyRecentItem}
                    title={path}
                    onClick={() => onOpenRecent(path)}
                  >
                    {recentLabel(path)}
                  </button>
                ))}
              </div>
            </div>
          )}
        <p className={css.vaultEmptyHint}>{t('emptyHint')}</p>
      </div>
    </div>
  )
}

/**
 * Short label for a recent path; the full path stays in the tooltip.
 * @param path - vault-relative document path.
 * @returns the file name without the Markdown suffix.
 */
function recentLabel(path: string): string {
  const name = path.slice(path.lastIndexOf('/') + 1)
  return name.replace(/\.md$/i, '')
}
