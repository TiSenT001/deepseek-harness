/**
 * The settings dialog: appearance (density variant) plus the plugin panel.
 * Plugin enablement and the DSH plugin folder moved here when the ribbon kept
 * only the gear.
 * @module dsh-obsidian-vault/client/ui/SettingsDialog
 */
import type { Translate } from '../i18n.ts'
import { Icon } from './Icon.tsx'
import type { Variant } from './kit/index.ts'
import { PluginPanel } from './plugins/PluginPanel.tsx'
import { css } from './theme.ts'

/** Props for {@link SettingsDialog}. */
export interface SettingsDialogProps {
  readonly t: Translate
  /** Active density variant. */
  readonly variant: Variant
  /** Apply and persist a variant choice. */
  readonly onVariant: (variant: Variant) => void
  readonly onClose: () => void
}

/**
 * Render the settings dialog.
 * @param props - translator, the active variant, and the close callback.
 */
export function SettingsDialog({ t, variant, onVariant, onClose }: SettingsDialogProps): JSX.Element {
  const variants: readonly { readonly id: Variant; readonly label: Parameters<Translate>[0] }[] = [
    { id: 'comfortable', label: 'variantComfortable' },
    { id: 'compact', label: 'variantCompact' },
  ]
  return (
    <div
      className={css.dialogLayer}
      role="presentation"
      onMouseDown={onClose}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          onClose()
        }
      }}
    >
      <div
        className={css.dialog}
        role="dialog"
        aria-label={t('settings')}
        onMouseDown={event => event.stopPropagation()}
      >
        <header className={css.dialogHead}>
          <span className={css.dialogTitle}>{t('settings')}</span>
          <button
            type="button"
            className={css.dialogClose}
            aria-label={t('close')}
            title={t('close')}
            onClick={onClose}
          >
            <Icon name="close" size={14} />
          </button>
        </header>
        <div className={css.dialogBody}>
          <div className={css.sectionTitle}>{t('appearance')}</div>
          <div className={css.dialogActions}>
            {variants.map(option => (
              <button
                key={option.id}
                type="button"
                className={`${css.dialogButton} ${option.id === variant ? css.dialogButtonPrimary : ''}`.trim()}
                aria-pressed={option.id === variant}
                onClick={() => onVariant(option.id)}
              >
                {t(option.label)}
              </button>
            ))}
          </div>
          <div className={css.sectionTitle}>{t('plugins')}</div>
          <PluginPanel t={t} />
        </div>
      </div>
    </div>
  )
}
