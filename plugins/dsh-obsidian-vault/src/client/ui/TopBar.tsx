/**
 * The workspace top bar: vault switcher, tab history, index refresh, and the
 * narrow-screen rail toggle.
 * @module dsh-obsidian-vault/client/ui/TopBar
 */
import type { Translate } from '../i18n.ts'
import { Icon } from './Icon.tsx'
import { css } from './theme.ts'

/** Props for {@link TopBar}. */
export interface TopBarProps {
  readonly t: Translate
  readonly vaultName: string
  readonly canBack: boolean
  readonly canForward: boolean
  readonly railOpen: boolean
  readonly onBack: () => void
  readonly onForward: () => void
  /** Reload the vault index. */
  readonly onRefresh: () => void
  readonly onToggleRail: () => void
  readonly onSwitchVault: () => void
}

/**
 * Render the top bar.
 * @param props - history state, panel state, and the entries it owns.
 */
export function TopBar({
  t, vaultName, canBack, canForward, railOpen, onBack, onForward, onRefresh, onToggleRail, onSwitchVault,
}: TopBarProps): JSX.Element {
  return (
    <header className={css.top}>
      <button
        type="button"
        className={css.vaultSwitch}
        onClick={onSwitchVault}
        title={t('switchVault')}
        aria-label={t('switchVault')}
      >
        <Icon name="files" size={13} />
        <span className={css.vaultSwitchName}>{vaultName}</span>
      </button>
      <span className={css.topGroup}>
        <button type="button" className={css.iconButton} onClick={onBack} disabled={!canBack} title={t('back')} aria-label={t('back')}>
          <Icon name="back" />
        </button>
        <button
          type="button"
          className={css.iconButton}
          onClick={onForward}
          disabled={!canForward}
          title={t('forward')}
          aria-label={t('forward')}
        >
          <Icon name="forward" />
        </button>
        <button
          type="button"
          className={css.iconButton}
          onClick={onRefresh}
          title={t('refresh')}
          aria-label={t('refresh')}
        >
          <Icon name="refresh" />
        </button>
      </span>
      <span className={css.grow} />
      <button
        type="button"
        className={`${css.iconButton} ${css.narrowOnly}`}
        aria-pressed={railOpen}
        title={t('outline')}
        aria-label={t('outline')}
        onClick={onToggleRail}
      >
        <Icon name="panelRight" />
      </button>
    </header>
  )
}
