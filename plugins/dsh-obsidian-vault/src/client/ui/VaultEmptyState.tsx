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
  /** Open the quick switcher; the search row behaves as its trigger. */
  readonly onSearch: () => void
}

/**
 * Render the empty workspace.
 * @param props - translated labels, the vault name, and the action cards.
 */
export function VaultEmptyState({ t, vaultName, actions, onSearch }: VaultEmptyStateProps): JSX.Element {
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
        <p className={css.vaultEmptyHint}>{t('emptyHint')}</p>
      </div>
    </div>
  )
}
